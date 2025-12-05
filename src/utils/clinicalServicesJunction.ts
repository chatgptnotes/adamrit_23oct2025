// Utility functions for working with visit_clinical_services junction table
// These functions provide easy-to-use interfaces for the database helper functions

import { supabase } from '@/integrations/supabase/client';

export interface ClinicalServiceDetail {
  junction_id: string;
  service_id: string;
  service_name: string;
  quantity: number;
  rate_used: number;
  rate_type: 'tpa' | 'private' | 'nabh' | 'non_nabh';
  amount: number;
  external_requisition?: string;
  selected_at: string;
  tpa_rate: number;
  private_rate: number;
  nabh_rate: number;
  non_nabh_rate: number;
}

export interface AddClinicalServiceParams {
  visitId: string; // TEXT visit_id like "IH25I22001"
  clinicalServiceId: string; // UUID
  rateUsed: number;
  rateType: 'tpa' | 'private' | 'nabh' | 'non_nabh';
  quantity?: number;
  externalRequisition?: string;
}

export interface UpdateClinicalServiceParams {
  visitId: string;
  clinicalServiceId: string;
  rateUsed?: number;
  rateType?: 'tpa' | 'private' | 'nabh' | 'non_nabh';
  quantity?: number;
  externalRequisition?: string;
}

/**
 * Add a clinical service to a visit using junction table
 */
export const addClinicalServiceToVisit = async (params: AddClinicalServiceParams): Promise<string | null> => {
  try {
    const { data, error } = await supabase.rpc('add_clinical_service_to_visit_by_text_id', {
      p_visit_id: params.visitId,
      p_clinical_service_id: params.clinicalServiceId,
      p_rate_used: params.rateUsed,
      p_rate_type: params.rateType,
      p_quantity: params.quantity || 1,
      p_external_requisition: params.externalRequisition || null
    });

    if (error) {
      console.error('Error adding clinical service to visit:', error);
      throw error;
    }

    return data; // Returns the junction record ID
  } catch (error) {
    console.error('Failed to add clinical service to visit:', error);
    return null;
  }
};

/**
 * Get all clinical services for a visit
 */
export const getClinicalServicesForVisit = async (visitId: string): Promise<ClinicalServiceDetail[]> => {
  try {
    const { data, error } = await supabase.rpc('get_clinical_services_for_visit', {
      p_visit_id: visitId
    });

    if (error) {
      console.error('Error fetching clinical services for visit:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch clinical services for visit:', error);
    return [];
  }
};

/**
 * Remove a clinical service from a visit
 */
export const removeClinicalServiceFromVisit = async (
  visitId: string,
  clinicalServiceId: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('remove_clinical_service_from_visit', {
      p_visit_id: visitId,
      p_clinical_service_id: clinicalServiceId
    });

    if (error) {
      console.error('Error removing clinical service from visit:', error);
      throw error;
    }

    return data || false;
  } catch (error) {
    console.error('Failed to remove clinical service from visit:', error);
    return false;
  }
};

/**
 * Update a clinical service in a visit
 */
export const updateClinicalServiceInVisit = async (params: UpdateClinicalServiceParams): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('update_clinical_service_in_visit', {
      p_visit_id: params.visitId,
      p_clinical_service_id: params.clinicalServiceId,
      p_rate_used: params.rateUsed || null,
      p_rate_type: params.rateType || null,
      p_quantity: params.quantity || null,
      p_external_requisition: params.externalRequisition || null
    });

    if (error) {
      console.error('Error updating clinical service in visit:', error);
      throw error;
    }

    return data || false;
  } catch (error) {
    console.error('Failed to update clinical service in visit:', error);
    return false;
  }
};

/**
 * Get total amount for all clinical services in a visit
 */
export const getVisitClinicalServicesTotal = async (visitId: string): Promise<number> => {
  try {
    const { data, error } = await supabase.rpc('get_visit_clinical_services_total', {
      p_visit_id: visitId
    });

    if (error) {
      console.error('Error calculating clinical services total:', error);
      throw error;
    }

    return data || 0;
  } catch (error) {
    console.error('Failed to calculate clinical services total:', error);
    return 0;
  }
};

/**
 * Get visit UUID from TEXT visit_id (helper function)
 */
export const getVisitUuidFromVisitId = async (visitId: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase.rpc('get_visit_uuid_from_visit_id', {
      p_visit_id: visitId
    });

    if (error) {
      console.error('Error getting visit UUID:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to get visit UUID:', error);
    return null;
  }
};

/**
 * Example usage in component:
 *
 * // Add clinical service
 * const result = await addClinicalServiceToVisit({
 *   visitId: 'IH25I22001',
 *   clinicalServiceId: 'service-uuid-here',
 *   rateUsed: 500.00,
 *   rateType: 'private',
 *   quantity: 1,
 *   externalRequisition: 'REQ-001'
 * });
 *
 * // Get all clinical services for visit
 * const services = await getClinicalServicesForVisit('IH25I22001');
 *
 * // Get total amount
 * const total = await getVisitClinicalServicesTotal('IH25I22001');
 *
 * // Remove service
 * const removed = await removeClinicalServiceFromVisit('IH25I22001', 'service-uuid');
 */