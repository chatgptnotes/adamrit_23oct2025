import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";

// Import critical pages synchronously
import Index from "../pages/Index";
import NotFound from "../pages/NotFound";
import PatientDashboard from "../pages/PatientDashboard";
import PatientOverview from "../pages/PatientOverview";
import TodaysIpdDashboard from "../pages/TodaysIpdDashboard";
import TodaysOpd from "../pages/TodaysOpd";
import AdvanceStatementReport from "../pages/AdvanceStatementReport";
import NoDeductionLetterPage from "../pages/NoDeductionLetter";
import CurrentlyAdmittedPatients from "../pages/CurrentlyAdmittedPatients";

// Lazy load discharged patients page
const DischargedPatients = lazy(() => import("../pages/DischargedPatients"));
const Accommodation = lazy(() => import("../pages/Accommodation"));
const RoomManagement = lazy(() => import("../pages/RoomManagement"));

// Import authentication pages
import LoginPage from "./LoginPage";
import SignupPage from "./SignupPage";
import TestSignup from "./TestSignup";
import SimpleSignup from "./SimpleSignup";

// Lazy load Advanced Statement Report
const AdvancedStatementReport = lazy(() => import("../pages/AdvancedStatementReport"));

// Lazy load heavy feature pages
const Accounting = lazy(() => import("../pages/Accounting"));
const CashBook = lazy(() => import("../pages/CashBook"));
const PatientLedger = lazy(() => import("../pages/PatientLedger"));
const DayBook = lazy(() => import("../pages/DayBook"));
const LedgerStatement = lazy(() => import("../pages/LedgerStatement"));
const Pharmacy = lazy(() => import("../pages/Pharmacy"));
const Lab = lazy(() => import("../pages/Lab"));
const Radiology = lazy(() => import("../pages/Radiology"));
const FinalBill = lazy(() => import("../pages/FinalBill"));
const EditFinalBill = lazy(() => import("../pages/EditFinalBill"));

// Lazy load other pages
const Diagnoses = lazy(() => import("../pages/Diagnoses"));
const Patients = lazy(() => import("../pages/Patients"));
const Users = lazy(() => import("../pages/Users"));
const Complications = lazy(() => import("../pages/Complications"));
const CghsSurgery = lazy(() => import("../pages/CghsSurgery"));
const CghsSurgeryMaster = lazy(() => import("../pages/CghsSurgeryMaster"));
const EsicSurgeons = lazy(() => import("../pages/EsicSurgeons"));
const Referees = lazy(() => import("../pages/Referees"));
const HopeSurgeons = lazy(() => import("../pages/HopeSurgeons"));
const HopeConsultants = lazy(() => import("../pages/HopeConsultants"));
const HopeAnaesthetists = lazy(() => import("../pages/HopeAnaesthetists"));
const AyushmanSurgeons = lazy(() => import("../pages/AyushmanSurgeons"));
const AyushmanConsultants = lazy(() => import("../pages/AyushmanConsultants"));
const AyushmanAnaesthetists = lazy(() => import("../pages/AyushmanAnaesthetists"));
const MandatoryService = lazy(() => import("../pages/MandatoryService"));
const MandatoryServiceCreate = lazy(() => import("../pages/MandatoryServiceCreate"));
const ClinicalServices = lazy(() => import("../pages/ClinicalServices"));
const ClinicalServiceCreate = lazy(() => import("../pages/ClinicalServiceCreate"));
const ExternalRequisition = lazy(() => import("../pages/ExternalRequisition"));
const ExternalRequisitionCreate = lazy(() => import("../pages/ExternalRequisitionCreate"));
const GatePassPrintPage = lazy(() => import("../pages/GatePassPrint"));
const DischargeSummaryPrint = lazy(() => import("../pages/DischargeSummaryPrint"));
const DischargeSummaryEdit = lazy(() => import("../pages/DischargeSummaryEdit"));
const IpdDischargeSummary = lazy(() => import("../pages/IpdDischargeSummary"));
const DeathCertificate = lazy(() => import("../pages/DeathCertificate"));
const PhysiotherapyBill = lazy(() => import("../pages/PhysiotherapyBill"));
const AdmissionNotes = lazy(() => import("../pages/AdmissionNotes"));
const OpdAdmissionNotes = lazy(() => import("../pages/OpdAdmissionNotes"));

