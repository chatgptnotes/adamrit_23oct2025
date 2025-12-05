// Hook for managing radiology data operations
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  RadiologyOrder, 
  RadiologyAppointment, 
  RadiologyReport, 
  DicomStudy,
  RadiologyModality,
  RadiologyProcedure,
  Radiologist,
  RadiologyTechnologist,
  RadiologyQACheck,
  RadiationDoseTracking,
  Priority,
  OrderStatus,
  AppointmentStatus,
  ReportStatus
} from '@/types/radiology';

interface UseRadiologyDataReturn {
  // Orders
  orders: RadiologyOrder[];
  createOrder: (order: Partial<RadiologyOrder>) => Promise<void>;
  updateOrder: (id: string, updates: Partial<RadiologyOrder>) => Promise<void>;
  getOrdersByStatus: (status: string) => RadiologyOrder[];
  
  // Appointments
  appointments: RadiologyAppointment[];
  scheduleAppointment: (appointment: Partial<RadiologyAppointment>) => Promise<void>;
  updateAppointment: (id: string, updates: Partial<RadiologyAppointment>) => Promise<void>;
  
  // Reports
  reports: RadiologyReport[];
  createReport: (report: Partial<RadiologyReport>) => Promise<void>;
  updateReport: (id: string, updates: Partial<RadiologyReport>) => Promise<void>;
  getReportsByStatus: (status: string) => RadiologyReport[];
  
  // Studies
  studies: DicomStudy[];
  createStudy: (study: Partial<DicomStudy>) => Promise<void>;
  
  // Modalities
  modalities: RadiologyModality[];
  procedures: RadiologyProcedure[];
  
  // Staff
  radiologists: Radiologist[];
  technologists: RadiologyTechnologist[];
  
  // QA & Safety
  qaChecks: RadiologyQACheck[];
  doseTracking: RadiationDoseTracking[];
  addDoseRecord: (dose: Partial<RadiationDoseTracking>) => Promise<void>;
  
  // Loading states
  loading: boolean;
  error: string | null;
  
  // Refresh data
  refreshData: () => Promise<void>;
}

