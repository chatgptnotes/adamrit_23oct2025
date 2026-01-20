import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { VisitDetailsSection } from '@/components/visit/VisitDetailsSection';
import { VisitFormActions } from '@/components/visit/VisitFormActions';

interface VisitRegistrationFormProps {
  isOpen: boolean;
  onClose: () => void;
  patient: {
    id: string;
    name: string;
    patients_id?: string;
  };
  existingVisit?: any;  // Optional existing visit data for editing
  editMode?: boolean;   // Flag to indicate edit mode
}

export const VisitRegistrationForm: React.FC<VisitRegistrationFormProps> = ({
  isOpen,
  onClose,
  patient,
  existingVisit,
  editMode = false
}) => {
  const [visitDate, setVisitDate] = useState<Date>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    visitType: '',
    appointmentWith: '',
    reasonForVisit: '',
    relationWithEmployee: '',
    status: '',
    referringDoctor: '',
    relationshipManager: '',
    claimId: '',
    patientType: '',
    wardAllotted: '',
    roomAllotted: '',
  });

  // Keep track of selected IDs for foreign keys
  const [selectedIds, setSelectedIds] = useState({
    referringDoctorId: '' as string,
    relationshipManagerId: '' as string
  });

  // Populate form with existing data when in edit mode
  React.useEffect(() => {
    if (editMode && existingVisit) {
      console.log('=== POPULATING FORM FOR EDIT MODE ===');
      console.log('Existing Visit Data:', existingVisit);
      console.log('Appointment With value from DB:', existingVisit.appointment_with);

      const populatedData = {
        visitType: existingVisit.visit_type || 'Follow-up',
        appointmentWith: existingVisit.appointment_with || 'Dr. Unknown',
        reasonForVisit: existingVisit.reason_for_visit || '',
        relationWithEmployee: existingVisit.relation_with_employee || 'Self',
        status: existingVisit.status || 'scheduled',
        referringDoctor: existingVisit.referring_doctor || '',
        relationshipManager: existingVisit.relationship_manager || '',
        claimId: existingVisit.claim_id || '',
        patientType: existingVisit.patient_type || 'OPD',
        wardAllotted: existingVisit.ward_allotted || '',
        roomAllotted: existingVisit.room_allotted || '',
      };

      console.log('Populated Form Data:', populatedData);
      setFormData(populatedData);

      // Set visit date if available
      if (existingVisit.visit_date) {
        setVisitDate(new Date(existingVisit.visit_date));
      }
    }
  }, [editMode, existingVisit]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Handle referring doctor ID mapping
    if (field === 'referringDoctor') {
      // Find the referee by name to get the ID
      const findRefereeId = async () => {
        if (value && value !== 'none') {
          const { data: referees } = await supabase
            .from('referees')
            .select('id, name')
            .eq('name', value)
            .single();

          if (referees) {
            setSelectedIds(prev => ({ ...prev, referringDoctorId: referees.id }));
          }
        } else {
          setSelectedIds(prev => ({ ...prev, referringDoctorId: '' }));
        }
      };
      findRefereeId();
    }

    // Handle relationship manager ID mapping
    if (field === 'relationshipManager') {
      const findRelationshipManagerId = async () => {
        if (value && value !== 'none') {
          const { data: manager } = await supabase
            .from('relationship_managers')
            .select('id, name')
            .eq('name', value)
            .single();

          if (manager) {
            setSelectedIds(prev => ({ ...prev, relationshipManagerId: manager.id }));
          }
        } else {
          setSelectedIds(prev => ({ ...prev, relationshipManagerId: '' }));
        }
      };
      findRelationshipManagerId();
    }
  };



  const generateVisitId = async (visitDate: Date) => {
    const year = visitDate.getFullYear().toString().slice(-2);
    const monthLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    const monthLetter = monthLetters[visitDate.getMonth()];
    const day = visitDate.getDate().toString().padStart(2, '0');
    const dateString = format(visitDate, 'yyyy-MM-dd');
    
    // Fetch all existing visit_ids for today
    const { data: existingVisits, error } = await supabase
      .from('visits')
      .select('visit_id')
      .eq('visit_date', dateString)
      .like('visit_id', 'IH%');
    
    if (error) {
      console.error('Error fetching existing visits:', error);
      throw error;
    }
    
    // Collect all existing visit_ids for today
    const existingIds = new Set((existingVisits || []).map(v => v.visit_id));
    let sequenceNumber = (existingVisits?.length || 0) + 1;
    let visitId;
    let sequenceStr;
    // Keep incrementing until a unique visit_id is found
    do {
      sequenceStr = sequenceNumber.toString().padStart(3, '0');
      visitId = `IH${year}${monthLetter}${day}${sequenceStr}`;
      sequenceNumber++;
    } while (existingIds.has(visitId));

    return visitId;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('=== FORM SUBMISSION DEBUG ===');
    console.log('Form Data:', formData);
    console.log('Individual Fields:');
    console.log('  - visitType:', formData.visitType, 'Length:', formData.visitType?.length);
    console.log('  - appointmentWith:', formData.appointmentWith, 'Length:', formData.appointmentWith?.length);
    console.log('  - reasonForVisit:', formData.reasonForVisit, 'Length:', formData.reasonForVisit?.length);
    console.log('  - patientType:', formData.patientType, 'Length:', formData.patientType?.length);
    console.log('Selected IDs:', selectedIds);
    console.log('Patient data:', patient);
    console.log('Edit Mode:', editMode);
    console.log('Existing Visit:', existingVisit);

    // Validate required fields with more detailed error messaging
    const missingFields = [];
    if (!formData.visitType || formData.visitType.trim() === '') missingFields.push('Visit Type');

    // For edit mode, be more lenient with appointment_with validation
    if (!editMode && (!formData.appointmentWith || formData.appointmentWith.trim() === '')) {
      missingFields.push('Appointment With');
    } else if (editMode && (!formData.appointmentWith || formData.appointmentWith.trim() === '' || formData.appointmentWith === 'Select Doctor')) {
      // In edit mode, set a default value if appointment_with is missing
      formData.appointmentWith = 'Dr. Unknown';
      console.log('Setting default appointment_with for edit mode:', formData.appointmentWith);
    }

    if (!formData.reasonForVisit || formData.reasonForVisit.trim() === '') missingFields.push('Reason for Visit');
    if (!formData.patientType || formData.patientType.trim() === '') missingFields.push('Patient Type');
    if (!formData.claimId || formData.claimId.trim() === '') missingFields.push('Claim Id');

    // Validate ward and room only for IPD/Emergency patients
    const requiresWardRoom = formData.patientType === 'IPD' ||
                             formData.patientType === 'IPD (Inpatient)' ||
                             formData.patientType === 'Emergency';

    if (requiresWardRoom) {
      if (!formData.wardAllotted || formData.wardAllotted.trim() === '') missingFields.push('Ward Allotted');
      if (!formData.roomAllotted || formData.roomAllotted.trim() === '') missingFields.push('Room Allotted');
    }

    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      toast({
        title: "Error",
        description: `Please fill in the following required fields: ${missingFields.join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (editMode && existingVisit?.visit_id) {
        // Update existing visit
        // For IPD/Emergency patients, set admission_date if not already set
        const isIPDOrEmergency = formData.patientType === 'IPD' ||
                                  formData.patientType === 'IPD (Inpatient)' ||
                                  formData.patientType === 'Emergency';

        // Only set admission_date if it's IPD/Emergency and not already set
        const admissionDate = isIPDOrEmergency && !existingVisit.admission_date
          ? format(visitDate, 'yyyy-MM-dd')
          : existingVisit.admission_date;

        console.log('Updating visit with ID:', existingVisit.visit_id);
        console.log('Update data:', {
          visit_date: format(visitDate, 'yyyy-MM-dd'),
          visit_type: formData.visitType,
          appointment_with: formData.appointmentWith,
          reason_for_visit: formData.reasonForVisit,
          relation_with_employee: formData.relationWithEmployee || null,
          status: formData.status || 'scheduled',
          patient_type: formData.patientType,
          referring_doctor_id: selectedIds.referringDoctorId || null,
          relationship_manager_id: selectedIds.relationshipManagerId || null,
          claim_id: formData.claimId,
          admission_date: admissionDate
        });

        const { data: updateData, error: updateError } = await supabase
          .from('visits')
          .update({
            visit_date: format(visitDate, 'yyyy-MM-dd'),
            visit_type: formData.visitType,
            appointment_with: formData.appointmentWith,
            reason_for_visit: formData.reasonForVisit,
            relation_with_employee: formData.relationWithEmployee || null,
            status: formData.status || 'scheduled',
            patient_type: formData.patientType,
            referring_doctor_id: selectedIds.referringDoctorId || null,
            relationship_manager_id: selectedIds.relationshipManagerId || null,
            claim_id: formData.claimId || null,
            ward_allotted: formData.wardAllotted || null,
            room_allotted: formData.roomAllotted || null,
            admission_date: admissionDate
          })
          .eq('visit_id', existingVisit.visit_id)
          .select();

        if (updateError) {
          console.error('Error updating visit:', updateError);
          toast({
            title: "Error",
            description: `Failed to update visit: ${updateError.message}`,
            variant: "destructive"
          });
          return;
        }

        console.log('Visit updated successfully:', updateData);

        toast({
          title: "Success",
          description: "Visit updated successfully",
        });

        // Invalidate queries to refresh data
        await queryClient.invalidateQueries({ queryKey: ['opd-patients'] });
        await queryClient.invalidateQueries({ queryKey: ['todays-visits'] });
        await queryClient.invalidateQueries({ queryKey: ['currently-admitted-visits'] });
        await queryClient.invalidateQueries({ queryKey: ['visits'] });
        await queryClient.invalidateQueries({ queryKey: ['patients'] });

        // Close the form
        onClose();

        // Redirect to appropriate dashboard based on patient type
        setTimeout(() => {
          if (formData.patientType === 'OPD' || formData.patientType === 'OPD (Outpatient)') {
            navigate('/todays-opd');
          } else if (formData.patientType === 'IPD' || formData.patientType === 'IPD (Inpatient)') {
            navigate('/todays-ipd');
          } else if (formData.patientType === 'Emergency') {
            // For emergency, redirect to IPD dashboard as well
            navigate('/todays-ipd');
          }
        }, 1500); // Wait 1.5 seconds to let user see the success message

      } else {
        // Create new visit (existing code)
        const visitId = await generateVisitId(visitDate);
        console.log('Generated visit ID (TEXT):', visitId);

        // For IPD/Emergency patients, set admission_date to visit_date
        const isIPDOrEmergency = formData.patientType === 'IPD' ||
                                  formData.patientType === 'IPD (Inpatient)' ||
                                  formData.patientType === 'Emergency';

        // Insert the visit record
        const { data: visitData, error: visitError } = await supabase
          .from('visits')
          .insert({
            visit_id: visitId, // TEXT field for custom ID
            patient_id: patient.id,
            visit_date: format(visitDate, 'yyyy-MM-dd'),
            visit_type: formData.visitType,
            appointment_with: formData.appointmentWith,
            reason_for_visit: formData.reasonForVisit,
            relation_with_employee: formData.relationWithEmployee || null,
            status: formData.status || 'scheduled',
            patient_type: formData.patientType,
            referring_doctor_id: selectedIds.referringDoctorId || null,
            relationship_manager_id: selectedIds.relationshipManagerId || null,
            claim_id: formData.claimId,
            ward_allotted: formData.wardAllotted || null,
            room_allotted: formData.roomAllotted || null,
            admission_date: isIPDOrEmergency ? format(visitDate, 'yyyy-MM-dd') : null
          })
          .select('id, visit_id')
          .single();

      if (visitError) {
        console.error('Error registering visit:', visitError);
        toast({
          title: "Error",
          description: `Failed to register visit: ${visitError.message}`,
          variant: "destructive"
        });
        return;
      }

      // Get the database-generated UUID for junction table references
      const dbVisitUUID = visitData.id; // This is the UUID primary key
      console.log('Visit created successfully!');
      console.log('Visit TEXT ID:', visitData.visit_id);
      console.log('Visit UUID:', dbVisitUUID);

      // Now fetch patient data from patients table using patient_id reference
      const { data: patientData, error: patientFetchError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patient.id)
        .single();

      if (patientFetchError) {
        console.error('Error fetching patient data:', patientFetchError);
        // Continue with visit creation even if patient fetch fails
      }

      // Get the readable patient_id for use in patient_data
      const readablePatientId = patient.patients_id || patientData?.patients_id || patient.id;
      console.log('Using readable patient_id for patient_data:', readablePatientId);

      // Update patient_data table with visit information - ENSURE patient_id is readable ID
      try {
        // First, find the patient_data record by patient_id (using readable ID)
        const { data: patientDataRecord, error: findError } = await supabase
          .from('patient_data')
          .select('sr_no')
          .eq('patient_id', readablePatientId)
          .single();

        if (findError || !patientDataRecord) {
          console.log('Patient not found in patient_data, creating new record...');
          // If patient doesn't exist in patient_data, create a new record
          const insertData = {
            patient_name: patientData?.name || patient.name,
            patient_id: readablePatientId, // CRITICAL: Use readable patient_id, not UUID
            mrn: visitData.visit_id, // Store visit_id in MRN field
            age: patientData?.age?.toString() || '',
            sex: patientData?.gender || '',
            patient_type: patientData?.corporate || '',
            date_of_admission: format(visitDate, 'yyyy-MM-dd'),
            diagnosis_and_surgery_performed: '',
            surgery_performed_by: formData.appointmentWith,
            reff_dr_name: formData.referringDoctor,
            claim_id: formData.claimId || visitData.visit_id,
            intimation_done_not_done: 'Done',
            payment_status: 'Pending',
            // Map additional fields from patient data
            sst_or_secondary_treatment: patientData?.corporate === 'esic' ? 'ESIC' : 'Private',
            referral_original_yes_no: 'No',
            e_pahachan_card_yes_no: 'No',
            hitlabh_or_entitelment_benefits_yes_no: 'No',
            adhar_card_yes_no: patientData?.aadhar_passport ? 'Yes' : 'No',
            // Add visit_id and patient_id for tracking
            remark_1: `Visit ID: ${visitData.visit_id}`,
            remark_2: `Patient ID: ${readablePatientId}`
          };
          
          console.log('INSERTING patient_data with patient_id:', insertData.patient_id);
          console.log('INSERTING patient_data with MRN:', insertData.mrn);
          
          const { data: insertedData, error: insertError } = await supabase
            .from('patient_data')
            .insert(insertData)
            .select()
            .single();

          if (insertError) {
            console.error('Error inserting patient_data record:', insertError);
          } else {
            console.log('Patient_data record created successfully');
            console.log('Stored patient_id:', insertedData.patient_id);
            console.log('MRN field value:', insertedData.mrn);
          }
        } else {
          console.log('Updating existing patient_data record...');
          // Update existing patient_data record - ENSURE readable patient_id
          const updateData = {
            patient_name: patientData?.name || patient.name,
            patient_id: readablePatientId, // CRITICAL: Ensure readable patient_id, not UUID
            mrn: visitData.visit_id, // Store visit_id in MRN field
            age: patientData?.age?.toString() || '',
            sex: patientData?.gender || '',
            patient_type: patientData?.corporate || '',
            date_of_admission: format(visitDate, 'yyyy-MM-dd'),
            diagnosis_and_surgery_performed: '',
            surgery_performed_by: formData.appointmentWith,
            reff_dr_name: formData.referringDoctor,
            claim_id: formData.claimId || visitData.visit_id,
            intimation_done_not_done: 'Done',
            payment_status: 'Pending',
            // Map additional fields from patient data
            sst_or_secondary_treatment: patientData?.corporate === 'esic' ? 'ESIC' : 'Private',
            referral_original_yes_no: 'No',
            e_pahachan_card_yes_no: 'No',
            hitlabh_or_entitelment_benefits_yes_no: 'No',
            adhar_card_yes_no: patientData?.aadhar_passport ? 'Yes' : 'No',
            // Update visit_id and patient_id for tracking
            remark_1: `Visit ID: ${visitData.visit_id}`,
            remark_2: `Patient ID: ${readablePatientId}`
          };
          
          console.log('UPDATING patient_data with patient_id:', updateData.patient_id);
          console.log('UPDATING patient_data with MRN:', updateData.mrn);
          
          const { data: updatedData, error: updateError } = await supabase
            .from('patient_data')
            .update(updateData)
            .eq('sr_no', patientDataRecord.sr_no)
            .select()
            .single();

          if (updateError) {
            console.error('Error updating patient_data record:', updateError);
          } else {
            console.log('Patient_data record updated successfully');
            console.log('Updated patient_id:', updatedData.patient_id);
            console.log('MRN field value:', updatedData.mrn);
          }
        }
      } catch (error) {
        console.error('Error handling patient_data:', error);
        // Don't fail the whole process if patient_data update fails
      }



      toast({
        title: "Success",
        description: `Visit registered successfully! Visit ID: ${visitData.visit_id}`,
      });

      // Invalidate queries to refresh data - INCLUDING REPORTS DATA
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      queryClient.invalidateQueries({ queryKey: ['todays-visits'] });
      queryClient.invalidateQueries({ queryKey: ['currently-admitted-visits'] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patient-data'] }); // This will refresh Reports page data
      queryClient.invalidateQueries({ queryKey: ['spreadsheet-data'] }); // Refresh spreadsheet data

      handleCancel();

      // Show success message with confirmation
      toast({
        title: "Data Stored Successfully",
        description: `Patient ID ${readablePatientId} and Visit ID ${visitData.visit_id} stored properly!`,
      });

      // Redirect to appropriate dashboard based on patient type
      setTimeout(() => {
        if (formData.patientType === 'OPD' || formData.patientType === 'OPD (Outpatient)') {
          navigate('/todays-opd');
        } else if (formData.patientType === 'IPD' || formData.patientType === 'IPD (Inpatient)') {
          navigate('/todays-ipd');
        } else if (formData.patientType === 'Emergency') {
          // For emergency, redirect to IPD dashboard as well
          navigate('/todays-ipd');
        }
      }, 1500); // Wait 1.5 seconds to let user see the success message
      }  // Close the else block for create new visit

    } catch (error) {
      console.error('Error registering visit:', error);
      toast({
        title: "Error",
        description: "Failed to register visit",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      visitType: '',
      appointmentWith: '',
      reasonForVisit: '',
      relationWithEmployee: '',
      status: '',
      referringDoctor: '',
      relationshipManager: '',
      claimId: '',
      patientType: '',
      wardAllotted: '',
      roomAllotted: '',
    });
    setSelectedIds({
      referringDoctorId: '',
      relationshipManagerId: ''
    });
    setVisitDate(new Date());
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-blue-600">
            {editMode ? 'Edit Visit' : 'Register New Visit'}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Patient: {patient.name} {patient.patients_id ? `(${patient.patients_id})` : ''} IPD
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <VisitDetailsSection
            visitDate={visitDate}
            setVisitDate={setVisitDate}
            formData={formData}
            handleInputChange={handleInputChange}
            existingVisit={existingVisit}
          />

          <VisitFormActions
            isSubmitting={isSubmitting}
            onCancel={handleCancel}
            onSubmit={handleSubmit}
            editMode={editMode}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default VisitRegistrationForm;
