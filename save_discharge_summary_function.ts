// TypeScript function to save IPD Discharge Summary data
// Use this in your React component

interface MedicationRow {
  name: string;
  unit: string;
  route: string;
  dose: string;
  quantity: string;
  days: string;
  startDate: string;
  timing: {
    morning: boolean;
    afternoon: boolean;
    evening: boolean;
    night: boolean;
  };
  isSos: boolean;
  remark: string;
}

interface ExaminationData {
  temperature: string;
  pulseRate: string;
  respiratoryRate: string;
  bloodPressure: string;
  spo2: string;
  examinationDetails: string;
}

interface SurgeryDetails {
  surgeryDate: string;
  procedurePerformed: string;
  surgeon: string;
  anesthetist: string;
  anesthesiaType: string;
  implant: string;
  description: string;
}

interface DischargeSummaryData {
  // Visit Information
  visitId: string;
  visitUuid?: string;

  // Patient Information
  patientName: string;
  regId: string;
  address: string;
  ageSex: string;
  treatingConsultant: string;
  doa: string;
  otherConsultants: string;
  dateOfDischarge: string;
  reasonOfDischarge: string;
  corporateType: string;
  otherConsultantsText: string;

  // Medical Information
  diagnosis: string;
  investigations: string;
  stayNotes: string;

  // Treatment Information
  treatmentCondition: string;
  treatmentStatus: string;
  reviewDate: string;
  residentOnDischarge: string;
  enableSmsAlert: boolean;

  // Complex Data
  examinationData: ExaminationData;
  medications: MedicationRow[];
  surgeryDetails: SurgeryDetails;
}

// Function to save discharge summary
export const saveDischargeSummary = async (data: DischargeSummaryData) => {
  try {
    console.log('💾 Saving discharge summary...', data);

    // Transform medications data
    const medicationsJson = data.medications.map((med, index) => ({
      name: med.name,
      unit: med.unit,
      route: med.route,
      dose: med.dose,
      quantity: med.quantity,
      days: med.days,
      start_date: med.startDate,
      timing: {
        morning: med.timing.morning,
        afternoon: med.timing.afternoon,
        evening: med.timing.evening,
        night: med.timing.night
      },
      is_sos: med.isSos,
      remark: med.remark,
      order: index + 1
    }));

    // Transform examination data
    const examinationJson = {
      temperature: data.examinationData.temperature,
      pulse_rate: data.examinationData.pulseRate,
      respiratory_rate: data.examinationData.respiratoryRate,
      blood_pressure: data.examinationData.bloodPressure,
      spo2: data.examinationData.spo2,
      examination_details: data.examinationData.examinationDetails
    };

    // Transform surgery details
    const surgeryJson = {
      surgery_date: data.surgeryDetails.surgeryDate,
      procedure_performed: data.surgeryDetails.procedurePerformed,
      surgeon: data.surgeryDetails.surgeon,
      anesthetist: data.surgeryDetails.anesthetist,
      anesthesia_type: data.surgeryDetails.anesthesiaType,
      implant: data.surgeryDetails.implant,
      description: data.surgeryDetails.description
    };

    // Supabase query
    const { data: result, error } = await supabase
      .from('ipd_discharge_summary')
      .upsert({
        // Visit Information
        visit_id: data.visitId,
        visit_uuid: data.visitUuid,

        // Patient Information
        patient_name: data.patientName,
        reg_id: data.regId,
        address: data.address,
        age_sex: data.ageSex,
        treating_consultant: data.treatingConsultant,
        doa: data.doa,
        other_consultants: data.otherConsultants,
        date_of_discharge: data.dateOfDischarge,
        reason_of_discharge: data.reasonOfDischarge,
        corporate_type: data.corporateType,
        other_consultants_text: data.otherConsultantsText,

        // Medical Information
        diagnosis: data.diagnosis,
        investigations: data.investigations,
        stay_notes: data.stayNotes,

        // Treatment Information
        treatment_condition: data.treatmentCondition,
        treatment_status: data.treatmentStatus,
        review_date: data.reviewDate,
        resident_on_discharge: data.residentOnDischarge,
        enable_sms_alert: data.enableSmsAlert,

        // Complex Data as JSON
        examination_data: examinationJson,
        medications: medicationsJson,
        surgery_details: surgeryJson,

        // Metadata
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'visit_id'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error saving discharge summary:', error);
      throw error;
    }

    console.log('✅ Discharge summary saved successfully:', result);
    return result;

  } catch (error) {
    console.error('❌ Failed to save discharge summary:', error);
    throw error;
  }
};

// Function to fetch discharge summary
export const fetchDischargeSummary = async (visitId: string) => {
  try {
    console.log('📋 Fetching discharge summary for visit:', visitId);

    const { data, error } = await supabase
      .from('ipd_discharge_summary')
      .select('*')
      .eq('visit_id', visitId)
      .single();

    if (error) {
      console.error('❌ Error fetching discharge summary:', error);
      throw error;
    }

    console.log('✅ Discharge summary fetched:', data);
    return data;

  } catch (error) {
    console.error('❌ Failed to fetch discharge summary:', error);
    throw error;
  }
};

// Function to check if discharge summary exists
export const checkDischargeSummaryExists = async (visitId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('ipd_discharge_summary')
      .select('id')
      .eq('visit_id', visitId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw error;
    }

    return !!data;
  } catch (error) {
    console.error('❌ Error checking discharge summary existence:', error);
    return false;
  }
};

