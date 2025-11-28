// Example integration code for FinalBill.tsx to use junction table
// This shows how to replace JSONB operations with proper junction table operations

import React, { useState, useEffect } from 'react';
import {
  addClinicalServiceToVisit,
  getClinicalServicesForVisit,
  removeClinicalServiceFromVisit,
  updateClinicalServiceInVisit,
  getVisitClinicalServicesTotal,
  ClinicalServiceDetail
} from '@/utils/clinicalServicesJunction';

interface ClinicalServiceSelection {
  serviceId: string;
  serviceName: string;
  selectedRate: number;
  rateType: 'tpa' | 'private' | 'nabh' | 'non_nabh';
  quantity: number;
  externalRequisition?: string;
}

const FinalBillJunctionExample = ({ visitId }: { visitId: string }) => {
  const [clinicalServices, setClinicalServices] = useState<ClinicalServiceDetail[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  // Load clinical services for the visit
  const loadClinicalServices = async () => {
    setLoading(true);
    try {
      const services = await getClinicalServicesForVisit(visitId);
      setClinicalServices(services);

      const total = await getVisitClinicalServicesTotal(visitId);
      setTotalAmount(total);
    } catch (error) {
      console.error('Error loading clinical services:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add clinical service to visit
  const handleAddClinicalService = async (selection: ClinicalServiceSelection) => {
    try {
      const result = await addClinicalServiceToVisit({
        visitId,
        clinicalServiceId: selection.serviceId,
        rateUsed: selection.selectedRate,
        rateType: selection.rateType,
        quantity: selection.quantity,
        externalRequisition: selection.externalRequisition
      });

      if (result) {
        console.log('✅ Clinical service added successfully:', result);
        // Reload the services list
        await loadClinicalServices();
      }
    } catch (error) {
      console.error('❌ Failed to add clinical service:', error);
    }
  };

  // Remove clinical service from visit
  const handleRemoveClinicalService = async (serviceId: string) => {
    try {
      const removed = await removeClinicalServiceFromVisit(visitId, serviceId);

      if (removed) {
        console.log('✅ Clinical service removed successfully');
        // Reload the services list
        await loadClinicalServices();
      }
    } catch (error) {
      console.error('❌ Failed to remove clinical service:', error);
    }
  };

  // Update clinical service in visit
  const handleUpdateClinicalService = async (
    serviceId: string,
    updates: Partial<ClinicalServiceSelection>
  ) => {
    try {
      const updated = await updateClinicalServiceInVisit({
        visitId,
        clinicalServiceId: serviceId,
        rateUsed: updates.selectedRate,
        rateType: updates.rateType,
        quantity: updates.quantity,
        externalRequisition: updates.externalRequisition
      });

      if (updated) {
        console.log('✅ Clinical service updated successfully');
        // Reload the services list
        await loadClinicalServices();
      }
    } catch (error) {
      console.error('❌ Failed to update clinical service:', error);
    }
  };

  useEffect(() => {
    if (visitId) {
      loadClinicalServices();
    }
  }, [visitId]);

  return (
    <div className="clinical-services-junction-example">
      <h3>Clinical Services (Junction Table)</h3>

      {loading ? (
        <div>Loading clinical services...</div>
      ) : (
        <>
          <div className="services-list">
            {clinicalServices.map((service) => (
              <div key={service.junction_id} className="service-item">
                <h4>{service.service_name}</h4>
                <p>Rate: ₹{service.rate_used} ({service.rate_type})</p>
                <p>Quantity: {service.quantity}</p>
                <p>Amount: ₹{service.amount}</p>
                {service.external_requisition && (
                  <p>External Req: {service.external_requisition}</p>
                )}

                <button
                  onClick={() => handleRemoveClinicalService(service.service_id)}
                  className="remove-btn"
                >
                  Remove
                </button>

                <button
                  onClick={() => handleUpdateClinicalService(service.service_id, {
                    quantity: service.quantity + 1
                  })}
                  className="update-btn"
                >
                  +1 Quantity
                </button>
              </div>
            ))}
          </div>

          <div className="total-amount">
            <strong>Total Amount: ₹{totalAmount}</strong>
          </div>
        </>
      )}
    </div>
  );
};

// Example of how to integrate in your existing FinalBill.tsx component:

/*
// Replace old JSONB operations:

// OLD WAY (JSONB):
const handleServiceSelection = async (service: any) => {
  const existingServices = visitData.clinical_services || [];
  const updatedServices = [...existingServices, serviceData];

  await supabase
    .from('visits')
    .update({ clinical_services: updatedServices })
    .eq('visit_id', visitId);
};

// NEW WAY (Junction Table):
const handleServiceSelection = async (service: any) => {
  await addClinicalServiceToVisit({
    visitId: visitId, // TEXT like "IH25I22001"
    clinicalServiceId: service.id,
    rateUsed: service.selectedRate,
    rateType: service.rateType,
    quantity: 1,
    externalRequisition: service.external_requisition
  });
};

// Replace data fetching:

// OLD WAY:
const fetchClinicalServices = async () => {
  const { data } = await supabase
    .from('visits')
    .select('clinical_services')
    .eq('visit_id', visitId)
    .single();

  const services = JSON.parse(data.clinical_services || '[]');
  return services;
};

// NEW WAY:
const fetchClinicalServices = async () => {
  const services = await getClinicalServicesForVisit(visitId);
  return services;
};
*/

export default FinalBillJunctionExample;