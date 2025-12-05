-- Migration to populate visit_hope_surgeons and visit_diagnoses junction tables
-- from existing data stored in remark2 and reason_for_visit fields

-- This migration parses the text data and creates proper relational links

-- Part 1: Populate visit_hope_surgeons from remark2 field
-- The remark2 field contains strings like "Hope Surgeon: Dr. Smith; Referee: Dr. Jones"

DO $$
DECLARE
    visit_record RECORD;
    surgeon_name TEXT;
    surgeon_id UUID;
    inserted_count INTEGER := 0;
BEGIN
    -- Loop through all visits that have remark2 data
    FOR visit_record IN
        SELECT id, remark2
        FROM visits
        WHERE remark2 IS NOT NULL
          AND remark2 LIKE '%Hope Surgeon:%'
    LOOP
        -- Extract the Hope Surgeon name from remark2
        -- Format: "...Hope Surgeon: Dr. Name..."
        surgeon_name := NULL;

        -- Try to extract "Hope Surgeon: {name}" pattern
        IF visit_record.remark2 LIKE '%Hope Surgeon: %' THEN
            surgeon_name := TRIM(
                SPLIT_PART(
                    SPLIT_PART(visit_record.remark2, 'Hope Surgeon: ', 2),
                    ';',
                    1
                )
            );

            -- Clean up any trailing content
            surgeon_name := TRIM(BOTH FROM surgeon_name);

            -- Look up the surgeon ID from hope_surgeons table by name
            IF surgeon_name IS NOT NULL AND surgeon_name != '' THEN
                SELECT id INTO surgeon_id
                FROM hope_surgeons
                WHERE name = surgeon_name
                LIMIT 1;

                -- If surgeon found, insert into junction table
                IF surgeon_id IS NOT NULL THEN
                    INSERT INTO visit_hope_surgeons (visit_id, surgeon_id)
                    VALUES (visit_record.id, surgeon_id)
                    ON CONFLICT (visit_id, surgeon_id) DO NOTHING;

                    inserted_count := inserted_count + 1;
                    RAISE NOTICE 'Added surgeon % (ID: %) to visit %', surgeon_name, surgeon_id, visit_record.id;
                ELSE
                    RAISE NOTICE 'Surgeon not found in hope_surgeons table: %', surgeon_name;
                END IF;
            END IF;
        END IF;
    END LOOP;

    RAISE NOTICE 'Populated visit_hope_surgeons: % records inserted', inserted_count;
END $$;

-- Part 2: Populate visit_diagnoses from reason_for_visit field
-- The reason_for_visit field typically contains the primary diagnosis as text

DO $$
DECLARE
    visit_record RECORD;
    diagnosis_name TEXT;
    diagnosis_id UUID;
    inserted_count INTEGER := 0;
BEGIN
    -- Loop through all visits that have reason_for_visit data
    FOR visit_record IN
        SELECT id, reason_for_visit
        FROM visits
        WHERE reason_for_visit IS NOT NULL
          AND reason_for_visit != ''
          AND reason_for_visit != 'No diagnosis'
          AND patient_type IN ('IPD', 'IPD (Inpatient)', 'Emergency')
    LOOP
        diagnosis_name := TRIM(visit_record.reason_for_visit);

        -- Look up the diagnosis ID from diagnoses table by name
        -- Try exact match first
        SELECT id INTO diagnosis_id
        FROM diagnoses
        WHERE name = diagnosis_name
        LIMIT 1;

        -- If exact match not found, try case-insensitive match
        IF diagnosis_id IS NULL THEN
            SELECT id INTO diagnosis_id
            FROM diagnoses
            WHERE LOWER(name) = LOWER(diagnosis_name)
            LIMIT 1;
        END IF;

        -- If diagnosis found, insert into junction table
        IF diagnosis_id IS NOT NULL THEN
            INSERT INTO visit_diagnoses (visit_id, diagnosis_id, is_primary)
            VALUES (visit_record.id, diagnosis_id, true)
            ON CONFLICT (visit_id, diagnosis_id) DO NOTHING;

            inserted_count := inserted_count + 1;
            RAISE NOTICE 'Added diagnosis % (ID: %) to visit %', diagnosis_name, diagnosis_id, visit_record.id;
        ELSE
            -- Diagnosis name not found in master table, log it
            RAISE NOTICE 'Diagnosis not found in diagnoses table: %', diagnosis_name;
        END IF;
    END LOOP;

    RAISE NOTICE 'Populated visit_diagnoses: % records inserted', inserted_count;
END $$;

-- Part 3: Verification - Show summary of populated data
SELECT
    (SELECT COUNT(*) FROM visit_hope_surgeons) as total_doctor_links,
    (SELECT COUNT(*) FROM visit_diagnoses) as total_diagnosis_links,
    (SELECT COUNT(DISTINCT visit_id) FROM visit_hope_surgeons) as visits_with_doctors,
    (SELECT COUNT(DISTINCT visit_id) FROM visit_diagnoses) as visits_with_diagnoses;
