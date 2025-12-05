# Pharmacy Billing Integration Guide

## Overview
This guide shows how to integrate pharmacy billing form with `pharmacy_sales` and `pharmacy_sale_items` tables in Supabase.

---

## 📋 Form Data Structure (from screenshot)

### Sale Information:
- **Sale Type**: Dropdown (Other, IPD, OPD, etc.)
- **Patient ID**: Text input
- **Visit ID**: Text input
- **Patient Name**: Text input

### Shopping Cart:
- Multiple medicine items with:
  - Medicine name
  - Generic name
  - Quantity
  - Unit price
  - Discount
  - Tax
  - Total price

### Order Summary:
- **Subtotal**: ₹0.00
- **Discount**: -₹0.00
- **Tax (GST)**: ₹0.00
- **Total**: ₹0.00

### Payment Method:
- CASH (selected)
- CARD
- UPI
- INSURANCE

---

## 🚀 Integration Steps

### Step 1: Import the Service

In your `PharmacyBilling.tsx`:

```typescript
import { savePharmacySale, SaleData, CartItem } from '@/lib/pharmacy-billing-service';
```

### Step 2: Update handleCompleteSale Function

Replace the existing save logic around line 400-495 with:

```typescript
const handleCompleteSale = async () => {
  // Validation
  if (cart.length === 0) {
    alert('Cart is empty. Please add medicines before completing the sale.');
    return;
  }

  setIsProcessingPayment(true);

  try {
    // Calculate totals
    const totals = calculateTotals();

    // Prepare sale data
    const saleData: SaleData = {
      // Sale Information
      sale_type: saleType, // from dropdown
      patient_id: patientInfo.id ? parseInt(patientInfo.id) : undefined,
      visit_id: visitId ? parseInt(visitId) : undefined,
      patient_name: patientInfo.name || undefined,
      prescription_number: prescriptionId || undefined,

      // Financial Details
      subtotal: totals.subtotal,
      discount: totals.totalDiscount,
      discount_percentage: discountPercentage,
      tax_gst: totals.totalTax,
      tax_percentage: 9, // Adjust as needed (e.g., 9% GST)
      total_amount: totals.totalAmount,

      // Payment Info
      payment_method: paymentMethod,
      payment_status: 'COMPLETED',

      // Optional fields
      doctor_name: undefined,
      ward_type: undefined,
      remarks: undefined,

      // Cart Items
      items: cart.map(item => ({
        medicine_id: item.medicine_id,
        medicine_name: item.medicine_name,
        generic_name: item.generic_name,
        item_code: item.item_code, // Add if available
        batch_number: item.batch_number,
        expiry_date: item.expiry_date,
        quantity: item.quantity,
        pack_size: 1, // Add if you track pack sizes
        loose_quantity: 0,
        unit_price: item.unit_price,
        mrp: item.unit_price,
        cost_price: undefined,
        discount_percentage: item.discount_percentage,
        discount_amount: item.discount_amount,
        ward_discount: 0,
        tax_percentage: item.tax_percentage,
        tax_amount: item.tax_amount,
        total_amount: item.total_amount,
        manufacturer: undefined, // Add if available from medication table
        dosage_form: item.dosage_form,
        strength: item.strength,
        is_implant: false
      }))
    };

    // Save to database
    const response = await savePharmacySale(saleData);

    if (response.success) {
      // Success!
      alert(`Sale completed successfully! Sale ID: ${response.sale_id}`);

      // Create completed sale object for display
      const completedSaleObj = {
        id: response.sale_id?.toString() || '',
        bill_number: `BILL-${Date.now()}`,
        patient_id: patientInfo.id,
        patient_name: patientInfo.name,
        prescription_id: prescriptionId,
        sale_date: new Date().toISOString(),
        sale_type: saleType,
        subtotal: totals.subtotal,
        discount_amount: totals.totalDiscount,
        tax_amount: totals.totalTax,
        total_amount: totals.totalAmount,
        paid_amount: totals.totalAmount,
        balance_amount: 0,
        payment_method: paymentMethod,
        payment_reference: paymentReference,
        status: 'COMPLETED' as const,
        cashier_name: 'Current User',
        items: [...cart]
      };

      setCompletedSale(completedSaleObj);

      // Clear cart and form
      clearCart();
      setPatientInfo({ id: '', name: '', phone: '' });
      setVisitId('');
      setPrescriptionId('');
      setDiscountPercentage(0);

    } else {
      // Error
      alert(`Error saving sale: ${response.error}`);
    }

  } catch (error: any) {
    console.error('Error completing sale:', error);
    alert(`Unexpected error: ${error.message}`);
  } finally {
    setIsProcessingPayment(false);
  }
};
```

### Step 3: Add Calculate Totals Function

Add this helper function if it doesn't exist:

```typescript
const calculateTotals = () => {
  const subtotal = cart.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const totalDiscount = cart.reduce((sum, item) => sum + item.discount_amount, 0);
  const totalTax = cart.reduce((sum, item) => sum + item.tax_amount, 0);
  const totalAmount = subtotal - totalDiscount + totalTax;

  return {
    subtotal,
    totalDiscount,
    totalTax,
    totalAmount
  };
};
```

---

## 📊 Database Structure

### Tables Created:
1. **pharmacy_sales** - Sale header information
2. **pharmacy_sale_items** - Individual line items (medicines)

