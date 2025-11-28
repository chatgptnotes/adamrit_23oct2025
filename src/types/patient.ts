
// Patient interface matching the database structure and component usage
export interface Patient {
  id: string;
  patientUuid?: string;
  name: string;
  patients_id: string;
  patientId?: string; // Alternative field name
  insurance_person_no?: string;
  age?: string;
  gender?: string;
  hospital_name?: string;
  surgeon?: string;
  consultant?: string;
  hopeSurgeon?: string;
  hopeConsultants?: string;
  visitId?: string;
  visitIdDisplay?: string;
  
  // Date fields
  admissionDate?: string;
  surgeryDate?: string;
  dischargeDate?: string;
  
  // Medical fields
  primaryDiagnosis?: string;
  surgery?: string;
  complications?: string;
  
  // Administrative fields
  sstTreatment?: string;
  intimationDone?: boolean | string;
  cghsCode?: string;
  packageAmount?: string | number;
  billingExecutive?: string;
  extensionTaken?: boolean | string;
  delayWaiverIntimation?: boolean | string;
  surgicalApproval?: boolean | string;
  remark1?: string;
  remark2?: string;
  sanctionStatus?: string;
  
  // Legacy fields for backward compatibility
  srNo?: number | string;
  bunchNo?: string;
  patientName?: string;
  sstOrSecondaryTreatment?: string;
  mrn?: string;
  referralOriginalYesNo?: string;
  ePahachanCardYesNo?: string;
  entitlementBenefitsYes?: string;
  adharCardYesNo?: string;
  sex?: string;
  patientType?: string;
  reffDrName?: string;
  dateOfAdmission?: string;

  // Patient Data table specific fields
  source?: string;
  hitlabhOrEntitelmentBenefitsYesNo?: string;
  dateOfDischarge?: string;
  claimId?: string;
  intimationDoneNotDone?: string;
  cghsSurgeryEsicReferral?: string;
  diagnosisAndSurgeryPerformed?: string;
  totalPackageAmount?: string;
  billAmount?: string;
  surgeryPerformedBy?: string;
  surgeryNameWithCghsAmountWithCghsCode?: string;
  surgery1InReferralLetter?: string;
  surgery2?: string;
  surgery3?: string;
  surgery4?: string;
  dateOfSurgery?: string;
  cghsCodeUnlistedWithApprovalFromEsic?: string;
  cghsPackageAmountApprovedUnlistedAmount?: string;
  paymentStatus?: string;
  onPortalSubmissionDate?: string;
  billMadeByNameOfBillingExecutive?: string;
  extensionTakenNotTakenNotRequired?: string;
  delayWaiverForIntimationBillSubmissionTakenNotRequired?: string;
  surgicalAdditionalApprovalTakenNotTakenNotRequiredBoth?: string;
}

export interface Diagnosis {
  id: string;
  name: string;
  description?: string;
}
