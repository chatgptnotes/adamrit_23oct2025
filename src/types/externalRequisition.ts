export const SCAN_CENTERS = [
  'Biviji Scan',
  'Helix Scan',
  'Nobel Scan',
  'Orange Scan',
  'Insight Scan',
  'Galaxy Scan',
] as const;

export type ScanCenter = typeof SCAN_CENTERS[number];

export interface ExternalRequisition {
  id: string;
  service_name: string;
  scan_center?: ScanCenter | string | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
}

export interface CreateExternalRequisitionData {
  service_name: string;
  scan_center?: ScanCenter | string | null;
}
