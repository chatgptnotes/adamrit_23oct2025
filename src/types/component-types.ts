// Type definitions for components
export interface VisitWithSurgery {
  id: any;
  visit_surgeries?: Array<{
    cghs_surgery?: { name: string };
  }>;
}

export interface TableRow {
  [key: string]: unknown;
  id?: string | number;
  description?: string;
  category?: string;
  specialty?: string;
  department?: string;
}

// Mock data to avoid database relation errors
export const mockVisitData: VisitWithSurgery[] = [];
export const mockTableData: TableRow[] = [];