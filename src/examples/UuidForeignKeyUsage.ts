// Example usage of UUID foreign key approach in visits table
// This replaces JSONB operations with proper foreign key relationships

import { supabase } from '@/integrations/supabase/client';

interface VisitServiceData {
  visitId: string; // TEXT visit_id like "IH25I22001"
  clinicalServiceId?: string; // UUID - all rate details fetched from master table
  mandatoryServiceId?: string; // UUID - all rate details fetched from master table
}

/**
 * Add clinical service to visit using UUID foreign key
 * All rate details will be fetched from clinical_services master table
 */
export const addClinicalServiceToVisitForeignKey = async (data: VisitServiceData) => {
  try {
    const { error } = await supabase
      .from('visits')
      .update({
        clinical_service_id: data.clinicalServiceId
      })
      .eq('visit_id', data.visitId);

    if (error) {
      console.error('Error adding clinical service:', error);
      throw error;
    }

    console.log('✅ Clinical service added successfully using UUID foreign key');
    return true;
  } catch (error) {
    console.error('❌ Failed to add clinical service:', error);
    return false;
  }
};

/**
 * Add mandatory service to visit using UUID foreign key
 * All rate details will be fetched from mandatory_services master table
 */
export const addMandatoryServiceToVisitForeignKey = async (data: VisitServiceData) => {
  try {
    const { error } = await supabase
      .from('visits')
      .update({
        mandatory_service_id: data.mandatoryServiceId
      })
      .eq('visit_id', data.visitId);

    if (error) {
      console.error('Error adding mandatory service:', error);
      throw error;
    }

    console.log('✅ Mandatory service added successfully using UUID foreign key');
    return true;
  } catch (error) {
    console.error('❌ Failed to add mandatory service:', error);
    return false;
  }
};

/**
 * Get visit with services using proper joins
 */
export const getVisitWithServices = async (visitId: string) => {
  try {
    const { data, error } = await supabase
      .from('visits')
      .select(`
        *,
        clinical_service:clinical_services(
          id,
          service_name,
          tpa_rate,
          private_rate,
          nabh_rate,
          non_nabh_rate
        ),
        mandatory_service:mandatory_services(
          id,
          service_name,
          tpa_rate,
          private_rate,
          nabh_rate,
          non_nabh_rate
        )
      `)
      .eq('visit_id', visitId)
      .single();

    if (error) {
      console.error('Error fetching visit with services:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('❌ Failed to fetch visit with services:', error);
    return null;
  }
};

/**
 * Remove clinical service from visit
 */
export const removeClinicalServiceFromVisitForeignKey = async (visitId: string) => {
  try {
    const { error } = await supabase
      .from('visits')
      .update({
        clinical_service_id: null
      })
      .eq('visit_id', visitId);

    if (error) {
      console.error('Error removing clinical service:', error);
      throw error;
    }

    console.log('✅ Clinical service removed successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to remove clinical service:', error);
    return false;
  }
};

/**
 * Update clinical service in visit
 */
export const updateClinicalServiceInVisitForeignKey = async (
  visitId: string,
  clinicalServiceId: string
) => {
  try {
    const { error } = await supabase
      .from('visits')
      .update({
        clinical_service_id: clinicalServiceId
      })
      .eq('visit_id', visitId);

    if (error) {
      console.error('Error updating clinical service:', error);
      throw error;
    }

    console.log('✅ Clinical service updated successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to update clinical service:', error);
    return false;
  }
};

/**
 * Example usage in React component:
 */
/*
const handleAddClinicalService = async (serviceId: string) => {
  const success = await addClinicalServiceToVisitForeignKey({
    visitId: 'IH25I22001',
    clinicalServiceId: serviceId
  });

  if (success) {
    // Refresh the visit data - all rate details will be fetched via join
    const visitData = await getVisitWithServices('IH25I22001');
    console.log('Updated visit with service details:', visitData);

    // visitData.clinical_service will contain:
    // - service_name, tpa_rate, private_rate, nabh_rate, non_nabh_rate
    // - All from clinical_services master table
  }
};

// Usage:
await handleAddClinicalService('service-uuid-123');
*/

/**
 * Migration from JSONB to UUID Foreign Keys:
 */
/*
// OLD WAY (JSONB):
const oldWay = async () => {
  const { data } = await supabase
    .from('visits')
    .select('clinical_services')
    .eq('visit_id', visitId)
    .single();

  const services = JSON.parse(data.clinical_services || '[]');
  services.push(newService);

  await supabase
    .from('visits')
    .update({ clinical_services: JSON.stringify(services) })
    .eq('visit_id', visitId);
};

// NEW WAY (UUID Foreign Keys):
const newWay = async () => {
  await addClinicalServiceToVisitForeignKey({
    visitId: visitId,
    clinicalServiceId: serviceId,
    clinicalServiceRate: rate,
    clinicalServiceRateType: rateType,
    clinicalServiceQuantity: quantity
  });
};
*/