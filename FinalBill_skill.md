# Final Bill - Feature Documentation (skill.md)

## Overview

Final Bill is a comprehensive hospital IPD (Inpatient Department) billing page used to generate, edit, and manage final discharge bills for admitted patients. It supports multiple billing categories including PRIVATE, CGHS, ECHS, ESIC, and Corporate patients.

**Route:** `/final-bill/:visitId`
**Edit Route:** `/edit-final-bill/:visitId`

---

## Patient Header Section

The top section displays patient and admission details. All fields are editable.

| Field | Description | Example |
|-------|-------------|---------|
| **Bill No** | Auto-generated bill number | PVT-016-127 |
| **Registration No** | Patient registration number | 1244925120062 |
| **Name of Patient** | Full name of the patient | test |
| **Age** | Age in years | 25 |
| **Sex** | Gender (male/female/other) | male |
| **Address** | Patient address | nagpur |
| **Date of Admission** | Admission date (date picker) | 06.12.2025 |
| **Date of Discharge** | Discharge date (date picker) | 24.12.2025 |
| **Bill Date** | Date the bill is generated (date picker, top-right) | dd.mm.yyyy |
| **IP No** | Inpatient number / Rank | — |
| **Service No** | Service number | — |
| **Category** | Billing category (highlighted in green) | GENERAL |
| **Diagnosis** | Primary diagnosis (textarea, resizable) | — |
| **Claim ID** | Insurance/CGHS claim identifier | IN251650919 |
| **Name of Private Beneficiary** | Beneficiary name (for CGHS/ECHS) | — |
| **Relation with IP** | Relation dropdown | SELF |

### Category Options
- ESIC
- CGHS
- ECHS

### Relation Options
- SELF
- SPOUSE
- SON
- DAUGHTER
- FATHER
- MOTHER

---

## Bill Table Structure

The bill items are displayed in a table with the following columns:

| Column | Description |
|--------|-------------|
| **SR.NO** | Serial number of the item |
| **ITEM** | Description of the charge item |
| **CGHS NABH CODE No.** | CGHS/NABH procedure code |
| **CGHS NABH RATE** | Rate as per CGHS/NABH schedule |
| **QTY** | Quantity (number of days/units) |
| **AMOUNT** | Calculated amount (Rate x Qty) |
| **ACTIONS** | Action buttons (Add, Delete, Edit) |

---

## Bill Sections

### Section 1: Conservative Treatment (Collapsible Header)

- Collapsible section with chevron toggle
- Shows date range (e.g., 06/12/25 - 24/12/25)
- Has **"+ Add Date Range"** button to add multiple date ranges
- Represents pre-surgical treatment period during admission
- Dates auto-sync from admission/discharge dates

### Section 2: Surgical Package (Days) (Collapsible Header)

- Collapsible section with chevron toggle
- Shows date range with configurable number of days
- Has **"+ Add Date Range"** button
- Represents the surgery package cost period

---

### Sr. 1 - Consultation for Inpatients

- **Doctor Selection:** Dropdown to select consulting doctor (e.g., Dr. B.K. Murali)
- **Date Range:** Per sub-item date range (e.g., 06/12/25 - 24/12/25)
- **"+ Add Date Range"** button for multiple date ranges per doctor
- **"Auto-Synced with Conservative Treatment"** checkbox — when checked, dates auto-sync with the Conservative Treatment section dates
- **+ Add** button (green) to add more consultation sub-items
- **Fields:** CGHS NABH Code, Rate (e.g., 550), Qty (e.g., 10), Amount (e.g., 5500)
- **Delete:** Red trash icon per sub-item

### Sr. 2 - Accommodation Charges

- **Ward Type Dropdown:** Select accommodation type
  - Accommodation of General Ward
  - Accommodation of Semi Private Ward
  - Accommodation of Private Ward
  - Accommodation in ICU
- **Date Range:** Per sub-item date range
- **"+ Add Date Range"** button
- **+ Add** button (green) to add more accommodation sub-items
- **Fields:** Rate (e.g., 1500), Qty (e.g., 10), Amount (e.g., 15000)
- **Delete:** Red trash icon per sub-item

### Sr. 3 - Pathology Charges

- **Date Range Picker:** From date — To date (e.g., 06.12.2025 to 24.12.2025)
- **"+ Add Date Range"** button
- **+ Add** button (green) to add pathology charge items
- **Notes:** Text area for entering pathology notes (below items)
- **Fields:** CGHS NABH Code, Rate (e.g., 550), Qty (e.g., 14), Amount (e.g., 9100)
- **Edit Icon:** Pencil icon for editing pathology details
- **Delete:** Red trash icon per sub-item

### Sr. 4 - Medicine Charges

