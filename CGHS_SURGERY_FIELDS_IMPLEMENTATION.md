# CGHS Surgery Fields Implementation

## Overview
Added three new fields to the CGHS Surgery section that appear below the sanctioned status dropdown:
1. **Implant** - Text field for implant details
2. **Anaesthetist name** - Dropdown populated from hope_consultants table
3. **Type of anes.Service** - Dropdown with predefined anaesthesia types

## Changes Made

### 1. Database Migration
Created migration file: `supabase/migrations/20250922000000_add_surgery_detail_fields.sql`
- Adds `implant` (TEXT) column to visit_surgeries table
- Adds `anaesthetist_name` (TEXT) column to visit_surgeries table
- Adds `anaesthesia_type` (TEXT) column to visit_surgeries table

### 2. Frontend Components

#### MedicalInformationSection Component (`src/components/visit/MedicalInformationSection.tsx`)
- Extended the `selectedSurgeries` state to include the new fields
- Added `handleSurgeryFieldChange` function to manage field updates
- Added UI elements for each selected surgery:
  - Implant text input field
  - Anaesthetist name dropdown (fetches from hope_consultants table)
  - Type of anaesthesia service dropdown with options:
    - General
    - Regional
    - Local
    - Sedation
    - Spinal
    - Epidural
    - Combined Spinal-Epidural
    - Monitored Anesthesia Care
- Updated the `onSurgeryChange` callback to include surgery details

### 3. Backend Integration

#### useVisitSurgeries Hook (`src/hooks/useVisitSurgeries.ts`)
- Updated query to fetch new fields from visit_surgeries table
- Added `useUpdateSurgeryDetails` function to update surgery details

#### SurgeryManagementSection Component (`src/components/SurgeryManagementSection.tsx`)
- Updated insert operation to include default values for new fields

## UI Layout
The new fields are displayed in a grid layout below the sanction status dropdown:
- Positioned with a left border for visual hierarchy
- Uses smaller labels and input fields to maintain clean design
- Three columns on desktop, stacked on mobile

## How to Use

1. In the CGHS Surgery section, search and select a surgery
2. Each selected surgery will show:
   - Surgery name and code badge
   - Sanction status dropdown
   - Below the sanction status:
     - Implant field - Enter implant details if applicable
     - Anaesthetist name - Select from dropdown
     - Type of anes.Service - Select the type of anaesthesia

## Data Flow
1. User selects a surgery from the search dropdown
2. Surgery is added to the selected surgeries list with default values
3. User can update the implant, anaesthetist, and anaesthesia type for each surgery
4. When the form is submitted, the data is saved to the visit_surgeries table

## Future Enhancements
- Auto-populate anaesthetist based on surgery type
- Add validation for required fields based on surgery type
- Add templates for common implant descriptions