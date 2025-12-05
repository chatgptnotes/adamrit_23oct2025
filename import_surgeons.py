#!/usr/bin/env python3
"""
Script to parse doctors.sql and extract surgeon data for import into ayushman_surgeons table
"""

import re
import json
from typing import List, Dict, Optional

def parse_doctors_sql(file_path: str) -> List[Dict]:
    """Parse the doctors.sql file and extract surgeon records"""

    surgeons = []

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find all INSERT INTO doctors statements
    insert_pattern = r"INSERT INTO `doctors` \([^)]+\) VALUES\s*(.*?)(?=INSERT INTO|ALTER TABLE|$)"
    matches = re.findall(insert_pattern, content, re.DOTALL)

    if not matches:
        print("No INSERT statements found")
        return []

    # Parse the VALUES section
    values_content = matches[0] if matches else ""

    # Split individual record values - each record is enclosed in parentheses
    record_pattern = r'\(([^)]+(?:\([^)]*\)[^)]*)*)\)(?:,\s*)?'
    records = re.findall(record_pattern, values_content)

    print(f"Found {len(records)} total doctor records")

    for i, record in enumerate(records):
        try:
            # Split the record into fields, handling quoted strings and NULL values
            fields = parse_record_fields(record)

            if len(fields) < 40:  # Should have around 40+ fields based on schema
                continue

            # Map fields based on INSERT column order
            doctor_data = {
                'id': fields[0],
                'doctor_name': clean_string(fields[1]),
                'first_name': clean_string(fields[2]),
                'last_name': clean_string(fields[3]),
                'middle_name': clean_string(fields[4]),
                'charges': fields[5],
                'surgery_charges': fields[12],
                'anaesthesia_charges': fields[18],
                'other_charges': fields[19],
                'education': clean_string(fields[20]),
                'has_specialty': fields[21],
                'specialty_keyword': clean_string(fields[22]),
                'experience': clean_string(fields[23]),
                'department_id': fields[24],
                'is_surgeon': fields[36] if len(fields) > 36 else None,
                'is_active': fields[41] if len(fields) > 41 else None,
                'is_deleted': fields[42] if len(fields) > 42 else None,
            }

            # Filter for surgeons only
            if (doctor_data['is_surgeon'] == '1' and
                doctor_data['is_active'] == '1' and
                doctor_data['is_deleted'] != '1' and
                doctor_data['doctor_name'] and
                doctor_data['doctor_name'].strip()):

                surgeons.append(doctor_data)

        except Exception as e:
            print(f"Error parsing record {i+1}: {e}")
            continue

    print(f"Found {len(surgeons)} surgeon records")
    return surgeons

def parse_record_fields(record: str) -> List[str]:
    """Parse individual record fields, handling quotes and NULL values"""
    fields = []
    current_field = ""
    in_quotes = False
    quote_char = None
    i = 0

    while i < len(record):
        char = record[i]

        if not in_quotes:
            if char in ["'", '"']:
                in_quotes = True
                quote_char = char
                current_field += char
            elif char == ',':
                fields.append(current_field.strip())
                current_field = ""
            else:
                current_field += char
        else:
            current_field += char
            if char == quote_char:
                # Check if it's an escaped quote
                if i + 1 < len(record) and record[i + 1] == quote_char:
                    current_field += quote_char
                    i += 1  # Skip the next quote
                else:
                    in_quotes = False
                    quote_char = None

        i += 1

    # Add the last field
    if current_field:
        fields.append(current_field.strip())

    return fields

def clean_string(value: str) -> Optional[str]:
    """Clean string values by removing quotes and handling NULL"""
    if not value or value.upper() == 'NULL':
        return None

    # Remove quotes
    if value.startswith("'") and value.endswith("'"):
        value = value[1:-1]
    elif value.startswith('"') and value.endswith('"'):
        value = value[1:-1]

    # Unescape quotes
    value = value.replace("''", "'").replace('""', '"')

    return value.strip() if value.strip() else None