- **Description:** Shows medication info (e.g., "No medications prescribed for this visit")
- **Date Range:** Per sub-item
- **+ Add** button (green) to add medicine charge items
- **Notes:** Text area for entering medicine notes (below items)
- **Fields:** Rate, Qty, Amount
- **Edit Icon:** Pencil icon for editing medicine details
- **Delete:** Red trash icon per sub-item

### Sr. 6 - Other Charges

- **Description:** Item name (e.g., ECG)
- **+ Add** button (green) to add more charge items
- **Fields:** CGHS NABH Code (e.g., 590), Rate (e.g., 50), Qty (e.g., 1), Amount (e.g., 50)
- **Delete:** Red trash icon per sub-item

### Sr. 8 - Miscellaneous Charges

- **Description:** Item name (e.g., Registration)
- **+ Add** button (green) to add more charge items
- **Fields:** Rate (e.g., 500), Qty (e.g., 1), Amount (e.g., 500)
- **Delete:** Red trash icon per sub-item

### Sr. 12 - Surgical Treatment

Separate section with its own column headers:

| Column | Description |
|--------|-------------|
| **Code** | Surgery CGHS code (e.g., 1137) |
| **Adjustment Details** | Two dropdown rows for primary & secondary adjustments |
| **Amount** | Base surgery amount (e.g., 607) |
| **Final Amount** | Amount after adjustments applied |

- **+ Add** button (green) to add surgical treatment rows
- Each row has two adjustment dropdowns (primary & secondary)
- **Delete:** Red trash icon per surgery row

#### CGHS Adjustment Options (for each dropdown):
| Option | Discount |
|--------|----------|
| No Adjustment | 0% |
| 10% Less as per Gen. Ward Charges | -10% |
| 25% Less as per CGHS Guideline | -25% |
| 50% Less as per CGHS Guideline | -50% |
| 75% Less as per CGHS Guidelines | -75% |

#### Adjustment Calculation:
```
Base Amount = Rate x Quantity
After 1st Adjustment = Base Amount - (Base Amount x Primary %)
After 2nd Adjustment = After 1st - (After 1st x Secondary %)
Final Amount = After 2nd Adjustment
```

---

## CRUD Operations

### Add (+Add Button)
- Green **"+ Add"** button available in every section
- Adds a new sub-item row to the section
- New rows have empty/default values ready for input

### Edit (Inline Editing)
- All fields (description, rate, qty, code) are directly editable inline
- Click on any field to modify its value
- Amount auto-calculates as `Rate x Qty`
- Pencil/Edit icon available for pathology and medicine sections

### Delete (Trash Icon)
- Red trash icon on each row
- Shows confirmation dialog before deleting
- Removes the item from the section

### Add Date Range
- **"+ Add Date Range"** link available in sections and sub-items
- Allows adding multiple date ranges to a single item
- Each date range has From and To date pickers
- Days are calculated as: `differenceInDays(to, from) + 1`

---

## Amount Calculation

### Total Bill Calculation:
```
Total = Sum of all section sub-item amounts + Surgical Treatment total (with adjustments)
```

### Per Item:
```
Amount = CGHS NABH Rate x Qty
```

### Surgical Treatment:
```
Final Amount = Base Amount
  - (Base Amount x Primary Adjustment %)
  - (Remaining x Secondary Adjustment %)
```

### Amount in Words:
- Converts total to English words (e.g., 7800 → "SEVEN THOUSAND EIGHT HUNDRED")
- Uses Indian numbering system (THOUSAND, LAKH, CRORE)

---

## Data Storage (Supabase)

### `bills` Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| patient_id | UUID | FK to patients |
| visit_id | UUID | FK to visits |
| bill_no | TEXT | Bill number |
| claim_id | TEXT | Claim identifier |
| date | DATE | Bill date |
| category | TEXT | Billing category |
| total_amount | NUMERIC | Total bill amount |
| status | TEXT | DRAFT / PREPARED / SUBMITTED / FINALIZED |
| bill_patient_data | JSONB | Stores patient header info as JSON |
| bill_items_json | JSONB | Stores bill items as JSON |
| created_at | TIMESTAMP | Created timestamp |
| updated_at | TIMESTAMP | Last updated timestamp |

### `bill_sections` Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| bill_id | UUID | FK to bills |
| section_title | TEXT | "Conservative Treatment", "Surgical Package", etc. |
| date_from | DATE | Section start date |
| date_to | DATE | Section end date |
| section_order | INTEGER | Display order |
| conservative_additional_start | DATE | Additional Conservative Treatment start date |
| conservative_additional_end | DATE | Additional Conservative Treatment end date |

