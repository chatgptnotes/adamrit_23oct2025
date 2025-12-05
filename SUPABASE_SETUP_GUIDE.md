# Supabase Pharmacy Setup Guide

## 🚀 Quick Setup

### Step 1: Run Migration in Supabase SQL Editor

1. Go to your Supabase project
2. Click on **SQL Editor** (left sidebar)
3. Create a **New Query**
4. Copy-paste the entire content of `supabase_pharmacy_migration.sql`
5. Click **RUN** or press `Ctrl+Enter`

---

## 📋 What This Migration Does

### ✅ Enhances `medication` table with:
- **Stock management**: loose_stock_quantity, minimum_stock, maximum_stock, reorder_level, pack_size
- **Product IDs**: drug_id_external, product_code
- **Medicine details**: dosage_form, route, therapeutic_category, med_strength_uom
- **Business fields**: profit_percentage, expensive_product
- **Ward discounts**: gen_ward_discount, spcl_ward_discount, dlx_ward_discount, etc.
- **Flags**: is_common, is_favourite
- **Indexes** for performance

### ✅ Creates new tables:
1. **pharmacy_sales** - Main sale/bill information
2. **pharmacy_sale_items** - Individual medicines in each sale

### ✅ Security (RLS):
- Row Level Security enabled
- Policies for authenticated users
- Created_by tracks user via `auth.uid()`

### ✅ Useful views:
1. **v_pharmacy_sales_complete** - Complete sales with medication details
2. **v_pharmacy_today_sales** - Today's sales summary
3. **v_pharmacy_low_stock_alert** - Low stock medications

### ✅ RPC Function:
- **create_pharmacy_sale()** - Create complete sale with items in one call

---

## 📝 Usage Examples (Supabase Client)

### 1. Fetch Medications
```typescript
// Get all active medications
const { data, error } = await supabase
  .from('medication')
  .select('*')
  .eq('is_deleted', false)
  .order('name');

// Get low stock medications
const { data: lowStock } = await supabase
  .from('v_pharmacy_low_stock_alert')
  .select('*');
```

### 2. Create a Sale (Using RPC)
```typescript
const { data: saleId, error } = await supabase.rpc('create_pharmacy_sale', {
  p_sale_type: 'OPD',
  p_patient_id: 123,
  p_patient_name: 'Ram Kumar',
  p_visit_id: 456,
  p_payment_method: 'CASH',
  p_items: [
    {
      medication_id: 'uuid-here',
      medication_name: 'Paracetamol 500mg',
      generic_name: 'PARACETAMOL',
      quantity: 2,
      unit_price: 50.00,
      discount: 5.00,
      item_code: 'T1AL001',
      batch_number: 'BATCH123'
    },
    {
      medication_id: 'uuid-here-2',
      medication_name: 'Crocin',
      generic_name: 'PARACETAMOL',
      quantity: 1,
      unit_price: 150.00,
      discount: 0,
      item_code: 'T2CR001',
      batch_number: 'BATCH456'
    }
  ]
});

console.log('Sale created with ID:', saleId);
```

### 3. Get Patient Sale History
```typescript
const { data: sales } = await supabase
  .from('v_pharmacy_sales_complete')
  .select('*')
  .eq('patient_id', 123)
  .order('sale_date', { ascending: false });
```

### 4. Get Today's Sales Summary
```typescript
const { data: todaySales } = await supabase
  .from('v_pharmacy_today_sales')
  .select('*');
```

### 5. Insert Sale (Manual way)
```typescript
// Step 1: Insert sale header
const { data: sale, error: saleError } = await supabase
  .from('pharmacy_sales')
  .insert({
    sale_type: 'OPD',
    patient_id: 123,
    patient_name: 'Ram Kumar',
    visit_id: 456,
    subtotal: 200.00,
    discount: 5.00,
    tax_gst: 18.00,
    total_amount: 213.00,
    payment_method: 'CASH',
    payment_status: 'COMPLETED'
  })
  .select()
  .single();

// Step 2: Insert sale items
const { error: itemsError } = await supabase
  .from('pharmacy_sale_items')
  .insert([
    {
      sale_id: sale.sale_id,
      medication_id: 'uuid-here',
      medication_name: 'Paracetamol 500mg',
      quantity: 2,
      unit_price: 50.00,
      total_price: 100.00
    },
    {
      sale_id: sale.sale_id,
      medication_id: 'uuid-here-2',
      medication_name: 'Crocin',
      quantity: 1,
      unit_price: 100.00,
      total_price: 100.00
    }
  ]);
```

### 6. Update Medication Stock
```typescript
const { error } = await supabase
  .from('medication')
  .update({
    stock: '50',
    loose_stock_quantity: 5,
    updated_at: new Date().toISOString()
  })
  .eq('id', 'medication-uuid');
```