const PVIFormPrint = lazy(() => import("../pages/PVIFormPrint"));
const PatientProfile = lazy(() => import("../pages/PatientProfile"));
const TreatmentSheet = lazy(() => import("../pages/TreatmentSheet"));
const Reports = lazy(() => import("../pages/Reports"));
const FinalBillTest = lazy(() => import("../pages/FinalBillTest"));
const LabPrintDemo = lazy(() => import("../pages/LabPrintDemo"));
const StoreRequisition = lazy(() => import("../components/pharmacy/StoreRequisition"));
const EditSaleBill = lazy(() => import("../components/pharmacy/EditSaleBill"));
const DaywiseBills = lazy(() => import("../pages/DaywiseBills"));
const OldBills = lazy(() => import("../pages/OldBills"));
const ViewBill = lazy(() => import("../pages/ViewBill"));
const FinancialSummary = lazy(() => import("../pages/FinancialSummary"));
const P2Form = lazy(() => import("../pages/P2Form"));
const LabResultsEntryDemo = lazy(() => import("../pages/LabResultsEntryDemo"));
const Invoice = lazy(() => import("../pages/Invoice"));
const DetailedInvoice = lazy(() => import("../pages/DetailedInvoice"));
const DischargeInvoice = lazy(() => import("../pages/DischargeInvoice"));
const Corporate = lazy(() => import("../pages/Corporate"));
const BillSubmission = lazy(() => import("../pages/BillSubmission"));
const BillAgingStatement = lazy(() => import("../pages/BillAgingStatement"));
const ExpectedPaymentDateReport = lazy(() => import("../pages/ExpectedPaymentDateReport"));
const Marketing = lazy(() => import("../pages/Marketing"));
const RelationshipManager = lazy(() => import("../pages/RelationshipManager"));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
  </div>
);

