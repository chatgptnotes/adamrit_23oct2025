// TypeScript interfaces for Medicine Master and related entities

export interface MedicineMaster {
  id: string;
  medicine_name: string;
  generic_name?: string | null;
  manufacturer_id?: number | null;
  supplier_id?: number | null;
  type?: string | null;
  hospital_name?: string | null;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;

  // Relations (populated when joined)
  manufacturer?: ManufacturerCompany;
  supplier?: Supplier;

  // Deprecated fields - kept for backward compatibility during migration
  // These will be removed after database migration
  tablets_pieces?: number;
  quantity?: number;
  batch_number?: string | null;
  purchase_price?: number;
  selling_price?: number;
  mrp_price?: number;
  expiry_date?: string | null;
}

export interface ManufacturerCompany {
  id: number;
  name: string;
  created_at?: string;
}

export interface Supplier {
  id: number;
  supplier_name: string;
  supplier_code: string;
  supplier_type?: string | null;
  phone?: string | null;
  credit_limit?: number | null;
  email?: string | null;
  pin?: string | null;
  dl_no?: string | null;
  account_group?: string | null;
  cst?: string | null;
  s_tax_no?: string | null;
  address?: string | null;
  credit_day?: number | null;
  bank_or_branch?: string | null;
  mobile?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface MedicineMasterFormData {
  medicine_name: string;
  generic_name: string;
  manufacturer_id: number | null;
  supplier_id: number | null;
  type: string;
}
