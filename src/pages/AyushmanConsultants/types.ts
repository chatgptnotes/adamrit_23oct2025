export interface AyushmanConsultant {
  id: string;
  name: string;
  specialty?: string;
  department?: string;
  contact_info?: string;
  tpa_rate?: number;
  non_nabh_rate?: number;
  nabh_rate?: number;
  private_rate?: number;
  created_at: string;
  updated_at: string;
}