
import { supabaseClient as supabase } from "@/utils/supabase-client";

export interface SpreadsheetCell {
  value: string;
  color?: string;
  bold?: boolean;
  background?: string;
}

// Header row based on the patient_data table schema
const headerRow: SpreadsheetCell[] = [
  { value: "Sr.No.", bold: true, background: "#f0f0f0" },
  { value: "Patient Name", bold: true, background: "#f0f0f0" },
  { value: "SST or Secondary Treatment", bold: true, background: "#f0f0f0" },
  { value: "MRN (Visit ID)", bold: true, background: "#f0f0f0" }, // Updated header to clarify
  { value: "Patient ID", bold: true, background: "#f0f0f0" },
  { value: "Age", bold: true, background: "#f0f0f0" },
  { value: "Referral Original Y/N", bold: true, background: "#f0f0f0" },
  { value: "E-Pahachan Card Y/N", bold: true, background: "#f0f0f0" },
  { value: "Entitlement Benefits Y/N", bold: true, background: "#f0f0f0" },
  { value: "Adhar Card Y/N", bold: true, background: "#f0f0f0" },
  { value: "Sex", bold: true, background: "#f0f0f0" },
  { value: "Patient Type", bold: true, background: "#f0f0f0" },
  { value: "Reff Dr Name", bold: true, background: "#f0f0f0" },
  { value: "Date of Admission", bold: true, background: "#f0f0f0" },
  { value: "Date of Discharge", bold: true, background: "#f0f0f0" },
  { value: "Claim ID", bold: true, background: "#f0f0f0" },
  { value: "Intimation Done/Not Done", bold: true, background: "#f0f0f0" },
  { value: "CGHS Surgery ESIC Referral", bold: true, background: "#f0f0f0" },
  { value: "Diagnosis and Surgery Performed", bold: true, background: "#f0f0f0" },
  { value: "Total Package Amount", bold: true, background: "#f0f0f0" },
  { value: "Bill Amount", bold: true, background: "#f0f0f0" },
  { value: "Surgery Performed By", bold: true, background: "#f0f0f0" },
  { value: "Surgery Name with CGHS Amount with CGHS Code", bold: true, background: "#f0f0f0" },
  { value: "Surgery1 in Referral Letter", bold: true, background: "#f0f0f0" },
  { value: "Surgery2", bold: true, background: "#f0f0f0" },
  { value: "Surgery3", bold: true, background: "#f0f0f0" },
  { value: "Surgery4", bold: true, background: "#f0f0f0" },
  { value: "Date of Surgery", bold: true, background: "#f0f0f0" },
  { value: "CGHS Code Unlisted with Approval from ESIC", bold: true, background: "#f0f0f0" },
  { value: "CGHS Package Amount Approved Unlisted Amount", bold: true, background: "#f0f0f0" },
  { value: "Payment Status", bold: true, background: "#f0f0f0" },
  { value: "On Portal Submission Date", bold: true, background: "#f0f0f0" },
  { value: "Bill Made By Name of Billing Executive", bold: true, background: "#f0f0f0" },
  { value: "Extension Taken/Not Taken/Not Required", bold: true, background: "#f0f0f0" },
  { value: "Delay Waiver for Intimation Bill Submission Taken/Not Required", bold: true, background: "#f0f0f0" },
  { value: "Surgical Additional Approval Taken/Not Taken/Not Required/Both", bold: true, background: "#f0f0f0" },
  { value: "Remark 1 (Visit ID)", bold: true, background: "#f0f0f0" }, // Updated header to clarify
  { value: "Remark 2 (Patient ID)", bold: true, background: "#f0f0f0" }, // Updated header to clarify
  { value: "Shweta Task", bold: true, background: "#f0f0f0" },
  { value: "Azhar Task", bold: true, background: "#f0f0f0" },
  { value: "Kashish Task", bold: true, background: "#f0f0f0" },
  { value: "Gurudas Task", bold: true, background: "#f0f0f0" },
  { value: "Shashank Task", bold: true, background: "#f0f0f0" }
];

// Function to format date strings
const formatDate = (dateString: string | null) => {
  if (!dateString) return '';
  return dateString;
};

// Function to convert Yes/No text to formatted cell
const formatYesNo = (value: string | null): SpreadsheetCell => {
  if (!value) return { value: '' };
  const cleanValue = value.toLowerCase().trim();
  if (cleanValue === 'yes') {
    return {
      value: 'Yes',
      color: 'green'
    };
  } else if (cleanValue === 'no') {
    return {
      value: 'No',
      color: 'red'
    };
  }
  return { value: value };
};

// Function to format date status values (1=✓, 2=✗)
const formatDateStatus = (value: string | null): SpreadsheetCell => {
  if (!value) return { value: '' };
  if (value === '1') {
    return {
      value: '✓',
      color: '#16a34a', // Green color for checkmark
      bold: true
    };
  } else if (value === '2') {
    return {
      value: '✗',
      color: '#dc2626', // Red color for cross
      bold: true
    };
  }
  return { value: value };
};