### `bill_line_items` Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| bill_id | UUID | FK to bills |
| bill_section_id | UUID | FK to bill_sections |
| sr_no | TEXT | Serial number |
| item_description | TEXT | Item name/description |
| cghs_nabh_code | TEXT | CGHS/NABH code |
| cghs_nabh_rate | NUMERIC(10,2) | Rate amount |
| qty | INTEGER | Quantity (default 1) |
| amount | NUMERIC(10,2) | Total amount |
| item_type | TEXT | 'standard' or 'surgical' |
| base_amount | NUMERIC | For surgical items only |
| primary_adjustment | TEXT | First adjustment label |
| secondary_adjustment | TEXT | Second adjustment label |
| dates_info | TEXT | JSON string of date ranges |
| item_order | INTEGER | Display order |

### Related Tables
- `visit_accommodations` — Accommodation records with rate types
- `bills_diagnoses` — Links bills to diagnoses
- `bills_surgeries` — Links bills to surgeries with status
- `bills_pharmacy` — Medication/pharmacy items

---

## Data Flow

### Loading Bill Data:
1. Page loads with `visitId` from URL params
2. `useFinalBillData` hook fetches bill data from Supabase
3. `fetchPatientInfo()` loads patient demographics and visit details
4. Section-specific fetchers load accommodations, pathology, radiology, medications, surgeries
5. Data populates the patient header and invoice items state

### Saving Bill Data:
1. User clicks Save
2. `saveBill` mutation fires
3. Creates or updates `bills` record with patient data JSON
4. Deletes and recreates `bill_sections` records
5. Deletes and recreates `bill_line_items` records
6. All saved to Supabase with timestamps

### Bill Status Workflow:
```
DRAFT → PREPARED → SUBMITTED → FINALIZED
```
- Can edit until status is FINALIZED
- Tracks `created_at` and `updated_at` timestamps

---

## Special Features

### Auto-Sync with Conservative Treatment
- Checkbox on Consultation for Inpatients section
- When enabled, consultation dates automatically match Conservative Treatment date range
- Updates qty (days) accordingly

### Collapsible Sections
- Conservative Treatment and Surgical Package headers are collapsible
- Toggle with chevron up/down icon
- State managed via `isOpen` flag in section data

### Print Functionality
- Print button generates printable final bill
- HTML print layout with CSS styling
- Supports multiple bill formats (Standard, ESIC, Corporate)

### ESIC Letter Generator
- Generates ESIC-format letter from bill data
- Component: `ESICLetterGenerator`

### Discharge Summary Link
- Links to discharge summary from within the bill
- Component: `DischargeSummary`

### Discount Tab
- Manages discounts applied to the bill
- Component: `DiscountTab`

### Advance Payment Modal
- Records and tracks advance payments
- Component: `AdvancePaymentModal`

### Financial Summary
- Displays: Advance Payment, Total Clinical Services, Laboratory Services
- Shows totals, discounts, amounts paid, balance
- Refunded amount tracking
- Hook: `useFinancialSummary`

### Claim ID Validation
- Cleans whitespace and removes duplicate parts
- Priority sources: Manual input > Visit claim_id > Insurance person no > Report data > visit_id
- Display format: "CLAIM ID - IN251650919"

---

## Key Source Files

| File | Description |
|------|-------------|
| `src/pages/FinalBill.tsx` | Main Final Bill page (primary file) |
| `src/pages/EditFinalBill.tsx` | Edit Final Bill page |
| `src/pages/FinalBillTest.tsx` | Test page |
| `src/hooks/useFinalBillData.ts` | React Query hook for bill data CRUD |
| `src/hooks/useFinancialSummary.ts` | Financial summary calculations |
| `src/components/patient/tabs/FinalBillTab.tsx` | Read-only bill display tab |
| `src/components/patient/tabs/EditableFinalBillTab.tsx` | Editable bill interface |
| `src/components/ESICLetterGenerator.tsx` | ESIC letter generation |
| `src/components/DischargeSummary.tsx` | Discharge summary component |
| `src/components/DiscountTab.tsx` | Discount management |
| `src/components/AdvancePaymentModal.tsx` | Advance payment modal |
| `src/components/AppRoutes.tsx` | Route definitions |

---

## Rate Types (CGHS/NABH)

Rates are selected based on corporate category:

| Rate Type | Description |
|-----------|-------------|
| `private_rate` | Private/self-pay rate |
| `NABH_NABL_Rate` | NABH accredited rate |
| `Non_NABH_NABL_Rate` | Non-NABH rate |
| `bhopal_nabh_rate` | Bhopal NABH-specific rate |

Rate selection depends on:
- Patient category (CGHS, ECHS, ESIC, Corporate)
- Hospital accreditation status
- Ward type selected

---

## Technologies Used

- **Frontend:** React + TypeScript
- **UI Library:** shadcn/ui (Table, Button, Input, Select, Dialog, AlertDialog, etc.)
- **State Management:** React useState + React Query (TanStack Query)
- **Database:** Supabase (PostgreSQL)
- **Date Handling:** date-fns (format, differenceInDays)
- **Icons:** Lucide React
- **Notifications:** Sonner (toast)
- **Routing:** React Router DOM