### 7. Search Medications
```typescript
const { data: medicines } = await supabase
  .from('medication')
  .select('id, name, generic_name, item_code, stock, price_per_strip')
  .eq('is_deleted', false)
  .ilike('name', `%${searchTerm}%`)
  .limit(10);
```

---

## 🔐 Security Notes

### Row Level Security (RLS) is enabled:
- Only authenticated users can read/write
- `created_by` automatically populated with `auth.uid()`
- Policies can be customized based on your requirements

### To customize RLS policies:
```sql
-- Example: Only allow users to see their own sales
CREATE POLICY "Users can view own sales" ON public.pharmacy_sales
    FOR SELECT USING (created_by = auth.uid());

-- Example: Only admins can delete
CREATE POLICY "Only admins can delete" ON public.pharmacy_sales
    FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');
```

---

## 📊 Database Relationships

```
medication (UUID primary key)
    ↑
    | (One-to-Many)
    |
pharmacy_sale_items (sale items)
    ↑
    | (Many-to-One)
    |
pharmacy_sales (sale header)
```

---

## 🧪 Testing Queries

Run these in Supabase SQL Editor to verify:

```sql
-- 1. Check medication table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'medication'
ORDER BY ordinal_position;

-- 2. Count medications
SELECT COUNT(*) FROM medication WHERE is_deleted = FALSE;

-- 3. Check sales tables
SELECT COUNT(*) FROM pharmacy_sales;
SELECT COUNT(*) FROM pharmacy_sale_items;

-- 4. Test views
SELECT * FROM v_pharmacy_low_stock_alert LIMIT 5;
SELECT * FROM v_pharmacy_today_sales;

-- 5. Sample data
SELECT id, name, generic_name, stock, item_code
FROM medication
WHERE is_deleted = FALSE
LIMIT 10;
```

---

## ⚙️ TypeScript Types (for your app)

```typescript
// medication.types.ts
export interface Medication {
  id: string;
  name: string;
  generic_name?: string;
  category?: string;
  dosage?: string;
  description?: string;
  strength?: string;
  manufacturer?: string;
  manufacturer_id?: string;
  supplier_name?: string;
  supplier_id?: string;
  stock?: string;
  loose_stock?: number;
  pack?: string;
  item_code?: string;
  barcode?: string;
  shelf?: string;
  exp_date?: string;
  price_per_strip?: string;
  cost?: number;

  // New fields
  loose_stock_quantity?: number;
  minimum_stock?: number;
  maximum_stock?: number;
  reorder_level?: number;
  pack_size?: number;
  drug_id_external?: string;
  product_code?: string;
  dosage_form?: string;
  route?: string;
  therapeutic_category?: string;
  med_strength_uom?: string;
  profit_percentage?: number;
  expensive_product?: boolean;
  gen_ward_discount?: number;
  spcl_ward_discount?: number;
  dlx_ward_discount?: number;
  is_common?: boolean;
  is_favourite?: boolean;
  is_deleted?: boolean;
  is_implant?: boolean;
  item_type?: number;

  created_at?: string;
  updated_at?: string;
}

export interface PharmacySale {
  sale_id: number;
  sale_type?: string;
  patient_id?: number;
  visit_id?: number;
  patient_name?: string;
  sale_date?: string;
  subtotal?: number;
  discount?: number;
  discount_percentage?: number;
  tax_gst?: number;
  tax_percentage?: number;
  total_amount?: number;
  payment_method?: 'CASH' | 'CARD' | 'UPI' | 'INSURANCE';
  payment_status?: 'PENDING' | 'COMPLETED' | 'REFUNDED' | 'CANCELLED';
  prescription_number?: string;
  doctor_id?: number;
  doctor_name?: string;
  ward_type?: string;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PharmacySaleItem {
  sale_item_id: number;
  sale_id: number;
  medication_id: string;
  medication_name?: string;
  generic_name?: string;
  item_code?: string;
  batch_number?: string;
  expiry_date?: string;
  quantity: number;
  pack_size?: number;
  loose_quantity?: number;
  unit_price?: number;
  mrp?: number;
  cost_price?: number;
  discount?: number;
  discount_percentage?: number;
  ward_discount?: number;
  tax_amount?: number;
  tax_percentage?: number;
  total_price?: number;
  manufacturer?: string;
  dosage_form?: string;
  strength?: string;
  is_implant?: boolean;
  created_at?: string;
}
```

---

## 🎯 Next Steps

1. ✅ Run `supabase_pharmacy_migration.sql` in Supabase SQL Editor
2. ✅ Verify tables created successfully
3. ✅ Test with sample data
4. ✅ Update your frontend TypeScript types
5. ✅ Integrate with your React components

---

## 📞 Support

For Supabase-specific questions:
- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com

---

**Created**: 2025-10-07
**Database**: Supabase (PostgreSQL 15+)
**Compatible**: Supabase Edge Functions, PostgREST API