// Function to fetch spreadsheet data with better caching control
export const fetchSpreadsheetData = async (): Promise<SpreadsheetCell[][]> => {
  try {
    console.log('Fetching fresh patient data from patient_data table...');
    
    // Use a fresh query to avoid cache issues
    const { data: patients, error } = await supabase
      .from('patient_data')
      .select('*')
      .order('sr_no', { ascending: true });

    if (error) {
      console.error('Error fetching patient data:', error);
      throw error;
    }

    console.log('Fetched patients from patient_data:', patients?.length || 0);
    
    // Debug: Log first few MRN values to check visit_id storage
    if (patients && patients.length > 0) {
      console.log('Sample MRN values from database:');
      patients.slice(0, 5).forEach((patient, index) => {
        console.log(`Row ${index + 1}: MRN = "${patient.mrn}", Patient = "${patient.patient_name}"`);
      });
    }

    if (!patients || patients.length === 0) {
      console.log('No patient data found, showing headers only');
      return [headerRow];
    }

    // Transform the data into spreadsheet format
    const rows = patients.map((patient) => [
      { value: patient.sr_no?.toString() || '' },
      { value: patient.patient_name || '' },
      { value: patient.sst_or_secondary_treatment || '' },
      { 
        value: patient.mrn || '', // This MUST show the visit_id (text format like IH25F19001)
        bold: true, // Make MRN bold to highlight visit_id
        color: '#2563eb', // Blue color to highlight visit_id
        background: patient.mrn && patient.mrn.startsWith('IH') ? '#e0f2fe' : '#fee2e2' // Light blue if visit_id, light red if not
      },
      { value: patient.patient_id || '' },
      { value: patient.age || '' },
      formatYesNo(patient.referral_original_yes_no),
      formatYesNo(patient.e_pahachan_card_yes_no),
      formatYesNo(patient.hitlabh_or_entitelment_benefits_yes_no),
      formatYesNo(patient.adhar_card_yes_no),
      { value: patient.sex || '' },
      { value: patient.patient_type || '' },
      { value: patient.reff_dr_name || '' },
      { value: formatDate(patient.date_of_admission) },
      { value: formatDate(patient.date_of_discharge) },
      { value: patient.claim_id || '' },
      { value: patient.intimation_done_not_done || '' },
      { value: patient.cghs_surgery_esic_referral || '' },
      { value: patient.diagnosis_and_surgery_performed || '' },
      { value: patient.total_package_amount || '' },
      { value: patient.bill_amount || '' },
      { value: patient.surgery_performed_by || '' },
      { value: patient.surgery_name_with_cghs_amount_with_cghs_code || '' },
      { value: patient.surgery1_in_referral_letter || '' },
      { value: patient.surgery2 || '' },
      { value: patient.surgery3 || '' },
      { value: patient.surgery4 || '' },
      { value: patient.date_of_surgery || '' },
      { value: patient.cghs_code_unlisted_with_approval_from_esic || '' },
      { value: patient.cghs_package_amount_approved_unlisted_amount || '' },
      { value: patient.payment_status || '' },
      { value: patient.on_portal_submission_date || '' },
      { value: patient.bill_made_by_name_of_billing_executive || '' },
      { value: patient.extension_taken_not_taken_not_required || '' },
      { value: patient.delay_waiver_for_intimation_bill_submission_taken_not_required || '' },
      { value: patient.surgical_additional_approval_taken_not_taken_not_required_both_ || '' },
      { 
        value: patient.remark_1 || '', // This will show "Visit ID: IH25F19001"
        color: '#059669' // Green color for visit ID info
      },
      { 
        value: patient.remark_2 || '', // This will show "Patient ID: ..."
        color: '#7c3aed' // Purple color for patient ID info
      },
      formatDateStatus(patient.date_column_1), // Shweta Task - show ✓/✗ from database
      formatDateStatus(patient.date_column_2), // Azhar Task - show ✓/✗ from database
      formatDateStatus(patient.date_column_3), // Kashish Task - show ✓/✗ from database
      formatDateStatus(patient.date_column_4), // Gurudas Task - show ✓/✗ from database
      formatDateStatus(patient.date_column_5)  // Shashank Task - show ✓/✗ from database
    ]);

    console.log('Transformed rows for spreadsheet:', rows.length);
    console.log('Sample MRN values for display:');
    rows.slice(0, 5).forEach((row, index) => {
      console.log(`Display Row ${index + 1}: MRN = "${row[3]?.value}"`);
    });
    
    return [headerRow, ...rows];
  } catch (error) {
    console.error('Error fetching spreadsheet data:', error);
    // Return just headers if there's an error
    return [headerRow];
  }
};
