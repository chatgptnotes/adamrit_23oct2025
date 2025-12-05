-- Manual WhatsApp Sender Function
-- Run this daily to send reminders (no Edge Function deployment needed)

CREATE OR REPLACE FUNCTION send_admission_reminders_manual()
RETURNS TABLE(
    patient_name TEXT,
    admission_date DATE,
    corporate TEXT,
    status TEXT,
    message TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_patient RECORD;
    v_formatted_date TEXT;
    v_api_response TEXT;
BEGIN
    -- Loop through all visits from 5 days ago
    FOR v_patient IN
        SELECT
            v.visit_id,
            v.admission_date,
            p.id as patient_id,
            p.name,
            COALESCE(p.corporate, 'General') as corp
        FROM visits v
        JOIN patients p ON v.patient_id = p.id
        WHERE v.admission_date = CURRENT_DATE - INTERVAL '5 days'
        AND NOT EXISTS (
            SELECT 1 FROM whatsapp_notifications wn
            WHERE wn.visit_id = v.visit_id
            AND wn.admission_date = v.admission_date
        )
    LOOP
        -- Format date
        v_formatted_date := to_char(v_patient.admission_date, 'DD/MM/YYYY');

        -- Send WhatsApp via HTTP
        SELECT content::TEXT INTO v_api_response
        FROM http((
            'POST',
            'https://public.doubletick.io/whatsapp/message/template',
            ARRAY[
                http_header('Content-Type', 'application/json'),
                http_header('Authorization', 'key_8sc9MP6JpQ'),
                http_header('accept', 'application/json')
            ],
            'application/json',
            json_build_object(
                'messages', json_build_array(
                    json_build_object(
                        'content', json_build_object(
                            'language', 'en',
                            'templateName', 'patient_admission_reminder',
                            'bodyValues', json_build_array(
                                v_patient.name,
                                v_formatted_date,
                                v_patient.corp
                            )
                        ),
                        'to', '+916260800477'
                    )
                )
            )::TEXT
        )::http_request);

        -- Log notification
        INSERT INTO whatsapp_notifications (
            visit_id, patient_id, patient_name, admission_date,
            corporate, phone_number, message_content, template_name,
            status, sent_at, doubletick_response
        ) VALUES (
            v_patient.visit_id, v_patient.patient_id, v_patient.name,
            v_patient.admission_date, v_patient.corp, '6260800477',
            json_build_object('name', v_patient.name, 'date', v_formatted_date, 'corp', v_patient.corp)::TEXT,
            'patient_admission_reminder', 'sent', NOW(), v_api_response::JSONB
        );

        -- Return result
        RETURN QUERY SELECT v_patient.name, v_patient.admission_date, v_patient.corp, 'sent'::TEXT, v_api_response;
    END LOOP;

    IF NOT FOUND THEN
        RETURN QUERY SELECT NULL::TEXT, NULL::DATE, NULL::TEXT, 'no_patients'::TEXT, 'No patients found from 5 days ago'::TEXT;
    END IF;
END;
$$;

-- To run manually:
-- SELECT * FROM send_admission_reminders_manual();