def map_to_ayushman_surgeons(surgeons: List[Dict]) -> List[Dict]:
    """Map surgeon data to ayushman_surgeons table structure"""

    mapped_surgeons = []

    for surgeon in surgeons:
        # Extract specialty from name if specialty_keyword is empty
        specialty = surgeon.get('specialty_keyword')
        if not specialty:
            name = surgeon.get('doctor_name', '')
            # Try to extract specialty from name (look for patterns like "MS (Ortho)", "MBBS,MD", etc.)
            specialty_match = re.search(r'\b(MS|MD|MBBS|DNB|DM|MCh)\s*\(([^)]+)\)', name)
            if specialty_match:
                specialty = specialty_match.group(2)
            elif 'ortho' in name.lower():
                specialty = 'Orthopedics'
            elif 'gen' in name.lower():
                specialty = 'General Surgery'
            elif 'ent' in name.lower():
                specialty = 'ENT'
            elif 'anaes' in name.lower():
                specialty = 'Anesthesiology'

        # Determine rates - use surgery_charges as primary, fallback to charges
        base_rate = None
        if surgeon.get('surgery_charges') and surgeon['surgery_charges'] != 'NULL':
            try:
                base_rate = float(surgeon['surgery_charges'].replace("'", ""))
            except:
                pass

        if not base_rate and surgeon.get('charges') and surgeon['charges'] != 'NULL':
            try:
                base_rate = float(surgeon['charges'].replace("'", ""))
            except:
                pass

        # Set default rates if no base rate found
        if not base_rate:
            base_rate = 1000.0  # Default rate

        # Create rate structure
        tpa_rate = base_rate * 0.8  # 80% of base for TPA
        non_nabh_rate = base_rate
        nabh_rate = base_rate * 1.2  # 20% higher for NABH
        private_rate = base_rate * 1.5  # 50% higher for private

        mapped_surgeon = {
            'name': surgeon.get('doctor_name', '').replace("'", "''"),  # Escape quotes for SQL
            'specialty': specialty.replace("'", "''") if specialty else None,
            'department': f"Department {surgeon.get('department_id', 'Unknown')}" if surgeon.get('department_id') else None,
            'contact_info': None,  # Not available in source data
            'tpa_rate': round(tpa_rate, 2),
            'non_nabh_rate': round(non_nabh_rate, 2),
            'nabh_rate': round(nabh_rate, 2),
            'private_rate': round(private_rate, 2)
        }

        mapped_surgeons.append(mapped_surgeon)

    return mapped_surgeons

def generate_postgresql_inserts(surgeons: List[Dict]) -> str:
    """Generate PostgreSQL INSERT statements for ayushman_surgeons table"""

    if not surgeons:
        return "-- No surgeon data to import\n"

    sql = """-- Import surgeons from doctors.sql into ayushman_surgeons table
-- Generated automatically by import_surgeons.py

"""

    for surgeon in surgeons:
        name = surgeon['name']
        specialty = f"'{surgeon['specialty']}'" if surgeon['specialty'] else 'NULL'
        department = f"'{surgeon['department']}'" if surgeon['department'] else 'NULL'
        contact_info = 'NULL'  # Not available
        tpa_rate = surgeon['tpa_rate']
        non_nabh_rate = surgeon['non_nabh_rate']
        nabh_rate = surgeon['nabh_rate']
        private_rate = surgeon['private_rate']

        insert_stmt = f"""INSERT INTO public.ayushman_surgeons (
    name, specialty, department, contact_info, tpa_rate, non_nabh_rate, nabh_rate, private_rate
) VALUES (
    '{name}', {specialty}, {department}, {contact_info}, {tpa_rate}, {non_nabh_rate}, {nabh_rate}, {private_rate}
);
"""
        sql += insert_stmt

    sql += f"\n-- Total surgeons imported: {len(surgeons)}\n"
    return sql

def main():
    """Main function to process the doctors.sql file"""

    doctors_file = "/Users/apple/Downloads/doctors.sql"
    output_file = "/Users/apple/Desktop/Hope_projects/adamrit.com/import_ayushman_surgeons.sql"

    print("Parsing doctors.sql file...")
    surgeons = parse_doctors_sql(doctors_file)

    if not surgeons:
        print("No surgeon records found!")
        return

    print(f"Processing {len(surgeons)} surgeon records...")
    mapped_surgeons = map_to_ayushman_surgeons(surgeons)

    print("Generating PostgreSQL INSERT statements...")
    sql_content = generate_postgresql_inserts(mapped_surgeons)

    # Write to output file
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(sql_content)

    print(f"Generated SQL file: {output_file}")
    print(f"Ready to import {len(mapped_surgeons)} surgeons into ayushman_surgeons table")

    # Also save raw data as JSON for debugging
    debug_file = "/Users/apple/Desktop/Hope_projects/adamrit.com/surgeons_debug.json"
    with open(debug_file, 'w', encoding='utf-8') as f:
        json.dump({
            'raw_surgeons': surgeons,
            'mapped_surgeons': mapped_surgeons
        }, f, indent=2)

    print(f"Debug data saved to: {debug_file}")

if __name__ == "__main__":
    main()