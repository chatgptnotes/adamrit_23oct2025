# Payment Integration Guide

This guide explains how to integrate the new payment tracking system into your existing forms.

## Overview

The payment system automatically tracks all cash transactions and displays them in the Cash Book. The system consists of:

1. **Database Tables**: `patient_payment_transactions` - central payment tracking
2. **Auto-Voucher System**: Automatically creates accounting vouchers for cash payments
3. **Triggers**: Auto-record pharmacy payments
4. **Frontend Service**: Easy-to-use functions for recording payments

## 1. Pharmacy Payments (Already Integrated!)

Pharmacy payments are **automatically** recorded via database trigger. No changes needed!

When you save a pharmacy sale using `savePharmacySale()`:
- The sale is saved to `pharmacy_sales` table
- A trigger automatically creates an entry in `patient_payment_transactions`
- If payment_mode = 'CASH', a voucher is auto-created
- The transaction appears in Cash Book immediately

```typescript
import { savePharmacySale } from '@/lib/pharmacy-billing-service';

// Existing code - no changes needed!
const result = await savePharmacySale({
  patient_id: patientId,
  visit_id: visitId,
  payment_method: 'CASH', // or 'CARD', 'UPI', etc.
  total_amount: 1500.00,
  items: cartItems,
  // ... other fields
});

// Payment is automatically recorded ✓
```

## 2. OPD Service Payments (Integration Required)

For OPD services, you need to call the payment recording function after billing.

### Step 1: Import the payment service

```typescript
import { recordOpdServicePayment } from '@/lib/payment-service';
```

### Step 2: Call after billing OPD services

```typescript
// Example: In your OPD billing component

// After adding clinical services to visit
const services = [
  { service_id: 'uuid1', amount: 500 },
  { service_id: 'uuid2', amount: 1000 }
];

const totalAmount = services.reduce((sum, s) => sum + s.amount, 0);

// Add services to visit (existing code)
for (const service of services) {
  await addClinicalServiceToVisit({
    visitId: visit.visit_id,
    clinicalServiceId: service.service_id,
    rateUsed: service.amount,
    rateType: 'private',
    quantity: 1
  });
}

// NEW: Record the payment
const paymentResult = await recordOpdServicePayment({
  visitId: visit.visit_id, // TEXT visit ID like "IH25I22001"
  paymentMode: 'CASH', // or 'CARD', 'UPI', etc.
  amount: totalAmount,
  narration: 'OPD consultation and services',
  createdBy: currentUser?.id // optional
});

if (paymentResult.success) {
  // Payment recorded successfully!
  // Will appear in Cash Book automatically
  toast.success('Payment recorded successfully');
} else {
  toast.error('Payment recording failed: ' + paymentResult.error);
}
```

### Integration Points

Update these files to add payment recording:

1. **Visit Clinical Services Form** (where services are added)
   - After billing, show a payment modal
   - Collect payment_mode and amount
   - Call `recordOpdServicePayment()`

2. **OPD Billing Page** (if you have one)
   - Add payment recording after service selection
   - Call `recordOpdServicePayment()`

## 3. Advance Payments (Already Working!)

Advance payments are already integrated via the existing trigger system.

## 4. Final Bill Payments (Already Working!)

Final bill payments at discharge are already integrated.

## 5. Payment Modes

Supported payment modes:
- `CASH` - Appears in Cash Book immediately
- `CARD` - Credit/Debit card
- `UPI` - UPI payments
- `CHEQUE` - Cheque payments
- `DD` - Demand Draft
- `NEFT` - Bank transfer
- `RTGS` - Bank transfer
- `ONLINE` - Online payment
- `PAYTM` - Paytm
- `PHONEPE` - PhonePe

Only **CASH** payments appear in Cash Book. Other modes appear after bank reconciliation.

## 6. Viewing Payment History

```typescript
import {
  getVisitPaymentHistory,
  getPatientPaymentHistory,
  getTodayCashCollections,
  getPaymentSummaryBySource
} from '@/lib/payment-service';

// Get all payments for a visit
const visitPayments = await getVisitPaymentHistory(visitId);

// Get all payments for a patient
const patientPayments = await getPatientPaymentHistory(patientId);

// Get today's cash collections
const todayCash = await getTodayCashCollections();

// Get payment summary by source (OPD, Pharmacy, etc.)
const summary = await getPaymentSummaryBySource('2025-10-01', '2025-10-31');
```

## 7. Cash Book Display

After integration, the Cash Book will show:

| Date | Type | Particulars | Voucher Type | Voucher No. | Debit | Credit |
|------|------|-------------|--------------|-------------|-------|--------|
| 29/10/2025 | Advance | Patient Name - Advance Payment | Cash Receipt | REC-001 | Rs 5,000 | |
| 29/10/2025 | OPD | Patient Name - OPD Services | Cash Receipt | REC-002 | Rs 1,500 | |
| 29/10/2025 | Pharmacy | Patient Name - Pharmacy | Cash Receipt | REC-003 | Rs 2,300 | |
| 29/10/2025 | Final Bill | Patient Name - Final Bill | Cash Receipt | REC-004 | Rs 10,000 | |

## 8. Testing

To test the integration:

1. **Run migrations**:
   ```bash
   # Run the new migrations
   supabase db push
   ```

2. **Test Pharmacy** (should work automatically):
   - Create a pharmacy sale with payment_method = 'CASH'
   - Check Cash Book - transaction should appear

3. **Test OPD** (after integration):
   - Add services to a visit
   - Record payment using `recordOpdServicePayment()`
   - Check Cash Book - transaction should appear

4. **Check Cash Book**:
   - Navigate to Cash Book page
   - Select today's date
   - All cash transactions should be visible with "Type" badges

## 9. Troubleshooting

**Payment not appearing in Cash Book:**
- Check if payment_mode = 'CASH' (uppercase)
- Verify patient_id and visit_id are valid UUIDs
- Check browser console for errors
- Look for error messages in database logs

**Pharmacy payments not auto-recording:**
- Verify trigger is installed: Run migrations
- Check if `record_pharmacy_sale_payment()` function exists
- Ensure `payment_status` is not 'PENDING'

**OPD payments not working:**
- Verify function call is correct
- Check visit_id is valid UUID
- Ensure amount > 0
- Verify `record_opd_visit_payment()` function exists

## 10. Next Steps

1. Update OPD service billing forms to call `recordOpdServicePayment()`
2. Add payment modal/dialog for collecting payment details
3. Test all payment flows
4. Update user training materials

---

**Need Help?**
Contact the development team or refer to:
- `src/lib/payment-service.ts` - Frontend payment functions
- `supabase/migrations/20251029000000_create_patient_payment_transactions.sql` - Database schema
- `supabase/migrations/20251029000001_add_payment_triggers_for_pharmacy_opd.sql` - Triggers
