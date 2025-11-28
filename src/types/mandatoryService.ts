export interface MandatoryService {
  id: string;
  service_name: string;
  tpa_rate?: number | null;
  private_rate?: number | null;
  nabh_rate?: number | null;
  nabh_bhopal?: number | null;
  non_nabh_rate?: number | null;
  non_nabh_bhopal?: number | null;
  status: string;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
}

export interface CreateMandatoryServiceData {
  service_name: string;
  tpa_rate?: number;
  private_rate?: number;
  nabh_rate?: number;
  nabh_bhopal?: number;
  non_nabh_rate?: number;
  non_nabh_bhopal?: number;
}