### Relationship:
```
pharmacy_sales (1) ----< pharmacy_sale_items (many)
    sale_id  (PK)         sale_id (FK)
```

---

## 🧪 Testing

### Test 1: Simple Sale
```typescript
// Add one medicine to cart
// Fill patient info
// Click "Complete Sale"
// Check Supabase database:
SELECT * FROM pharmacy_sales ORDER BY created_at DESC LIMIT 1;
SELECT * FROM pharmacy_sale_items WHERE sale_id = <last_sale_id>;
```

### Test 2: Multiple Items
```typescript
// Add 3-4 medicines to cart
// Apply discount
// Complete sale
// Verify all items saved
```

### Test 3: View Sales History
```typescript
import { getPatientSalesHistory } from '@/lib/pharmacy-billing-service';

const history = await getPatientSalesHistory(123);
console.log('Patient sales:', history);
```

---

## 📝 Complete Example Code

```typescript
// PharmacyBilling.tsx - Complete handleCompleteSale
const handleCompleteSale = async () => {
  if (cart.length === 0) {
    alert('Please add medicines to cart');
    return;
  }

  if (!patientInfo.id && !patientInfo.name) {
    alert('Please enter patient information');
    return;
  }

  setIsProcessingPayment(true);

  try {
    const totals = calculateTotals();

    const saleData: SaleData = {
      sale_type: saleType,
      patient_id: patientInfo.id ? parseInt(patientInfo.id) : undefined,
      visit_id: visitId ? parseInt(visitId) : undefined,
      patient_name: patientInfo.name,
      prescription_number: prescriptionId,
      subtotal: totals.subtotal,
      discount: totals.totalDiscount,
      discount_percentage: discountPercentage,
      tax_gst: totals.totalTax,
      tax_percentage: 9,
      total_amount: totals.totalAmount,
      payment_method: paymentMethod,
      payment_status: 'COMPLETED',
      items: cart.map(item => ({
        medicine_id: item.medicine_id,
        medicine_name: item.medicine_name,
        generic_name: item.generic_name,
        batch_number: item.batch_number || 'N/A',
        expiry_date: item.expiry_date,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_percentage: item.discount_percentage,
        discount_amount: item.discount_amount,
        tax_percentage: item.tax_percentage,
        tax_amount: item.tax_amount,
        total_amount: item.total_amount,
        dosage_form: item.dosage_form,
        strength: item.strength,
        pack_size: 1,
        loose_quantity: 0,
        is_implant: false
      }))
    };

    const response = await savePharmacySale(saleData);

    if (response.success) {
      alert(`✅ Sale completed! Sale ID: ${response.sale_id}`);

      // Show receipt or print
      const completedSaleObj = {
        id: response.sale_id?.toString() || '',
        bill_number: `BILL-${response.sale_id}`,
        ...saleData,
        patient_id: patientInfo.id,
        prescription_id: prescriptionId,
        sale_date: new Date().toISOString(),
        paid_amount: totals.totalAmount,
        balance_amount: 0,
        payment_reference: paymentReference,
        status: 'COMPLETED' as const,
        cashier_name: 'Current User',
        items: cart
      };

      setCompletedSale(completedSaleObj);
      clearCart();
    } else {
      alert(`❌ Error: ${response.error}`);
    }

  } catch (error: any) {
    alert(`Error: ${error.message}`);
  } finally {
    setIsProcessingPayment(false);
  }
};
```

---

## 🔍 Query Examples

### Get Today's Sales
```typescript
import { getTodaySales } from '@/lib/pharmacy-billing-service';

const todaySales = await getTodaySales();
console.log('Today total sales:', todaySales.length);
console.log('Today revenue:', todaySales.reduce((sum, s) => sum + s.total_amount, 0));
```

### Get Patient History
```typescript
import { getPatientSalesHistory } from '@/lib/pharmacy-billing-service';

const history = await getPatientSalesHistory(123);
history.forEach(sale => {
  console.log(`Sale ${sale.sale_id}: ₹${sale.total_amount}`);
});
```

### Get Sale Details
```typescript
import { getSaleById } from '@/lib/pharmacy-billing-service';

const saleDetails = await getSaleById(45);
console.log('Sale:', saleDetails);
```

---

## ✅ Checklist

- [ ] Run `supabase_pharmacy_migration.sql` in Supabase SQL Editor
- [ ] Create `pharmacy-billing-service.ts` file
- [ ] Import service in `PharmacyBilling.tsx`
- [ ] Update `handleCompleteSale` function
- [ ] Test with sample sale
- [ ] Verify data in Supabase database
- [ ] Test multiple items
- [ ] Test discount and tax calculations
- [ ] Test different payment methods

---

## 🆘 Troubleshooting

### Error: "relation pharmacy_sales does not exist"
**Fix**: Run `supabase_pharmacy_migration.sql` first

### Error: "foreign key constraint fails"
**Fix**: Ensure medication_id exists in medication table

### Error: "insert or update on table violates check constraint"
**Fix**: Ensure payment_method is one of: CASH, CARD, UPI, INSURANCE

---

## 📞 Support Files

1. **supabase_pharmacy_migration.sql** - Database schema
2. **pharmacy-billing-service.ts** - Service functions
3. **PHARMACY_BILLING_INTEGRATION.md** - This guide

---

**Created**: 2025-10-07
**For**: Pharmacy Billing & Dispensing Page
**Database**: Supabase PostgreSQL
