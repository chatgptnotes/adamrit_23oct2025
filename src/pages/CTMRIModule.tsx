import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, subDays, startOfMonth, endOfMonth, differenceInMinutes, parseISO } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

import {
  Calendar, Clock, Search, Plus, Printer, RefreshCw, Activity, CheckCircle2,
  XCircle, AlertTriangle, Stethoscope, ClipboardList, BarChart3, Filter,
  Save, FileText, Wrench, TrendingUp, Camera, Zap, Shield, Heart,
  Eye, Edit2, Trash2, ChevronRight, AlertCircle, ThermometerSun, Radio
} from "lucide-react";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, PieChart, Pie,
  Cell, ResponsiveContainer, LineChart, Line, Legend, CartesianGrid
} from "recharts";

// ── Types ──────────────────────────────────────────────────────────────────

interface PatientRow { id: string; name: string; gender?: string; age?: number; phone?: string; }
interface ModalityRow { id: string; name: string; code: string; manufacturer?: string; model?: string; location?: string; status?: string; calibration_date?: string; next_calibration_date?: string; max_patients_per_day?: number; installation_date?: string; created_at?: string; }
interface ProcedureRow { id: string; name: string; code?: string; modality_id?: string; body_part?: string; study_type?: string; contrast_required?: boolean; estimated_duration?: number; price?: number; cpt_code?: string; preparation_instructions?: string; created_at?: string; }
interface OrderRow { id: string; order_number?: string; patient_id?: string; ordering_physician?: string; procedure_id?: string; modality_id?: string; priority?: string; clinical_indication?: string; clinical_history?: string; status?: string; estimated_cost?: number; created_at?: string; department?: string; pregnancy_status?: string; }
interface AppointmentRow { id: string; order_id?: string; patient_id?: string; modality_id?: string; technologist_id?: string; appointment_date?: string; appointment_time?: string; status?: string; contrast_administered?: boolean; contrast_volume?: number; created_at?: string; }
interface ReportRow { id: string; report_number?: string; study_id?: string; order_id?: string; patient_id?: string; radiologist_id?: string; findings?: string; impression?: string; recommendations?: string; critical_findings?: boolean; report_status?: string; created_at?: string; technique?: string; comparison_studies?: string; signed_at?: string; template_name?: string; }
interface TechnologistRow { id: string; name?: string; specialization?: string; status?: string; }
interface DicomStudyRow { id: string; study_instance_uid?: string; modality?: string; study_description?: string; series_count?: number; image_count?: number; body_part_examined?: string; quality_score?: number; order_id?: string; patient_id?: string; created_at?: string; }
interface DoseRow { id: string; study_id?: string; patient_id?: string; dose_length_product?: number; ct_dose_index?: number; effective_dose?: number; kvp?: number; mas?: number; exceeds_drl?: boolean; created_at?: string; modality_type?: string; }
interface QACheckRow { id: string; modality_id?: string; check_type?: string; check_date?: string; status?: string; performed_by?: string; notes?: string; next_due_date?: string; created_at?: string; }
interface RadiologistRow { id: string; name?: string; specialization?: string; license_number?: string; status?: string; }

// ── Constants ──────────────────────────────────────────────────────────────

const ORDER_STATUSES = ["Ordered", "Scheduled", "Patient Arrived", "In Progress", "Completed", "Reported", "Cancelled"];
const REPORT_STATUSES = ["Draft", "Preliminary", "Final", "Amended"];
const PRIORITIES = ["Routine", "Urgent", "STAT"];
const MODALITY_TYPES = ["CT", "MRI", "X-Ray", "USG", "Fluoroscopy"];
const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

const PRIORITY_COLORS: Record<string, string> = {
  Routine: "bg-blue-100 text-blue-800",
  Urgent: "bg-orange-100 text-orange-800",
  STAT: "bg-red-100 text-red-800",
};

const STATUS_COLORS: Record<string, string> = {
  Ordered: "bg-gray-100 text-gray-800",
  Scheduled: "bg-blue-100 text-blue-800",
  "Patient Arrived": "bg-yellow-100 text-yellow-800",
  "In Progress": "bg-purple-100 text-purple-800",
  Completed: "bg-green-100 text-green-800",
  Reported: "bg-emerald-100 text-emerald-800",
  Cancelled: "bg-red-100 text-red-800",
};

const REPORT_STATUS_COLORS: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-800",
  Preliminary: "bg-yellow-100 text-yellow-800",
  Final: "bg-green-100 text-green-800",
  Amended: "bg-blue-100 text-blue-800",
};

const REPORT_TEMPLATES: Record<string, string> = {
  "CT Head": "TECHNIQUE: Non-contrast CT of the head.\n\nFINDINGS:\nBrain parenchyma: Normal gray-white matter differentiation. No acute infarct, hemorrhage, or mass lesion.\nVentricles: Normal in size and configuration.\nMidline: No midline shift.\nExtra-axial spaces: No extra-axial collection.\nCalvarium: Intact.\nParanasal sinuses: Clear.\n\nIMPRESSION:\nNormal non-contrast CT head.",
  "CT Chest": "TECHNIQUE: CT of the chest with IV contrast.\n\nFINDINGS:\nLungs: Clear bilateral lung fields. No consolidation, ground-glass opacity, or nodules.\nAirways: Patent trachea and main bronchi.\nMediastinum: No lymphadenopathy. Normal cardiac silhouette.\nPleura: No pleural effusion or pneumothorax.\nBony thorax: No fracture or lytic lesion.\n\nIMPRESSION:\nNormal CT chest.",
  "CT Abdomen": "TECHNIQUE: CT of the abdomen and pelvis with IV contrast.\n\nFINDINGS:\nLiver: Normal size and attenuation. No focal lesion.\nGallbladder: Normal. No stones.\nPancreas: Normal.\nSpleen: Normal.\nKidneys: Normal bilateral kidneys. No hydronephrosis or stones.\nBowel: Normal caliber. No obstruction.\nLymph nodes: No pathological lymphadenopathy.\nFree fluid: None.\n\nIMPRESSION:\nNormal CT abdomen and pelvis.",
  "MRI Brain": "TECHNIQUE: MRI of the brain with and without IV contrast.\nSequences: T1W, T2W, FLAIR, DWI, ADC, SWI, post-contrast T1W.\n\nFINDINGS:\nBrain parenchyma: Normal signal intensity on all sequences. No restricted diffusion.\nVentricles: Normal in size.\nMidline structures: Normal.\nPosterior fossa: Normal cerebellum and brainstem.\nContrast enhancement: No abnormal enhancement.\n\nIMPRESSION:\nNormal MRI brain.",
  "MRI Spine": "TECHNIQUE: MRI of the lumbar spine without contrast.\nSequences: T1W sagittal, T2W sagittal, T2W axial, STIR sagittal.\n\nFINDINGS:\nAlignment: Normal lordotic curvature maintained.\nVertebral bodies: Normal height and signal. No compression fracture.\nIntervertebral discs: Normal signal and height at all levels.\nSpinal canal: No spinal stenosis.\nNeural foramina: Patent bilaterally.\nConus medullaris: Normal in position and signal.\nParaspinal soft tissues: Normal.\n\nIMPRESSION:\nNormal MRI lumbar spine.",
  "MRI Knee": "TECHNIQUE: MRI of the knee without contrast.\nSequences: PD FS sagittal, PD FS coronal, PD FS axial, T1W coronal.\n\nFINDINGS:\nMenisci: Normal medial and lateral menisci. No tear.\nCruciate ligaments: Intact ACL and PCL.\nCollateral ligaments: Intact MCL and LCL.\nArticular cartilage: Normal.\nBone marrow: Normal signal. No bone bruise or fracture.\nJoint effusion: None.\nExtensor mechanism: Intact patellar tendon and quadriceps tendon.\n\nIMPRESSION:\nNormal MRI knee.",
};

const CT_PREP_CHECKLIST = [
  { key: "fasting", label: "Fasting (4-6 hours)" },
  { key: "creatinine", label: "Creatinine/eGFR checked" },
  { key: "contrast_consent", label: "Contrast consent signed" },
  { key: "iv_access", label: "IV access established" },
  { key: "allergy_check", label: "Allergy history reviewed" },
];

const MRI_PREP_CHECKLIST = [
  { key: "metal_screening", label: "Metal screening questionnaire completed" },
  { key: "claustrophobia", label: "Claustrophobia assessment done" },
  { key: "implant_check", label: "Implant check (pacemaker, cochlear)" },
  { key: "jewelry_removed", label: "All metal/jewelry removed" },
  { key: "pregnancy_check", label: "Pregnancy status confirmed" },
];

// ── Helpers ────────────────────────────────────────────────────────────────

const LoadingSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="h-10 bg-gray-200 rounded animate-pulse" />
    ))}
  </div>
);

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
    <Camera className="w-12 h-12 mb-3 opacity-40" />
    <p className="text-sm">{message}</p>
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────