export const useRadiologyData = (): UseRadiologyDataReturn => {
  const [orders, setOrders] = useState<RadiologyOrder[]>([]);
  const [appointments, setAppointments] = useState<RadiologyAppointment[]>([]);
  const [reports, setReports] = useState<RadiologyReport[]>([]);
  const [studies, setStudies] = useState<DicomStudy[]>([]);
  const [modalities, setModalities] = useState<RadiologyModality[]>([]);
  const [procedures, setProcedures] = useState<RadiologyProcedure[]>([]);
  const [radiologists, setRadiologists] = useState<Radiologist[]>([]);
  const [technologists, setTechnologists] = useState<RadiologyTechnologist[]>([]);
  const [qaChecks, setQaChecks] = useState<RadiologyQACheck[]>([]);
  const [doseTracking, setDoseTracking] = useState<RadiationDoseTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to fetch all radiology data in parallel with proper error handling
      const [
        ordersResult,
        appointmentsResult,
        reportsResult,
        studiesResult,
        modalitiesResult,
        proceduresResult,
        radiologistsResult,
        technologistsResult,
        qaChecksResult,
        doseTrackingResult
      ] = await Promise.allSettled([
        supabase.from('radiology_orders').select('*').order('created_at', { ascending: false }),
        supabase.from('radiology_appointments').select('*').order('appointment_date', { ascending: false }),
        supabase.from('radiology_reports').select('*').order('created_at', { ascending: false }),
        supabase.from('dicom_studies').select('*').order('study_date', { ascending: false }),
        supabase.from('radiology_modalities').select('*').order('name'),
        supabase.from('radiology_procedures').select('*').order('name'),
        supabase.from('radiologists').select('*').order('last_name'),
        supabase.from('radiology_technologists').select('*').order('last_name'),
        supabase.from('radiology_qa_checks').select('*').order('test_date', { ascending: false }),
        supabase.from('radiation_dose_tracking').select('*').order('recorded_at', { ascending: false })
      ]);

      // Set data (use empty arrays if tables don't exist or queries fail)
      setOrders(ordersResult.status === 'fulfilled' && ordersResult.value.data ? 
        ordersResult.value.data.map(item => ({
          ...item,
          priority: item.priority as Priority,
          status: item.status as OrderStatus
        })) as RadiologyOrder[] : []);
        
      setAppointments(appointmentsResult.status === 'fulfilled' && appointmentsResult.value.data ? 
        appointmentsResult.value.data.map(item => ({
          ...item,
          status: item.status as AppointmentStatus
        })) as RadiologyAppointment[] : []);
        
      setReports(reportsResult.status === 'fulfilled' && reportsResult.value.data ? 
        reportsResult.value.data.map(item => ({
          ...item,
          report_status: item.report_status as ReportStatus,
          priority: item.priority as Priority
        })) as RadiologyReport[] : []);
        
      setStudies(studiesResult.status === 'fulfilled' && studiesResult.value.data ? studiesResult.value.data as DicomStudy[] : []);
      setModalities(modalitiesResult.status === 'fulfilled' && modalitiesResult.value.data ? modalitiesResult.value.data as RadiologyModality[] : []);
      setProcedures(proceduresResult.status === 'fulfilled' && proceduresResult.value.data ? proceduresResult.value.data as RadiologyProcedure[] : []);
      setRadiologists(radiologistsResult.status === 'fulfilled' && radiologistsResult.value.data ? radiologistsResult.value.data as Radiologist[] : []);
      setTechnologists(technologistsResult.status === 'fulfilled' && technologistsResult.value.data ? technologistsResult.value.data as RadiologyTechnologist[] : []);
      setQaChecks(qaChecksResult.status === 'fulfilled' && qaChecksResult.value.data ? 
        qaChecksResult.value.data.map(item => ({
          ...item,
          test_type: (item as any).test_type || 'Unknown'
        })) as RadiologyQACheck[] : []);
      setDoseTracking(doseTrackingResult.status === 'fulfilled' && doseTrackingResult.value.data ? doseTrackingResult.value.data as RadiationDoseTracking[] : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Order operations
  const createOrder = async (orderData: Partial<RadiologyOrder>) => {
    try {
      const orderNumber = `RO${Date.now()}`;
      const { data, error } = await supabase
        .from('radiology_orders')
        .insert({
          ...orderData,
          order_number: orderNumber,
          patient_id: orderData.patient_id || '',
          priority: orderData.priority || 'routine',
          status: orderData.status || 'ordered'
        })
        .select()
        .single();

      if (error) throw error;
      
      setOrders(prev => [data as RadiologyOrder, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order');
      throw err;
    }
  };

  const updateOrder = async (id: string, updates: Partial<RadiologyOrder>) => {
    try {
      const { data, error } = await supabase
        .from('radiology_orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setOrders(prev => prev.map(order => order.id === id ? data as RadiologyOrder : order));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order');
      throw err;
    }
  };

  const getOrdersByStatus = (status: string) => {
    return orders.filter(order => order.status === status);
  };

  // Appointment operations
  const scheduleAppointment = async (appointmentData: Partial<RadiologyAppointment>) => {
    try {
      const appointmentNumber = `RA${Date.now()}`;
      const { data, error } = await supabase
        .from('radiology_appointments')
        .insert({
          ...appointmentData,
          appointment_number: appointmentNumber,
          patient_id: appointmentData.patient_id || '',
          appointment_date: appointmentData.appointment_date || new Date().toISOString().split('T')[0],
          appointment_time: appointmentData.appointment_time || '09:00:00',
          status: appointmentData.status || 'scheduled'
        })
        .select()
        .single();

      if (error) throw error;
      
      setAppointments(prev => [data as RadiologyAppointment, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule appointment');
      throw err;
    }
  };

  const updateAppointment = async (id: string, updates: Partial<RadiologyAppointment>) => {
    try {
      const { data, error } = await supabase
        .from('radiology_appointments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setAppointments(prev => prev.map(apt => apt.id === id ? data as RadiologyAppointment : apt));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update appointment');
      throw err;
    }
  };

  // Report operations
  const createReport = async (reportData: Partial<RadiologyReport>) => {
    try {
      const reportNumber = `RR${Date.now()}`;
      const { data, error } = await supabase
        .from('radiology_reports')
        .insert({
          ...reportData,
          report_number: reportNumber,
          study_id: reportData.study_id || '',
          order_id: reportData.order_id || '',
          patient_id: reportData.patient_id || '',
          findings: reportData.findings || '',
          impression: reportData.impression || '',
          report_status: reportData.report_status || 'pending',
          priority: reportData.priority || 'routine'
        })
        .select()
        .single();

      if (error) throw error;
      
      setReports(prev => [data as RadiologyReport, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create report');
      throw err;
    }
  };

  const updateReport = async (id: string, updates: Partial<RadiologyReport>) => {
    try {
      const { data, error } = await supabase
        .from('radiology_reports')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setReports(prev => prev.map(report => report.id === id ? data as RadiologyReport : report));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update report');
      throw err;
    }
  };

  const getReportsByStatus = (status: string) => {
    return reports.filter(report => report.report_status === status);
  };

  // Study operations
  const createStudy = async (studyData: Partial<DicomStudy>) => {
    try {
      const { data, error } = await supabase
        .from('dicom_studies')
        .insert([{
          ...studyData,
          study_instance_uid: studyData.study_instance_uid || `STUDY${Date.now()}`,
          patient_id: studyData.patient_id || '',
          study_date: studyData.study_date || new Date().toISOString().split('T')[0],
          modality: studyData.modality || 'CT'
        }])
        .select()
        .single();

      if (error) throw error;
      
      setStudies(prev => [data as DicomStudy, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create study');
      throw err;
    }
  };

  // Dose tracking operations
  const addDoseRecord = async (doseData: Partial<RadiationDoseTracking>) => {
    try {
      const { data, error } = await supabase
        .from('radiation_dose_tracking')
        .insert([{
          ...doseData,
          patient_id: doseData.patient_id || '',
          modality: doseData.modality || 'CT'
        }])
        .select()
        .single();

      if (error) throw error;
      
      setDoseTracking(prev => [data as RadiationDoseTracking, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add dose record');
      throw err;
    }
  };

  const refreshData = async () => {
    await fetchAllData();
  };

  return {
    // Data
    orders,
    appointments,
    reports,
    studies,
    modalities,
    procedures,
    radiologists,
    technologists,
    qaChecks,
    doseTracking,
    
    // Operations
    createOrder,
    updateOrder,
    getOrdersByStatus,
    scheduleAppointment,
    updateAppointment,
    createReport,
    updateReport,
    getReportsByStatus,
    createStudy,
    addDoseRecord,
    
    // State
    loading,
    error,
    refreshData
  };
};

// Specialized hooks for specific workflows
export const useRadiologyOrders = () => {
  const { orders, createOrder, updateOrder, getOrdersByStatus, loading, error } = useRadiologyData();
  
  const pendingOrders = getOrdersByStatus('ordered');
  const scheduledOrders = getOrdersByStatus('scheduled');
  const inProgressOrders = getOrdersByStatus('in_progress');
  const completedOrders = getOrdersByStatus('completed');
  
  return {
    orders,
    pendingOrders,
    scheduledOrders,
    inProgressOrders,
    completedOrders,
    createOrder,
    updateOrder,
    loading,
    error
  };
};

export const useRadiologyReports = () => {
  const { reports, createReport, updateReport, getReportsByStatus, loading, error } = useRadiologyData();
  
  const pendingReports = getReportsByStatus('pending');
  const preliminaryReports = getReportsByStatus('preliminary');
  const finalReports = getReportsByStatus('final');
  
  return {
    reports,
    pendingReports,
    preliminaryReports,
    finalReports,
    createReport,
    updateReport,
    loading,
    error
  };
};

export const useRadiologyDashboard = () => {
  const {
    orders,
    appointments,
    reports,
    studies,
    modalities,
    qaChecks,
    doseTracking,
    loading,
    error,
    refreshData
  } = useRadiologyData();

  // Calculate dashboard statistics
  const dashboardStats = {
    todayStudies: studies.filter(study => 
      new Date(study.study_date).toDateString() === new Date().toDateString()
    ).length,
    pendingReports: reports.filter(report => report.report_status === 'pending').length,
    criticalFindings: reports.filter(report => 
      report.critical_findings && report.critical_findings.length > 0
    ).length,
    equipmentUptime: modalities.length > 0 
      ? modalities.reduce((acc, mod) => acc + (mod.is_active ? 1 : 0), 0) / modalities.length * 100
      : 0,
    avgTurnaroundTime: reports.length > 0
      ? reports.reduce((acc, report) => acc + (report.turnaround_time_minutes || 0), 0) / reports.length / 60
      : 0,
    totalRevenue: orders.reduce((acc, order) => acc + (order.estimated_cost || 0), 0),
    drlCompliance: doseTracking.length > 0
      ? doseTracking.filter(dose => !dose.exceeds_drl).length / doseTracking.length * 100
      : 100
  };

  return {
    dashboardStats,
    recentOrders: orders.slice(0, 10),
    recentReports: reports.slice(0, 10),
    todayAppointments: appointments.filter(apt => 
      new Date(apt.appointment_date).toDateString() === new Date().toDateString()
    ),
    activeModalities: modalities.filter(mod => mod.is_active),
    loading,
    error,
    refreshData
  };
};
