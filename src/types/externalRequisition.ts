export interface ExternalRequisition {
  id: string;
  service_name: string;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
}

export interface CreateExternalRequisitionData {
  service_name: string;
}