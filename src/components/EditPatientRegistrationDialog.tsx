
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { PatientInfoSection } from './EditPatientRegistrationDialog/PatientInfoSection';
import { EmergencyContactSection } from './EditPatientRegistrationDialog/EmergencyContactSection';
import { AdditionalInfoSection } from './EditPatientRegistrationDialog/AdditionalInfoSection';


interface EditPatientRegistrationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  patient: any;
}

export const EditPatientRegistrationDialog: React.FC<EditPatientRegistrationDialogProps> = ({
  isOpen,
  onClose,
  patient
}) => {
  const [dateOfBirth, setDateOfBirth] = useState<Date>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    patientName: '',
    corporate: '',
    insurancePersonNo: '',
    age: '',
    gender: '',
    phone: '',
    address: '',
    emergencyContactName: '',
    emergencyContactMobile: '',
    secondEmergencyContactName: '',
    secondEmergencyContactMobile: '',
    aadharPassport: '',
    quarterPlotNo: '',
    ward: '',
    panchayat: '',
    relationshipManager: '',
    pinCode: '',
    state: '',
    cityTown: '',
    bloodGroup: '',
    spouseName: '',
    allergies: '',
    relativePhoneNo: '',
    instructions: '',
    identityType: '',
    email: '',
    privilegeCardNumber: '',
    billingLink: ''
  });

  useEffect(() => {
    if (patient && isOpen) {
      setFormData({
        patientName: patient.name || '',
        corporate: patient.corporate || 'private',
        insurancePersonNo: patient.insurance_person_no || '',
        age: patient.age?.toString() || '',
        gender: patient.gender || '',
        phone: patient.phone || '',
        address: patient.address || '',
        emergencyContactName: patient.emergency_contact_name || '',
        emergencyContactMobile: patient.emergency_contact_mobile || '',
        secondEmergencyContactName: patient.second_emergency_contact_name || '',
        secondEmergencyContactMobile: patient.second_emergency_contact_mobile || '',
        aadharPassport: patient.aadhar_passport || '',
        quarterPlotNo: patient.quarter_plot_no || '',
        ward: patient.ward || '',
        panchayat: patient.panchayat || '',
        relationshipManager: patient.relationship_manager || '',
        pinCode: patient.pin_code || '',
        state: patient.state || '',
        cityTown: patient.city_town || '',
        bloodGroup: patient.blood_group || '',
        spouseName: patient.spouse_name || '',
        allergies: patient.allergies || '',
        relativePhoneNo: patient.relative_phone_no || '',
        instructions: patient.instructions || '',
        identityType: patient.identity_type || '',
        email: patient.email || '',
        privilegeCardNumber: patient.privilege_card_number || '',
        billingLink: patient.billing_link || ''
      });
      
      // Set date of birth if available
      if (patient.date_of_birth) {
        try {
          setDateOfBirth(new Date(patient.date_of_birth));
        } catch (error) {
          console.error('Error parsing date of birth:', error);
          setDateOfBirth(undefined);
        }
      } else {
        setDateOfBirth(undefined);
      }
    }
  }, [patient, isOpen]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    console.log('Date of birth changed:', date);
    setDateOfBirth(date);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.patientName || !formData.corporate || !formData.age ||
        !formData.gender || !formData.phone || !formData.address) {
      toast({
        title: "Error",
        description: "Please fill in all required fields (Patient Name, Corporate, Age, Gender, Phone, Address)",
        variant: "destructive"
      });
      return;
    }

    // Check if ESIC is selected but Insurance Person No. is empty
    if (formData.corporate === 'esic' && !formData.insurancePersonNo) {
      toast({
        title: "Error",
        description: "Insurance Person No. is required for ESIC patients",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Form submission started with data:', formData);
      console.log('Date of birth:', dateOfBirth);
      console.log('Patient ID:', patient.id);

      // Only update basic fields that definitely exist
      const updateData = {
        name: formData.patientName,
        corporate: formData.corporate,
        insurance_person_no: formData.corporate === 'esic' ? formData.insurancePersonNo : null,
        age: formData.age ? parseInt(formData.age) : null,
        gender: formData.gender,
        phone: formData.phone,
        address: formData.address,
        date_of_birth: dateOfBirth ? format(dateOfBirth, 'yyyy-MM-dd') : null,
        email: formData.email || null,
        emergency_contact_name: formData.emergencyContactName || null,
        emergency_contact_mobile: formData.emergencyContactMobile || null,
        second_emergency_contact_name: formData.secondEmergencyContactName || null,
        second_emergency_contact_mobile: formData.secondEmergencyContactMobile || null,
        aadhar_passport: formData.aadharPassport || null,
        quarter_plot_no: formData.quarterPlotNo || null,
        relationship_manager: formData.relationshipManager || null,
        pin_code: formData.pinCode || null,
        state: formData.state || null,
        city_town: formData.cityTown || null,
        blood_group: formData.bloodGroup || null,
        spouse_name: formData.spouseName || null,
        allergies: formData.allergies || null,
        relative_phone_no: formData.relativePhoneNo || null,
        instructions: formData.instructions || null,
        identity_type: formData.identityType || null,
        privilege_card_number: formData.privilegeCardNumber || null,
        billing_link: formData.billingLink || null,
        updated_at: new Date().toISOString()
      };

      console.log('Update data being sent:', updateData);

      const { error } = await supabase
        .from('patients')
        .update(updateData)
        .eq('id', patient.id);

      if (error) {
        console.error('Supabase error updating patient:', error);
        throw error;
      }

      console.log('Patient updated successfully');

      toast({
        title: "Success",
        description: "Patient registration updated successfully!",
      });

      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['dashboard-patients'] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patient-data-edit', patient.id] });
      
      onClose();
    } catch (error: any) {
      console.error('Error updating patient:', error);

      let errorMessage = "Failed to update patient registration. Please try again.";

      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.details) {
        errorMessage = error.details;
      } else if (error?.hint) {
        errorMessage = error.hint;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-600">
            Edit Patient Registration - {patient?.patients_id}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <PatientInfoSection
            formData={formData}
            dateOfBirth={dateOfBirth}
            onInputChange={handleInputChange}
            onDateChange={handleDateChange}
          />

          <EmergencyContactSection 
            formData={formData}
            onInputChange={handleInputChange}
          />

          <AdditionalInfoSection 
            formData={formData}
            onInputChange={handleInputChange}
          />


          <div className="flex justify-end gap-4 pt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isSubmitting}>
              {isSubmitting ? 'Updating Patient...' : 'Update Patient'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
