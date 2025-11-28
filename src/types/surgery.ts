// Surgery status types and validation schemas
export const SURGERY_STATUSES = ['planned', 'in_progress', 'completed', 'cancelled'] as const;
export const SANCTION_STATUSES = ['Sanctioned', 'Not Sanctioned'] as const;

export type SurgeryStatus = typeof SURGERY_STATUSES[number];
export type SanctionStatus = typeof SANCTION_STATUSES[number];

export interface VisitSurgery {
  id: string;
  visit_id: string;
  surgery_id: string;
  surgery_name: string;
  status: SurgeryStatus;
  sanction_status: SanctionStatus;
  notes?: string;
  scheduled_date?: string;
  performed_date?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateVisitSurgeryInput {
  visit_id: string;
  surgery_id: string;
  status?: SurgeryStatus;
  sanction_status?: SanctionStatus;
  notes?: string;
  scheduled_date?: string;
}

export interface UpdateVisitSurgeryInput {
  status?: SurgeryStatus;
  sanction_status?: SanctionStatus;
  notes?: string;
  scheduled_date?: string;
  performed_date?: string;
}

// Validation functions
export const isValidSurgeryStatus = (status: string): status is SurgeryStatus => {
  return SURGERY_STATUSES.includes(status as SurgeryStatus);
};

export const isValidSanctionStatus = (status: string): status is SanctionStatus => {
  return SANCTION_STATUSES.includes(status as SanctionStatus);
};

// Status display helpers
export const getSurgeryStatusColor = (status: SurgeryStatus): string => {
  switch (status) {
    case 'planned':
      return 'bg-blue-100 text-blue-800';
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getSanctionStatusColor = (status: SanctionStatus): string => {
  switch (status) {
    case 'Sanctioned':
      return 'bg-green-100 text-green-800';
    case 'Not Sanctioned':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Surgery workflow helpers
export const getNextSurgeryStatus = (currentStatus: SurgeryStatus): SurgeryStatus | null => {
  switch (currentStatus) {
    case 'planned':
      return 'in_progress';
    case 'in_progress':
      return 'completed';
    case 'completed':
    case 'cancelled':
      return null;
    default:
      return null;
  }
};

export const canTransitionToStatus = (from: SurgeryStatus, to: SurgeryStatus): boolean => {
  const allowedTransitions: Record<SurgeryStatus, SurgeryStatus[]> = {
    planned: ['in_progress', 'cancelled'],
    in_progress: ['completed', 'cancelled'],
    completed: [], // No transitions allowed from completed
    cancelled: ['planned'] // Can reschedule cancelled surgeries
  };

  return allowedTransitions[from].includes(to);
};