const CTMRIModule: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "dashboard";
  const { toast } = useToast();

  // Shared state
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [modalities, setModalities] = useState<ModalityRow[]>([]);
  const [procedures, setProcedures] = useState<ProcedureRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [technologists, setTechnologists] = useState<TechnologistRow[]>([]);
  const [dicomStudies, setDicomStudies] = useState<DicomStudyRow[]>([]);
  const [doseRecords, setDoseRecords] = useState<DoseRow[]>([]);
  const [qaChecks, setQAChecks] = useState<QACheckRow[]>([]);
  const [radiologists, setRadiologists] = useState<RadiologistRow[]>([]);

  // Dashboard
  const [dashFilter, setDashFilter] = useState("today");

  // Orders
  const [orderDialog, setOrderDialog] = useState(false);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderFilterStatus, setOrderFilterStatus] = useState("all");
  const [orderFilterPriority, setOrderFilterPriority] = useState("all");
  const [orderFilterModality, setOrderFilterModality] = useState("all");
  const [editingOrder, setEditingOrder] = useState<OrderRow | null>(null);
  const [orderForm, setOrderForm] = useState({
    patient_id: "", procedure_id: "", modality_id: "", ordering_physician: "", department: "",
    priority: "Routine", clinical_indication: "", clinical_history: "", contrast_required: false,
    pregnancy_status: "", estimated_cost: 0,
  });

  // Scheduling
  const [scheduleDialog, setScheduleDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    appointment_date: format(new Date(), "yyyy-MM-dd"),
    appointment_time: "09:00",
    technologist_id: "",
  });
  const [prepChecklist, setPrepChecklist] = useState<Record<string, boolean>>({});
  const [scheduleDate, setScheduleDate] = useState(format(new Date(), "yyyy-MM-dd"));

  // Reporting
  const [reportDialog, setReportDialog] = useState(false);
  const [editingReport, setEditingReport] = useState<ReportRow | null>(null);
  const [reportForm, setReportForm] = useState({
    order_id: "", patient_id: "", radiologist_id: "", findings: "", impression: "",
    recommendations: "", critical_findings: false, report_status: "Draft",
    technique: "", comparison_studies: "", template_name: "",
  });
  const [printReportId, setPrintReportId] = useState<string | null>(null);

  // Dose monitoring
  const [dosePatientId, setDosePatientId] = useState("");
  const [dosePatientSearch, setDosePatientSearch] = useState("");

  // Equipment & QA
  const [qaDialog, setQaDialog] = useState(false);
  const [qaForm, setQaForm] = useState({
    modality_id: "", check_type: "daily", status: "Pass", performed_by: "", notes: "", next_due_date: "",
  });

  // Analytics
  const [analyticsRange, setAnalyticsRange] = useState("month");

  // Procedure master
  const [procDialog, setProcDialog] = useState(false);
  const [editingProc, setEditingProc] = useState<ProcedureRow | null>(null);
  const [procForm, setProcForm] = useState({
    name: "", code: "", modality_id: "", body_part: "", study_type: "",
    contrast_required: false, estimated_duration: 30, price: 0, cpt_code: "", preparation_instructions: "",
  });

  // Patient search results
  const [patientSearchResults, setPatientSearchResults] = useState<PatientRow[]>([]);
  const [patientSearchTerm, setPatientSearchTerm] = useState("");

  // ── Data Fetching ──────────────────────────────────────────────────────

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { data: pats }, { data: mods }, { data: procs }, { data: ords },
        { data: appts }, { data: reps }, { data: techs }, { data: dicoms },
        { data: doses }, { data: qas }, { data: rads },
      ] = await Promise.all([
        supabase.from("patients").select("id, name, gender, age, phone").order("name"),
        supabase.from("radiology_modalities").select("*").order("name"),
        supabase.from("radiology_procedures").select("*").order("name"),
        supabase.from("radiology_orders").select("*").order("created_at", { ascending: false }),
        supabase.from("radiology_appointments").select("*").order("appointment_date", { ascending: false }),
        supabase.from("radiology_reports").select("*").order("created_at", { ascending: false }),
        supabase.from("radiology_technologists").select("*").order("name"),
        supabase.from("dicom_studies").select("*").order("created_at", { ascending: false }),
        supabase.from("radiation_dose_tracking").select("*").order("created_at", { ascending: false }),
        supabase.from("radiology_qa_checks").select("*").order("check_date", { ascending: false }),
        supabase.from("radiologists").select("*").order("name"),
      ]);
      setPatients(pats || []);
      setModalities(mods || []);
      setProcedures(procs || []);
      setOrders(ords || []);
      setAppointments(appts || []);
      setReports(reps || []);
      setTechnologists(techs || []);
      setDicomStudies(dicoms || []);
      setDoseRecords(doses || []);
      setQAChecks(qas || []);
      setRadiologists(rads || []);
    } catch (err) {
      toast({ title: "Error loading data", description: String(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  // ── Lookup helpers ─────────────────────────────────────────────────────

  const getPatientName = (id?: string) => patients.find(p => p.id === id)?.name || "Unknown";
  const getModalityName = (id?: string) => modalities.find(m => m.id === id)?.name || "—";
  const getModalityCode = (id?: string) => modalities.find(m => m.id === id)?.code || "—";
  const getProcedureName = (id?: string) => procedures.find(p => p.id === id)?.name || "—";
  const getProcedureByModality = (modId: string) => procedures.filter(p => p.modality_id === modId);
  const getRadiologistName = (id?: string) => radiologists.find(r => r.id === id)?.name || "—";
  const getTechName = (id?: string) => technologists.find(t => t.id === id)?.name || "—";

  const todayStr = format(new Date(), "yyyy-MM-dd");

  const todaysOrders = orders.filter(o => o.created_at && o.created_at.startsWith(todayStr));
  const todaysAppointments = appointments.filter(a => a.appointment_date === todayStr);
  const pendingReports = orders.filter(o => o.status === "Completed" && !reports.find(r => r.order_id === o.id && r.report_status === "Final"));
  const criticalReports = reports.filter(r => r.critical_findings);

  // ── Patient search ────────────────────────────────────────────────────

  const searchPatients = useCallback(async (term: string) => {
    setPatientSearchTerm(term);
    if (term.length < 2) { setPatientSearchResults([]); return; }
    const { data } = await supabase.from("patients").select("id, name, gender, age, phone").ilike("name", `%${term}%`).limit(10);
    setPatientSearchResults(data || []);
  }, []);

  // ── Order CRUD ────────────────────────────────────────────────────────

  const openNewOrder = () => {
    setEditingOrder(null);
    setOrderForm({ patient_id: "", procedure_id: "", modality_id: "", ordering_physician: "", department: "", priority: "Routine", clinical_indication: "", clinical_history: "", contrast_required: false, pregnancy_status: "", estimated_cost: 0 });
    setPatientSearchTerm("");
    setPatientSearchResults([]);
    setOrderDialog(true);
  };

  const openEditOrder = (order: OrderRow) => {
    setEditingOrder(order);
    setOrderForm({
      patient_id: order.patient_id || "", procedure_id: order.procedure_id || "", modality_id: order.modality_id || "",
      ordering_physician: order.ordering_physician || "", department: order.department || "",
      priority: order.priority || "Routine", clinical_indication: order.clinical_indication || "",
      clinical_history: order.clinical_history || "", contrast_required: false,
      pregnancy_status: order.pregnancy_status || "", estimated_cost: order.estimated_cost || 0,
    });
    setOrderDialog(true);
  };

  const saveOrder = async () => {
    if (!orderForm.patient_id || !orderForm.procedure_id) {
      toast({ title: "Missing fields", description: "Patient and procedure are required.", variant: "destructive" });
      return;
    }
    const payload: any = {
      patient_id: orderForm.patient_id, procedure_id: orderForm.procedure_id, modality_id: orderForm.modality_id,
      ordering_physician: orderForm.ordering_physician, department: orderForm.department,
      priority: orderForm.priority, clinical_indication: orderForm.clinical_indication,
      clinical_history: orderForm.clinical_history, estimated_cost: orderForm.estimated_cost,
      pregnancy_status: orderForm.pregnancy_status, status: "Ordered",
    };
    if (!editingOrder) {
      payload.order_number = `RAD-${Date.now().toString(36).toUpperCase()}`;
    }
    const { error } = editingOrder
      ? await supabase.from("radiology_orders").update(payload).eq("id", editingOrder.id)
      : await supabase.from("radiology_orders").insert(payload);
    if (error) {
      toast({ title: "Error saving order", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editingOrder ? "Order updated" : "Order created" });
      setOrderDialog(false);
      fetchAllData();
    }
  };

  const cancelOrder = async (id: string) => {
    const { error } = await supabase.from("radiology_orders").update({ status: "Cancelled" }).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Order cancelled" }); fetchAllData(); }
  };

  // ── Scheduling ────────────────────────────────────────────────────────

  const openScheduleDialog = (order: OrderRow) => {
    setSelectedOrder(order);
    setScheduleForm({ appointment_date: todayStr, appointment_time: "09:00", technologist_id: "" });
    setPrepChecklist({});
    setScheduleDialog(true);
  };

  const saveAppointment = async () => {
    if (!selectedOrder) return;
    // Check for conflicts
    const existing = appointments.filter(a =>
      a.appointment_date === scheduleForm.appointment_date &&
      a.modality_id === selectedOrder.modality_id &&
      a.appointment_time === scheduleForm.appointment_time &&
      a.status !== "Cancelled"
    );
    if (existing.length > 0) {
      toast({ title: "Scheduling conflict", description: "This slot is already booked.", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("radiology_appointments").insert({
      order_id: selectedOrder.id,
      patient_id: selectedOrder.patient_id,
      modality_id: selectedOrder.modality_id,
      technologist_id: scheduleForm.technologist_id || null,
      appointment_date: scheduleForm.appointment_date,
      appointment_time: scheduleForm.appointment_time,
      status: "Scheduled",
    });
    if (!error) {
      await supabase.from("radiology_orders").update({ status: "Scheduled" }).eq("id", selectedOrder.id);
      toast({ title: "Appointment scheduled" });
      setScheduleDialog(false);
      fetchAllData();
    } else {
      toast({ title: "Error scheduling", description: error.message, variant: "destructive" });
    }
  };

  const updateAppointmentStatus = async (id: string, status: string, orderId?: string) => {
    const { error } = await supabase.from("radiology_appointments").update({ status }).eq("id", id);
    if (!error && orderId) {
      const orderStatus = status === "Arrived" ? "Patient Arrived" : status === "Scanning" ? "In Progress" : status === "Complete" ? "Completed" : undefined;
      if (orderStatus) await supabase.from("radiology_orders").update({ status: orderStatus }).eq("id", orderId);
    }
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: `Status updated to ${status}` }); fetchAllData(); }
  };

  // ── Reporting ─────────────────────────────────────────────────────────

  const openNewReport = (order: OrderRow) => {
    setEditingReport(null);
    setReportForm({
      order_id: order.id, patient_id: order.patient_id || "", radiologist_id: "",
      findings: "", impression: "", recommendations: "", critical_findings: false,
      report_status: "Draft", technique: "", comparison_studies: "", template_name: "",
    });
    setReportDialog(true);
  };

  const openEditReport = (report: ReportRow) => {
    setEditingReport(report);
    setReportForm({
      order_id: report.order_id || "", patient_id: report.patient_id || "",
      radiologist_id: report.radiologist_id || "", findings: report.findings || "",
      impression: report.impression || "", recommendations: report.recommendations || "",
      critical_findings: report.critical_findings || false, report_status: report.report_status || "Draft",
      technique: report.technique || "", comparison_studies: report.comparison_studies || "",
      template_name: report.template_name || "",
    });
    setReportDialog(true);
  };

  const applyTemplate = (templateName: string) => {
    const content = REPORT_TEMPLATES[templateName];
    if (content) {
      const parts = content.split("\nIMPRESSION:\n");
      const findingsSection = parts[0] || "";
      const impressionSection = parts[1] || "";
      setReportForm(prev => ({
        ...prev, template_name: templateName, findings: findingsSection, impression: impressionSection,
      }));
    }
  };

  const saveReport = async () => {
    if (!reportForm.order_id) return;
    const payload: any = {
      order_id: reportForm.order_id, patient_id: reportForm.patient_id, radiologist_id: reportForm.radiologist_id || null,
      findings: reportForm.findings, impression: reportForm.impression, recommendations: reportForm.recommendations,
      critical_findings: reportForm.critical_findings, report_status: reportForm.report_status,
      technique: reportForm.technique, comparison_studies: reportForm.comparison_studies,
      template_name: reportForm.template_name,
    };
    if (reportForm.report_status === "Final") payload.signed_at = new Date().toISOString();
    if (!editingReport) {
      payload.report_number = `RPT-${Date.now().toString(36).toUpperCase()}`;
    }
    const { error } = editingReport
      ? await supabase.from("radiology_reports").update(payload).eq("id", editingReport.id)
      : await supabase.from("radiology_reports").insert(payload);
    if (!error) {
      if (reportForm.report_status === "Final") {
        await supabase.from("radiology_orders").update({ status: "Reported" }).eq("id", reportForm.order_id);
      }
      toast({ title: editingReport ? "Report updated" : "Report created" });
      setReportDialog(false);
      fetchAllData();
    } else {
      toast({ title: "Error saving report", description: error.message, variant: "destructive" });
    }
  };

  // ── QA ────────────────────────────────────────────────────────────────

  const saveQACheck = async () => {
    if (!qaForm.modality_id) return;
    const { error } = await supabase.from("radiology_qa_checks").insert({
      modality_id: qaForm.modality_id, check_type: qaForm.check_type,
      check_date: todayStr, status: qaForm.status, performed_by: qaForm.performed_by,
      notes: qaForm.notes, next_due_date: qaForm.next_due_date || null,
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "QA check saved" }); setQaDialog(false); fetchAllData(); }
  };

  // ── Procedure CRUD ────────────────────────────────────────────────────

  const openNewProc = () => {
    setEditingProc(null);
    setProcForm({ name: "", code: "", modality_id: "", body_part: "", study_type: "", contrast_required: false, estimated_duration: 30, price: 0, cpt_code: "", preparation_instructions: "" });
    setProcDialog(true);
  };

  const openEditProc = (proc: ProcedureRow) => {
    setEditingProc(proc);
    setProcForm({
      name: proc.name, code: proc.code || "", modality_id: proc.modality_id || "",
      body_part: proc.body_part || "", study_type: proc.study_type || "",
      contrast_required: proc.contrast_required || false, estimated_duration: proc.estimated_duration || 30,
      price: proc.price || 0, cpt_code: proc.cpt_code || "", preparation_instructions: proc.preparation_instructions || "",
    });
    setProcDialog(true);
  };

  const saveProc = async () => {
    if (!procForm.name) return;
    const payload = { ...procForm, price: Number(procForm.price), estimated_duration: Number(procForm.estimated_duration) };
    const { error } = editingProc
      ? await supabase.from("radiology_procedures").update(payload).eq("id", editingProc.id)
      : await supabase.from("radiology_procedures").insert(payload);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: editingProc ? "Procedure updated" : "Procedure created" }); setProcDialog(false); fetchAllData(); }
  };

  const deleteProc = async (id: string) => {
    const { error } = await supabase.from("radiology_procedures").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Procedure deleted" }); fetchAllData(); }
  };

  // ── Procedure auto-fill ───────────────────────────────────────────────

  const onProcedureSelect = (procId: string) => {
    const proc = procedures.find(p => p.id === procId);
    if (proc) {
      setOrderForm(prev => ({
        ...prev, procedure_id: procId, modality_id: proc.modality_id || prev.modality_id,
        contrast_required: proc.contrast_required || false, estimated_cost: proc.price || 0,
      }));
    }
  };

  // ══════════════════════════════════════════════════════════════════════
  //  TAB 1 — DASHBOARD
  // ══════════════════════════════════════════════════════════════════════

  const renderDashboard = () => {
    const totalToday = todaysOrders.length;
    const completedToday = todaysOrders.filter(o => o.status === "Completed" || o.status === "Reported").length;
    const pendingCount = pendingReports.length;
    const criticalCount = criticalReports.length;

    // Modality utilization
    const modalityUtilization = modalities.map(m => {
      const appts = todaysAppointments.filter(a => a.modality_id === m.id && a.status !== "Cancelled");
      const maxPpd = m.max_patients_per_day || 20;
      return { name: m.name || m.code, count: appts.length, max: maxPpd, pct: Math.round((appts.length / maxPpd) * 100) };
    });

    // Status pipeline counts
    const pipelineCounts = ORDER_STATUSES.filter(s => s !== "Cancelled").map(s => ({
      status: s, count: todaysOrders.filter(o => o.status === s).length,
    }));

    return (
      <div className="space-y-6">
        {/* Critical findings alert */}
        {criticalCount > 0 && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-4 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <div>
              <p className="font-semibold text-red-800">{criticalCount} Critical Finding{criticalCount > 1 ? "s" : ""} Pending Review</p>
              <p className="text-sm text-red-600">Immediate attention required for flagged radiology reports.</p>
            </div>
          </div>
        )}

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-3 bg-blue-100 rounded-lg"><Camera className="w-6 h-6 text-blue-600" /></div><div><p className="text-sm text-gray-500">Total Today</p><p className="text-2xl font-bold">{totalToday}</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-3 bg-green-100 rounded-lg"><CheckCircle2 className="w-6 h-6 text-green-600" /></div><div><p className="text-sm text-gray-500">Completed</p><p className="text-2xl font-bold">{completedToday}</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-3 bg-yellow-100 rounded-lg"><Clock className="w-6 h-6 text-yellow-600" /></div><div><p className="text-sm text-gray-500">Pending Reports</p><p className="text-2xl font-bold">{pendingCount}</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-3 bg-red-100 rounded-lg"><AlertTriangle className="w-6 h-6 text-red-600" /></div><div><p className="text-sm text-gray-500">Critical Findings</p><p className="text-2xl font-bold">{criticalCount}</p></div></div></CardContent></Card>
        </div>

        {/* Status pipeline */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Status Pipeline</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 flex-wrap">
              {pipelineCounts.map((p, i) => (
                <React.Fragment key={p.status}>
                  <div className="flex flex-col items-center">
                    <Badge className={`${STATUS_COLORS[p.status] || "bg-gray-100 text-gray-800"} text-xs`}>{p.status}</Badge>
                    <span className="text-lg font-bold mt-1">{p.count}</span>
                  </div>
                  {i < pipelineCounts.length - 1 && <ChevronRight className="w-4 h-4 text-gray-400" />}
                </React.Fragment>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Modality utilization */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Modality Utilization</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {modalityUtilization.length === 0 && <EmptyState message="No modalities configured" />}
              {modalityUtilization.map(m => (
                <div key={m.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{m.name}</span>
                    <span className="text-gray-500">{m.count}/{m.max} ({m.pct}%)</span>
                  </div>
                  <Progress value={m.pct} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Today's worklist */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Today's Worklist</CardTitle></CardHeader>
            <CardContent>
              {todaysOrders.length === 0 ? <EmptyState message="No studies scheduled for today" /> : (
                <div className="max-h-80 overflow-y-auto">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Patient</TableHead><TableHead>Study</TableHead><TableHead>Priority</TableHead><TableHead>Status</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {todaysOrders.slice(0, 15).map(o => (
                        <TableRow key={o.id}>
                          <TableCell className="font-medium">{getPatientName(o.patient_id)}</TableCell>
                          <TableCell>{getProcedureName(o.procedure_id)}</TableCell>
                          <TableCell><Badge className={PRIORITY_COLORS[o.priority || "Routine"] + " text-xs"}>{o.priority}</Badge></TableCell>
                          <TableCell><Badge className={STATUS_COLORS[o.status || "Ordered"] + " text-xs"}>{o.status}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════
  //  TAB 2 — ORDER MANAGEMENT
  // ══════════════════════════════════════════════════════════════════════

  const renderOrders = () => {
    let filtered = [...orders];
    if (orderFilterStatus !== "all") filtered = filtered.filter(o => o.status === orderFilterStatus);
    if (orderFilterPriority !== "all") filtered = filtered.filter(o => o.priority === orderFilterPriority);
    if (orderFilterModality !== "all") filtered = filtered.filter(o => o.modality_id === orderFilterModality);
    if (orderSearch) filtered = filtered.filter(o => {
      const pName = getPatientName(o.patient_id).toLowerCase();
      return pName.includes(orderSearch.toLowerCase()) || (o.order_number || "").toLowerCase().includes(orderSearch.toLowerCase());
    });

    const selectedProc = procedures.find(p => p.id === orderForm.procedure_id);
    const selectedPatient = patients.find(p => p.id === orderForm.patient_id);

    return (
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={openNewOrder}><Plus className="w-4 h-4 mr-2" />New Order</Button>
          <div className="relative flex-1 max-w-xs"><Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" /><Input placeholder="Search orders..." className="pl-9" value={orderSearch} onChange={e => setOrderSearch(e.target.value)} /></div>
          <Select value={orderFilterStatus} onValueChange={setOrderFilterStatus}><SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem>{ORDER_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
          <Select value={orderFilterPriority} onValueChange={setOrderFilterPriority}><SelectTrigger className="w-[130px]"><SelectValue placeholder="Priority" /></SelectTrigger><SelectContent><SelectItem value="all">All Priority</SelectItem>{PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select>
          <Select value={orderFilterModality} onValueChange={setOrderFilterModality}><SelectTrigger className="w-[140px]"><SelectValue placeholder="Modality" /></SelectTrigger><SelectContent><SelectItem value="all">All Modality</SelectItem>{modalities.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent></Select>
          <Button variant="outline" onClick={fetchAllData}><RefreshCw className="w-4 h-4" /></Button>
        </div>

        {/* Orders table */}
        {loading ? <LoadingSkeleton /> : filtered.length === 0 ? <EmptyState message="No orders found" /> : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Order #</TableHead><TableHead>Patient</TableHead><TableHead>Procedure</TableHead>
                  <TableHead>Modality</TableHead><TableHead>Priority</TableHead><TableHead>Status</TableHead>
                  <TableHead>Physician</TableHead><TableHead>Cost</TableHead><TableHead>Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filtered.slice(0, 50).map(o => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs">{o.order_number || "—"}</TableCell>
                      <TableCell className="font-medium">{getPatientName(o.patient_id)}</TableCell>
                      <TableCell>{getProcedureName(o.procedure_id)}</TableCell>
                      <TableCell>{getModalityCode(o.modality_id)}</TableCell>
                      <TableCell><Badge className={PRIORITY_COLORS[o.priority || "Routine"] + " text-xs"}>{o.priority}</Badge></TableCell>
                      <TableCell><Badge className={STATUS_COLORS[o.status || "Ordered"] + " text-xs"}>{o.status}</Badge></TableCell>
                      <TableCell className="text-sm">{o.ordering_physician || "—"}</TableCell>
                      <TableCell className="text-sm">{o.estimated_cost ? `₹${o.estimated_cost}` : "—"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEditOrder(o)}><Edit2 className="w-3 h-3" /></Button>
                          {o.status === "Ordered" && <Button variant="ghost" size="sm" onClick={() => openScheduleDialog(o)} title="Schedule"><Calendar className="w-3 h-3" /></Button>}
                          {o.status !== "Cancelled" && o.status !== "Reported" && <Button variant="ghost" size="sm" onClick={() => cancelOrder(o.id)}><XCircle className="w-3 h-3 text-red-500" /></Button>}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Order dialog */}
        <Dialog open={orderDialog} onOpenChange={setOrderDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingOrder ? "Edit Order" : "New Radiology Order"}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              {/* Patient search */}
              <div className="col-span-2">
                <Label>Patient *</Label>
                {orderForm.patient_id ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary">{getPatientName(orderForm.patient_id)}</Badge>
                    <Button variant="ghost" size="sm" onClick={() => setOrderForm(prev => ({ ...prev, patient_id: "" }))}>Change</Button>
                  </div>
                ) : (
                  <div>
                    <Input placeholder="Search patient name..." value={patientSearchTerm} onChange={e => searchPatients(e.target.value)} />
                    {patientSearchResults.length > 0 && (
                      <div className="border rounded mt-1 max-h-40 overflow-y-auto bg-white shadow-sm">
                        {patientSearchResults.map(p => (
                          <div key={p.id} className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm" onClick={() => { setOrderForm(prev => ({ ...prev, patient_id: p.id })); setPatientSearchResults([]); setPatientSearchTerm(""); }}>
                            {p.name} {p.gender ? `(${p.gender})` : ""} {p.age ? `— ${p.age}y` : ""}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Procedure */}
              <div className="col-span-2">
                <Label>Procedure *</Label>
                <Select value={orderForm.procedure_id} onValueChange={onProcedureSelect}>
                  <SelectTrigger><SelectValue placeholder="Select procedure" /></SelectTrigger>
                  <SelectContent>
                    {modalities.map(m => {
                      const mProcs = getProcedureByModality(m.id);
                      if (mProcs.length === 0) return null;
                      return (
                        <React.Fragment key={m.id}>
                          <SelectItem value={`_header_${m.id}`} disabled className="font-bold text-xs text-gray-500 uppercase">{m.name}</SelectItem>
                          {mProcs.map(p => <SelectItem key={p.id} value={p.id}>{p.name} {p.price ? `(₹${p.price})` : ""}</SelectItem>)}
                        </React.Fragment>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div><Label>Ordering Physician</Label><Input value={orderForm.ordering_physician} onChange={e => setOrderForm(prev => ({ ...prev, ordering_physician: e.target.value }))} /></div>
              <div><Label>Department</Label><Input value={orderForm.department} onChange={e => setOrderForm(prev => ({ ...prev, department: e.target.value }))} /></div>
              <div><Label>Priority</Label><Select value={orderForm.priority} onValueChange={v => setOrderForm(prev => ({ ...prev, priority: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Estimated Cost (₹)</Label><Input type="number" value={orderForm.estimated_cost} onChange={e => setOrderForm(prev => ({ ...prev, estimated_cost: Number(e.target.value) }))} /></div>

              <div className="col-span-2"><Label>Clinical Indication</Label><Textarea value={orderForm.clinical_indication} onChange={e => setOrderForm(prev => ({ ...prev, clinical_indication: e.target.value }))} rows={2} /></div>
              <div className="col-span-2"><Label>Clinical History</Label><Textarea value={orderForm.clinical_history} onChange={e => setOrderForm(prev => ({ ...prev, clinical_history: e.target.value }))} rows={2} /></div>

              {/* Warnings */}
              {orderForm.contrast_required && (
                <div className="col-span-2 bg-yellow-50 border border-yellow-300 rounded p-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm text-yellow-800">Contrast required — check allergy history & eGFR/creatinine before proceeding.</span>
                </div>
              )}
              {selectedPatient?.gender === "Female" && (
                <div className="col-span-2">
                  <Label>Pregnancy Status</Label>
                  <Select value={orderForm.pregnancy_status} onValueChange={v => setOrderForm(prev => ({ ...prev, pregnancy_status: v }))}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="Not Pregnant">Not Pregnant</SelectItem><SelectItem value="Pregnant">Pregnant</SelectItem><SelectItem value="Unknown">Unknown</SelectItem></SelectContent></Select>
                  {orderForm.pregnancy_status === "Pregnant" && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Ionizing radiation contraindicated. Consider MRI or USG.</p>
                  )}
                </div>
              )}
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setOrderDialog(false)}>Cancel</Button><Button onClick={saveOrder}><Save className="w-4 h-4 mr-2" />{editingOrder ? "Update" : "Create"} Order</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════
  //  TAB 3 — SCHEDULING & WORKLIST
  // ══════════════════════════════════════════════════════════════════════

  const renderScheduling = () => {
    const unscheduledOrders = orders.filter(o => o.status === "Ordered");
    const dayAppointments = appointments.filter(a => a.appointment_date === scheduleDate);

    // Group appointments by modality
    const modalitySlots: Record<string, AppointmentRow[]> = {};
    modalities.forEach(m => { modalitySlots[m.id] = dayAppointments.filter(a => a.modality_id === m.id).sort((a, b) => (a.appointment_time || "").localeCompare(b.appointment_time || "")); });

    const prepList = selectedOrder ? (getModalityCode(selectedOrder.modality_id)?.toUpperCase().includes("MRI") ? MRI_PREP_CHECKLIST : CT_PREP_CHECKLIST) : CT_PREP_CHECKLIST;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Label>Date:</Label>
          <Input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="w-48" />
          <Button variant="outline" onClick={() => setScheduleDate(todayStr)}>Today</Button>
          <Button variant="outline" onClick={fetchAllData}><RefreshCw className="w-4 h-4" /></Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Unscheduled orders */}
          <Card>
            <CardHeader><CardTitle className="text-base">Unscheduled Orders ({unscheduledOrders.length})</CardTitle></CardHeader>
            <CardContent className="max-h-[500px] overflow-y-auto space-y-2">
              {unscheduledOrders.length === 0 ? <EmptyState message="All orders are scheduled" /> :
                unscheduledOrders.map(o => (
                  <div key={o.id} className="border rounded p-3 hover:bg-blue-50 cursor-pointer" onClick={() => openScheduleDialog(o)}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">{getPatientName(o.patient_id)}</p>
                        <p className="text-xs text-gray-500">{getProcedureName(o.procedure_id)}</p>
                      </div>
                      <Badge className={PRIORITY_COLORS[o.priority || "Routine"] + " text-xs"}>{o.priority}</Badge>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{getModalityCode(o.modality_id)} • {o.ordering_physician || "—"}</p>
                  </div>
                ))
              }
            </CardContent>
          </Card>

          {/* Timeline view */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Schedule — {format(parseISO(scheduleDate), "EEEE, MMMM d, yyyy")}</CardTitle></CardHeader>
              <CardContent>
                {modalities.length === 0 ? <EmptyState message="No modalities configured" /> : (
                  <div className="space-y-4">
                    {modalities.map(m => (
                      <div key={m.id}>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="font-semibold">{m.name} ({m.code})</Badge>
                          <span className="text-xs text-gray-400">{m.location || ""}</span>
                        </div>
                        {(modalitySlots[m.id] || []).length === 0 ? (
                          <p className="text-xs text-gray-400 pl-4 pb-2">No appointments</p>
                        ) : (
                          <div className="space-y-1 pl-4">
                            {(modalitySlots[m.id] || []).map(a => {
                              const order = orders.find(o => o.id === a.order_id);
                              return (
                                <div key={a.id} className="flex items-center gap-3 border rounded px-3 py-2 bg-white">
                                  <span className="text-sm font-mono w-16">{a.appointment_time || "—"}</span>
                                  <span className="font-medium text-sm flex-1">{getPatientName(a.patient_id)}</span>
                                  <span className="text-xs text-gray-500">{order ? getProcedureName(order.procedure_id) : "—"}</span>
                                  <span className="text-xs text-gray-500">{getTechName(a.technologist_id)}</span>
                                  <Badge className={STATUS_COLORS[a.status || "Scheduled"] + " text-xs"}>{a.status}</Badge>
                                  <div className="flex gap-1">
                                    {a.status === "Scheduled" && <Button variant="ghost" size="sm" onClick={() => updateAppointmentStatus(a.id, "Arrived", a.order_id)} title="Mark Arrived"><CheckCircle2 className="w-3 h-3 text-green-600" /></Button>}
                                    {a.status === "Arrived" && <Button variant="ghost" size="sm" onClick={() => updateAppointmentStatus(a.id, "Prep Done", a.order_id)} title="Prep Done"><ClipboardList className="w-3 h-3 text-blue-600" /></Button>}
                                    {a.status === "Prep Done" && <Button variant="ghost" size="sm" onClick={() => updateAppointmentStatus(a.id, "Scanning", a.order_id)} title="Start Scanning"><Radio className="w-3 h-3 text-purple-600" /></Button>}
                                    {a.status === "Scanning" && <Button variant="ghost" size="sm" onClick={() => updateAppointmentStatus(a.id, "Complete", a.order_id)} title="Complete"><CheckCircle2 className="w-3 h-3 text-emerald-600" /></Button>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Schedule dialog */}
        <Dialog open={scheduleDialog} onOpenChange={setScheduleDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Schedule Appointment</DialogTitle></DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded p-3">
                  <p className="font-medium">{getPatientName(selectedOrder.patient_id)}</p>
                  <p className="text-sm text-gray-600">{getProcedureName(selectedOrder.procedure_id)} — {getModalityName(selectedOrder.modality_id)}</p>
                  <Badge className={PRIORITY_COLORS[selectedOrder.priority || "Routine"] + " text-xs mt-1"}>{selectedOrder.priority}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Date</Label><Input type="date" value={scheduleForm.appointment_date} onChange={e => setScheduleForm(prev => ({ ...prev, appointment_date: e.target.value }))} /></div>
                  <div><Label>Time</Label><Input type="time" value={scheduleForm.appointment_time} onChange={e => setScheduleForm(prev => ({ ...prev, appointment_time: e.target.value }))} /></div>
                </div>
                <div><Label>Technologist</Label><Select value={scheduleForm.technologist_id} onValueChange={v => setScheduleForm(prev => ({ ...prev, technologist_id: v }))}><SelectTrigger><SelectValue placeholder="Assign technologist" /></SelectTrigger><SelectContent>{technologists.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select></div>

                {/* Preparation checklist */}
                <div>
                  <Label className="mb-2 block">Patient Preparation Checklist</Label>
                  <div className="space-y-2">
                    {prepList.map(item => (
                      <div key={item.key} className="flex items-center gap-2">
                        <Checkbox checked={prepChecklist[item.key] || false} onCheckedChange={c => setPrepChecklist(prev => ({ ...prev, [item.key]: !!c }))} />
                        <span className="text-sm">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <DialogFooter><Button variant="outline" onClick={() => setScheduleDialog(false)}>Cancel</Button><Button onClick={saveAppointment}><Calendar className="w-4 h-4 mr-2" />Schedule</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════
  //  TAB 4 — REPORTING
  // ══════════════════════════════════════════════════════════════════════

  const renderReporting = () => {
    // Studies awaiting report — STAT first
    const awaitingReport = orders.filter(o => o.status === "Completed").sort((a, b) => {
      const priorityOrder = { STAT: 0, Urgent: 1, Routine: 2 };
      return (priorityOrder[a.priority as keyof typeof priorityOrder] ?? 2) - (priorityOrder[b.priority as keyof typeof priorityOrder] ?? 2);
    });

    const allReportsSorted = [...reports].sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));

    // Print view
    if (printReportId) {
      const rpt = reports.find(r => r.id === printReportId);
      if (!rpt) { setPrintReportId(null); return null; }
      const order = orders.find(o => o.id === rpt.order_id);
      return (
        <div className="space-y-4">
          <Button variant="outline" onClick={() => setPrintReportId(null)}>Back to Reports</Button>
          <div id="print-report" className="bg-white border rounded-lg p-8 max-w-3xl mx-auto print:border-0 print:p-0">
            <div className="text-center border-b pb-4 mb-6">
              <h1 className="text-2xl font-bold text-blue-900">ADAMRIT HOSPITAL</h1>
              <p className="text-sm text-gray-500">Department of Radiology</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm mb-6">
              <div><span className="text-gray-500">Patient:</span> <strong>{getPatientName(rpt.patient_id)}</strong></div>
              <div><span className="text-gray-500">Report #:</span> <strong>{rpt.report_number}</strong></div>
              <div><span className="text-gray-500">Study:</span> {order ? getProcedureName(order.procedure_id) : "—"}</div>
              <div><span className="text-gray-500">Date:</span> {rpt.created_at ? format(parseISO(rpt.created_at), "dd/MM/yyyy HH:mm") : "—"}</div>
              <div><span className="text-gray-500">Radiologist:</span> {getRadiologistName(rpt.radiologist_id)}</div>
              <div><span className="text-gray-500">Status:</span> <Badge className={REPORT_STATUS_COLORS[rpt.report_status || "Draft"]}>{rpt.report_status}</Badge></div>
            </div>
            {rpt.technique && <div className="mb-4"><h3 className="font-semibold text-sm text-gray-700 mb-1">TECHNIQUE</h3><p className="text-sm whitespace-pre-wrap">{rpt.technique}</p></div>}
            {rpt.comparison_studies && <div className="mb-4"><h3 className="font-semibold text-sm text-gray-700 mb-1">COMPARISON</h3><p className="text-sm">{rpt.comparison_studies}</p></div>}
            <div className="mb-4"><h3 className="font-semibold text-sm text-gray-700 mb-1">FINDINGS</h3><p className="text-sm whitespace-pre-wrap">{rpt.findings || "—"}</p></div>
            <div className="mb-4"><h3 className="font-semibold text-sm text-gray-700 mb-1">IMPRESSION</h3><p className="text-sm whitespace-pre-wrap font-medium">{rpt.impression || "—"}</p></div>
            {rpt.recommendations && <div className="mb-4"><h3 className="font-semibold text-sm text-gray-700 mb-1">RECOMMENDATIONS</h3><p className="text-sm whitespace-pre-wrap">{rpt.recommendations}</p></div>}
            {rpt.critical_findings && <div className="bg-red-50 border border-red-300 rounded p-3 mb-4"><p className="text-sm text-red-800 font-semibold flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> CRITICAL FINDING — Immediate clinical correlation required</p></div>}
            {rpt.signed_at && <div className="mt-8 border-t pt-4 text-sm text-gray-600"><p>Electronically signed by: <strong>{getRadiologistName(rpt.radiologist_id)}</strong></p><p>Signed at: {format(parseISO(rpt.signed_at), "dd/MM/yyyy HH:mm")}</p></div>}
          </div>
          <Button onClick={() => window.print()}><Printer className="w-4 h-4 mr-2" />Print Report</Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Worklist */}
          <Card>
            <CardHeader><CardTitle className="text-base">Awaiting Report ({awaitingReport.length})</CardTitle></CardHeader>
            <CardContent className="max-h-[500px] overflow-y-auto space-y-2">
              {awaitingReport.length === 0 ? <EmptyState message="No studies awaiting report" /> :
                awaitingReport.map(o => (
                  <div key={o.id} className="border rounded p-3 hover:bg-blue-50 cursor-pointer" onClick={() => openNewReport(o)}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">{getPatientName(o.patient_id)}</p>
                        <p className="text-xs text-gray-500">{getProcedureName(o.procedure_id)}</p>
                      </div>
                      <Badge className={PRIORITY_COLORS[o.priority || "Routine"] + " text-xs"}>{o.priority}</Badge>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{o.created_at ? format(parseISO(o.created_at), "dd/MM HH:mm") : ""}</p>
                  </div>
                ))
              }
            </CardContent>
          </Card>

          {/* Reports list */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader><CardTitle className="text-base">All Reports</CardTitle></CardHeader>
              <CardContent>
                {allReportsSorted.length === 0 ? <EmptyState message="No reports yet" /> : (
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Report #</TableHead><TableHead>Patient</TableHead><TableHead>Radiologist</TableHead>
                      <TableHead>Status</TableHead><TableHead>Critical</TableHead><TableHead>Date</TableHead><TableHead>Actions</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {allReportsSorted.slice(0, 50).map(r => {
                        const order = orders.find(o => o.id === r.order_id);
                        const tat = r.created_at && order?.created_at ? differenceInMinutes(parseISO(r.created_at), parseISO(order.created_at)) : null;
                        return (
                          <TableRow key={r.id}>
                            <TableCell className="font-mono text-xs">{r.report_number || "—"}</TableCell>
                            <TableCell className="font-medium">{getPatientName(r.patient_id)}</TableCell>
                            <TableCell className="text-sm">{getRadiologistName(r.radiologist_id)}</TableCell>
                            <TableCell><Badge className={REPORT_STATUS_COLORS[r.report_status || "Draft"] + " text-xs"}>{r.report_status}</Badge></TableCell>
                            <TableCell>{r.critical_findings ? <AlertTriangle className="w-4 h-4 text-red-500" /> : "—"}</TableCell>
                            <TableCell className="text-xs text-gray-500">{r.created_at ? format(parseISO(r.created_at), "dd/MM HH:mm") : "—"}{tat !== null && <span className="block text-gray-400">TAT: {tat}min</span>}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm" onClick={() => openEditReport(r)}><Edit2 className="w-3 h-3" /></Button>
                                <Button variant="ghost" size="sm" onClick={() => setPrintReportId(r.id)}><Printer className="w-3 h-3" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Report dialog */}
        <Dialog open={reportDialog} onOpenChange={setReportDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingReport ? "Edit Report" : "New Radiology Report"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              {/* Clinical info auto-filled */}
              {reportForm.order_id && (() => {
                const order = orders.find(o => o.id === reportForm.order_id);
                return order ? (
                  <div className="bg-gray-50 rounded p-3 text-sm">
                    <p><strong>Patient:</strong> {getPatientName(order.patient_id)}</p>
                    <p><strong>Study:</strong> {getProcedureName(order.procedure_id)} — {getModalityName(order.modality_id)}</p>
                    {order.clinical_indication && <p><strong>Clinical Indication:</strong> {order.clinical_indication}</p>}
                    {order.clinical_history && <p><strong>Clinical History:</strong> {order.clinical_history}</p>}
                  </div>
                ) : null;
              })()}

              <div className="grid grid-cols-2 gap-3">
                <div><Label>Radiologist</Label><Select value={reportForm.radiologist_id} onValueChange={v => setReportForm(prev => ({ ...prev, radiologist_id: v }))}><SelectTrigger><SelectValue placeholder="Assign radiologist" /></SelectTrigger><SelectContent>{radiologists.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Report Template</Label><Select value={reportForm.template_name} onValueChange={v => { setReportForm(prev => ({ ...prev, template_name: v })); applyTemplate(v); }}><SelectTrigger><SelectValue placeholder="Select template" /></SelectTrigger><SelectContent>{Object.keys(REPORT_TEMPLATES).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
              </div>

              <div><Label>Comparison Studies</Label><Input value={reportForm.comparison_studies} onChange={e => setReportForm(prev => ({ ...prev, comparison_studies: e.target.value }))} placeholder="Prior studies for comparison" /></div>
              <div><Label>Technique</Label><Textarea value={reportForm.technique} onChange={e => setReportForm(prev => ({ ...prev, technique: e.target.value }))} rows={2} placeholder="Protocol / technique used" /></div>
              <div><Label>Findings</Label><Textarea value={reportForm.findings} onChange={e => setReportForm(prev => ({ ...prev, findings: e.target.value }))} rows={8} placeholder="Describe findings by body part / system..." /></div>
              <div><Label>Impression</Label><Textarea value={reportForm.impression} onChange={e => setReportForm(prev => ({ ...prev, impression: e.target.value }))} rows={3} placeholder="Summary impression" /></div>
              <div><Label>Recommendations</Label><Textarea value={reportForm.recommendations} onChange={e => setReportForm(prev => ({ ...prev, recommendations: e.target.value }))} rows={2} placeholder="Follow-up recommendations" /></div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox checked={reportForm.critical_findings} onCheckedChange={c => setReportForm(prev => ({ ...prev, critical_findings: !!c }))} />
                  <Label className="text-red-600 font-semibold">Critical Finding</Label>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={reportForm.report_status} onValueChange={v => setReportForm(prev => ({ ...prev, report_status: v }))}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent>{REPORT_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
                </div>
              </div>

              {reportForm.critical_findings && (
                <div className="bg-red-50 border border-red-300 rounded p-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span className="text-sm text-red-800">Critical finding flagged — alert notification will be triggered on save.</span>
                </div>
              )}
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setReportDialog(false)}>Cancel</Button><Button onClick={saveReport}><Save className="w-4 h-4 mr-2" />Save Report</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════
  //  TAB 5 — RADIATION DOSE MONITORING
  // ══════════════════════════════════════════════════════════════════════

  const renderDoseMonitoring = () => {
    // Filter by patient
    const filteredDoses = dosePatientId ? doseRecords.filter(d => d.patient_id === dosePatientId) : doseRecords;

    // Monthly summary
    const monthStart = startOfMonth(new Date());
    const monthEnd = endOfMonth(new Date());
    const monthDoses = doseRecords.filter(d => d.created_at && parseISO(d.created_at) >= monthStart && parseISO(d.created_at) <= monthEnd);
    const exceedsDrlCount = monthDoses.filter(d => d.exceeds_drl).length;
    const totalEffective = monthDoses.reduce((sum, d) => sum + (d.effective_dose || 0), 0);

    // Dose trends for selected patient
    const patientDoseTrend = filteredDoses.slice().reverse().map(d => ({
      date: d.created_at ? format(parseISO(d.created_at), "MM/dd") : "—",
      dlp: d.dose_length_product || 0,
      ctdi: d.ct_dose_index || 0,
      effective: d.effective_dose || 0,
    }));

    return (
      <div className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-3 bg-blue-100 rounded-lg"><Zap className="w-6 h-6 text-blue-600" /></div><div><p className="text-sm text-gray-500">Monthly Studies</p><p className="text-2xl font-bold">{monthDoses.length}</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-3 bg-yellow-100 rounded-lg"><ThermometerSun className="w-6 h-6 text-yellow-600" /></div><div><p className="text-sm text-gray-500">Total Effective Dose</p><p className="text-2xl font-bold">{totalEffective.toFixed(1)} mSv</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-3 bg-red-100 rounded-lg"><AlertTriangle className="w-6 h-6 text-red-600" /></div><div><p className="text-sm text-gray-500">Exceeds DRL</p><p className="text-2xl font-bold">{exceedsDrlCount}</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-3 bg-green-100 rounded-lg"><Shield className="w-6 h-6 text-green-600" /></div><div><p className="text-sm text-gray-500">ALARA Compliance</p><p className="text-2xl font-bold">{monthDoses.length > 0 ? Math.round(((monthDoses.length - exceedsDrlCount) / monthDoses.length) * 100) : 100}%</p></div></div></CardContent></Card>
        </div>

        {/* Patient search */}
        <Card>
          <CardHeader><CardTitle className="text-base">Patient Cumulative Dose Tracker</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1 max-w-xs">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <Input placeholder="Search patient for dose history..." className="pl-9" value={dosePatientSearch} onChange={e => { setDosePatientSearch(e.target.value); searchPatients(e.target.value); }} />
              </div>
              {dosePatientId && <Badge variant="secondary">{getPatientName(dosePatientId)} <Button variant="ghost" size="sm" className="h-4 w-4 p-0 ml-1" onClick={() => { setDosePatientId(""); setDosePatientSearch(""); }}><XCircle className="w-3 h-3" /></Button></Badge>}
            </div>
            {dosePatientSearch && !dosePatientId && patientSearchResults.length > 0 && (
              <div className="border rounded mb-4 max-h-40 overflow-y-auto bg-white shadow-sm">
                {patientSearchResults.map(p => (
                  <div key={p.id} className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm" onClick={() => { setDosePatientId(p.id); setDosePatientSearch(p.name || ""); setPatientSearchResults([]); }}>
                    {p.name} {p.gender ? `(${p.gender})` : ""} {p.age ? `— ${p.age}y` : ""}
                    {p.age && p.age < 18 && <Badge className="ml-2 bg-orange-100 text-orange-800 text-xs">Pediatric</Badge>}
                  </div>
                ))}
              </div>
            )}

            {/* Dose trend chart */}
            {patientDoseTrend.length > 1 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Dose Trend</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={patientDoseTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={11} />
                    <YAxis fontSize={11} />
                    <RechartsTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="dlp" stroke="#3b82f6" name="DLP (mGy·cm)" strokeWidth={2} />
                    <Line type="monotone" dataKey="effective" stroke="#ef4444" name="Effective Dose (mSv)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dose records table */}
        <Card>
          <CardHeader><CardTitle className="text-base">Dose Records {dosePatientId ? `— ${getPatientName(dosePatientId)}` : ""}</CardTitle></CardHeader>
          <CardContent>
            {filteredDoses.length === 0 ? <EmptyState message="No dose records found" /> : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Patient</TableHead><TableHead>Modality</TableHead><TableHead>DLP (mGy·cm)</TableHead>
                  <TableHead>CTDIvol (mGy)</TableHead><TableHead>Effective (mSv)</TableHead><TableHead>kVp</TableHead>
                  <TableHead>mAs</TableHead><TableHead>Exceeds DRL</TableHead><TableHead>Date</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filteredDoses.slice(0, 50).map(d => (
                    <TableRow key={d.id} className={d.exceeds_drl ? "bg-red-50" : ""}>
                      <TableCell className="font-medium">{getPatientName(d.patient_id)}</TableCell>
                      <TableCell>{d.modality_type || "—"}</TableCell>
                      <TableCell>{d.dose_length_product?.toFixed(1) || "—"}</TableCell>
                      <TableCell>{d.ct_dose_index?.toFixed(2) || "—"}</TableCell>
                      <TableCell>{d.effective_dose?.toFixed(2) || "—"}</TableCell>
                      <TableCell>{d.kvp || "—"}</TableCell>
                      <TableCell>{d.mas || "—"}</TableCell>
                      <TableCell>{d.exceeds_drl ? <Badge className="bg-red-100 text-red-800 text-xs">YES</Badge> : <Badge className="bg-green-100 text-green-800 text-xs">No</Badge>}</TableCell>
                      <TableCell className="text-xs">{d.created_at ? format(parseISO(d.created_at), "dd/MM/yyyy") : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════
  //  TAB 6 — EQUIPMENT & QA
  // ══════════════════════════════════════════════════════════════════════

  const renderEquipmentQA = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button onClick={() => { setQaForm({ modality_id: "", check_type: "daily", status: "Pass", performed_by: "", notes: "", next_due_date: "" }); setQaDialog(true); }}><Plus className="w-4 h-4 mr-2" />Log QA Check</Button>
          <Button variant="outline" onClick={fetchAllData}><RefreshCw className="w-4 h-4" /></Button>
        </div>

        {/* Modality cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modalities.length === 0 ? <EmptyState message="No modalities configured" /> :
            modalities.map(m => {
              const latestQA = qaChecks.find(q => q.modality_id === m.id);
              const isCalDue = m.next_calibration_date && parseISO(m.next_calibration_date) <= new Date();
              return (
                <Card key={m.id} className={isCalDue ? "border-red-300" : ""}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base">{m.name}</CardTitle>
                      <Badge className={m.status === "Active" ? "bg-green-100 text-green-800" : m.status === "Under Maintenance" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"} >{m.status || "Active"}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <p><span className="text-gray-500">Code:</span> {m.code}</p>
                    <p><span className="text-gray-500">Manufacturer:</span> {m.manufacturer || "—"}</p>
                    <p><span className="text-gray-500">Model:</span> {m.model || "—"}</p>
                    <p><span className="text-gray-500">Location:</span> {m.location || "—"}</p>
                    <p><span className="text-gray-500">Installation:</span> {m.installation_date ? format(parseISO(m.installation_date), "dd/MM/yyyy") : "—"}</p>
                    <p><span className="text-gray-500">Last Calibration:</span> {m.calibration_date ? format(parseISO(m.calibration_date), "dd/MM/yyyy") : "—"}</p>
                    <p className={isCalDue ? "text-red-600 font-semibold" : ""}>
                      <span className="text-gray-500">Next Calibration:</span> {m.next_calibration_date ? format(parseISO(m.next_calibration_date), "dd/MM/yyyy") : "—"}
                      {isCalDue && <span className="ml-2 text-xs">(OVERDUE)</span>}
                    </p>
                    <p><span className="text-gray-500">Max Patients/Day:</span> {m.max_patients_per_day || "—"}</p>
                    {latestQA && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs text-gray-400">Last QA: {latestQA.check_date ? format(parseISO(latestQA.check_date), "dd/MM/yyyy") : "—"} — <Badge className={latestQA.status === "Pass" ? "bg-green-100 text-green-800 text-xs" : "bg-red-100 text-red-800 text-xs"}>{latestQA.status}</Badge></p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          }
        </div>

        {/* QA checks log */}
        <Card>
          <CardHeader><CardTitle className="text-base">QA Check History</CardTitle></CardHeader>
          <CardContent>
            {qaChecks.length === 0 ? <EmptyState message="No QA checks recorded" /> : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Modality</TableHead><TableHead>Type</TableHead><TableHead>Date</TableHead>
                  <TableHead>Status</TableHead><TableHead>Performed By</TableHead><TableHead>Notes</TableHead><TableHead>Next Due</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {qaChecks.slice(0, 30).map(q => (
                    <TableRow key={q.id}>
                      <TableCell>{getModalityName(q.modality_id)}</TableCell>
                      <TableCell className="capitalize">{q.check_type}</TableCell>
                      <TableCell className="text-sm">{q.check_date ? format(parseISO(q.check_date), "dd/MM/yyyy") : "—"}</TableCell>
                      <TableCell><Badge className={q.status === "Pass" ? "bg-green-100 text-green-800 text-xs" : "bg-red-100 text-red-800 text-xs"}>{q.status}</Badge></TableCell>
                      <TableCell className="text-sm">{q.performed_by || "—"}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{q.notes || "—"}</TableCell>
                      <TableCell className="text-sm">{q.next_due_date ? format(parseISO(q.next_due_date), "dd/MM/yyyy") : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* QA dialog */}
        <Dialog open={qaDialog} onOpenChange={setQaDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>Log QA Check</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Modality *</Label><Select value={qaForm.modality_id} onValueChange={v => setQaForm(prev => ({ ...prev, modality_id: v }))}><SelectTrigger><SelectValue placeholder="Select modality" /></SelectTrigger><SelectContent>{modalities.map(m => <SelectItem key={m.id} value={m.id}>{m.name} ({m.code})</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Check Type</Label><Select value={qaForm.check_type} onValueChange={v => setQaForm(prev => ({ ...prev, check_type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="daily">Daily</SelectItem><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="quarterly">Quarterly</SelectItem><SelectItem value="annual">Annual</SelectItem></SelectContent></Select></div>
              <div><Label>Status</Label><Select value={qaForm.status} onValueChange={v => setQaForm(prev => ({ ...prev, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Pass">Pass</SelectItem><SelectItem value="Fail">Fail</SelectItem><SelectItem value="Conditional">Conditional</SelectItem></SelectContent></Select></div>
              <div><Label>Performed By</Label><Input value={qaForm.performed_by} onChange={e => setQaForm(prev => ({ ...prev, performed_by: e.target.value }))} /></div>
              <div><Label>Notes</Label><Textarea value={qaForm.notes} onChange={e => setQaForm(prev => ({ ...prev, notes: e.target.value }))} rows={3} /></div>
              <div><Label>Next Due Date</Label><Input type="date" value={qaForm.next_due_date} onChange={e => setQaForm(prev => ({ ...prev, next_due_date: e.target.value }))} /></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setQaDialog(false)}>Cancel</Button><Button onClick={saveQACheck}><Save className="w-4 h-4 mr-2" />Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════
  //  TAB 7 — ANALYTICS & REPORTS
  // ══════════════════════════════════════════════════════════════════════

  const renderAnalytics = () => {
    // Studies per day (last 30 days)
    const last30 = Array.from({ length: 30 }, (_, i) => {
      const d = subDays(new Date(), 29 - i);
      const ds = format(d, "yyyy-MM-dd");
      const dayLabel = format(d, "MM/dd");
      const count = orders.filter(o => o.created_at && o.created_at.startsWith(ds)).length;
      return { date: dayLabel, count };
    });

    // Modality distribution
    const modalityDist = modalities.map(m => ({
      name: m.name || m.code,
      value: orders.filter(o => o.modality_id === m.id).length,
    })).filter(d => d.value > 0);

    // Body part distribution
    const bodyParts: Record<string, number> = {};
    orders.forEach(o => {
      const proc = procedures.find(p => p.id === o.procedure_id);
      const bp = proc?.body_part || "Other";
      bodyParts[bp] = (bodyParts[bp] || 0) + 1;
    });
    const bodyPartData = Object.entries(bodyParts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);

    // Revenue by procedure
    const revByProc: Record<string, number> = {};
    orders.filter(o => o.status !== "Cancelled").forEach(o => {
      const pName = getProcedureName(o.procedure_id);
      revByProc[pName] = (revByProc[pName] || 0) + (o.estimated_cost || 0);
    });
    const revenueData = Object.entries(revByProc).map(([name, value]) => ({ name: name.length > 20 ? name.slice(0, 20) + "..." : name, value })).sort((a, b) => b.value - a.value).slice(0, 10);

    // Avg TAT (order to report, in minutes)
    const tats: number[] = [];
    reports.filter(r => r.report_status === "Final").forEach(r => {
      const order = orders.find(o => o.id === r.order_id);
      if (order?.created_at && r.created_at) {
        tats.push(differenceInMinutes(parseISO(r.created_at), parseISO(order.created_at)));
      }
    });
    const avgTAT = tats.length > 0 ? Math.round(tats.reduce((a, b) => a + b, 0) / tats.length) : 0;

    // TAT by radiologist
    const tatByRad: Record<string, number[]> = {};
    reports.filter(r => r.report_status === "Final" && r.radiologist_id).forEach(r => {
      const order = orders.find(o => o.id === r.order_id);
      if (order?.created_at && r.created_at) {
        const name = getRadiologistName(r.radiologist_id);
        if (!tatByRad[name]) tatByRad[name] = [];
        tatByRad[name].push(differenceInMinutes(parseISO(r.created_at), parseISO(order.created_at)));
      }
    });
    const tatByRadData = Object.entries(tatByRad).map(([name, vals]) => ({
      name, avgTAT: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
    }));

    // Referring physician analysis
    const refPhys: Record<string, number> = {};
    orders.forEach(o => { const ph = o.ordering_physician || "Unknown"; refPhys[ph] = (refPhys[ph] || 0) + 1; });
    const refPhysData = Object.entries(refPhys).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);

    // Critical findings rate
    const totalReports = reports.length;
    const criticalRate = totalReports > 0 ? ((criticalReports.length / totalReports) * 100).toFixed(1) : "0";

    // Cancellation rate
    const cancelledOrders = orders.filter(o => o.status === "Cancelled").length;
    const cancelRate = orders.length > 0 ? ((cancelledOrders / orders.length) * 100).toFixed(1) : "0";

    return (
      <div className="space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-6"><p className="text-sm text-gray-500">Total Orders</p><p className="text-2xl font-bold">{orders.length}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-gray-500">Avg Report TAT</p><p className="text-2xl font-bold">{avgTAT} min</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-gray-500">Critical Finding Rate</p><p className="text-2xl font-bold">{criticalRate}%</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-gray-500">Cancellation Rate</p><p className="text-2xl font-bold">{cancelRate}%</p></CardContent></Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Studies per day */}
          <Card>
            <CardHeader><CardTitle className="text-base">Studies Per Day (Last 30 Days)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={last30}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" fontSize={10} angle={-45} textAnchor="end" height={50} /><YAxis fontSize={11} /><RechartsTooltip /><Bar dataKey="count" fill="#3b82f6" name="Studies" radius={[2, 2, 0, 0]} /></BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Modality distribution */}
          <Card>
            <CardHeader><CardTitle className="text-base">Modality Distribution</CardTitle></CardHeader>
            <CardContent>
              {modalityDist.length === 0 ? <EmptyState message="No data" /> : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={modalityDist} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {modalityDist.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Body part distribution */}
          <Card>
            <CardHeader><CardTitle className="text-base">Body Part Distribution</CardTitle></CardHeader>
            <CardContent>
              {bodyPartData.length === 0 ? <EmptyState message="No data" /> : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={bodyPartData} layout="vertical"><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" fontSize={11} /><YAxis type="category" dataKey="name" fontSize={11} width={100} /><RechartsTooltip /><Bar dataKey="value" fill="#10b981" name="Studies" radius={[0, 2, 2, 0]} /></BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Revenue by procedure */}
          <Card>
            <CardHeader><CardTitle className="text-base">Revenue by Procedure (₹)</CardTitle></CardHeader>
            <CardContent>
              {revenueData.length === 0 ? <EmptyState message="No revenue data" /> : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={revenueData} layout="vertical"><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" fontSize={11} /><YAxis type="category" dataKey="name" fontSize={10} width={120} /><RechartsTooltip formatter={(v: number) => `₹${v.toLocaleString()}`} /><Bar dataKey="value" fill="#f59e0b" name="Revenue" radius={[0, 2, 2, 0]} /></BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* TAT by radiologist */}
          <Card>
            <CardHeader><CardTitle className="text-base">Report TAT by Radiologist (min)</CardTitle></CardHeader>
            <CardContent>
              {tatByRadData.length === 0 ? <EmptyState message="No data" /> : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={tatByRadData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={11} /><YAxis fontSize={11} /><RechartsTooltip /><Bar dataKey="avgTAT" fill="#8b5cf6" name="Avg TAT (min)" radius={[2, 2, 0, 0]} /></BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Referring physicians */}
          <Card>
            <CardHeader><CardTitle className="text-base">Top Referring Physicians</CardTitle></CardHeader>
            <CardContent>
              {refPhysData.length === 0 ? <EmptyState message="No data" /> : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={refPhysData} layout="vertical"><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" fontSize={11} /><YAxis type="category" dataKey="name" fontSize={11} width={120} /><RechartsTooltip /><Bar dataKey="value" fill="#ec4899" name="Orders" radius={[0, 2, 2, 0]} /></BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════
  //  TAB 8 — PROCEDURE & PROTOCOL MASTER
  // ══════════════════════════════════════════════════════════════════════

  const renderProcedureMaster = () => {
    const groupedByModality: Record<string, ProcedureRow[]> = {};
    modalities.forEach(m => {
      const procs = procedures.filter(p => p.modality_id === m.id);
      if (procs.length > 0) groupedByModality[m.name || m.code] = procs;
    });
    const ungrouped = procedures.filter(p => !p.modality_id || !modalities.find(m => m.id === p.modality_id));
    if (ungrouped.length > 0) groupedByModality["Unassigned"] = ungrouped;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button onClick={openNewProc}><Plus className="w-4 h-4 mr-2" />Add Procedure</Button>
          <Button variant="outline" onClick={fetchAllData}><RefreshCw className="w-4 h-4" /></Button>
        </div>

        {Object.keys(groupedByModality).length === 0 ? <EmptyState message="No procedures configured" /> :
          Object.entries(groupedByModality).map(([modalityName, procs]) => (
            <Card key={modalityName}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2"><Camera className="w-4 h-4" />{modalityName} ({procs.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Name</TableHead><TableHead>Code</TableHead><TableHead>Body Part</TableHead>
                    <TableHead>Contrast</TableHead><TableHead>Duration</TableHead><TableHead>Price (₹)</TableHead>
                    <TableHead>CPT</TableHead><TableHead>Actions</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {procs.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell className="font-mono text-xs">{p.code || "—"}</TableCell>
                        <TableCell>{p.body_part || "—"}</TableCell>
                        <TableCell>{p.contrast_required ? <Badge className="bg-yellow-100 text-yellow-800 text-xs">Yes</Badge> : "No"}</TableCell>
                        <TableCell>{p.estimated_duration ? `${p.estimated_duration} min` : "—"}</TableCell>
                        <TableCell>{p.price ? `₹${p.price}` : "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{p.cpt_code || "—"}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEditProc(p)}><Edit2 className="w-3 h-3" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => deleteProc(p.id)}><Trash2 className="w-3 h-3 text-red-500" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))
        }

        {/* Procedure dialog */}
        <Dialog open={procDialog} onOpenChange={setProcDialog}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingProc ? "Edit Procedure" : "Add Procedure"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name *</Label><Input value={procForm.name} onChange={e => setProcForm(prev => ({ ...prev, name: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Code</Label><Input value={procForm.code} onChange={e => setProcForm(prev => ({ ...prev, code: e.target.value }))} /></div>
                <div><Label>CPT Code</Label><Input value={procForm.cpt_code} onChange={e => setProcForm(prev => ({ ...prev, cpt_code: e.target.value }))} /></div>
              </div>
              <div><Label>Modality</Label><Select value={procForm.modality_id} onValueChange={v => setProcForm(prev => ({ ...prev, modality_id: v }))}><SelectTrigger><SelectValue placeholder="Select modality" /></SelectTrigger><SelectContent>{modalities.map(m => <SelectItem key={m.id} value={m.id}>{m.name} ({m.code})</SelectItem>)}</SelectContent></Select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Body Part</Label><Input value={procForm.body_part} onChange={e => setProcForm(prev => ({ ...prev, body_part: e.target.value }))} /></div>
                <div><Label>Study Type</Label><Input value={procForm.study_type} onChange={e => setProcForm(prev => ({ ...prev, study_type: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Duration (min)</Label><Input type="number" value={procForm.estimated_duration} onChange={e => setProcForm(prev => ({ ...prev, estimated_duration: Number(e.target.value) }))} /></div>
                <div><Label>Price (₹)</Label><Input type="number" value={procForm.price} onChange={e => setProcForm(prev => ({ ...prev, price: Number(e.target.value) }))} /></div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={procForm.contrast_required} onCheckedChange={c => setProcForm(prev => ({ ...prev, contrast_required: !!c }))} />
                <Label>Contrast Required</Label>
              </div>
              <div><Label>Preparation Instructions</Label><Textarea value={procForm.preparation_instructions} onChange={e => setProcForm(prev => ({ ...prev, preparation_instructions: e.target.value }))} rows={3} placeholder="Patient preparation instructions..." /></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setProcDialog(false)}>Cancel</Button><Button onClick={saveProc}><Save className="w-4 h-4 mr-2" />{editingProc ? "Update" : "Create"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════
  //  MAIN RENDER
  // ══════════════════════════════════════════════════════════════════════

  if (loading && orders.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><Camera className="w-6 h-6 text-blue-600" /> CT / MRI Radiology</h1>
        <LoadingSkeleton rows={8} />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Camera className="w-6 h-6 text-blue-600" /> CT / MRI Radiology</h1>
        <Button variant="outline" onClick={fetchAllData}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
      </div>

      <Tabs value={activeTab} onValueChange={v => setSearchParams({ tab: v })}>
        <TabsList className="flex flex-wrap h-auto gap-1 mb-6">
          <TabsTrigger value="dashboard"><BarChart3 className="w-4 h-4 mr-1" />Dashboard</TabsTrigger>
          <TabsTrigger value="orders"><ClipboardList className="w-4 h-4 mr-1" />Orders</TabsTrigger>
          <TabsTrigger value="scheduling"><Calendar className="w-4 h-4 mr-1" />Scheduling</TabsTrigger>
          <TabsTrigger value="reporting"><FileText className="w-4 h-4 mr-1" />Reporting</TabsTrigger>
          <TabsTrigger value="dose"><Zap className="w-4 h-4 mr-1" />Radiation Dose</TabsTrigger>
          <TabsTrigger value="equipment"><Wrench className="w-4 h-4 mr-1" />Equipment & QA</TabsTrigger>
          <TabsTrigger value="analytics"><TrendingUp className="w-4 h-4 mr-1" />Analytics</TabsTrigger>
          <TabsTrigger value="procedures"><Stethoscope className="w-4 h-4 mr-1" />Procedures</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">{renderDashboard()}</TabsContent>
        <TabsContent value="orders">{renderOrders()}</TabsContent>
        <TabsContent value="scheduling">{renderScheduling()}</TabsContent>
        <TabsContent value="reporting">{renderReporting()}</TabsContent>
        <TabsContent value="dose">{renderDoseMonitoring()}</TabsContent>
        <TabsContent value="equipment">{renderEquipmentQA()}</TabsContent>
        <TabsContent value="analytics">{renderAnalytics()}</TabsContent>
        <TabsContent value="procedures">{renderProcedureMaster()}</TabsContent>
      </Tabs>
    </div>
  );
};

export default CTMRIModule;
