# Room Management SQL Migration Guide

## Overview
This guide explains how to set up the Room Management feature in your application. The room management system supports multi-hospital filtering, ensuring users only see wards for their logged-in hospital.

## Important: Hospital Name Convention

**The application uses lowercase hospital identifiers:**
- Hope Hospital: `'hope'`
- Ayushman Hospital: `'ayushman'`

All `hospital_name` values in the database **must** use these lowercase identifiers to match the application's `hospital.ts` configuration.

## SQL Files Overview

| File | Purpose | When to Use |
|------|---------|-------------|
| `wards_table_migration.sql` | Creates fresh `room_management` table with sample data | First-time setup |
| `migrate_wards_to_room_management.sql` | Migrates data from existing `wards` table to `room_management` | If you have existing `wards` table |
| `update_hospital_names.sql` | Fixes existing hospital_name values to lowercase | After migration, if names are incorrect |
| `insert_ward_data.sql` | Inserts Hope Hospital ward data | To add Hope Hospital wards |
| `insert_ayushman_ward_data.sql` | Inserts Ayushman Hospital ward data | To add Ayushman Hospital wards |
| `rename_wards_to_room_management.sql` | Renames `wards` table to `room_management` | Alternative to migration |

## Execution Scenarios

### Scenario 1: Fresh Installation (No existing data)

```sql
-- Step 1: Create table and structure
-- Execute: wards_table_migration.sql
-- This creates the table, indexes, RLS policies, and sample data

-- Step 2 (Optional): Add Ayushman Hospital data
-- Execute: insert_ayushman_ward_data.sql
```

### Scenario 2: You Have Existing `wards` Table

```sql
-- Step 1: Migrate existing data to room_management
-- Execute: migrate_wards_to_room_management.sql
-- This creates room_management table and copies all data from wards
-- Also converts hospital_name to lowercase ('hope', 'ayushman')

-- Step 2: Verify hospital names are correct
-- Run verification query from the migration script

-- Step 3 (Optional): Drop old wards table
-- Uncomment the DROP TABLE line in migrate_wards_to_room_management.sql
```

### Scenario 3: Hospital Names Are Wrong

If you see "No wards found" but data exists in the database:

```sql
-- Step 1: Check current hospital names
SELECT DISTINCT hospital_name FROM room_management;

-- Step 2: If names are not lowercase ('hope', 'ayushman'), fix them
-- Execute: update_hospital_names.sql
```

### Scenario 4: Just Rename Table (Fastest)

If your `wards` table structure is already correct:

```sql
-- Execute: rename_wards_to_room_management.sql
-- Then: update_hospital_names.sql (to fix hospital names)
```

## Hospital Filtering

The application automatically filters wards based on the logged-in user's hospital:

- **Hope Hospital Login** → Shows only wards where `hospital_name = 'hope'`
- **Ayushman Hospital Login** → Shows only wards where `hospital_name = 'ayushman'`

This is configured in `src/types/hospital.ts`:

```typescript
hope: {
  name: 'hope',  // ← Used for database filtering
  fullName: 'Hope Multi-Specialty Hospital',
  ...
}

ayushman: {
  name: 'ayushman',  // ← Used for database filtering
  fullName: 'Ayushman Hospital',
  ...
}
```

## Verification Queries

### Check Ward Count by Hospital
```sql
SELECT
  hospital_name,
  COUNT(*) as ward_count
FROM room_management
GROUP BY hospital_name
ORDER BY hospital_name;
```

Expected output:
```
hospital_name | ward_count
--------------+-----------
ayushman      | 12
hope          | 20
```

### View All Hope Hospital Wards
```sql
SELECT ward_id, ward_type, location, maximum_rooms
FROM room_management
WHERE hospital_name = 'hope'
ORDER BY ward_type;
```

### View All Ayushman Hospital Wards
```sql
SELECT ward_id, ward_type, location, maximum_rooms
FROM room_management
WHERE hospital_name = 'ayushman'
ORDER BY ward_type;
```

## Troubleshooting

### Issue: "No wards found" when data exists

**Cause:** Hospital names in database don't match application config

**Solution:**
```sql
-- Execute: update_hospital_names.sql
```

### Issue: Wards from other hospitals showing up

**Cause:** Hospital filtering not working

**Check:**
1. Verify logged-in hospital in browser (check sidebar/header)
2. Verify hospital_name values in database:
   ```sql
   SELECT DISTINCT hospital_name FROM room_management;
   ```
3. Should return only: `'hope'` and/or `'ayushman'`

### Issue: Cannot insert duplicate ward_id

**Cause:** Ward ID already exists

**Solution:** Use a different ward_id or update the existing record

## Adding New Wards

### Via Application UI
1. Log in to the hospital
2. Navigate to Room Management (`/room-management`)
3. Click "Add Ward" button
4. Fill in the form and submit

### Via SQL
```sql
INSERT INTO room_management (ward_type, location, ward_id, maximum_rooms, hospital_name)
VALUES
('New Ward Type', 'Location', 'UNIQUEID', 10, 'hope')
ON CONFLICT (ward_id) DO NOTHING;
```

## Sample Data

### Hope Hospital (20 wards)
- Delux Room, ICU, Semi-Private, Dialysis, Operation Theatres, etc.
- See `insert_ward_data.sql` for complete list

### Ayushman Hospital (12 wards)
- General Ward, ICU, Private Rooms, Maternity, Pediatric, etc.
- See `insert_ayushman_ward_data.sql` for complete list

## Quick Start

**If you have existing `wards` table:**
```bash
# In Supabase SQL Editor, execute in this order:
1. migrate_wards_to_room_management.sql
2. update_hospital_names.sql
3. insert_ayushman_ward_data.sql (optional)
```

**If starting fresh:**
```bash
# In Supabase SQL Editor, execute:
1. wards_table_migration.sql
2. insert_ayushman_ward_data.sql (optional)
```

After executing, refresh your Room Management page to see the wards!
