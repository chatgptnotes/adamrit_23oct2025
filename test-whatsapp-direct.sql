-- Direct WhatsApp Test Function (No Edge Function Needed)
-- This sends WhatsApp message directly from SQL

CREATE OR REPLACE FUNCTION send_whatsapp_test()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_visit RECORD;
    v_patient RECORD;
    v_message_params jsonb;
    v_response jsonb;
    v_formatted_date text;
BEGIN
    -- Get a visit from 5 days ago
    SELECT v.*, p.name, p.corporate, p.id as patient_uuid
    INTO v_visit
    FROM visits v
    JOIN patients p ON v.patient_id = p.id
    WHERE v.admission_date = CURRENT_DATE - INTERVAL '5 days'
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'No visits found from 5 days ago'
        );
    END IF;

    -- Format date as DD/MM/YYYY
    v_formatted_date := to_char(v_visit.admission_date, 'DD/MM/YYYY');

    -- Prepare message parameters
    v_message_params := jsonb_build_object(
        'to', '+916260800477',
        'type', 'template',
        'template', jsonb_build_object(
            'name', 'patient_admission_reminder',
            'language', jsonb_build_object('code', 'en'),
            'components', jsonb_build_array(
                jsonb_build_object(
                    'type', 'body',
                    'parameters', jsonb_build_array(
                        jsonb_build_object('type', 'text', 'text', v_visit.name),
                        jsonb_build_object('type', 'text', 'text', v_formatted_date),
                        jsonb_build_object('type', 'text', 'text', COALESCE(v_visit.corporate, 'N/A'))
                    )
                )
            )
        )
    );

    -- Call Double Tick API
    SELECT content::jsonb INTO v_response
    FROM http((
        'POST',
        'https://api.doubl.in/v1/messages/send',
        ARRAY[
            http_header('Content-Type', 'application/json'),
            http_header('Authorization', 'Bearer key_8sc9MP6JpQ')
        ],
        'application/json',
        v_message_params::text
    )::http_request);

    -- Log the notification
    INSERT INTO whatsapp_notifications (
        visit_id,
        patient_id,
        patient_name,
        admission_date,
        corporate,
        phone_number,
        message_content,
        template_name,
        status,
        sent_at,
        doubletick_response
    ) VALUES (
        v_visit.visit_id,
        v_visit.patient_uuid,
        v_visit.name,
        v_visit.admission_date,
        v_visit.corporate,
        '6260800477',
        v_message_params::text,
        'patient_admission_reminder',
        'sent',
        NOW(),
        v_response
    );

    RETURN jsonb_build_object(
        'success', true,
        'patient_name', v_visit.name,
        'admission_date', v_formatted_date,
        'corporate', COALESCE(v_visit.corporate, 'N/A'),
        'response', v_response
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;

-- To send WhatsApp message, just run:
-- SELECT send_whatsapp_test();