// Function to delete discharge summary
export const deleteDischargeSummary = async (visitId: string) => {
  try {
    console.log('🗑️ Deleting discharge summary for visit:', visitId);

    const { error } = await supabase
      .from('ipd_discharge_summary')
      .delete()
      .eq('visit_id', visitId);

    if (error) {
      console.error('❌ Error deleting discharge summary:', error);
      throw error;
    }

    console.log('✅ Discharge summary deleted successfully');
  } catch (error) {
    console.error('❌ Failed to delete discharge summary:', error);
    throw error;
  }
};

// Usage example in React component:
/*
const handleSave = async () => {
  try {
    const dischargeSummaryData: DischargeSummaryData = {
      visitId: patientData.visit_id,
      visitUuid: patientData.id,
      patientName: patientData.name,
      regId: patientData.reg_id,
      address: address,
      ageSex: ageSex,
      treatingConsultant: treatingConsultant,
      doa: doa,
      otherConsultants: otherConsultants,
      dateOfDischarge: dateOfDischarge,
      reasonOfDischarge: reasonOfDischarge,
      corporateType: corporateType,
      otherConsultantsText: otherConsultantsText,
      diagnosis: diagnosis,
      investigations: investigations,
      stayNotes: stayNotes,
      treatmentCondition: treatmentCondition,
      treatmentStatus: treatmentStatus,
      reviewDate: reviewDate,
      residentOnDischarge: residentOnDischarge,
      enableSmsAlert: enableSmsAlert,
      examinationData: {
        temperature: temperature,
        pulseRate: pulseRate,
        respiratoryRate: respiratoryRate,
        bloodPressure: bloodPressure,
        spo2: spo2,
        examinationDetails: examinationDetails
      },
      medications: medicationRows,
      surgeryDetails: {
        surgeryDate: surgeryDate,
        procedurePerformed: procedurePerformed,
        surgeon: surgeon,
        anesthetist: anesthetist,
        anesthesiaType: anesthesiaType,
        implant: implant,
        description: surgeryDescription
      }
    };

    await saveDischargeSummary(dischargeSummaryData);

    toast({
      title: "Success",
      description: "Discharge summary saved successfully",
    });
  } catch (error) {
    toast({
      title: "Error",
      description: "Failed to save discharge summary",
      variant: "destructive"
    });
  }
};
*/