export const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/signup-simple" element={<SimpleSignup />} />
        <Route path="/test" element={<TestSignup />} />
        <Route path="/patient-dashboard" element={<PatientDashboard />} />
        <Route path="/patient-overview" element={<PatientOverview />} />
        <Route path="/patient-profile" element={<Suspense fallback={<PageLoader />}><PatientProfile /></Suspense>} />
        <Route path="/todays-ipd" element={<TodaysIpdDashboard />} />
        <Route path="/todays-opd" element={<TodaysOpd />} />
        <Route path="/advance-statement-report" element={<AdvanceStatementReport />} />
        <Route path="/advanced-statement-report" element={<Suspense fallback={<PageLoader />}><AdvancedStatementReport /></Suspense>} />
        <Route path="/currently-admitted" element={<CurrentlyAdmittedPatients />} />
        <Route path="/accommodation" element={<Suspense fallback={<PageLoader />}><Accommodation /></Suspense>} />
        <Route path="/room-management" element={<Suspense fallback={<PageLoader />}><RoomManagement /></Suspense>} />
        <Route path="/discharged-patients" element={<Suspense fallback={<PageLoader />}><DischargedPatients /></Suspense>} />
        <Route path="/mandatory-service" element={<Suspense fallback={<PageLoader />}><MandatoryService /></Suspense>} />
        <Route path="/mandatory-service-create" element={<Suspense fallback={<PageLoader />}><MandatoryServiceCreate /></Suspense>} />
        <Route path="/clinical-services" element={<Suspense fallback={<PageLoader />}><ClinicalServices /></Suspense>} />
        <Route path="/clinical-service-create" element={<Suspense fallback={<PageLoader />}><ClinicalServiceCreate /></Suspense>} />
        <Route path="/external-requisition" element={<Suspense fallback={<PageLoader />}><ExternalRequisition /></Suspense>} />
        <Route path="/external-requisition-create" element={<Suspense fallback={<PageLoader />}><ExternalRequisitionCreate /></Suspense>} />
        <Route path="/gate-pass/:visitId" element={<Suspense fallback={<PageLoader />}><GatePassPrintPage /></Suspense>} />
        <Route path="/discharge-summary-print/:visitId" element={<Suspense fallback={<PageLoader />}><DischargeSummaryPrint /></Suspense>} />
        <Route path="/discharge-summary-edit/:visitId" element={<Suspense fallback={<PageLoader />}><DischargeSummaryEdit /></Suspense>} />
        <Route path="/physiotherapy-bill/:visitId" element={<Suspense fallback={<PageLoader />}><PhysiotherapyBill /></Suspense>} />
        <Route path="/admission-notes/:visitId" element={<Suspense fallback={<PageLoader />}><AdmissionNotes /></Suspense>} />
        <Route path="/opd-admission-notes/:visitId" element={<Suspense fallback={<PageLoader />}><OpdAdmissionNotes /></Suspense>} />

        <Route path="/pvi-form/:visitId" element={<Suspense fallback={<PageLoader />}><PVIFormPrint /></Suspense>} />
        <Route path="/diagnoses" element={<Suspense fallback={<PageLoader />}><Diagnoses /></Suspense>} />
        <Route path="/patients" element={<Suspense fallback={<PageLoader />}><Patients /></Suspense>} />
        <Route path="/users" element={<Suspense fallback={<PageLoader />}><Users /></Suspense>} />
        <Route path="/complications" element={<Suspense fallback={<PageLoader />}><Complications /></Suspense>} />
        <Route path="/cghs-surgery" element={<Suspense fallback={<PageLoader />}><CghsSurgery /></Suspense>} />
        <Route path="/cghs-surgery-master" element={<Suspense fallback={<PageLoader />}><CghsSurgeryMaster /></Suspense>} />
        <Route path="/lab" element={<Suspense fallback={<PageLoader />}><Lab /></Suspense>} />
        <Route path="/radiology" element={<Suspense fallback={<PageLoader />}><Radiology /></Suspense>} />
        <Route path="/treatment-sheet" element={<Suspense fallback={<PageLoader />}><TreatmentSheet /></Suspense>} />
        <Route path="/esic-surgeons" element={<Suspense fallback={<PageLoader />}><EsicSurgeons /></Suspense>} />
        <Route path="/referees" element={<Suspense fallback={<PageLoader />}><Referees /></Suspense>} />
        <Route path="/relationship-manager" element={<Suspense fallback={<PageLoader />}><RelationshipManager /></Suspense>} />
        <Route path="/hope-surgeons" element={<Suspense fallback={<PageLoader />}><HopeSurgeons /></Suspense>} />
        <Route path="/hope-consultants" element={<Suspense fallback={<PageLoader />}><HopeConsultants /></Suspense>} />
        <Route path="/hope-anaesthetists" element={<Suspense fallback={<PageLoader />}><HopeAnaesthetists /></Suspense>} />
        <Route path="/ayushman-surgeons" element={<Suspense fallback={<PageLoader />}><AyushmanSurgeons /></Suspense>} />
        <Route path="/ayushman-consultants" element={<Suspense fallback={<PageLoader />}><AyushmanConsultants /></Suspense>} />
        <Route path="/ayushman-anaesthetists" element={<Suspense fallback={<PageLoader />}><AyushmanAnaesthetists /></Suspense>} />
        <Route path="/accounting" element={<Suspense fallback={<PageLoader />}><Accounting /></Suspense>} />
        <Route path="/cash-book" element={<Suspense fallback={<PageLoader />}><CashBook /></Suspense>} />
        <Route path="/patient-ledger" element={<Suspense fallback={<PageLoader />}><PatientLedger /></Suspense>} />
        <Route path="/day-book" element={<Suspense fallback={<PageLoader />}><DayBook /></Suspense>} />
        <Route path="/ledger-statement" element={<Suspense fallback={<PageLoader />}><LedgerStatement /></Suspense>} />
        <Route path="/corporate" element={<Suspense fallback={<PageLoader />}><Corporate /></Suspense>} />
        <Route path="/pharmacy/goods-received-note" element={<Suspense fallback={<PageLoader />}><Pharmacy /></Suspense>} />
        <Route path="/pharmacy/purchase-orders/add" element={<Suspense fallback={<PageLoader />}><Pharmacy /></Suspense>} />
        <Route path="/pharmacy/purchase-orders/list" element={<Suspense fallback={<PageLoader />}><Pharmacy /></Suspense>} />
        <Route path="/pharmacy/product-purchase-report" element={<Suspense fallback={<PageLoader />}><Pharmacy /></Suspense>} />
        <Route path="/pharmacy/inventory-tracking" element={<Suspense fallback={<PageLoader />}><Pharmacy /></Suspense>} />
        <Route path="/pharmacy" element={<Suspense fallback={<PageLoader />}><Pharmacy /></Suspense>} />
        <Route path="/pharmacy/edit-sale/:saleId" element={<Suspense fallback={<PageLoader />}><EditSaleBill /></Suspense>} />
        <Route path="/reports" element={<Suspense fallback={<PageLoader />}><Reports /></Suspense>} />
        <Route path="/final-bill/:visitId" element={<Suspense fallback={<PageLoader />}><FinalBill /></Suspense>} />
        <Route path="/no-deduction-letter/:visitId" element={<NoDeductionLetterPage />} />
        <Route path="/edit-final-bill/:visitId" element={<Suspense fallback={<PageLoader />}><EditFinalBill /></Suspense>} />
        <Route path="/old-bills/:visitId" element={<Suspense fallback={<PageLoader />}><OldBills /></Suspense>} />
        <Route path="/old-bills" element={<Suspense fallback={<PageLoader />}><OldBills /></Suspense>} />
        <Route path="/view-bill/:billId" element={<Suspense fallback={<PageLoader />}><ViewBill /></Suspense>} />
        <Route path="/financial-summary" element={<Suspense fallback={<PageLoader />}><FinancialSummary /></Suspense>} />
        <Route path="/p2form/:visitId" element={<Suspense fallback={<PageLoader />}><P2Form /></Suspense>} />
        <Route path="/lab-print-demo" element={<Suspense fallback={<PageLoader />}><LabPrintDemo /></Suspense>} />
        <Route path="/lab-results-entry-demo" element={<Suspense fallback={<PageLoader />}><LabResultsEntryDemo /></Suspense>} />
        <Route path="/daywise-bills" element={<Suspense fallback={<PageLoader />}><DaywiseBills /></Suspense>} />
        <Route path="/invoice/:visitId" element={<Suspense fallback={<PageLoader />}><Invoice /></Suspense>} />
        <Route path="/detailed-invoice/:visitId" element={<Suspense fallback={<PageLoader />}><DetailedInvoice /></Suspense>} />
        <Route path="/detailed-invoice" element={<Suspense fallback={<PageLoader />}><DetailedInvoice /></Suspense>} />
        <Route path="/discharge-invoice/:visitId" element={<Suspense fallback={<PageLoader />}><DischargeInvoice /></Suspense>} />
        <Route path="/ipd-discharge-summary/:visitId" element={<Suspense fallback={<PageLoader />}><IpdDischargeSummary /></Suspense>} />
        <Route path="/death-certificate/:visitId" element={<Suspense fallback={<PageLoader />}><DeathCertificate /></Suspense>} />
        <Route path="/bill-submission" element={<Suspense fallback={<PageLoader />}><BillSubmission /></Suspense>} />
        <Route path="/bill-aging-statement" element={<Suspense fallback={<PageLoader />}><BillAgingStatement /></Suspense>} />
        <Route path="/expected-payment-date-report" element={<Suspense fallback={<PageLoader />}><ExpectedPaymentDateReport /></Suspense>} />
        <Route path="/marketing" element={<Suspense fallback={<PageLoader />}><Marketing /></Suspense>} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};
