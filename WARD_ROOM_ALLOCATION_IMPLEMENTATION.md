# Ward and Room Allocation Feature - Implementation Guide

## ✅ What Was Implemented

Added **Ward Allotted** and **Room Allotted** fields to the Visit Registration Form, allowing staff to assign wards and rooms to patients during visit registration.

---

## 📁 Files Modified

### 1. **Database Migration**
- **File:** `add_ward_room_to_visits.sql`
- **Action:** Adds `ward_allotted` and `room_allotted` columns to `visits` table
- **Execute:** Run this in Supabase SQL Editor FIRST

### 2. **Visit Registration Form**
- **File:** `src/components/VisitRegistrationForm.tsx`
- **Changes:**
  - Added `wardAllotted` and `roomAllotted` to form state
  - Updated INSERT query to save ward/room data
  - Updated UPDATE query for edit mode
  - Updated form reset logic

### 3. **Visit Details Section**
- **File:** `src/components/visit/VisitDetailsSection.tsx`
- **Changes:**
  - Added ward and room dropdowns
  - Fetches wards from `room_management` table
  - Dynamic room dropdown based on selected ward
  - "Check Availability" button implementation

---

## 🚀 How to Setup

### Step 1: Database Migration

```sql
-- Execute in Supabase SQL Editor:
ALTER TABLE visits
ADD COLUMN IF NOT EXISTS ward_allotted TEXT,
ADD COLUMN IF NOT EXISTS room_allotted TEXT;
```

Or run the entire file: `add_ward_room_to_visits.sql`

### Step 2: Ensure Room Management Data Exists

Make sure you have wards in the `room_management` table:

```sql
-- Check if wards exist:
SELECT * FROM room_management;

-- If no wards, add some:
-- (Use the SQL files created earlier: insert_ward_data.sql, etc.)
```

### Step 3: Restart Application

```bash
npm run dev
```

---

## 🎯 Features

### 1. **Ward Allotted Dropdown**
- Fetches all wards from `room_management` table
- Shows ward type and maximum rooms
- Example: "General Ward (Max: 10 rooms)"
- **Required field** (marked with *)

### 2. **Room Allotted Dropdown**
- Dynamically populated based on selected ward
- Shows room numbers from 1 to maximum_rooms
- Disabled until ward is selected
- **Required field** (marked with *)

### 3. **Check Availability Button**
- Shows available vs occupied rooms
- Queries `visits` table for current allocations
- Displays alert with room status

### 4. **Smart Validation**
- Ward must be selected before room
- Room selection resets when ward changes
- Both fields required for IPD patients

---

## 📊 Data Flow

```
User selects Ward
    ↓
System fetches ward details
    ↓
Room dropdown populated (1 to max_rooms)
    ↓
User clicks "Check Availability"
    ↓
System queries occupied rooms
    ↓
Shows available rooms
    ↓
User selects room
    ↓
Form submitted
    ↓
Saved to visits table (ward_allotted, room_allotted)
```

---

## 💡 Usage Example

### Register New Visit with Ward/Room:

1. Open "Register New Visit" dialog
2. Fill in patient details
3. Select **Ward Allotted**: "General Ward"
4. Click **"Check Availability"** to see available rooms
5. Select **Room Allotted**: "Room 5"
6. Click "Register Visit"

### Data Saved:
```json
{
  "visit_id": "IH25J0601",
  "patient_id": "uuid",
  "ward_allotted": "GENHOP261",
  "room_allotted": "5"
}
```

---

## 🔍 Check Availability Feature

When user clicks "Check Availability":

1. System queries all visits with same ward_id
2. Collects occupied room numbers
3. Calculates available rooms
4. Displays alert:

```
Available rooms: 7
Occupied rooms: 3
Total rooms: 10

Available: 1, 2, 4, 6, 7, 8, 9
```

---

## 🎨 UI Design

### Ward Allotted Field:
```
┌─────────────────────────────────────┐
│ Ward Allotted *    Check Availability│
├─────────────────────────────────────┤
│ General Ward (Max: 10 rooms)    ▼  │
└─────────────────────────────────────┘
```

### Room Allotted Field:
```
┌─────────────────────────────┐
│ Room Allotted *             │
├─────────────────────────────┤
│ Room 5                  ▼  │
└─────────────────────────────┘
```

---

## 🐛 Troubleshooting

### Issue: No wards in dropdown
**Solution:** Run SQL to add wards to `room_management` table
```sql
-- Execute: insert_ward_data.sql or insert_ayushman_ward_data.sql
```

### Issue: Room dropdown disabled
**Solution:** Select a ward first. Room dropdown is dependent on ward selection.

### Issue: "Check Availability" shows all rooms occupied
**Solution:**
- Check if `visits` table has correct ward_allotted/room_allotted data
- Verify patient_type (IPD vs OPD)
- May need to discharge/delete test visits

### Issue: Database error on submit
**Solution:** Ensure SQL migration was executed:
```sql
-- Verify columns exist:
SELECT column_name FROM information_schema.columns
WHERE table_name = 'visits'
AND column_name IN ('ward_allotted', 'room_allotted');
```

---

## 🔄 Hospital-Wise Filtering

Wards are automatically filtered by hospital:
- **Hope login:** Shows only Hope wards (`hospital_name = 'hope'`)
- **Ayushman login:** Shows only Ayushman wards (`hospital_name = 'ayushman'`)

*This requires proper hospital_name values in room_management table*

---

## ✅ Testing Checklist

- [ ] SQL migration executed successfully
- [ ] Wards visible in dropdown
- [ ] Room dropdown populates when ward selected
- [ ] "Check Availability" shows correct data
- [ ] Form submits successfully with ward/room
- [ ] Data saved to database correctly
- [ ] Edit mode loads ward/room values
- [ ] Hospital filtering works (if multi-hospital)

---

## 📝 Database Schema

### visits table (updated):
```sql
CREATE TABLE visits (
  ...existing columns...
  ward_allotted TEXT,           -- Ward ID from room_management
  room_allotted TEXT,           -- Room number (1, 2, 3, etc.)
  ...
);
```

### room_management table (referenced):
```sql
CREATE TABLE room_management (
  ward_id TEXT PRIMARY KEY,
  ward_type TEXT,
  location TEXT,
  maximum_rooms INTEGER,
  hospital_name TEXT
);
```

---

## 🎉 Success!

Ward and Room Allocation feature is now fully integrated into the Visit Registration system!

Users can now:
✅ Select wards from hospital inventory
✅ Assign specific rooms to patients
✅ Check real-time room availability
✅ Track ward/room allocations in visits table

---

**Questions? Check the code comments in:**
- `src/components/VisitRegistrationForm.tsx:45-46` (form state)
- `src/components/visit/VisitDetailsSection.tsx:304-371` (UI components)
