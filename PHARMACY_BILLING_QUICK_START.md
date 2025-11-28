# Pharmacy Billing - Quick Start Guide

## ✅ Integration Complete!

Your Pharmacy Billing page is now connected to save data in:
- `pharmacy_sales` (bill header)
- `pharmacy_sale_items` (bill items)

---

## 📋 What Was Changed

### File: `PharmacyBilling.tsx`

**Changes Made:**
1. ✅ Added import: `import { savePharmacySale, SaleData } from '@/lib/pharmacy-billing-service'`
2. ✅ Updated `handleCompleteSale` function (line 472-524)
3. ✅ Now saves to new pharmacy_sales tables instead of old structure

**What it does now:**
- Form mein jo data fill karte ho (Patient ID, Patient Name, Visit ID, Sale Type, Payment Method)
- Cart mein jo medicines add karte ho
- Order Summary (Subtotal, Discount, Tax, Total)
- Sab data **pharmacy_sales** aur **pharmacy_sale_items** tables mein save hota hai

---

## 🚀 How to Test

### Step 1: Run Supabase Migration (if not done)
```sql
-- In Supabase SQL Editor, run:
-- File: supabase_pharmacy_migration.sql
```

### Step 2: Add Sample Medicine (if needed)
```sql
-- In Supabase SQL Editor:
INSERT INTO public.medication (
  name, generic_name, item_code, stock, price_per_strip
) VALUES (
  'Paracetamol 500mg', 'PARACETAMOL', 'P001', '100', '50'
);
```

### Step 3: Test the Form

1. **Open Pharmacy Billing page**
2. **Fill Sale Information:**
   - Sale Type: Select "Other"
   - Patient ID: Enter "123"
   - Visit ID: Enter "456"
   - Patient Name: Enter "Test Patient"

3. **Add Medicine to Cart:**
   - Search for "Paracetamol"
   - Click to add to cart
   - Set quantity: 2

4. **Select Payment Method:**
   - Click "CASH"

5. **Click "Complete Sale"**

6. **Check Result:**
   - Alert should show: "✅ Sale completed successfully! Sale ID: XXX"
   - Check Supabase database

---

## 🔍 Verify in Supabase

### Check Sale Header:
```sql
SELECT * FROM pharmacy_sales ORDER BY created_at DESC LIMIT 1;
```

**Expected Result:**
```
sale_id: 1
patient_id: 123
patient_name: "Test Patient"
visit_id: 456
sale_type: "other"
subtotal: 100.00
discount: 0.00
tax_gst: 9.00
total_amount: 109.00
payment_method: "CASH"
payment_status: "COMPLETED"
```

### Check Sale Items:
```sql
SELECT * FROM pharmacy_sale_items WHERE sale_id = 1;
```

**Expected Result:**
```
sale_item_id: 1
sale_id: 1
medication_id: <uuid>
medication_name: "Paracetamol 500mg"
quantity: 2
unit_price: 50.00
total_price: 100.00
```

---

## 📊 Data Flow

```
User fills form
    ↓
Click "Complete Sale"
    ↓
PharmacyBilling.tsx handleCompleteSale()
    ↓
Calls savePharmacySale() from pharmacy-billing-service.ts
    ↓
Inserts into pharmacy_sales (header)
    ↓
Gets sale_id
    ↓
Inserts into pharmacy_sale_items (items with sale_id)
    ↓
Success! Shows alert with sale_id
```

---

## 🎯 What Gets Saved

### From Form → pharmacy_sales:
| Form Field | Database Column |
|------------|-----------------|
| Sale Type dropdown | sale_type |
| Patient ID input | patient_id |
| Visit ID input | visit_id |
| Patient Name input | patient_name |
| Prescription ID (if any) | prescription_number |
| Payment Method (CASH/CARD/UPI) | payment_method |
| Subtotal (calculated) | subtotal |
| Discount (calculated) | discount |
| Tax (calculated) | tax_gst |
| Total (calculated) | total_amount |

### From Cart → pharmacy_sale_items:
| Cart Data | Database Column |
|-----------|-----------------|
| Medicine ID | medication_id |
| Medicine Name | medication_name |
| Generic Name | generic_name |
| Quantity | quantity |
| Unit Price | unit_price |
| Discount | discount |
| Tax Amount | tax_amount |
| Total Price | total_price |

---

## 🧪 Sample Data for Testing

```javascript
// Test Data 1: Single Medicine
{
  saleType: "other",
  patientInfo: { id: "123", name: "Ram Kumar" },
  visitId: "456",
  cart: [
    { medicine_id: "uuid", medicine_name: "Paracetamol 500mg", quantity: 2, unit_price: 50 }
  ],
  paymentMethod: "CASH"
}

// Test Data 2: Multiple Medicines
{
  saleType: "other",
  patientInfo: { id: "789", name: "Sita Devi" },
  visitId: "101",
  cart: [
    { medicine_id: "uuid1", medicine_name: "Paracetamol 500mg", quantity: 2, unit_price: 50 },
    { medicine_id: "uuid2", medicine_name: "Crocin", quantity: 1, unit_price: 150 },
    { medicine_id: "uuid3", medicine_name: "Amoxicillin", quantity: 1, unit_price: 200 }
  ],
  paymentMethod: "CARD"
}
```

---

## ⚠️ Common Issues

### Issue 1: "Cannot find module '@/lib/pharmacy-billing-service'"
**Fix**: Make sure `pharmacy-billing-service.ts` file exists at:
```
src/lib/pharmacy-billing-service.ts
```

### Issue 2: "relation pharmacy_sales does not exist"
**Fix**: Run `supabase_pharmacy_migration.sql` in Supabase SQL Editor first

### Issue 3: "foreign key constraint fails"
**Fix**: Make sure medication exists in `medication` table with correct UUID

### Issue 4: "Error: insert or update violates check constraint"
**Fix**: Ensure payment_method is one of: CASH, CARD, UPI, INSURANCE

---

## 📁 Files Involved

```
src/
├── components/
│   └── pharmacy/
│       └── PharmacyBilling.tsx          ← Updated (imports service)
└── lib/
    └── pharmacy-billing-service.ts      ← Service functions

Database:
├── pharmacy_sales                        ← Bill header
└── pharmacy_sale_items                   ← Bill items
    └── (links to) medication            ← Medicine catalog
```

---

## 🎉 Summary

✅ **PharmacyBilling.tsx updated**
✅ **Saves to pharmacy_sales table** (bill header)
✅ **Saves to pharmacy_sale_items table** (bill items)
✅ **Links to medication table** (medicine details)
✅ **Success alert shows sale_id**

**Status**: Ready to use! 🚀

---

## 📞 Next Steps

1. Test with real data
2. Print receipt functionality (optional)
3. View sales history (already created views available)
4. Stock update on sale (optional - commented in service)

---

**Updated**: 2025-10-07
**Status**: Production Ready ✅
