import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Calendar, CalendarDays, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

interface MedicationRow {
  id: string;
  name: string;
  unit: string;
  remark: string;
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
}

// Helper function to extract value from JSON or return as-is
const extractValueFromJSON = (data: any): string => {
  // If null/undefined, return 'N/A'
  if (data === null || data === undefined) {
    return 'N/A';
  }

  // If it's already a plain string without JSON, return it
  if (typeof data === 'string' && !data.includes('{') && !data.includes('"value"')) {
    return data.trim();
  }

  // If it's an object, extract the value field
  if (typeof data === 'object' && !Array.isArray(data)) {
    return String(data.value || data.val || 'N/A');
  }

  // If it's a string that looks like JSON, parse it
  if (typeof data === 'string') {
    const trimmed = data.trim();

    // Try to parse as JSON
    if (trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === 'object') {
          return String(parsed.value || parsed.val || 'N/A');
        }
      } catch (e) {
        // If JSON parse fails, try regex extraction
        const match = trimmed.match(/"value"\s*:\s*"?([^",}]+)"?/);
        if (match) {
          return match[1].trim();
        }
      }
    }

    return trimmed;
  }

  // Fallback: convert to string
  return String(data);
};

// Helper function to clean JSON from text - only keeps valid lab results
const cleanJSONFromText = (text: string): string => {
  if (!text) return text;

  return text.split('\n').filter(line => {
    const trimmed = line.trim();
    if (!trimmed) return false;

    // Remove lines containing JSON patterns
    if (trimmed.includes('{"') || trimmed.includes('"}') ||
        trimmed.includes('":"') || trimmed.includes('histoCytologyData') ||
        trimmed.includes('"specimen"') || trimmed.includes('"clinicalDetails"') ||
        trimmed.includes('"grossDescription"') || trimmed.includes('"microscopicDescription"') ||
        trimmed.includes('"impression"') || trimmed.includes('"noteComment"') ||
        trimmed.includes('"tabNotes"') || trimmed.includes('"immunohistochemistry"') ||
        trimmed.includes('"savedAt"') || trimmed.includes('"files"')) {
      return false;
    }

    // Keep valid lab results: starts with date pattern DD/MM/YYYY:-TestName
    const isValidLabResult = /^\d{1,2}\/\d{1,2}\/\d{4}:-[A-Z]/.test(trimmed) &&
                            trimmed.includes(':') &&
                            (trimmed.includes('mmol') || trimmed.includes('mg/') ||
                             trimmed.includes('mg/dL') || trimmed.includes('%') ||
                             trimmed.includes('Reactive') || trimmed.includes('Non') ||
                             trimmed.includes('unit') || trimmed.includes('IU/L') ||
                             trimmed.includes('gm/dL') || trimmed.includes('lac') ||
                             trimmed.includes('cumm') || trimmed.includes('fl'));

    // Filter gibberish: lines with excessive consecutive consonants
    const hasHighConsonantRatio = (trimmed.match(/[bcdfghjklmnpqrstvwxyz]{5,}/gi) || []).length > 3;

    return isValidLabResult && !hasHighConsonantRatio;
  }).join('\n');
};

const IpdDischargeSummary = () => {
  const { visitId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hospitalConfig } = useAuth();

  // Fetch consultants based on hospital
  const { data: consultants = [] } = useQuery({
    queryKey: ['consultants', hospitalConfig.name],
    queryFn: async () => {
      const tableName = hospitalConfig.name === 'hope' ? 'hope_consultants' : 'ayushman_consultants';
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching consultants:', error);
        return [];
      }

      return data || [];
    }
  });

  // Force complete cache clear and component refresh
  React.useEffect(() => {
    console.log('🔄 IpdDischargeSummary component mounted - clearing all caches for visitId:', visitId);

    // Clear all React Query cache
    try {
      queryClient.clear();
      queryClient.invalidateQueries();
      queryClient.removeQueries();

      // Clear any specific queries that might still exist
      queryClient.removeQueries({ queryKey: ['patient-discharge-data'] });
      queryClient.removeQueries({ queryKey: ['patient-discharge-data-simple'] });
      queryClient.removeQueries({ queryKey: ['investigations-data'] });

      // Clear browser storage that might contain cached queries
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
        // Clear only react-query related items from localStorage to avoid breaking other functionality
        Object.keys(localStorage).forEach(key => {
          if (key.includes('react-query') || key.includes('discharge') || key.includes('investigation')) {
            localStorage.removeItem(key);
          }
        });
      }

      console.log('✅ All React Query caches and storage cleared');
    } catch (error) {
      console.log('Cache clearing completed with minor issues:', error);
    }
  }, [visitId, queryClient]);

  // Patient Info States
  const [patientInfo, setPatientInfo] = useState({
    name: '',
    address: '',
    regId: '',
    ageSex: '',
    treatingConsultant: '',
    otherConsultants: '',
    doa: '',
    dateOfDischarge: '',
    reasonOfDischarge: 'Please select',
    corporateType: ''
  });

  // Diagnosis States
  const [diagnosis, setDiagnosis] = useState('');

  // Treatment on Discharge States
  const [medicationRows, setMedicationRows] = useState<MedicationRow[]>([
    {
      id: '1',
      name: '',
      unit: '',
      remark: '',
      route: 'Select',
      dose: 'Select',
      quantity: '',
      days: '0',
      startDate: '',
      timing: { morning: false, afternoon: false, evening: false, night: false },
      isSos: false
    }
  ]);

  // Examination States
  const [examination, setExamination] = useState({
    temp: '',
    pr: '',
    rr: '',
    bp: '',
    spo2: '',
    details: ''
  });
  const [examinationTemplates] = useState([
    'CVS - S1S2 Normal, P/A - Tenderness, CNS : Conscious/Oriented, RS- Clear'
  ]);

  // Investigations States
  const [investigations, setInvestigations] = useState('');
  const [printRecentOnly, setPrintRecentOnly] = useState(false);

  // Surgery Details States - Multiple surgeries support
  const [surgeryRows, setSurgeryRows] = useState<Array<{
    id: string;
    date: string;
    procedurePerformed: string;
    surgeon: string;
    anesthetist: string;
    anesthesia: string;
    implant: string;
  }>>([{
    id: '1',
    date: '',
    procedurePerformed: '',
    surgeon: '',
    anesthetist: '',
    anesthesia: '',
    implant: ''
  }]);
  const [sharedSurgeryDescription, setSharedSurgeryDescription] = useState('');

  // Helper functions for multiple surgeries
  const addSurgeryRow = () => {
    setSurgeryRows([...surgeryRows, {
      id: Date.now().toString(),
      date: '',
      procedurePerformed: '',
      surgeon: '',
      anesthetist: '',
      anesthesia: '',
      implant: ''
    }]);
  };

  const removeSurgeryRow = (id: string) => {
    if (surgeryRows.length > 1) {
      setSurgeryRows(surgeryRows.filter(row => row.id !== id));
    }
  };

  const updateSurgeryRow = (id: string, field: string, value: string) => {
    setSurgeryRows(surgeryRows.map(row =>
      row.id === id ? { ...row, [field]: value } : row
    ));
  };


  // OT Notes States
  const [stayNotes, setStayNotes] = useState('');
  const [stayNotesTemplates, setStayNotesTemplates] = useState<Array<{id?: string, name: string, content: string, display_order?: number}>>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateContent, setNewTemplateContent] = useState('');

  // Default template content for fallback
  const defaultTemplateContent = `You are a medical specialist. Write a brief, professional surgical/medical summary in 5-8 lines only. Include:
1. Procedure performed
2. Key findings
3. Patient's condition post-procedure
4. Any complications (if none, state "uneventful recovery")

Keep it concise and professional. Do not use tables, bullet points, or extensive formatting. Do not mention patient name, age, or gender. Write in paragraph form only. Maximum 100 words.`;

  // New states for Advice and Case Summary
  const [advice, setAdvice] = useState('');
  const [hospitalStayNotes, setHospitalStayNotes] = useState('');
  const [caseSummaryPresentingComplaints, setCaseSummaryPresentingComplaints] = useState('');
  const [editingTemplateIndex, setEditingTemplateIndex] = useState<number | null>(null);
  const [editingTemplateName, setEditingTemplateName] = useState('');
  const [editingTemplateContent, setEditingTemplateContent] = useState('');
  const [showAddTemplate, setShowAddTemplate] = useState(false);

  // Fetch OT Notes templates from database on mount
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const { data, error } = await supabase
          .from('ot_notes_templates')
          .select('*')
          .order('display_order', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          setStayNotesTemplates(data);
        } else {
          // Fallback to default if no templates in DB
          setStayNotesTemplates([{
            name: 'discharge_summary',
            content: defaultTemplateContent
          }]);
        }
      } catch (error) {
        console.error('Error fetching templates:', error);
        // Fallback to default on error
        setStayNotesTemplates([{
          name: 'discharge_summary',
          content: defaultTemplateContent
        }]);
      } finally {
        setTemplatesLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  // Treatment During Hospital Stay States
  const [treatmentCondition, setTreatmentCondition] = useState('Satisfactory');
  const [treatmentStatus, setTreatmentStatus] = useState('Please select');
  const [reviewDate, setReviewDate] = useState('2025-09-26');
  const [residentOnDischarge, setResidentOnDischarge] = useState('Please select');
  const [enableSmsAlert, setEnableSmsAlert] = useState(false);
  const [isChatGptLoading, setIsChatGptLoading] = useState(false);

  // Fetch patient data using the same query structure as IPD Dashboard
  const { data: patientData, isLoading: isPatientLoading, error: patientError } = useQuery({
    queryKey: ['patient-discharge-data', visitId],
    queryFn: async () => {
      try {
        console.log('🏥 IPD Discharge Summary: Fetching data for visit_id:', visitId);

        // Use the EXACT same query structure as IPD Dashboard
        // Search by visit_id (not id) and join with patients table
        const { data: visitData, error: visitError } = await supabase
          .from('visits')
          .select(`
            *,
            patients!inner(
              id,
              name,
              patients_id,
              hospital_name,
              corporate,
              age,
              gender,
              address,
              phone
            )
          `)
          .eq('visit_id', visitId)
          .eq('patient_type', 'IPD')
          .single();

        if (visitError) {
          console.log('❌ Visit not found with visit_id:', visitId, visitError.message);

          // Fallback: Check if there's lab data for this visit_id
          const { data: labData } = await supabase
            .from('lab_results')
            .select('patient_name, patient_age, patient_gender, created_at')
            .eq('visit_id', visitId)
            .limit(1);

          if (labData && labData.length > 0) {
            console.log('✅ Found lab results, creating fallback data');
            const labResult = labData[0];

            return {
              id: visitId,
              visit_id: visitId,
              patient_type: 'IPD',
              admission_date: labResult.created_at,
              discharge_date: null,
              created_at: labResult.created_at,
              patients: {
                id: 'lab-derived',
                name: labResult.patient_name || 'Lab Patient',
                patients_id: visitId.replace(/[A-Za-z]/g, ''), // Extract numbers only
                age: labResult.patient_age,
                gender: labResult.patient_gender,
                address: 'Address from lab records',
                hospital_name: null,
                corporate: null
              },
              dataSource: 'lab-results'
            };
          }

          // If no lab data either, throw error to show fallback form
          throw new Error(`Visit ID ${visitId} not found`);
        }

        console.log('✅ Found visit data with patients:', visitData);

        // Get discharge summary if exists
        const { data: summaryData } = await supabase
          .from('discharge_summaries')
          .select('*')
          .eq('visit_id', visitId)
          .single();

        if (summaryData) {
          console.log('✅ Found existing discharge summary');
        }

        return {
          ...visitData,
          dischargeSummary: summaryData,
          dataSource: 'dashboard-compatible'
        };

      } catch (error) {
        console.log('❌ Error in patient data fetch:', error.message);
        throw error;
      }
    },
    enabled: !!visitId,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000
  });

  // Fetch real lab results from database using visit_id
  const { data: labResultsData, isLoading: isLabResultsLoading } = useQuery({
    queryKey: ['lab-results', visitId],
    queryFn: async () => {
      console.log('🧪 Fetching lab results for visit_id:', visitId);

      let data, error;

      // First, try to find the UUID for this visit_id string
      console.log('🔍 Looking for visit UUID for visit_id:', visitId);
      const { data: visitData } = await supabase
        .from('visits')
        .select('id')
        .eq('visit_id', visitId)
        .single();

      let visitUUID = visitData?.id;
      console.log('📋 Found visit UUID:', visitUUID);

      // Try to get lab results using the UUID
      if (visitUUID) {
        console.log('🧪 Searching lab results using UUID:', visitUUID);
        const result = await supabase
          .from('lab_results')
          .select(`
            id,
            visit_id,
            test_name,
            test_category,
            result_value,
            result_unit,
            main_test_name,
            patient_name,
            patient_age,
            patient_gender,
            created_at
          `)
          .eq('visit_id', visitUUID)
          .order('created_at', { ascending: false });

        data = result.data;
        error = result.error;
      } else {
        // Fallback: search by patient name if available from patientData
        if (patientData?.patients?.name) {
          console.log('🔍 Searching lab results by patient name:', patientData.patients.name);
          const result = await supabase
            .from('lab_results')
            .select(`
              id,
              visit_id,
              test_name,
              test_category,
              result_value,
              result_unit,
              main_test_name,
              patient_name,
              patient_age,
              patient_gender,
              created_at
            `)
            .ilike('patient_name', `%${patientData.patients.name}%`)
            .order('created_at', { ascending: false })
            .limit(10);

          data = result.data;
          error = result.error;
        } else {
          data = [];
          error = { message: 'No visit UUID found and no patient name available' };
        }
      }

      if (error) {
        console.log('❌ No lab results found for visit_id:', visitId, error.message);
        return {
          rawData: [],
          groupedResults: {},
          formattedResults: `No lab results found for visit ID: ${visitId}`
        };
      }

      console.log('✅ Lab results data found:', data?.length || 0, 'results');

      if (!data || data.length === 0) {
        return {
          rawData: [],
          groupedResults: {},
          formattedResults: 'No lab results found for this visit. Lab data will be populated when available.'
        };
      }

      // Group results by date and main test category
      const groupedResults = data.reduce((acc, result) => {
        const date = result.created_at;
        const formattedDate = date ? format(new Date(date), 'dd/MM/yyyy') : 'Unknown Date';

        if (!acc[formattedDate]) {
          acc[formattedDate] = {};
        }

        const category = result.main_test_name || result.test_category || 'General Tests';
        if (!acc[formattedDate][category]) {
          acc[formattedDate][category] = [];
        }

        acc[formattedDate][category].push(result);
        return acc;
      }, {});

      // Format according to the requested format: "03/11/2024:-KFT (Kidney Function Test): Blood Urea:39.3 mg/dl, Creatinine:1.03 mg/dl"
      const formattedResults = Object.entries(groupedResults)
        .map(([date, categories]) => {
          return Object.entries(categories)
            .map(([categoryName, results]) => {
              const resultString = results
                .map(result => {
                  const value = result.result_value || 'N/A';
                  const unit = result.result_unit ? ` ${result.result_unit}` : '';
                  return `${result.test_name}:${value}${unit}`;
                })
                .join(', ');

              return `${date}:-${categoryName}: ${resultString}`;
            })
            .join('\n');
        })
        .join('\n\n');

      return {
        rawData: data,
        groupedResults,
        formattedResults
      };
    },
    enabled: !!visitId,
    retry: false,
    staleTime: 30000
  });

  // Fetch radiology data from database using visit_id (or UUID)
  const { data: radiologyData, isLoading: isRadiologyLoading } = useQuery({
    queryKey: ['radiology-data', visitId, patientData?.id],
    queryFn: async () => {
      console.log('🩻 Fetching radiology data for visit_id:', visitId);

      // First, let's try to get radiology data using the visit's UUID (from patientData)
      let radiologyResults = [];

      if (patientData?.id) {
        console.log('🔍 Trying radiology lookup with visit UUID:', patientData.id);
        const { data: radiologyViaUUID, error: radiologyUUIDError } = await supabase
          .from('visit_radiology')
          .select(`
            id,
            status,
            ordered_date,
            scheduled_date,
            completed_date,
            findings,
            impression,
            notes,
            radiology!inner(
              id,
              name,
              category,
              description
            )
          `)
          .eq('visit_id', patientData.id)
          .order('ordered_date', { ascending: false });

        if (!radiologyUUIDError && radiologyViaUUID && radiologyViaUUID.length > 0) {
          radiologyResults = radiologyViaUUID;
          console.log('✅ Found radiology data via visit UUID:', radiologyResults.length, 'studies');
        }
      }

      // If no results with UUID, try with visit_id in radiology_orders table (complex system)
      if (radiologyResults.length === 0) {
        console.log('🔍 Trying radiology lookup in radiology_orders with visit_id:', visitId);
        const { data: radiologyOrders } = await supabase
          .from('radiology_orders')
          .select(`
            id,
            order_number,
            priority,
            clinical_indication,
            clinical_history,
            order_date,
            scheduled_date,
            status,
            notes,
            radiology_procedures!inner(
              id,
              name,
              code,
              modality_id,
              body_part
            )
          `)
          .eq('patient_id', patientData?.patients?.id || visitId)
          .order('order_date', { ascending: false });

        if (radiologyOrders && radiologyOrders.length > 0) {
          // Convert to similar format as visit_radiology
          radiologyResults = radiologyOrders.map(order => ({
            id: order.id,
            status: order.status,
            ordered_date: order.order_date,
            scheduled_date: order.scheduled_date,
            completed_date: null,
            findings: null,
            impression: null,
            notes: order.notes,
            radiology: {
              id: order.radiology_procedures.id,
              name: order.radiology_procedures.name,
              category: order.radiology_procedures.body_part || 'Radiology',
              description: order.clinical_indication
            }
          }));
          console.log('✅ Found radiology data via radiology_orders:', radiologyResults.length, 'orders');
        }
      }

      if (radiologyResults.length === 0) {
        return {
          rawData: [],
          formattedResults: 'No radiology studies found for this visit. Radiology data will be populated when available.'
        };
      }

      // Group results by date and category
      const groupedResults = radiologyResults.reduce((acc, result) => {
        const date = result.ordered_date || result.scheduled_date;
        const formattedDate = date ? format(new Date(date), 'dd/MM/yyyy') : 'Unknown Date';

        if (!acc[formattedDate]) {
          acc[formattedDate] = {};
        }

        const category = result.radiology.category || 'Radiology';
        if (!acc[formattedDate][category]) {
          acc[formattedDate][category] = [];
        }

        acc[formattedDate][category].push(result);
        return acc;
      }, {});

      // Format according to a similar pattern as lab results
      const formattedResults = Object.entries(groupedResults)
        .map(([date, categories]) => {
          return Object.entries(categories)
            .map(([categoryName, studies]) => {
              const studyString = studies
                .map(study => {
                  const name = study.radiology.name;
                  const status = study.status ? ` (${study.status})` : '';
                  const findings = study.findings ? `, Findings: ${study.findings}` : '';
                  const impression = study.impression ? `, Impression: ${study.impression}` : '';
                  return `${name}${status}${findings}${impression}`;
                })
                .join(', ');

              return `${date}:-${categoryName}: ${studyString}`;
            })
            .join('\n');
        })
        .join('\n\n');

      return {
        rawData: radiologyResults,
        formattedResults
      };
    },
    enabled: !!visitId,
    retry: false,
    staleTime: 30000
  });

  // Fetch real surgery data for this visit - moved after patient data query
  const { data: visitSurgeryData, isLoading: isSurgeryLoading } = useQuery({
    queryKey: ['visit-surgery-data', visitId],
    queryFn: async () => {
      if (!visitId) return null;

      console.log('🔪 Fetching surgery data for visit:', visitId);

      // First try to get the visit UUID from the string visit ID
      let visitUUID = null;

      try {
        const { data: visitData } = await supabase
          .from('visits')
          .select('id')
          .eq('visit_id', visitId)
          .single();
        visitUUID = visitData?.id;
      } catch (error) {
        console.log('❌ Error finding visit UUID:', error);
      }

      if (!visitUUID) {
        console.log('❌ No visit UUID found for surgery data fetch');
        return null;
      }

      console.log('🔍 Fetching surgery data with visit UUID:', visitUUID);

      try {
        const { data, error } = await supabase
          .from('visit_surgeries')
          .select(`
            *,
            cghs_surgery:surgery_id (
              name,
              code,
              NABH_NABL_Rate,
              description
            )
          `)
          .eq('visit_id', visitUUID)
          .order('created_at', { ascending: false });

        if (error) {
          console.log('❌ Error fetching surgery data:', error.message);
          return null;
        }

        console.log('✅ Surgery data found:', data?.length || 0, 'surgeries');
        console.log('🔍 Raw surgery data:', JSON.stringify(data, null, 2));
        return data;
      } catch (error) {
        console.log('❌ Surgery query failed:', error);
        return null;
      }
    },
    enabled: !!visitId,
    retry: false,
    staleTime: 30000
  });

  // Fetch OT Notes data to get surgeon, anesthetist, implant info
  const { data: otNotesData, isLoading: isOtNotesLoading } = useQuery({
    queryKey: ['ot-notes-data', visitId],
    queryFn: async () => {
      if (!visitId) return null;

      console.log('🏥 Fetching OT Notes data for visit:', visitId);

      // First try to get the visit UUID from the string visit ID
      let visitUUID = null;

      try {
        const { data: visitData } = await supabase
          .from('visits')
          .select('id')
          .eq('visit_id', visitId)
          .single();
        visitUUID = visitData?.id;
      } catch (error) {
        console.log('❌ Error finding visit UUID for OT notes:', error);
      }

      if (!visitUUID) {
        console.log('❌ No visit UUID found for OT notes fetch');
        return null;
      }

      console.log('🔍 Fetching OT notes with visit UUID:', visitUUID);

      try {
        const { data, error } = await supabase
          .from('ot_notes')
          .select('*')
          .eq('visit_id', visitUUID)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          console.log('❌ Error fetching OT notes:', error.message);
          return null;
        }

        console.log('✅ OT Notes data found:', data?.length || 0, 'records');
        console.log('🔍 Raw OT notes data:', JSON.stringify(data, null, 2));
        return data?.[0] || null;
      } catch (error) {
        console.log('❌ OT notes query failed:', error);
        return null;
      }
    },
    enabled: !!visitId,
    retry: false,
    staleTime: 30000
  });

  // Fetch diagnosis data from billing system
  const { data: visitDiagnosisData, isLoading: isDiagnosisLoading } = useQuery({
    queryKey: ['visit-diagnosis-data', visitId],
    queryFn: async () => {
      if (!visitId) return null;

      console.log('🏥 Fetching diagnosis data for visit:', visitId);

      // First try to get the visit UUID from the string visit ID
      let visitUUID = null;

      try {
        const { data: visitData } = await supabase
          .from('visits')
          .select('id')
          .eq('visit_id', visitId)
          .single();
        visitUUID = visitData?.id;
      } catch (error) {
        console.log('❌ Error finding visit UUID for diagnosis:', error);
      }

      if (!visitUUID) {
        console.log('❌ No visit UUID found for diagnosis fetch');
        return null;
      }

      console.log('🔍 Fetching diagnosis with visit UUID:', visitUUID);

      try {
        // First, let's check if there's any data in visit_diagnoses for this visit
        const { data: allVisitDiagnoses, error: checkError } = await supabase
          .from('visit_diagnoses')
          .select('*')
          .eq('visit_id', visitUUID);

        console.log('🔍 All visit_diagnoses for UUID:', visitUUID, allVisitDiagnoses);

        // Fetch diagnosis data with proper join
        const { data, error } = await supabase
          .from('visit_diagnoses')
          .select(`
            id,
            visit_id,
            diagnosis_id,
            is_primary,
            notes,
            created_at,
            diagnoses!visit_diagnoses_diagnosis_id_fkey (
              id,
              name
            )
          `)
          .eq('visit_id', visitUUID)
          .order('is_primary', { ascending: false })
          .order('created_at', { ascending: false });

        if (error) {
          console.log('❌ Error fetching diagnosis data:', error.message);
          return null;
        }

        console.log('✅ Diagnosis data found:', data?.length || 0, 'diagnoses');
        console.log('🔍 Detailed diagnosis data:', JSON.stringify(data, null, 2));

        // Also check what's in visit_diagnoses table without join
        if (!data || data.length === 0) {
          console.log('🔍 No data found, checking visit_diagnoses table directly...');
          const { data: rawData } = await supabase
            .from('visit_diagnoses')
            .select('*');
          console.log('🔍 All visit_diagnoses in table:', rawData);
        }

        return data;
      } catch (error) {
        console.log('❌ Diagnosis query failed:', error);
        return null;
      }
    },
    enabled: !!visitId,
    retry: false,
    staleTime: 30000
  });

  const isInvestigationsLoading = isLabResultsLoading || isRadiologyLoading;

  // Fetch existing discharge summary data for editing
  const { data: existingDischargeSummary, isLoading: isLoadingDischargeSummary } = useQuery({
    queryKey: ['existing-discharge-summary', visitId],
    queryFn: async () => {
      if (!visitId) return null;

      console.log('📋 Loading existing discharge summary for visit:', visitId);

      try {
        // First get visit UUID from string visit_id
        const { data: visitData } = await supabase
          .from('visits')
          .select('id')
          .eq('visit_id', visitId)
          .single();

        if (!visitData?.id) {
          console.log('📋 Visit UUID not found');
          return null;
        }

        // Get main discharge summary from ipd_discharge_summary table (get latest if multiple exist)
        const { data: summaryData, error: summaryError } = await supabase
          .from('ipd_discharge_summary')
          .select('*')
          .eq('visit_id', visitData.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (summaryError) {
          throw summaryError;
        }

        if (!summaryData) {
          console.log('📋 No existing discharge summary found - creating new one');
          return null;
        }

        console.log('📋 Found existing discharge summary:', summaryData.id);

        // Extract data from JSONB columns
        const medicationsData = summaryData.discharge_medications || [];
        const examinationData = summaryData.vital_signs || null;
        const surgeryData = summaryData.procedures_performed || null;

        console.log('📋 Loaded discharge summary data:', {
          summary: !!summaryData,
          medications: medicationsData?.length || 0,
          examination: !!examinationData,
          surgery: !!surgeryData
        });

        return {
          summary: summaryData,
          medications: medicationsData,
          examination: examinationData,
          surgery: surgeryData
        };

      } catch (error) {
        console.error('❌ Error loading existing discharge summary:', error);
        return null;
      }
    },
    enabled: !!visitId,
    retry: false,
    staleTime: 30000
  });

  // Fetch medications for the searchable dropdown
  const [medicationSearchTerm, setMedicationSearchTerm] = useState('');
  const [activeSearchRowId, setActiveSearchRowId] = useState(null);
  const { data: availableMedications = [] } = useQuery({
    queryKey: ['medications', medicationSearchTerm],
    queryFn: async () => {
      if (!medicationSearchTerm || medicationSearchTerm.length < 2) return [];

      const { data, error } = await supabase
        .from('medication')
        .select('id, name, generic_name, category, dosage, strength, manufacturer')
        .or(`name.ilike.%${medicationSearchTerm}%,generic_name.ilike.%${medicationSearchTerm}%,category.ilike.%${medicationSearchTerm}%`)
        .order('name')
        .limit(10);

      if (error) {
        console.error('Error fetching medications:', error);
        return [];
      }

      return data || [];
    },
    enabled: medicationSearchTerm.length >= 2,
    staleTime: 30000
  });

  // Update patient info when data is loaded
  useEffect(() => {
    if (patientData) {
      const patient = patientData.patients;
      const summary = patientData.dischargeSummary;

      setPatientInfo({
        name: patient?.name || 'Unknown Patient',
        address: patient?.address || '',
        regId: patient?.patients_id || patientData.id || '',
        ageSex: `${patient?.age || 'N/A'} Years / ${patient?.gender || 'N/A'}`,
        treatingConsultant: patientData.doctor_name || patientData.appointment_with || 'Unknown Doctor',
        otherConsultants: summary?.other_consultants || '',
        doa: patientData.admission_date ? format(new Date(patientData.admission_date), 'yyyy-MM-dd') : patientData.created_at ? format(new Date(patientData.created_at), 'yyyy-MM-dd') : '',
        // Set discharge date to admission date if not already set (to avoid constraint violation)
        dateOfDischarge: patientData.discharge_date
          ? format(new Date(patientData.discharge_date), 'yyyy-MM-dd')
          : patientData.admission_date
            ? format(new Date(patientData.admission_date), 'yyyy-MM-dd')
            : format(new Date(), 'yyyy-MM-dd'),
        reasonOfDischarge: summary?.reason_of_discharge || 'Please select',
        // Fetch corporate type from patients table
        corporateType: patient?.corporate || patient?.corporate_type || patient?.insurance_company || ''
      });

      // Load existing discharge summary data if available
      if (summary) {
        if (summary.diagnosis) setDiagnosis(summary.diagnosis);
        if (summary.investigations) setInvestigations(summary.investigations);
        if (summary.stay_notes) setStayNotes(summary.stay_notes);

        if (summary.medications) {
          try {
            const meds = JSON.parse(summary.medications);
            if (Array.isArray(meds)) {
              setMedicationRows(meds);
            }
          } catch (e) {
            console.log('Error parsing medications:', e);
          }
        }

        if (summary.examination_data) {
          try {
            const examData = JSON.parse(summary.examination_data);
            setExamination(examData);
          } catch (e) {
            console.log('Error parsing examination data:', e);
          }
        }

        if (summary.surgery_details) {
          try {
            const surgeryData = JSON.parse(summary.surgery_details);
            // Handle both old format (single object) and new format (object with surgeryRows array)
            if (surgeryData.surgeryRows && Array.isArray(surgeryData.surgeryRows)) {
              // New format: { surgeryRows: [...], sharedDescription: '...' }
              setSurgeryRows(surgeryData.surgeryRows);
              setSharedSurgeryDescription(surgeryData.sharedDescription || '');
            } else if (!Array.isArray(surgeryData) && surgeryData.date !== undefined) {
              // Old format: single object - convert to array
              setSurgeryRows([{
                id: '1',
                date: surgeryData.date || '',
                procedurePerformed: surgeryData.procedurePerformed || '',
                surgeon: surgeryData.surgeon || '',
                anesthetist: surgeryData.anesthetist || '',
                anesthesia: surgeryData.anesthesia || '',
                implant: surgeryData.implant || ''
              }]);
              setSharedSurgeryDescription(surgeryData.description || '');
            }
          } catch (e) {
            console.log('Error parsing surgery details:', e);
          }
        }
      }

      // Set vital signs from visit data if available and no examination data in summary
      if (patientData.vital_signs && !summary?.examination_data) {
        try {
          const vitals = JSON.parse(patientData.vital_signs);
          setExamination(prev => ({
            ...prev,
            temp: vitals.temperature || prev.temp,
            pr: vitals.pulse_rate || prev.pr,
            rr: vitals.respiratory_rate || prev.rr,
            bp: vitals.blood_pressure || prev.bp,
            spo2: vitals.oxygen_saturation || prev.spo2,
          }));
        } catch (e) {
          console.log('No vital signs data to parse');
        }
      }
    }
  }, [patientData]);

  // Update investigations with lab and radiology results data
  useEffect(() => {
    let combinedResults = [];

    // Add lab results
    if (labResultsData && labResultsData.formattedResults && labResultsData.formattedResults !== 'No lab results found for this visit. Lab data will be populated when available.') {
      combinedResults.push(labResultsData.formattedResults);
    }

    // Add radiology results
    if (radiologyData && radiologyData.formattedResults && radiologyData.formattedResults !== 'No radiology studies found for this visit. Radiology data will be populated when available.') {
      combinedResults.push(radiologyData.formattedResults);
    }

    if (combinedResults.length > 0) {
      const combinedInvestigations = combinedResults.join('\n\n--- RADIOLOGY ---\n\n');
      setInvestigations(combinedInvestigations);
    } else if (!investigations || investigations === 'Investigation details will be populated here...' || investigations.includes('Lab and radiology investigations will be populated here')) {
      setInvestigations('Lab and radiology investigations will be populated here when data is available.');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labResultsData, radiologyData]);  // Removed 'investigations' to prevent overwriting manual fetch data

  // Update surgery details when data is loaded - map each surgery to its own form row
  useEffect(() => {
    // Wait for OT Notes to finish loading before setting surgery details
    if (isOtNotesLoading) return;

    if (visitSurgeryData && visitSurgeryData.length > 0) {
      try {
        // Get previously saved surgery data (if any) to preserve implants
        // This is needed because visit_surgeries table has no implant column,
        // so user-entered implants for Surgery #2+ would be lost without this
        let savedSurgeryRows: any[] = [];
        if (patientData?.summary?.surgery_details) {
          try {
            const savedData = JSON.parse(patientData.summary.surgery_details);
            if (savedData.surgeryRows && Array.isArray(savedData.surgeryRows)) {
              savedSurgeryRows = savedData.surgeryRows;
            }
          } catch (e) {
            console.log('Could not parse saved surgery details');
          }
        }

        // Map each surgery to its own form row
        const mappedSurgeryRows = visitSurgeryData.map((surgery: any, index: number) => {
          const surgeryInfo = surgery?.cghs_surgery;

          // For first surgery, prefer OT notes data if available
          const isFirst = index === 0;
          const surgeon = isFirst && otNotesData?.surgeon ? otNotesData.surgeon : (surgery?.surgeon || '');
          const anesthetist = isFirst && otNotesData?.anaesthetist ? otNotesData.anaesthetist : (surgery?.anaesthetist_name || '');
          const anesthesia = isFirst && otNotesData?.anaesthesia ? otNotesData.anaesthesia : (surgery?.anaesthesia_type || '');

          // For implant: prefer OT notes for first surgery, then check saved data, then visit_surgeries
          const savedImplant = savedSurgeryRows[index]?.implant || '';
          const implant = isFirst && otNotesData?.implant ? otNotesData.implant : (savedImplant || surgery?.implant || '');

          // Use surgery date from visit_surgeries or OT notes
          const surgeryDate = surgery?.surgery_date ? new Date(surgery.surgery_date) :
                             (isFirst && otNotesData?.date ? new Date(otNotesData.date) :
                             (surgery?.created_at ? new Date(surgery.created_at) : null));

          // Get procedure name from cghs_surgery
          const procedurePerformed = surgeryInfo?.name ? `${surgeryInfo.name} (${surgeryInfo.code || ''})` : '';

          return {
            id: surgery.id || Date.now().toString() + index,
            date: surgeryDate ? format(surgeryDate, "yyyy-MM-dd'T'HH:mm") : '',
            procedurePerformed: procedurePerformed,
            surgeon: surgeon,
            anesthetist: anesthetist,
            anesthesia: anesthesia,
            implant: implant
          };
        });

        setSurgeryRows(mappedSurgeryRows);

        // Don't set shared description from OT notes - it will be loaded from ipd_discharge_summary if saved

        console.log('✅ Surgery rows updated with data:', {
          count: mappedSurgeryRows.length,
          surgeries: mappedSurgeryRows.map(r => r.procedurePerformed)
        });

      } catch (error) {
        console.log('❌ Error updating surgery details:', error);
      }
    } else if (otNotesData) {
      // Fallback: Populate from OT Notes even if no visit_surgeries data
      try {
        const surgeryDate = otNotesData?.date ? new Date(otNotesData.date) : null;

        setSurgeryRows([{
          id: '1',
          date: surgeryDate ? format(surgeryDate, "yyyy-MM-dd'T'HH:mm") : '',
          procedurePerformed: otNotesData?.procedure_performed || otNotesData?.surgery_name || '',
          surgeon: otNotesData?.surgeon || '',
          anesthetist: otNotesData?.anaesthetist || '',
          anesthesia: otNotesData?.anaesthesia || '',
          implant: otNotesData?.implant || ''
        }]);

        // Don't set shared description from OT notes - it will be loaded from ipd_discharge_summary if saved

        console.log('✅ Surgery details populated from OT Notes only:', {
          surgeon: otNotesData?.surgeon,
          anaesthetist: otNotesData?.anaesthetist,
          anaesthesia: otNotesData?.anaesthesia
        });
      } catch (error) {
        console.log('❌ Error populating from OT Notes:', error);
      }
    }
  }, [visitSurgeryData, otNotesData, patientData, isOtNotesLoading]);

  // Update diagnosis when data is loaded from visit_diagnoses table
  useEffect(() => {
    if (visitDiagnosisData && visitDiagnosisData.length > 0) {
      try {
        console.log('🔄 Processing diagnosis data:', visitDiagnosisData);

        // Format diagnosis data for display
        const primaryDiagnosis = visitDiagnosisData.find(d => d.is_primary === true);
        const secondaryDiagnoses = visitDiagnosisData.filter(d => d.is_primary !== true);

        let diagnosisText = '';

        // Add primary diagnosis
        if (primaryDiagnosis && primaryDiagnosis.diagnoses) {
          diagnosisText += `${primaryDiagnosis.diagnoses.name}`;
          if (primaryDiagnosis.notes) {
            diagnosisText += `\nNotes: ${primaryDiagnosis.notes}`;
          }
        }

        // Add secondary diagnoses
        if (secondaryDiagnoses.length > 0) {
          if (diagnosisText) diagnosisText += '\n';
          secondaryDiagnoses.forEach((diag, index) => {
            if (diag.diagnoses && diag.diagnoses.name) {
              diagnosisText += `${diag.diagnoses.name}`;
              if (diag.notes) {
                diagnosisText += ` (${diag.notes})`;
              }
              diagnosisText += '\n';
            }
          });
        }

        // If no primary/secondary structure, just list all diagnoses
        if (!primaryDiagnosis && visitDiagnosisData.length > 0) {
          diagnosisText = '';
          visitDiagnosisData.forEach((diag, index) => {
            if (diag.diagnoses && diag.diagnoses.name) {
              if (index > 0) diagnosisText += '\n';
              diagnosisText += `${diag.diagnoses.name}`;
              if (diag.notes) diagnosisText += ` - ${diag.notes}`;
            }
          });
        }

        // Update diagnosis field only if empty
        if (!diagnosis || diagnosis.trim() === '' || diagnosis === 'Enter diagnosis details...') {
          setDiagnosis(diagnosisText.trim());
          console.log('✅ Diagnosis field updated with:', diagnosisText.trim());
        }

        console.log('✅ Diagnosis data processed:', {
          primaryFound: !!primaryDiagnosis,
          primaryName: primaryDiagnosis?.diagnoses?.name,
          secondaryCount: secondaryDiagnoses.length,
          totalDiagnoses: visitDiagnosisData.length
        });

      } catch (error) {
        console.log('❌ Error formatting diagnosis data:', error);
      }
    }
  }, [visitDiagnosisData, diagnosis]);

  // Populate form fields when existing discharge summary is loaded
  useEffect(() => {
    if (existingDischargeSummary) {
      try {
        console.log('📝 Populating form with existing discharge summary data');

        const { summary, medications, examination, surgery } = existingDischargeSummary;

        // Populate main fields
        if (summary) {
          setDiagnosis(summary.primary_diagnosis || '');

          // Clean any JSON data from investigations text - AUTO CLEAN ON LOAD
          const investigationsText = summary.lab_investigations?.investigations_text || '';
          console.log('📥 Loading investigations from database, length:', investigationsText.length);
          const cleanedInvestigations = cleanJSONFromText(investigationsText);
          console.log('🧹 After auto-clean, length:', cleanedInvestigations.length);
          setInvestigations(cleanedInvestigations);

          setStayNotes(summary.ot_notes || '');
          setCaseSummaryPresentingComplaints(summary.chief_complaints || '');
          setAdvice(summary.discharge_advice || '');
          setHospitalStayNotes(summary.hospital_stay_notes || '');
          setTreatmentCondition(summary.condition_on_discharge || 'Satisfactory');
          setTreatmentStatus(summary.treatment_during_stay || 'Please select');
          setReviewDate(summary.review_on_date ? format(new Date(summary.review_on_date), 'yyyy-MM-dd') : '2025-09-26');
          setResidentOnDischarge(summary.resident_on_discharge || 'Please select');
          setEnableSmsAlert(summary.additional_data?.enable_sms_alert || false);

          // Update patient info - restore ALL saved fields from discharge summary
          setPatientInfo(prev => ({
            ...prev,
            name: summary.patient_name || prev.name,
            address: summary.address || prev.address,
            regId: summary.reg_id || prev.regId,
            ageSex: summary.age_sex || prev.ageSex,
            treatingConsultant: summary.treating_consultant || prev.treatingConsultant,
            otherConsultants: summary.other_consultants || prev.otherConsultants,
            doa: summary.admission_date ? format(new Date(summary.admission_date), 'yyyy-MM-dd') : prev.doa,
            dateOfDischarge: summary.date_of_discharge ? format(new Date(summary.date_of_discharge), 'yyyy-MM-dd') : prev.dateOfDischarge,
            reasonOfDischarge: summary.reason_of_discharge || prev.reasonOfDischarge,
            corporateType: summary.corporate_type || prev.corporateType
          }));
        }

        // Populate medications
        if (medications && medications.length > 0) {
          const formattedMedications = medications.map((med, index) => ({
            id: (index + 1).toString(),
            name: med.name || '',
            unit: med.unit || '',
            remark: med.remark || '',
            route: med.route || 'Select',
            dose: med.dose || 'Select',
            quantity: med.quantity || '',
            days: med.days || '0',
            startDate: med.start_date || '',
            timing: med.timing || { morning: false, afternoon: false, evening: false, night: false },
            isSos: med.is_sos || false
          }));

          setMedicationRows(formattedMedications);
          console.log('💊 Populated', formattedMedications.length, 'medications');
        }

        // Populate examination data
        if (examination) {
          setExamination({
            temp: examination.temperature || '',
            pr: examination.pulse_rate || '',
            rr: examination.respiratory_rate || '',
            bp: examination.blood_pressure || '',
            spo2: examination.spo2 || '',
            details: examination.examination_details || ''
          });
          console.log('🔍 Populated examination data');
        }

        // Populate surgery details ONLY if OT Notes data is not available
        // OT Notes takes priority as it's the source of truth for surgery data
        if (surgery && !otNotesData) {
          setSurgeryRows([{
            id: '1',
            date: surgery.surgery_date ? format(new Date(surgery.surgery_date), "yyyy-MM-dd'T'HH:mm") : '',
            procedurePerformed: surgery.procedure_performed || '',
            surgeon: surgery.surgeon || '',
            anesthetist: surgery.anesthetist || '',
            anesthesia: surgery.anesthesia_type || '',
            implant: surgery.implant || ''
          }]);
          console.log('🏥 Populated surgery details from saved discharge summary (no OT notes available)');
        } else if (surgery && otNotesData) {
          console.log('🏥 Skipping saved surgery details - using fresh OT notes data instead');
        }

        // Always restore shared description from saved discharge summary (regardless of OT notes)
        if (surgery?.sharedDescription) {
          setSharedSurgeryDescription(surgery.sharedDescription);
          console.log('📝 Restored shared description from saved discharge summary');
        }

        console.log('✅ Form populated with existing discharge summary data');

      } catch (error) {
        console.error('❌ Error populating form with existing data:', error);
      }
    }
  }, [existingDischargeSummary, otNotesData]);


  const addMedicationRow = () => {
    const newRow: MedicationRow = {
      id: Date.now().toString(),
      name: '',
      unit: '',
      remark: '',
      route: 'Select',
      dose: 'Select',
      quantity: '',
      days: '0',
      startDate: '',
      timing: { morning: false, afternoon: false, evening: false, night: false },
      isSos: false
    };
    setMedicationRows([...medicationRows, newRow]);
  };

  const removeMedicationRow = (id: string) => {
    if (medicationRows.length > 1) {
      setMedicationRows(medicationRows.filter(row => row.id !== id));
    }
  };

  const updateMedicationRow = (id: string, field: string, value: any) => {
    setMedicationRows(medicationRows.map(row =>
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  // Template management functions
  const addNewTemplate = async () => {
    if (newTemplateName.trim() && newTemplateContent.trim()) {
      try {
        const { data, error } = await supabase
          .from('ot_notes_templates')
          .insert({
            name: newTemplateName.trim(),
            content: newTemplateContent.trim(),
            display_order: stayNotesTemplates.length
          })
          .select()
          .single();

        if (error) throw error;

        setStayNotesTemplates([...stayNotesTemplates, data]);
        setNewTemplateName('');
        setNewTemplateContent('');
        setShowAddTemplate(false);
        toast({
          title: "Success",
          description: "Template saved successfully!",
        });
      } catch (error) {
        console.error('Error saving template:', error);
        toast({
          title: "Error",
          description: "Failed to save template",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "Error",
        description: "Please provide both template name and content",
        variant: "destructive"
      });
    }
  };

  const editTemplate = (index: number) => {
    setEditingTemplateIndex(index);
    setEditingTemplateName(stayNotesTemplates[index].name);
    setEditingTemplateContent(stayNotesTemplates[index].content);
  };

  const saveEditTemplate = async () => {
    if (editingTemplateIndex !== null && editingTemplateName.trim() && editingTemplateContent.trim()) {
      try {
        const template = stayNotesTemplates[editingTemplateIndex];

        if (template.id) {
          // Update existing template in database
          const { error } = await supabase
            .from('ot_notes_templates')
            .update({
              name: editingTemplateName.trim(),
              content: editingTemplateContent.trim(),
              updated_at: new Date().toISOString()
            })
            .eq('id', template.id);

          if (error) throw error;
        }

        // Update local state
        const updatedTemplates = [...stayNotesTemplates];
        updatedTemplates[editingTemplateIndex] = {
          ...template,
          name: editingTemplateName.trim(),
          content: editingTemplateContent.trim()
        };
        setStayNotesTemplates(updatedTemplates);
        setEditingTemplateIndex(null);
        setEditingTemplateName('');
        setEditingTemplateContent('');
        toast({
          title: "Success",
          description: "Template updated successfully!",
        });
      } catch (error) {
        console.error('Error updating template:', error);
        toast({
          title: "Error",
          description: "Failed to update template",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "Error",
        description: "Please provide both template name and content",
        variant: "destructive"
      });
    }
  };

  const cancelEditTemplate = () => {
    setEditingTemplateIndex(null);
    setEditingTemplateName('');
    setEditingTemplateContent('');
  };

  const deleteTemplate = async (index: number) => {
    try {
      const template = stayNotesTemplates[index];

      if (template.id) {
        const { error } = await supabase
          .from('ot_notes_templates')
          .delete()
          .eq('id', template.id);

        if (error) throw error;
      }

      const updatedTemplates = stayNotesTemplates.filter((_, i) => i !== index);
      setStayNotesTemplates(updatedTemplates);
      toast({
        title: "Success",
        description: "Template deleted successfully!",
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive"
      });
    }
  };

  const moveTemplateUp = async (index: number) => {
    if (index > 0) {
      const updatedTemplates = [...stayNotesTemplates];
      [updatedTemplates[index - 1], updatedTemplates[index]] = [updatedTemplates[index], updatedTemplates[index - 1]];

      // Update display_order in database
      try {
        if (updatedTemplates[index - 1].id && updatedTemplates[index].id) {
          await Promise.all([
            supabase.from('ot_notes_templates').update({ display_order: index - 1 }).eq('id', updatedTemplates[index - 1].id),
            supabase.from('ot_notes_templates').update({ display_order: index }).eq('id', updatedTemplates[index].id)
          ]);
        }
      } catch (error) {
        console.error('Error reordering templates:', error);
      }

      setStayNotesTemplates(updatedTemplates);
    }
  };

  const moveTemplateDown = async (index: number) => {
    if (index < stayNotesTemplates.length - 1) {
      const updatedTemplates = [...stayNotesTemplates];
      [updatedTemplates[index], updatedTemplates[index + 1]] = [updatedTemplates[index + 1], updatedTemplates[index]];

      // Update display_order in database
      try {
        if (updatedTemplates[index].id && updatedTemplates[index + 1].id) {
          await Promise.all([
            supabase.from('ot_notes_templates').update({ display_order: index }).eq('id', updatedTemplates[index].id),
            supabase.from('ot_notes_templates').update({ display_order: index + 1 }).eq('id', updatedTemplates[index + 1].id)
          ]);
        }
      } catch (error) {
        console.error('Error reordering templates:', error);
      }

      setStayNotesTemplates(updatedTemplates);
    }
  };


  const handleSave = async () => {
    try {
      if (!patientData) {
        toast({
          title: "Error",
          description: "Patient data not loaded. Cannot save discharge summary.",
        });
        return;
      }

      console.log('💾 Starting IPD discharge summary save process...');
      console.log('📋 Patient Data:', patientData);
      console.log('🔍 Visit ID (string):', visitId);

      // 1. Get visit and patient UUIDs
      let visitUUID = patientData.id;
      let patientUUID = patientData.patients?.id;

      console.log('🆔 Initial UUIDs - Visit:', visitUUID, 'Patient:', patientUUID);

      if (!visitUUID) {
        console.log('⚠️ No visitUUID found, querying visits table...');
        const { data: visitData, error: visitError } = await supabase
          .from('visits')
          .select('id, patient_id')
          .eq('visit_id', visitId)
          .single();

        if (visitError) {
          console.error('❌ Error fetching visit data:', visitError);
          throw new Error(`Could not find visit record: ${visitError.message}`);
        }

        visitUUID = visitData?.id;
        patientUUID = visitData?.patient_id;
        console.log('✅ Fetched UUIDs - Visit:', visitUUID, 'Patient:', patientUUID);
      }

      // Validate required UUIDs
      if (!visitUUID || !patientUUID) {
        const errorMsg = `Missing required IDs - Visit UUID: ${visitUUID}, Patient UUID: ${patientUUID}`;
        console.error('❌', errorMsg);
        throw new Error(errorMsg);
      }

      // Validate required fields
      if (!patientInfo.name) {
        throw new Error('Patient name is required');
      }
      if (!patientInfo.doa) {
        throw new Error('Admission date is required');
      }

      // Helper function to convert empty strings to null for date fields
      const formatDate = (dateValue: any) => {
        if (!dateValue || dateValue === '' || dateValue === 'Invalid Date') {
          return null;
        }
        return dateValue;
      };

      // 2. Prepare discharge summary data matching the actual database schema
      const dischargeData = {
        // Foreign keys - use UUIDs as per schema
        visit_id: visitUUID,
        patient_id: patientUUID,

        // Basic patient info (required fields)
        patient_name: patientInfo.name,
        reg_id: patientInfo.regId || null,
        address: patientInfo.address || null,
        age_sex: patientInfo.ageSex || null,

        // Dates - admission_date is required NOT NULL, others can be null
        admission_date: formatDate(patientInfo.doa),
        date_of_discharge: formatDate(patientInfo.dateOfDischarge),

        // Consultants
        treating_consultant: patientInfo.treatingConsultant || null,
        other_consultants: patientInfo.otherConsultants || null,
        reason_of_discharge: patientInfo.reasonOfDischarge || null,
        corporate_type: patientInfo.corporateType || null,

        // Medical data - using correct schema column names
        primary_diagnosis: diagnosis || null,
        ot_notes: stayNotes || null,
        chief_complaints: caseSummaryPresentingComplaints || null,
        discharge_advice: advice || null,
        hospital_stay_notes: hospitalStayNotes || null,

        // Treatment info - using correct schema column names
        condition_on_discharge: treatmentCondition || null,
        treatment_during_stay: treatmentStatus || null,
        review_on_date: formatDate(reviewDate),
        resident_on_discharge: residentOnDischarge || null,

        // Store investigations in JSONB column
        lab_investigations: {
          investigations_text: investigations
        },

        // Examination data in vital_signs JSONB column
        vital_signs: {
          temperature: examination.temp,
          pulse_rate: examination.pr,
          respiratory_rate: examination.rr,
          blood_pressure: examination.bp,
          spo2: examination.spo2,
          examination_details: examination.details
        },

        // Medications in discharge_medications JSONB column
        discharge_medications: medicationRows.map(med => ({
          name: med.name,
          unit: med.unit,
          dose: med.dose,
          quantity: med.quantity,
          days: med.days,
          route: med.route,
          timing: med.timing,
          is_sos: med.isSos,
          start_date: med.startDate,
          remark: med.remark
        })),

        // Surgery details in procedures_performed JSONB column - now supports multiple surgeries
        procedures_performed: {
          surgeryRows: surgeryRows,
          sharedDescription: sharedSurgeryDescription
        },

        // Store original visit_id string in additional_data for reference
        additional_data: {
          visit_id_string: visitId,
          enable_sms_alert: enableSmsAlert
        }
      };

      console.log('💾 Saving IPD discharge summary with data:', JSON.stringify(dischargeData, null, 2));

      // 3. Check if a discharge summary already exists for this visit
      const { data: existingRecord } = await supabase
        .from('ipd_discharge_summary')
        .select('id')
        .eq('visit_id', visitUUID)
        .maybeSingle();

      let dischargeSummary, summaryError;

      if (existingRecord) {
        // Update existing record
        console.log('📝 Updating existing discharge summary:', existingRecord.id);
        const result = await supabase
          .from('ipd_discharge_summary')
          .update(dischargeData)
          .eq('id', existingRecord.id)
          .select()
          .single();
        dischargeSummary = result.data;
        summaryError = result.error;
      } else {
        // Insert new record
        console.log('➕ Inserting new discharge summary');
        const result = await supabase
          .from('ipd_discharge_summary')
          .insert(dischargeData)
          .select()
          .single();
        dischargeSummary = result.data;
        summaryError = result.error;
      }

      if (summaryError) {
        console.error('❌ Supabase Error Details:', {
          message: summaryError.message,
          details: summaryError.details,
          hint: summaryError.hint,
          code: summaryError.code
        });
        throw new Error(`Database error: ${summaryError.message}${summaryError.hint ? ' - ' + summaryError.hint : ''}`);
      }

      console.log('✅ IPD discharge summary saved successfully:', dischargeSummary.id);
      console.log('📋 Summary contains:', {
        medications: medicationRows.length,
        investigations: investigations.length,
        diagnosis: diagnosis ? 'Yes' : 'No',
        stay_notes: stayNotes ? 'Yes' : 'No'
      });

      console.log('🎉 IPD discharge summary saved to database successfully!');

      toast({
        title: "Success",
        description: "Discharge summary saved successfully!",
      });

    } catch (error) {
      console.error('❌ Error saving discharge summary:', error);
      toast({
        title: "Error",
        description: `Failed to save discharge summary: ${error.message}`,
      });
    }
  };

  const handlePrintPreview = async () => {
    // Check for final payment
    if (!patientData?.bill_paid) {
      alert('⚠️ Final Payment Required\n\nPlease complete the final payment before printing the discharge summary.');
      return;
    }

    try {
      toast({
        title: "Generating Print Preview",
        description: "Loading discharge summary for printing...",
      });

      console.log('🖨️ Fetching data for print preview...');

      // Get visit UUID
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select('id, visit_id, patient_id')
        .eq('visit_id', visitId)
        .single();

      console.log('🔍 Visit data fetch result:', { visitData, visitError });

      if (visitError || !visitData?.id) {
        console.error('❌ Visit not found:', visitError);
        toast({
          title: "Error",
          description: `Visit not found for ID: ${visitId}. ${visitError?.message || ''}`,
          variant: "destructive"
        });
        return;
      }

      // Fetch patient details separately using visit's patient_id
      let patientDetails = null;
      if (visitData.patient_id) {
        console.log('🔍 Fetching patient with ID:', visitData.patient_id);
        const { data: patientData, error: patientError } = await supabase
          .from('patients')
          .select('patients_id, phone')
          .eq('id', visitData.patient_id)
          .single();

        if (patientError) {
          console.error('❌ Error fetching patient:', patientError);
        }

        patientDetails = patientData;
        console.log('👤 Patient details:', patientDetails);
      } else {
        console.warn('⚠️ No patient_id in visitData');
      }

      // Fetch discharge summary (get latest if multiple exist)
      const { data: summaryData, error: summaryError } = await supabase
        .from('ipd_discharge_summary')
        .select('*')
        .eq('visit_id', visitData.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (summaryError) {
        throw summaryError;
      }

      if (!summaryData) {
        toast({
          title: "Error",
          description: "No discharge summary found. Please save first.",
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Summary data loaded for print:', summaryData);

      // Add patient_id and mobile to summaryData for print
      if (patientDetails) {
        console.log('📝 Adding patient details to summary:', patientDetails);
        summaryData.patient_id = patientDetails.patients_id;
        summaryData.mobile_no = patientDetails.phone; // Changed from mobile to phone
        console.log('✅ Updated summaryData.patient_id:', summaryData.patient_id);
        console.log('✅ Updated summaryData.mobile_no:', summaryData.mobile_no);
      } else {
        console.warn('⚠️ No patient details found to add to summary');
      }

      // Fetch lab results for this visit - try UUID first, then string visit_id
      let { data: labTestResults } = await supabase
        .from('lab_results')
        .select(`
          id,
          visit_id,
          test_name,
          test_category,
          result_value,
          result_unit,
          main_test_name,
          created_at
        `)
        .eq('visit_id', visitData.id)
        .order('created_at', { ascending: false });

      console.log('🧪 Lab results fetched with UUID:', labTestResults?.length || 0);

      // If no results with UUID, try with string visit_id
      if (!labTestResults || labTestResults.length === 0) {
        console.log('🔄 Trying with string visit_id:', visitId);
        const { data: labResultsByStringId } = await supabase
          .from('lab_results')
          .select(`
            id,
            visit_id,
            test_name,
            test_category,
            result_value,
            result_unit,
            main_test_name,
            created_at
          `)
          .eq('visit_id', visitId)
          .order('created_at', { ascending: false });

        labTestResults = labResultsByStringId;
        console.log('🧪 Lab results fetched with string ID:', labTestResults?.length || 0);
      }

      // Format lab results
      let formattedLabResults = null;
      if (labTestResults && labTestResults.length > 0) {
        const groupedResults = labTestResults.reduce((acc, result) => {
          const date = result.created_at;
          const formattedDate = date ? format(new Date(date), 'dd/MM/yyyy') : 'Unknown Date';

          if (!acc[formattedDate]) {
            acc[formattedDate] = {};
          }

          const category = result.main_test_name || result.test_category || 'General Tests';
          if (!acc[formattedDate][category]) {
            acc[formattedDate][category] = [];
          }

          acc[formattedDate][category].push(result);
          return acc;
        }, {});

        const formattedResults = Object.entries(groupedResults)
          .map(([date, categories]) => {
            return Object.entries(categories)
              .map(([categoryName, results]: [string, any]) => {
                const resultString = results
                  .map((result: any) => {
                    // Parse result_value - AGGRESSIVE parsing to extract value
                    let value = result.result_value;

                    // Step 1: Handle null/undefined
                    if (value === null || value === undefined) {
                      return null; // Skip this result
                    }

                    // Step 2: If it's already an object (Supabase JSONB auto-parse)
                    if (typeof value === 'object' && !Array.isArray(value)) {
                      value = value.value || value.val || 'N/A';
                    }
                    // Step 3: If it's a string, try to parse
                    else if (typeof value === 'string') {
                      const trimmedValue = value.trim();

                      // Try to parse JSON string
                      if (trimmedValue.startsWith('{') || trimmedValue.startsWith('[')) {
                        try {
                          const parsed = JSON.parse(trimmedValue);
                          if (typeof parsed === 'object' && parsed !== null) {
                            value = parsed.value || parsed.val || trimmedValue;
                          }
                        } catch (e) {
                          // Not valid JSON, keep as string
                        }
                      }
                    }
                    // Step 4: Convert numbers to string
                    else {
                      value = String(value);
                    }

                    // Step 5: Final safety check - if value is still an object or looks like JSON, extract the number
                    if (typeof value === 'object' && value !== null) {
                      value = value.value || value.val || JSON.stringify(value);
                    }

                    // If final value is still a JSON string, do regex extraction
                    if (typeof value === 'string' && value.includes('"value"')) {
                      const match = value.match(/"value"\s*:\s*"?(\d+)"?/);
                      if (match) {
                        value = match[1];
                      }
                    }

                    const unit = result.result_unit ? ` ${result.result_unit}` : '';

                    // Only include test_name if it's different from category name
                    if (result.test_name && result.test_name !== categoryName) {
                      return `${result.test_name}:${value}${unit}`;
                    } else {
                      return `${value}${unit}`;
                    }
                  })
                  .filter((item: any) => item !== null) // Remove null entries
                  .join(', ');

                return `${date}:-${categoryName}: ${resultString}`;
              })
              .join('\n');
          })
          .join('\n\n');

        formattedLabResults = {
          rawData: labTestResults,
          groupedResults,
          formattedResults
        };
      }

      // Generate print HTML - pass current form surgery data
      // Get surgeryRows and description from state, or fallback to saved data
      let surgeryRowsToUse = surgeryRows;
      let descriptionToUse = sharedSurgeryDescription;

      if (summaryData.surgery_details) {
        try {
          const surgeryData = JSON.parse(summaryData.surgery_details);
          // Use saved surgeryRows if state is empty
          if ((!surgeryRowsToUse || surgeryRowsToUse.length === 0) && surgeryData.surgeryRows) {
            surgeryRowsToUse = surgeryData.surgeryRows;
          }
          // Use saved description if state is empty
          if (!descriptionToUse) {
            descriptionToUse = surgeryData.sharedDescription || surgeryData.description || '';
          }
        } catch (e) {
          console.log('Error parsing surgery_details:', e);
        }
      }
      console.log('🔍 Surgery rows for print:', surgeryRowsToUse?.length || 0);
      console.log('🔍 Surgery description for print:', descriptionToUse ? 'Found (' + descriptionToUse.substring(0, 50) + '...)' : 'Empty');
      const printHTML = generatePrintHTML(summaryData, patientInfo, visitId, formattedLabResults, surgeryRowsToUse, descriptionToUse);

      // Open print preview in new window
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printHTML);
        printWindow.document.close();

        // Wait for content to load then trigger print
        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();
        };

        toast({
          title: "Success",
          description: "Print preview opened successfully!",
        });
      }

    } catch (error) {
      console.error('❌ Print preview error:', error);
      toast({
        title: "Error",
        description: `Failed to generate print preview: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  // Function to convert markdown tables and formatting to HTML
  const formatOtNotesHTML = (content: string) => {
    if (!content) return '';

    let formatted = content;

    // Convert markdown tables to HTML tables - handles all markdown table formats
    // Matches: | header | header | followed by separator line, then data rows
    const lines = formatted.split(/\r?\n/);
    let inTable = false;
    let tableLines: string[] = [];
    let result: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check if this line looks like a table row (starts and ends with |)
      if (line.startsWith('|') && line.endsWith('|')) {
        if (!inTable) {
          inTable = true;
          tableLines = [line];
        } else {
          tableLines.push(line);
        }
      } else {
        // Not a table line - process any accumulated table
        if (inTable && tableLines.length >= 3) {
          result.push(convertMarkdownTableToHTML(tableLines));
          tableLines = [];
        }
        inTable = false;
        result.push(line);
      }
    }

    // Process any remaining table at the end
    if (inTable && tableLines.length >= 3) {
      result.push(convertMarkdownTableToHTML(tableLines));
    }

    formatted = result.join('\n');

    // Convert **bold** to <strong>
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Convert newlines to <br> but preserve table structure
    formatted = formatted.replace(/\n(?!<table|<\/table|<tr|<\/tr|<th|<\/th|<td|<\/td)/g, '<br>');

    return formatted;
  };

  // Helper function to convert markdown table lines to HTML
  const convertMarkdownTableToHTML = (tableLines: string[]): string => {
    if (tableLines.length < 3) return tableLines.join('\n');

    // First line is headers
    const headerLine = tableLines[0];
    const headers = headerLine.split('|')
      .map(h => h.trim())
      .filter(h => h.length > 0);

    // Second line is separator (skip it)
    // Remaining lines are data rows
    const dataLines = tableLines.slice(2);

    let html = '<table style="width: 100%; border-collapse: collapse; margin: 10px 0;"><thead><tr>';

    // Add headers
    headers.forEach(header => {
      html += `<th style="border: 1px solid #000; background-color: transparent; padding: 6px; text-align: left;">${header}</th>`;
    });

    html += '</tr></thead><tbody>';

    // Add data rows
    dataLines.forEach(dataLine => {
      const cells = dataLine.split('|')
        .map(c => c.trim())
        .filter(c => c.length > 0);

      if (cells.length > 0) {
        html += '<tr>';
        cells.forEach(cell => {
          html += `<td style="border: 1px solid #000; padding: 6px;">${cell}</td>`;
        });
        html += '</tr>';
      }
    });

    html += '</tbody></table>';
    return html;
  };

  // Helper function to detect placeholder/example investigation text
  const isPlaceholderInvestigations = (text: string): boolean => {
    if (!text) return true;
    const placeholderIndicators = [
      'No investigations found in database',
      'You can manually enter investigations in this format',
      'DD/MM/YYYY:-Test Category: Test1:Value1 unit',
      'Example:',
    ];
    return placeholderIndicators.some(indicator => text.includes(indicator));
  };

  // Function to generate formatted print HTML
  const generatePrintHTML = (summaryData: any, patientInfo: any, visitIdString: string, labResults?: any, currentSurgeryRows?: any[], currentSurgeryDescription?: string) => {
    const currentDate = format(new Date(), 'dd/MM/yyyy');

    console.log('🖨️ Generating print HTML with summaryData:', summaryData);
    console.log('🧪 Lab results data:', labResults);

    // Format medications for table - use correct field name from database
    const medications = summaryData.discharge_medications || summaryData.medications_on_discharge || [];
    const medicationsHTML = medications.map((med: any) => `
      <tr>
        <td>${med.name || ''}</td>
        <td>${med.unit || ''}</td>
        <td>${med.route || 'P.O'}</td>
        <td>${med.dose || ''}</td>
        <td>${med.days || ''} DAYS</td>
      </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Discharge Summary - ${patientInfo.name}</title>
  <style>
    @page {
      size: A4;
      margin: 20mm 15mm;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.3;
      color: #000;
      background: white;
      padding: 0;
    }

    .header {
      text-align: center;
      border-bottom: 1.5px solid #000;
      padding-bottom: 5px;
      margin-bottom: 10px;
    }

    .header h1 {
      font-size: 16pt;
      font-weight: bold;
      color: #000;
      margin: 0;
    }

    .patient-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px 15px;
      padding: 10px;
      border-bottom: 1.5px solid #000;
      margin-bottom: 10px;
      background: white;
    }

    .info-row {
      display: flex;
      align-items: baseline;
      font-size: 9pt;
      line-height: 1.4;
    }

    .info-label {
      font-weight: bold;
      min-width: 140px;
      margin-right: 5px;
    }

    .info-value {
      flex: 1;
    }

    .section {
      margin-bottom: 8px;
      background: white;
      page-break-inside: avoid;
    }

    .section-title {
      font-weight: bold;
      font-size: 11pt;
      text-align: center;
      margin-bottom: 8px;
      text-decoration: underline;
    }

    .section-subtitle {
      font-weight: bold;
      font-size: 10pt;
      margin-top: 8px;
      margin-bottom: 4px;
      text-decoration: underline;
    }

    .section-content {
      text-align: justify;
      line-height: 1.4;
      white-space: pre-wrap;
      font-size: 9pt;
    }

    .diagnosis-list {
      list-style-position: inside;
      padding-left: 0;
      margin: 0;
    }

    .diagnosis-list li {
      margin-bottom: 2px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0;
      font-size: 9pt;
    }

    table, th, td {
      border: 1px solid #000;
    }

    th {
      background-color: #d0d0d0;
      font-weight: bold;
      padding: 5px 4px;
      text-align: center;
      font-size: 9pt;
    }

    td {
      padding: 4px 6px;
      text-align: left;
      vertical-align: top;
    }

    .review-table {
      width: 100%;
      margin-top: 15px;
      border: 1px solid #000;
    }

    .review-table td {
      padding: 5px 8px;
      border: 1px solid #000;
    }

    .signature-section {
      margin-top: 20px;
      text-align: right;
      font-weight: bold;
    }

    .emergency-note {
      text-align: center;
      font-weight: bold;
      margin-top: 20px;
      padding: 8px;
      border: 1px solid #000;
      background-color: white;
      font-size: 10pt;
    }

    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        background: white;
        padding: 0;
      }

      .section {
        background: white;
        padding: 0;
      }

      .no-print {
        display: none;
      }

      @page {
        margin: 15mm 10mm;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Discharge Summary</h1>
  </div>

  <div class="patient-info">
    <div class="info-row">
      <span class="info-label">Name</span>
      <span class="info-value">: ${summaryData.patient_name || patientInfo.name || 'N/A'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Patient ID</span>
      <span class="info-value">: ${summaryData.patient_id || summaryData.reg_id || patientInfo.regId || 'N/A'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Primary Care Provider</span>
      <span class="info-value">: ${summaryData.treating_consultant || patientInfo.treatingConsultant || 'N/A'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Registration ID</span>
      <span class="info-value">: ${visitIdString || summaryData.reg_id || 'N/A'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Sex / Age</span>
      <span class="info-value">: ${summaryData.age_sex || patientInfo.ageSex || 'N/A'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Mobile No</span>
      <span class="info-value">: ${summaryData.mobile_no || summaryData.phone || 'N/A'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Tariff</span>
      <span class="info-value">: ${summaryData.corporate_type || patientInfo.corporateType || 'Private'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Address</span>
      <span class="info-value">: ${summaryData.address || patientInfo.address || 'N/A'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Admission Date</span>
      <span class="info-value">: ${summaryData.admission_date ? format(new Date(summaryData.admission_date), 'dd/MM/yyyy') : 'N/A'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Discharge Date</span>
      <span class="info-value">: ${summaryData.date_of_discharge ? format(new Date(summaryData.date_of_discharge), 'dd/MM/yyyy') : currentDate}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Discharge Reason</span>
      <span class="info-value">: ${summaryData.reason_of_discharge || 'Recovered'}</span>
    </div>
  </div>

  ${(() => {
    // Try to extract elaborated DIAGNOSIS from ot_notes (ChatGPT response)
    let diagnosis = summaryData.primary_diagnosis || '';
    if (summaryData.ot_notes) {
      const diagMatch = summaryData.ot_notes.match(/^DIAGNOSIS:\s*([\s\S]*?)(?=\nCLINICAL HISTORY:|\n\n)/i);
      if (diagMatch && diagMatch[1]) {
        diagnosis = diagMatch[1].trim();
      }
    }
    if (!diagnosis) return '';
    return '<div class="section"><div class="section-title">Present Condition</div><div class="section-subtitle">DIAGNOSIS:</div><div class="section-content">' + diagnosis.replace(/\n/g, '<br>') + '</div></div>';
  })()}

  ${medications.length > 0 ? `
  <div class="section">
    <div class="section-subtitle">MEDICATIONS (TREATMENT ON DISCHARGE):</div>
    <table>
      <thead>
        <tr>
          <th>Medication Name</th>
          <th>Unit</th>
          <th>Route</th>
          <th>Dosage</th>
          <th>Duration</th>
        </tr>
      </thead>
      <tbody>
        ${medicationsHTML}
      </tbody>
    </table>
  </div>
  ` : ''}

  ${(() => {
    if (!summaryData.ot_notes) return '';
    // Extract only CLINICAL HISTORY section from ot_notes
    let clinicalHistory = summaryData.ot_notes;

    // Remove "DIAGNOSIS:" section if present (it's rendered separately above)
    clinicalHistory = clinicalHistory.replace(/^DIAGNOSIS:[\s\S]*?(?=\nCLINICAL HISTORY:|\n\n)/i, '');
    // Remove "CLINICAL HISTORY:" header if present (with leading whitespace)
    clinicalHistory = clinicalHistory.replace(/^\s*CLINICAL HISTORY:\s*/i, '');

    // Remove markdown ## headers (e.g., "## Clinical History")
    clinicalHistory = clinicalHistory.replace(/^##\s*.*?\n/gm, '');

    // Extract only up to the next section marker (handles ##, ** and : formats, plus "Upon/On examination" text)
    const sectionMarkers = /(\n\s*\||\n##\s*Examination|\n\*\*EXAMINATION|\nEXAMINATION:|\nUpon examination|\nOn examination|\nMEDICATION|\nADVICE:|\n\*\*ADVICE|\n##\s*Advice|\nOperation Notes)/i;
    const match = clinicalHistory.search(sectionMarkers);
    if (match > 0) {
      clinicalHistory = clinicalHistory.substring(0, match).trim();
    }

    if (!clinicalHistory) return '';
    return '<div class="section"><div class="section-subtitle">CLINICAL HISTORY:</div><div class="section-content">' + clinicalHistory.replace(/\n/g, '<br>') + '</div></div>';
  })()}

  ${(() => {
    if (!summaryData.ot_notes) return '';
    // Extract EXAMINATION section from ot_notes (handles ##, **, : formats and "Upon examination" text)
    const content = summaryData.ot_notes;
    // Try ## Examination format first, then **EXAMINATION**, then EXAMINATION:, then "Upon/On examination"
    let examMatch = content.match(/##\s*Examination\s*([\s\S]*?)(?=\n\s*(?:##\s*Operation|##\s*Advice|##\s*Hospital|Operation Notes|HOSPITAL STAY NOTES|\*\*|$))/i);
    if (!examMatch) {
      examMatch = content.match(/\*\*EXAMINATION\*\*\s*([\s\S]*?)(?=\n\s*(?:\*\*ADVICE|\*\*OPERATION|\*\*HOSPITAL|HOSPITAL STAY NOTES|ADVICE:|Operation Notes|$))/i);
    }
    if (!examMatch) {
      examMatch = content.match(/EXAMINATION:?\s*([\s\S]*?)(?=\n\s*(?:MEDICATIONS|OPERATION|HOSPITAL STAY NOTES|ADVICE:|\*\*|$))/i);
    }
    if (!examMatch) {
      // Try to capture "Upon examination" or "On examination" text directly
      examMatch = content.match(/(Upon examination[\s\S]*?)(?=\n\s*(?:##\s*Operation|Operation Notes|HOSPITAL STAY NOTES|ADVICE:|$))/i);
      if (!examMatch) {
        examMatch = content.match(/(On examination[\s\S]*?)(?=\n\s*(?:##\s*Operation|Operation Notes|HOSPITAL STAY NOTES|ADVICE:|$))/i);
      }
    }
    if (examMatch && examMatch[1]) {
      let examination = examMatch[1].trim();
      // Remove markdown ## headers
      examination = examination.replace(/^##\s*.*?\n/gm, '');

      // Remove investigation-related content from examination section
      // Remove INVESTIGATIONS: section and everything after it
      examination = examination.replace(/INVESTIGATIONS:[\s\S]*/i, '');
      // Remove HOSPITAL STAY NOTES section from examination (safety cleanup)
      examination = examination.replace(/HOSPITAL STAY NOTES:[\s\S]*/i, '');
      // Remove markdown tables (| Test | Result | format)
      examination = examination.replace(/\|[\s\S]*?\|[-]+\|[\s\S]*?(?=\n\n|$)/g, '');
      // Remove lines starting with | (table rows)
      examination = examination.replace(/^\|.*\|.*$/gm, '');
      // Remove lines containing common lab test patterns
      examination = examination.replace(/^.*\b(A\/G Ratio|Globulin|Albumin|Protein|Alkaline Phosphatase|SGPT|SGOT|ALT|AST|Bilirubin|Creatinine|Urea|Hemoglobin|WBC|RBC|Platelet)\b.*$/gim, '');
      // Clean up multiple blank lines
      examination = examination.replace(/\n{3,}/g, '\n\n').trim();

      if (!examination) return '';
      return '<div class="section"><div class="section-subtitle">EXAMINATION:</div><div class="section-content">' + examination.replace(/\n/g, '<br>') + '</div></div>';
    }
    return '';
  })()}

  ${(() => {
    // Use current form data (surgeryRows from state) - show as table
    if (currentSurgeryRows && currentSurgeryRows.length > 0) {
      const surgeries = currentSurgeryRows.filter((s: any) => s.date || s.procedurePerformed);
      if (surgeries.length === 0) return '';

      let html = '<div class="section" style="page-break-inside: auto;"><div class="section-subtitle">Operation Notes</div>';

      // Surgery details table
      html += '<table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px;">';
      html += '<thead><tr style="background-color: #f0f0f0;">';
      html += '<th style="border: 1px solid #ddd; padding: 6px; text-align: left;">S.No</th>';
      html += '<th style="border: 1px solid #ddd; padding: 6px; text-align: left;">Procedure</th>';
      html += '<th style="border: 1px solid #ddd; padding: 6px; text-align: left;">Date/Time</th>';
      html += '<th style="border: 1px solid #ddd; padding: 6px; text-align: left;">Surgeon</th>';
      html += '<th style="border: 1px solid #ddd; padding: 6px; text-align: left;">Anesthetist</th>';
      html += '<th style="border: 1px solid #ddd; padding: 6px; text-align: left;">Anesthesia</th>';
      html += '<th style="border: 1px solid #ddd; padding: 6px; text-align: left;">Implant</th>';
      html += '</tr></thead><tbody>';

      surgeries.forEach((surgery: any, index: number) => {
        const dateStr = surgery.date ? format(new Date(surgery.date), 'dd/MM/yyyy, HH:mm') : '-';
        html += '<tr>';
        html += '<td style="border: 1px solid #ddd; padding: 6px;">' + (index + 1) + '</td>';
        html += '<td style="border: 1px solid #ddd; padding: 6px;">' + (surgery.procedurePerformed || '-') + '</td>';
        html += '<td style="border: 1px solid #ddd; padding: 6px;">' + dateStr + '</td>';
        html += '<td style="border: 1px solid #ddd; padding: 6px;">' + (surgery.surgeon || '-') + '</td>';
        html += '<td style="border: 1px solid #ddd; padding: 6px;">' + (surgery.anesthetist || '-') + '</td>';
        html += '<td style="border: 1px solid #ddd; padding: 6px;">' + (surgery.anesthesia || '-') + '</td>';
        html += '<td style="border: 1px solid #ddd; padding: 6px;">' + (surgery.implant || '-') + '</td>';
        html += '</tr>';
      });

      html += '</tbody></table>';

      // Add description at the end - clean AI preamble first
      if (currentSurgeryDescription) {
        // Remove common AI intro lines that shouldn't appear in print
        const cleanedDescription = currentSurgeryDescription
          .replace(/^Here are the surgical summaries based on the information provided:?\s*/i, '')
          .replace(/^Based on the information provided:?\s*/i, '')
          .replace(/^Here is the surgical summary:?\s*/i, '')
          .replace(/^Here is a brief surgical summary:?\s*/i, '')
          .replace(/^Surgical summary:?\s*/i, '')
          .trim();

        if (cleanedDescription) {
          html += '<div class="section-content" style="margin-top: 15px;"><strong>Description:</strong><br>' + cleanedDescription.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') + '</div>';
        }
      }

      html += '</div>';
      return html;
    }

    return '';
  })()}

  ${(() => {
    // First try to extract ADVICE from ot_notes
    if (summaryData.ot_notes) {
      const content = summaryData.ot_notes;
      const adviceMatch = content.match(/ADVICE:?\s*([\s\S]*?)$/i);
      if (adviceMatch && adviceMatch[1]) {
        const advice = adviceMatch[1].trim();
        if (advice) {
          return '<div class="section"><div class="section-subtitle">ADVICE:</div><div class="section-content">' + advice.replace(/\n/g, '<br>') + '</div></div>';
        }
      }
    }
    // Fallback to original discharge_advice field
    if (summaryData.discharge_advice) {
      return '<div class="section"><div class="section-subtitle">ADVICE:</div><div class="section-content">' + summaryData.discharge_advice.replace(/\n/g, '<br>') + '</div></div>';
    }
    return '';
  })()}

  ${(() => {
    // Hospital Stay Notes - prefer AI-generated from ot_notes, fallback to database field
    // First try to extract from ot_notes (AI-generated)
    if (summaryData.ot_notes) {
      const match = summaryData.ot_notes.match(/HOSPITAL STAY NOTES:?\s*([\s\S]*?)(?=ADVICE|$)/i);
      if (match && match[1]?.trim()) {
        return '<div class="section"><div class="section-subtitle">HOSPITAL STAY NOTES:</div><div class="section-content">' + match[1].trim().replace(/\n/g, '<br>') + '</div></div>';
      }
    }
    // Fallback to database field if no AI-generated content
    if (summaryData.hospital_stay_notes) {
      return '<div class="section"><div class="section-subtitle">HOSPITAL STAY NOTES:</div><div class="section-content">' + summaryData.hospital_stay_notes.replace(/\n/g, '<br>') + '</div></div>';
    }
    return '';
  })()}

  ${(() => {
    const investigationsText = summaryData.lab_investigations?.investigations_text;
    const hasRealLabResults = labResults?.formattedResults && !isPlaceholderInvestigations(labResults.formattedResults);
    const hasRealInvestigationsText = investigationsText && !isPlaceholderInvestigations(investigationsText);

    if (!hasRealLabResults && !hasRealInvestigationsText) return '';

    return `
    <div class="section">
      <div class="section-subtitle">INVESTIGATIONS</div>
      <div class="section-content">${hasRealLabResults ? cleanJSONFromText(labResults.formattedResults).replace(/\n/g, '<br>') : cleanJSONFromText(investigationsText).replace(/\n/g, '<br>')}</div>
    </div>`;
  })()}

  ${summaryData.review_on_date || summaryData.resident_on_discharge ? `
  <table class="review-table">
    <tbody>
      ${summaryData.review_on_date ? `
      <tr>
        <td style="width: 30%; font-weight: bold;">Review on</td>
        <td style="width: 5%;">:</td>
        <td style="text-align: left;">${format(new Date(summaryData.review_on_date), 'dd/MM/yyyy')}</td>
      </tr>
      ` : ''}
      ${summaryData.resident_on_discharge ? `
      <tr>
        <td style="width: 30%; font-weight: bold;">Resident On Discharge</td>
        <td style="width: 5%;">:</td>
        <td style="text-align: left;">${summaryData.resident_on_discharge}</td>
      </tr>
      ` : ''}
    </tbody>
  </table>
  ` : ''}

  <div class="signature-section">
    <strong>${summaryData.treating_consultant || 'Dr. Amod Shirode (IMS Residence)'}</strong>
  </div>

  <div class="emergency-note">
    <strong>Note: URGENT CARE/ EMERGENCY CARE IS AVAILABLE 24 X 7. PLEASE CONTACT: 7030974619, 9373111709.</strong>
  </div>
</body>
</html>
    `;
  };

  // Helper function to format medication timing for print
  const formatMedicationTiming = (timing: any) => {
    if (!timing) return '';
    const times = [];
    if (timing.morning) times.push('सुबह (Morning)');
    if (timing.afternoon) times.push('दोपहर (Afternoon)');
    if (timing.evening) times.push('शाम (Evening)');
    if (timing.night) times.push('रात (Night)');
    return times.join(', ') || '';
  };

  // Function to fetch all discharge summary data and display in textbox
  const handleFetchDischargeSummaryData = async () => {
    try {
      toast({
        title: "Fetching Data",
        description: "Loading discharge summary data from database...",
      });

      console.log('📥 Fetching discharge summary data for visit:', visitId);

      // Get visit UUID from string visit_id
      const { data: visitData } = await supabase
        .from('visits')
        .select('id')
        .eq('visit_id', visitId)
        .single();

      if (!visitData?.id) {
        toast({
          title: "Error",
          description: "Visit not found",
          variant: "destructive"
        });
        return;
      }

      // Get discharge summary from ipd_discharge_summary table (get latest if multiple exist)
      const { data: summaryData, error: summaryError } = await supabase
        .from('ipd_discharge_summary')
        .select('*')
        .eq('visit_id', visitData.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (summaryError) {
        throw summaryError;
      }

      if (!summaryData) {
        toast({
          title: "No Data Found",
          description: "No saved discharge summary found for this patient",
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Found discharge summary data:', summaryData);

      // Format all data into a readable text format for the textbox
      let formattedText = '';

      // Diagnosis
      if (summaryData.primary_diagnosis) {
        formattedText += `DIAGNOSIS:\n${summaryData.primary_diagnosis}\n\n`;
      }

      // Investigations
      if (summaryData.lab_investigations?.investigations_text) {
        formattedText += `INVESTIGATIONS:\n${summaryData.lab_investigations.investigations_text}\n\n`;
      }

      // Case Summary Presenting Complaints
      if (summaryData.chief_complaints) {
        formattedText += `CASE SUMMARY / PRESENTING COMPLAINTS:\n${summaryData.chief_complaints}\n\n`;
      }

      // Advice
      if (summaryData.discharge_advice) {
        formattedText += `ADVICE:\n${summaryData.discharge_advice}\n\n`;
      }

      // Hospital Stay Notes
      if (summaryData.hospital_stay_notes) {
        formattedText += `HOSPITAL STAY NOTES:\n${summaryData.hospital_stay_notes}\n\n`;
      }

      // Examination / Vital Signs
      if (summaryData.vital_signs) {
        formattedText += `EXAMINATION / VITAL SIGNS:\n`;
        if (summaryData.vital_signs.temperature) formattedText += `Temperature: ${summaryData.vital_signs.temperature}°F\n`;
        if (summaryData.vital_signs.pulse_rate) formattedText += `Pulse Rate: ${summaryData.vital_signs.pulse_rate}/min\n`;
        if (summaryData.vital_signs.respiratory_rate) formattedText += `Respiratory Rate: ${summaryData.vital_signs.respiratory_rate}/min\n`;
        if (summaryData.vital_signs.blood_pressure) formattedText += `Blood Pressure: ${summaryData.vital_signs.blood_pressure} mmHg\n`;
        if (summaryData.vital_signs.spo2) formattedText += `SpO2: ${summaryData.vital_signs.spo2}%\n`;
        if (summaryData.vital_signs.examination_details) formattedText += `Details: ${summaryData.vital_signs.examination_details}\n`;
        formattedText += '\n';
      }

      // NOTE: MEDICATIONS are NOT included here - displayed separately in their own section

      // Surgery Details - from current form state (surgeryRows)
      if (surgeryRows && surgeryRows.length > 0) {
        const validSurgeries = surgeryRows.filter((s) => s.date || s.procedurePerformed);
        if (validSurgeries.length > 0) {
          formattedText += `SURGERY DETAILS:\n`;
          validSurgeries.forEach((surgery, index) => {
            formattedText += `Surgery ${index + 1}:\n`;
            if (surgery.date) formattedText += `  Date: ${surgery.date}\n`;
            if (surgery.procedurePerformed) formattedText += `  Procedure: ${surgery.procedurePerformed}\n`;
            if (surgery.surgeon) formattedText += `  Surgeon: ${surgery.surgeon}\n`;
            if (surgery.anesthetist) formattedText += `  Anaesthetist: ${surgery.anesthetist}\n`;
            if (surgery.anesthesia) formattedText += `  Anaesthesia: ${surgery.anesthesia}\n`;
            if (surgery.implant) formattedText += `  Implant: ${surgery.implant}\n`;
          });
          if (sharedSurgeryDescription) {
            formattedText += `Description: ${sharedSurgeryDescription}\n`;
          }
          formattedText += '\n';
        }
      }

      // Display formatted text in the newTemplateContent textarea (above Fetch Data button)
      setNewTemplateContent(formattedText);

      toast({
        title: "Success",
        description: "Discharge summary data loaded successfully!",
      });

      console.log('✅ Discharge summary data formatted and displayed');

    } catch (error) {
      console.error('❌ Error fetching discharge summary data:', error);
      toast({
        title: "Error",
        description: `Failed to fetch data: ${error.message}`,
        variant: "destructive"
      });
    }
  };


  const handleFetchInvestigations = async () => {
    try {
      toast({
        title: "Searching Investigations",
        description: "Searching for lab results and radiology data...",
      });

      console.log('🔍 Searching investigations for visit_id:', visitId);
      let combinedResults = [];

      // First, get the visit UUID from the visit_id string
      const { data: visitData } = await supabase
        .from('visits')
        .select('id')
        .eq('visit_id', visitId)
        .single();

      const visitUUID = visitData?.id;
      console.log('🔍 Visit UUID found:', visitUUID);

      // Search for lab results using the UUID
      console.log('🧪 Searching lab results for visit UUID:', visitUUID);

      let data, error;

      // First try with TEXT visit_id (e.g., "IH25L06010") - this is how LabOrders saves results
      console.log('🧪 Fetching lab results for TEXT visit_id:', visitId);

      let result = await supabase
        .from('lab_results')
        .select(`
          id,
          visit_id,
          test_name,
          test_category,
          result_value,
          result_unit,
          main_test_name,
          created_at,
          updated_at
        `)
        .eq('visit_id', visitId)
        .order('created_at', { ascending: false })
        .order('updated_at', { ascending: false });

      data = result.data;
      error = result.error;

      console.log('✅ Lab results fetched with TEXT visit_id:', {
        count: data?.length,
        firstResult: data?.[0],
        error
      });

      // If no results with text visit_id, try with UUID as fallback
      if ((!data || data.length === 0) && visitUUID) {
        console.log('🧪 No results with text visit_id, trying UUID:', visitUUID);

        result = await supabase
          .from('lab_results')
          .select(`
            id,
            visit_id,
            test_name,
            test_category,
            result_value,
            result_unit,
            main_test_name,
            created_at,
            updated_at
          `)
          .eq('visit_id', visitUUID)
          .order('created_at', { ascending: false })
          .order('updated_at', { ascending: false });

        data = result.data;
        error = result.error;

        console.log('✅ Lab results fetched with UUID:', {
          count: data?.length,
          firstResult: data?.[0],
          error
        });
      }

      // If still no results, try by patient_name (fallback since visit_id may not be linked)
      if ((!data || data.length === 0) && patientData?.patients?.name) {
        console.log('🧪 No results with visit_id, trying by patient_name:', patientData.patients.name);

        result = await supabase
          .from('lab_results')
          .select(`
            id,
            visit_id,
            test_name,
            test_category,
            result_value,
            result_unit,
            main_test_name,
            created_at,
            updated_at
          `)
          .ilike('patient_name', `%${patientData.patients.name}%`)
          .order('created_at', { ascending: false });

        data = result.data;
        error = result.error;

        console.log('✅ Lab results fetched by patient_name:', {
          count: data?.length,
          firstResult: data?.[0],
          error
        });
      }

      // Log first few results to see what we got
      if (data && data.length > 0) {
        console.log('📋 First 3 results:', data.slice(0, 3));
      }

      // Note: Don't return early here - continue to check visit_labs and radiology tables
      if (!data || data.length === 0) {
        console.log('No lab_results found, will check visit_labs table next...');
      }

      // Process lab results
      if (data && data.length > 0) {
        console.log('✅ Found lab results:', data.length);

        const groupedLabResults = data.reduce((acc, result) => {
          const date = result.created_at;
          const formattedDate = date ? format(new Date(date), 'dd/MM/yyyy') : 'Unknown Date';

          if (!acc[formattedDate]) {
            acc[formattedDate] = {};
          }

          const category = result.main_test_name || result.test_category || 'General Tests';
          if (!acc[formattedDate][category]) {
            acc[formattedDate][category] = [];
          }

          acc[formattedDate][category].push(result);
          return acc;
        }, {});

        const formattedLabResults = Object.entries(groupedLabResults)
          .map(([date, categories]) => {
            return Object.entries(categories)
              .map(([categoryName, results]) => {
                const resultString = results
                  .map(result => {
                    // Use the new extractValueFromJSON function
                    const value = extractValueFromJSON(result.result_value);

                    console.log(`🔬 ${categoryName} - ${result.test_name}:`, {
                      raw: result.result_value,
                      extracted: value
                    });

                    // Skip if no value
                    if (value === 'N/A' && !result.result_value) {
                      return null;
                    }

                    const unit = result.result_unit ? ` ${result.result_unit}` : '';

                    // Only include test_name if it's different from category name
                    if (result.test_name && result.test_name !== categoryName) {
                      return `${result.test_name}:${value}${unit}`;
                    } else {
                      return `${value}${unit}`;
                    }
                  })
                  .filter(item => item !== null) // Remove null entries
                  .join(', ');

                return `${date}:-${categoryName}: ${resultString}`;
              })
              .join('\n');
          })
          .join('\n\n');

        combinedResults.push(formattedLabResults);
      }

      // Track visit_labs count for toast message
      let visitLabsCount = 0;

      // Track which tests already have detailed results from lab_results
      const testsWithResults = new Set<string>();
      if (data && data.length > 0) {
        data.forEach((result: any) => {
          const mainTestName = result.main_test_name || result.test_category;
          if (mainTestName) {
            testsWithResults.add(mainTestName.toLowerCase());
          }
        });
        console.log('📋 Tests with detailed results:', Array.from(testsWithResults));
      }

      // Also fetch from visit_labs table (where Lab Dashboard stores results)
      if (visitUUID) {
        console.log('🧪 Fetching from visit_labs for visit UUID:', visitUUID);

        // Step 1: Simple query without join to verify data exists
        const { data: visitLabsData, error: visitLabsError } = await supabase
          .from('visit_labs')
          .select('*')
          .eq('visit_id', visitUUID)
          .order('created_at', { ascending: false });

        console.log('✅ visit_labs raw query result:', {
          count: visitLabsData?.length || 0,
          error: visitLabsError,
          data: visitLabsData
        });

        if (visitLabsData && visitLabsData.length > 0) {
          // Update count for toast message
          visitLabsCount = visitLabsData.length;

          // Step 2: Fetch lab details separately
          const labIds = [...new Set(visitLabsData.map((vl: any) => vl.lab_id).filter(Boolean))];
          console.log('🔬 Fetching lab details for IDs:', labIds);

          const { data: labDetails, error: labError } = await supabase
            .from('lab')
            .select('id, name, category, description')
            .in('id', labIds);

          console.log('🔬 Lab details result:', { labDetails, labError });

          // Create a lookup map
          const labMap: Record<string, any> = {};
          labDetails?.forEach((l: any) => {
            labMap[l.id] = l;
          });

          // Enrich visitLabsData with lab info
          const enrichedData = visitLabsData.map((vl: any) => ({
            ...vl,
            lab: labMap[vl.lab_id] || null
          }));

          // Group by date and TEST NAME (for detailed results format)
          // Skip tests that already have detailed results from lab_results
          const groupedVisitLabs = enrichedData.reduce((acc: any, item: any) => {
            const date = format(new Date(item.ordered_date || item.created_at), 'dd/MM/yyyy');
            const testName = item.lab?.name || 'Unknown Test';

            // Skip if this test already has detailed results from lab_results
            if (testsWithResults.has(testName.toLowerCase())) {
              console.log(`⏭️ Skipping ${testName} - already has detailed results`);
              return acc;
            }

            const key = `${date}-${testName}`;

            if (!acc[key]) {
              acc[key] = {
                date,
                testName,
                resultValue: item.result_value || null,
                status: item.status
              };
            } else if (item.result_value && !acc[key].resultValue) {
              // Update with result value if we didn't have one
              acc[key].resultValue = item.result_value;
            }

            return acc;
          }, {});

          const formattedVisitLabs = Object.values(groupedVisitLabs)
            .map((group: any) => {
              if (group.resultValue) {
                // Has results - show test name with detailed values
                return `${group.date}:-${group.testName}: ${group.resultValue}`;
              } else {
                // No results yet - show test name with status
                return `${group.date}:-${group.testName} (${group.status || 'ordered'})`;
              }
            })
            .join('\n');

          // Don't include visit_labs status in discharge summary - only show actual lab results with values
          // if (formattedVisitLabs) {
          //   console.log('📋 Formatted visit_labs data:', formattedVisitLabs);
          //   combinedResults.push(formattedVisitLabs);
          // }
        }
      }

      // Now fetch radiology data
      console.log('🩻 Searching radiology data for visit_id:', visitId);

      // Try to get radiology data using the visit's UUID (from patientData)
      let radiologyResults = [];

      if (patientData?.id) {
        console.log('🔍 Trying radiology lookup with visit UUID:', patientData.id);
        const { data: radiologyViaUUID } = await supabase
          .from('visit_radiology')
          .select(`
            id,
            status,
            ordered_date,
            scheduled_date,
            completed_date,
            findings,
            impression,
            notes,
            radiology!inner(
              id,
              name,
              category,
              description
            )
          `)
          .eq('visit_id', patientData.id)
          .order('ordered_date', { ascending: false });

        if (radiologyViaUUID && radiologyViaUUID.length > 0) {
          radiologyResults = radiologyViaUUID;
          console.log('✅ Found radiology data via visit UUID:', radiologyResults.length, 'studies');
        }
      }

      // Process radiology results
      if (radiologyResults.length > 0) {
        const groupedRadiologyResults = radiologyResults.reduce((acc, result) => {
          const date = result.ordered_date || result.scheduled_date;
          const formattedDate = date ? format(new Date(date), 'dd/MM/yyyy') : 'Unknown Date';

          if (!acc[formattedDate]) {
            acc[formattedDate] = {};
          }

          const category = result.radiology.category || 'Radiology';
          if (!acc[formattedDate][category]) {
            acc[formattedDate][category] = [];
          }

          acc[formattedDate][category].push(result);
          return acc;
        }, {});

        const formattedRadiologyResults = Object.entries(groupedRadiologyResults)
          .map(([date, categories]) => {
            return Object.entries(categories)
              .map(([categoryName, studies]) => {
                const studyString = studies
                  .map(study => {
                    const name = study.radiology.name;
                    const status = study.status ? ` (${study.status})` : '';
                    const findings = study.findings ? `, Findings: ${study.findings}` : '';
                    const impression = study.impression ? `, Impression: ${study.impression}` : '';
                    return `${name}${status}${findings}${impression}`;
                  })
                  .join(', ');

                return `${date}:-${categoryName}: ${studyString}`;
              })
              .join('\n');
          })
          .join('\n\n');

        combinedResults.push(formattedRadiologyResults);
      }

      // Combine all results - only add RADIOLOGY separator before actual radiology data
      if (combinedResults.length > 0) {
        let labResultsSection = '';
        let radiologySection = '';

        // Check if last item contains radiology data (radiology is always pushed last)
        if (radiologyResults.length > 0 && combinedResults.length > 1) {
          // Last item is radiology, everything else is lab data
          labResultsSection = combinedResults.slice(0, -1).join('\n\n');
          radiologySection = combinedResults[combinedResults.length - 1];
        } else {
          // No radiology or only one item - join all as lab data
          labResultsSection = combinedResults.join('\n\n');
        }

        const finalResults = radiologySection
          ? `${labResultsSection}\n\n--- RADIOLOGY ---\n\n${radiologySection}`
          : labResultsSection;

        // IMPORTANT: Clean any JSON that might still be in the text
        console.log('🧹 Auto-cleaning fetched data before displaying...');
        const cleanedResults = cleanJSONFromText(finalResults);
        console.log('✅ Auto-clean complete, setting investigations');

        setInvestigations(cleanedResults);

        const labCount = (data?.length || 0) + visitLabsCount;
        const radiologyCount = radiologyResults.length;

        toast({
          title: "Success",
          description: `Fetched ${labCount} lab results and ${radiologyCount} radiology studies.`,
        });
      } else {
        // No data found
        setInvestigations(`No investigations found in database for visit ID: ${visitId}

You can manually enter investigations in this format:

LAB RESULTS:
DD/MM/YYYY:-Test Category: Test1:Value1 unit, Test2:Value2 unit

RADIOLOGY:
DD/MM/YYYY:-Study Category: Study Name (status), Findings: findings, Impression: impression

Example:
26/09/2024:-KFT (Kidney Function Test): Blood Urea:39.3 mg/dl, Creatinine:1.03 mg/dl, Sr. Sodium:147 mmol/L

--- RADIOLOGY ---

26/09/2024:-Chest Imaging: Chest X-Ray (completed), Findings: Clear lungs, Impression: Normal study`);

        toast({
          title: "No Data Found",
          description: "No investigations found for this visit. You can enter them manually.",
        });
      }
    } catch (error) {
      console.error('Error fetching investigations:', error);
      setInvestigations(`Error occurred while fetching lab results.

You can still manually enter lab results in this format:
DD/MM/YYYY:-Test Category: Test1:Value1 unit, Test2:Value2 unit`);

      toast({
        title: "Error",
        description: "Error occurred, but you can still enter lab results manually.",
      });
    }
  };

  // Function to clear all caches and force refresh
  const handleClearCacheAndRefresh = () => {
    try {
      queryClient.clear();
      sessionStorage.clear();

      // Clear React Query related localStorage items
      Object.keys(localStorage).forEach(key => {
        if (key.includes('react-query') || key.includes('discharge') || key.includes('investigation')) {
          localStorage.removeItem(key);
        }
      });

      toast({
        title: "Cache Cleared",
        description: "All caches have been cleared. Refreshing page...",
      });

      // Force a hard refresh after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.log('Cache clearing attempt completed');
      toast({
        title: "Cache Clear Attempted",
        description: "Cache clearing attempted. Please refresh the page manually.",
      });
    }
  };

  // Force complete page refresh on component mount to clear all browser cache
  React.useEffect(() => {
    const isFirstLoad = !sessionStorage.getItem('discharge-summary-loaded');

    if (isFirstLoad) {
      sessionStorage.setItem('discharge-summary-loaded', 'true');
      // Clear all possible caches on first load
      try {
        queryClient.clear();

        // Clear any cached data that might be causing errors
        Object.keys(localStorage).forEach(key => {
          if (key.includes('react-query') ||
              key.includes('supabase') ||
              key.includes('discharge') ||
              key.includes('investigation') ||
              key.includes('patient-data')) {
            localStorage.removeItem(key);
          }
        });

        console.log('✅ Browser cache fully cleared on component mount');
      } catch (error) {
        console.log('Cache clearing completed with minor issues');
      }
    }
  }, [queryClient]);

  // Show loading spinner while patient data is being fetched
  if (isPatientLoading || isInvestigationsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mb-4"></div>
            <p className="text-gray-600 mb-2">
              {isPatientLoading && 'Loading patient data...'}
              {isInvestigationsLoading && 'Loading lab results...'}
            </p>
            <p className="text-sm text-gray-500">
              Visit ID: <code className="bg-gray-100 px-1 py-0.5 rounded">{visitId}</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Create a fallback component that shows a working form even when no data exists
  const renderFallbackForm = () => {
    return (
      <form id="discharge_summaryForm" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
        <div className="container mx-auto p-6 space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="text-yellow-800">
              <h3 className="font-semibold">⚠️ No Data Found for Visit ID: {visitId}</h3>
              <p className="text-sm mt-1">
                Working with demo/placeholder data. You can still use the form to create a new discharge summary.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            IPD Discharge Summary
            <span className="text-lg font-normal text-gray-600 ml-2">
              - New Patient ({visitId})
            </span>
          </h1>
          <div className="space-x-2">
            <Button onClick={handleSave}>Save</Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      onClick={handlePrintPreview}
                      className="bg-blue-600 hover:bg-blue-700"
                      disabled={!patientData?.bill_paid}
                    >
                      Print Preview
                    </Button>
                  </span>
                </TooltipTrigger>
                {!patientData?.bill_paid && (
                  <TooltipContent className="bg-red-600 text-white border-red-700 font-semibold">
                    <p className="flex items-center gap-2">
                      <span className="text-lg">⚠️</span>
                      Please complete final payment
                    </p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            <Button
              onClick={() => navigate('/todays-ipd')}
              variant="outline"
              className="border-gray-300 hover:bg-gray-50"
            >
              Close
            </Button>
          </div>
        </div>

        {/* Patient Information with placeholder data */}
        <Card>
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name:</Label>
                <Input
                  value={patientInfo.name}
                  onChange={(e) => setPatientInfo({...patientInfo, name: e.target.value})}
                  placeholder="Enter patient name"
                />
              </div>
              <div className="space-y-2">
                <Label>Reg ID:</Label>
                <Input
                  value={patientInfo.regId}
                  onChange={(e) => setPatientInfo({...patientInfo, regId: e.target.value})}
                  placeholder="Enter registration ID"
                />
              </div>
              <div className="space-y-2">
                <Label>Address:</Label>
                <Input
                  value={patientInfo.address}
                  onChange={(e) => setPatientInfo({...patientInfo, address: e.target.value})}
                  placeholder="Enter patient address"
                />
              </div>
              <div className="space-y-2">
                <Label>Age/Sex:</Label>
                <Input
                  value={patientInfo.ageSex}
                  onChange={(e) => setPatientInfo({...patientInfo, ageSex: e.target.value})}
                  placeholder="Enter age/sex"
                />
              </div>
              <div className="space-y-2">
                <Label>Treating Consultant:</Label>
                <Input
                  value={patientInfo.treatingConsultant}
                  onChange={(e) => setPatientInfo({...patientInfo, treatingConsultant: e.target.value})}
                  placeholder="Enter treating consultant"
                />
              </div>
              <div className="space-y-2">
                <Label>DOA:</Label>
                <Input
                  type="date"
                  value={patientInfo.doa}
                  onChange={(e) => setPatientInfo({...patientInfo, doa: e.target.value})}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Investigations with demo data fetching */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Investigations:</span>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleFetchInvestigations}
                >
                  Try Fetch Lab Data
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={investigations}
              onChange={(e) => setInvestigations(e.target.value)}
              placeholder="Enter investigation details here. You can manually add lab results in the format: DD/MM/YYYY:-Test Name: Result1:Value1 unit, Result2:Value2 unit"
              className="min-h-[120px]"
            />
            <div className="text-sm text-gray-600">
              💡 Tip: You can manually enter lab results or try the "Try Fetch Lab Data" button to search for any existing data.
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center space-x-4 pb-6">
          <Button onClick={handleSave} className="px-8 py-2 bg-blue-600 hover:bg-blue-700">
            Save New Summary
          </Button>
          <Button
            onClick={() => navigate('/todays-ipd')}
            variant="outline"
            className="px-8 py-2 border-gray-300 hover:bg-gray-50"
          >
            Back to Dashboard
          </Button>
        </div>
        </div>
      </form>
    );
  };

  // Show error if patient data not found, but provide working fallback form
  if (!patientData && !isPatientLoading && patientError) {
    return renderFallbackForm();
  }

  return (
    <form id="discharge_summaryForm" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
      <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          IPD Discharge Summary
          {patientData && (
            <span className="text-lg font-normal text-gray-600 ml-2">
              - {patientData.patients.name} ({patientData.patients.patients_id})
            </span>
          )}
        </h1>
        <div className="space-x-2">
          <Button onClick={handleSave}>Save</Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    onClick={handlePrintPreview}
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={!patientData?.bill_paid}
                  >
                    Print Preview
                  </Button>
                </span>
              </TooltipTrigger>
              {!patientData?.bill_paid && (
                <TooltipContent className="bg-red-600 text-white border-red-700 font-semibold">
                  <p className="flex items-center gap-2">
                    <span className="text-lg">⚠️</span>
                    Please complete final payment
                  </p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          <Button
            onClick={handleClearCacheAndRefresh}
            variant="outline"
            className="bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
          >
            Clear Cache & Refresh
          </Button>
          <Button
            onClick={() => navigate('/todays-ipd')}
            variant="outline"
            className="border-gray-300 hover:bg-gray-50"
          >
            Close
          </Button>
        </div>
      </div>

      {/* Patient Information */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name:</Label>
              <Input
                value={patientInfo.name}
                onChange={(e) => setPatientInfo({...patientInfo, name: e.target.value})}
                placeholder="Patient Name"
              />
            </div>
            <div className="space-y-2">
              <Label>Reg ID:</Label>
              <Input
                value={patientInfo.regId}
                onChange={(e) => setPatientInfo({...patientInfo, regId: e.target.value})}
                placeholder="Registration ID"
              />
            </div>
            <div className="space-y-2">
              <Label>Address:</Label>
              <Input
                value={patientInfo.address}
                onChange={(e) => setPatientInfo({...patientInfo, address: e.target.value})}
                placeholder="Patient Address"
              />
            </div>
            <div className="space-y-2">
              <Label>Age/Sex:</Label>
              <Input
                value={patientInfo.ageSex}
                onChange={(e) => setPatientInfo({...patientInfo, ageSex: e.target.value})}
                placeholder="Age/Sex"
              />
            </div>
            <div className="space-y-2">
              <Label>Treating Consultant:</Label>
              <Input
                value={patientInfo.treatingConsultant}
                onChange={(e) => setPatientInfo({...patientInfo, treatingConsultant: e.target.value})}
                placeholder="Treating Consultant"
              />
            </div>
            <div className="space-y-2">
              <Label>DOA:</Label>
              <Input
                type="date"
                value={patientInfo.doa}
                onChange={(e) => setPatientInfo({...patientInfo, doa: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Other Consultants:</Label>
              <Textarea
                value={patientInfo.otherConsultants}
                onChange={(e) => setPatientInfo({...patientInfo, otherConsultants: e.target.value})}
                placeholder="Other Consultants"
                className="min-h-[80px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Date Of Discharge:</Label>
              <Input
                type="date"
                value={patientInfo.dateOfDischarge}
                onChange={(e) => setPatientInfo({...patientInfo, dateOfDischarge: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Reason Of Discharge:</Label>
              <Select
                value={patientInfo.reasonOfDischarge}
                onValueChange={(value) => setPatientInfo({...patientInfo, reasonOfDischarge: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Please select">Please select</SelectItem>
                  <SelectItem value="DAMA">DAMA</SelectItem>
                  <SelectItem value="Discharge on request">Discharge on request</SelectItem>
                  <SelectItem value="Death">Death</SelectItem>
                  <SelectItem value="Recovered">Recovered</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Corporate Type:</Label>
              <Input
                value={patientInfo.corporateType}
                onChange={(e) => setPatientInfo({...patientInfo, corporateType: e.target.value})}
                placeholder="Corporate Type"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Diagnosis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Diagnosis</span>
            {isDiagnosisLoading && (
              <div className="flex items-center text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                Loading diagnosis data...
              </div>
            )}
            {visitDiagnosisData && visitDiagnosisData.length > 0 && (
              <Badge variant="secondary" className="text-green-700 bg-green-100">
                {visitDiagnosisData.length} Diagnosis(es) Found
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Diagnosis Details:</Label>
            <Textarea
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="Enter diagnosis details..."
              className="min-h-[120px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Case Summary Presenting Complaints */}
      <Card>
        <CardHeader>
          <CardTitle>Case Summary Presenting Complaints:</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={caseSummaryPresentingComplaints}
            onChange={(e) => setCaseSummaryPresentingComplaints(e.target.value)}
            placeholder="Enter case summary and presenting complaints..."
            className="min-h-[120px]"
          />
        </CardContent>
      </Card>

      {/* Advice */}
      <Card>
        <CardHeader>
          <CardTitle>Advice:</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={advice}
            onChange={(e) => setAdvice(e.target.value)}
            placeholder="Enter discharge advice..."
            className="min-h-[120px]"
          />
        </CardContent>
      </Card>

      {/* Hospital Stay Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Hospital Stay Notes:</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={hospitalStayNotes}
            onChange={(e) => setHospitalStayNotes(e.target.value)}
            placeholder="Enter hospital stay notes..."
            className="min-h-[120px]"
          />
        </CardContent>
      </Card>

      {/* Treatment on Discharge */}
      <Card>
        <CardHeader>
          <CardTitle>Treatment on Discharge:</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-2 py-2 text-sm">Name of Medication</th>
                  <th className="border border-gray-300 px-2 py-2 text-sm">Unit</th>
                  <th className="border border-gray-300 px-2 py-2 text-sm">Remark</th>
                  <th className="border border-gray-300 px-2 py-2 text-sm">Route</th>
                  <th className="border border-gray-300 px-2 py-2 text-sm">Dose</th>
                  <th className="border border-gray-300 px-2 py-2 text-sm">Quantity</th>
                  <th className="border border-gray-300 px-2 py-2 text-sm">No. of Days</th>
                  <th className="border border-gray-300 px-2 py-2 text-sm">Start Date</th>
                  <th className="border border-gray-300 px-2 py-2 text-sm">Timing</th>
                  <th className="border border-gray-300 px-2 py-2 text-sm">Is SOS</th>
                </tr>
              </thead>
              <tbody>
                {medicationRows.map((row, index) => (
                  <tr key={row.id}>
                    <td className="border border-gray-300 px-1 py-1 relative">
                      <div className="relative">
                        <Input
                          value={row.name}
                          onChange={(e) => {
                            updateMedicationRow(row.id, 'name', e.target.value);
                            setMedicationSearchTerm(e.target.value);
                            setActiveSearchRowId(row.id);
                          }}
                          onFocus={() => setActiveSearchRowId(row.id)}
                          onBlur={() => setTimeout(() => setActiveSearchRowId(null), 300)}
                          className="border-0 focus:ring-0 text-sm"
                          placeholder="Search medicine name..."
                        />
                        {medicationSearchTerm.length >= 2 && availableMedications.length > 0 && activeSearchRowId === row.id && (
                          <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
                            {availableMedications.map((medication) => (
                              <div
                                key={medication.id}
                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                                onMouseDown={(e) => {
                                  e.preventDefault(); // Prevent blur event
                                  const medicationName = medication.name + (medication.strength ? ` ${medication.strength}` : '');
                                  updateMedicationRow(row.id, 'name', medicationName);
                                  setMedicationSearchTerm('');
                                  setActiveSearchRowId(null);
                                }}
                              >
                                <div className="font-medium text-gray-900">{medication.name}</div>
                                {medication.strength && (
                                  <div className="text-xs text-gray-500">Strength: {medication.strength}</div>
                                )}
                                {medication.generic_name && (
                                  <div className="text-xs text-gray-500">Generic: {medication.generic_name}</div>
                                )}
                                {medication.manufacturer && (
                                  <div className="text-xs text-gray-400">Mfg: {medication.manufacturer}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="border border-gray-300 px-1 py-1">
                      <Input
                        value={row.unit}
                        onChange={(e) => updateMedicationRow(row.id, 'unit', e.target.value)}
                        className="border-0 focus:ring-0 text-sm"
                      />
                    </td>
                    <td className="border border-gray-300 px-1 py-1">
                      <Input
                        value={row.remark}
                        onChange={(e) => updateMedicationRow(row.id, 'remark', e.target.value)}
                        className="border-0 focus:ring-0 text-sm"
                      />
                    </td>
                    <td className="border border-gray-300 px-1 py-1">
                      <Select
                        value={row.route}
                        onValueChange={(value) => updateMedicationRow(row.id, 'route', value)}
                      >
                        <SelectTrigger className="border-0 focus:ring-0 text-sm h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Select">Select</SelectItem>
                          <SelectItem value="PO">PO</SelectItem>
                          <SelectItem value="IV">IV</SelectItem>
                          <SelectItem value="IM">IM</SelectItem>
                          <SelectItem value="S/C">S/C</SelectItem>
                          <SelectItem value="PR">PR</SelectItem>
                          <SelectItem value="P/V">P/V</SelectItem>
                          <SelectItem value="R.T">R.T</SelectItem>
                          <SelectItem value="LA">LA</SelectItem>
                          <SelectItem value="Topical">Topical</SelectItem>
                          <SelectItem value="Oral">Oral</SelectItem>
                          <SelectItem value="Sublingual">Sublingual</SelectItem>
                          <SelectItem value="Inhalation">Inhalation</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="border border-gray-300 px-1 py-1">
                      <Select
                        value={row.dose}
                        onValueChange={(value) => updateMedicationRow(row.id, 'dose', value)}
                      >
                        <SelectTrigger className="border-0 focus:ring-0 text-sm h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Select">Select</SelectItem>
                          <SelectItem value="SOS">SOS</SelectItem>
                          <SelectItem value="OD">OD</SelectItem>
                          <SelectItem value="BD">BD</SelectItem>
                          <SelectItem value="TDS">TDS</SelectItem>
                          <SelectItem value="QID">QID</SelectItem>
                          <SelectItem value="HS">HS</SelectItem>
                          <SelectItem value="Twice a week">Twice a week</SelectItem>
                          <SelectItem value="Once a week">Once a week</SelectItem>
                          <SelectItem value="Once fort nightly">Once fort nightly</SelectItem>
                          <SelectItem value="Once a month">Once a month</SelectItem>
                          <SelectItem value="A/D">A/D</SelectItem>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="0.5">0.5</SelectItem>
                          <SelectItem value="1/2">1/2</SelectItem>
                          <SelectItem value="1/4">1/4</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="border border-gray-300 px-1 py-1">
                      <Input
                        value={row.quantity}
                        onChange={(e) => updateMedicationRow(row.id, 'quantity', e.target.value)}
                        className="border-0 focus:ring-0 text-sm"
                      />
                    </td>
                    <td className="border border-gray-300 px-1 py-1">
                      <Input
                        value={row.days}
                        onChange={(e) => updateMedicationRow(row.id, 'days', e.target.value)}
                        className="border-0 focus:ring-0 text-sm"
                      />
                    </td>
                    <td className="border border-gray-300 px-1 py-1">
                      <Input
                        type="date"
                        value={row.startDate}
                        onChange={(e) => updateMedicationRow(row.id, 'startDate', e.target.value)}
                        className="border-0 focus:ring-0 text-sm"
                      />
                    </td>
                    <td className="border border-gray-300 px-1 py-1">
                      <div className="flex space-x-1">
                        {['I', 'II', 'III', 'IV'].map((timing, timingIndex) => (
                          <Select key={timing}>
                            <SelectTrigger className="border-0 focus:ring-0 text-xs h-6 w-16">
                              <SelectValue placeholder={timing} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1AM">1AM</SelectItem>
                              <SelectItem value="2AM">2AM</SelectItem>
                              <SelectItem value="3AM">3AM</SelectItem>
                              <SelectItem value="4AM">4AM</SelectItem>
                              <SelectItem value="5AM">5AM</SelectItem>
                              <SelectItem value="6AM">6AM</SelectItem>
                              <SelectItem value="7AM">7AM</SelectItem>
                              <SelectItem value="8AM">8AM</SelectItem>
                              <SelectItem value="9AM">9AM</SelectItem>
                              <SelectItem value="10AM">10AM</SelectItem>
                              <SelectItem value="11AM">11AM</SelectItem>
                              <SelectItem value="12AM">12AM</SelectItem>
                              <SelectItem value="1PM">1PM</SelectItem>
                              <SelectItem value="2PM">2PM</SelectItem>
                              <SelectItem value="3PM">3PM</SelectItem>
                              <SelectItem value="4PM">4PM</SelectItem>
                              <SelectItem value="5PM">5PM</SelectItem>
                              <SelectItem value="6PM">6PM</SelectItem>
                              <SelectItem value="7PM">7PM</SelectItem>
                              <SelectItem value="8PM">8PM</SelectItem>
                              <SelectItem value="9PM">9PM</SelectItem>
                              <SelectItem value="10PM">10PM</SelectItem>
                              <SelectItem value="11PM">11PM</SelectItem>
                              <SelectItem value="12PM">12PM</SelectItem>
                            </SelectContent>
                          </Select>
                        ))}
                      </div>
                    </td>
                    <td className="border border-gray-300 px-1 py-1 text-center">
                      <Checkbox
                        checked={row.isSos}
                        onCheckedChange={(checked) => updateMedicationRow(row.id, 'isSos', checked)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex space-x-2 mt-2">
              <Button onClick={addMedicationRow} size="sm">Add More</Button>
              <Button onClick={() => removeMedicationRow(medicationRows[medicationRows.length - 1]?.id)} size="sm" variant="outline">Remove</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Examination */}
      <Card>
        <CardHeader>
          <CardTitle>Examination</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label>Temp:</Label>
              <div className="flex items-center space-x-2">
                <Input
                  value={examination.temp}
                  onChange={(e) => setExamination({...examination, temp: e.target.value})}
                  className="text-sm"
                />
                <span className="text-sm">°F</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>P.R:</Label>
              <div className="flex items-center space-x-2">
                <Input
                  value={examination.pr}
                  onChange={(e) => setExamination({...examination, pr: e.target.value})}
                  className="text-sm"
                />
                <span className="text-sm">/Min</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>R.R:</Label>
              <div className="flex items-center space-x-2">
                <Input
                  value={examination.rr}
                  onChange={(e) => setExamination({...examination, rr: e.target.value})}
                  className="text-sm"
                />
                <span className="text-sm">/Min</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>BP:</Label>
              <div className="flex items-center space-x-2">
                <Input
                  value={examination.bp}
                  onChange={(e) => setExamination({...examination, bp: e.target.value})}
                  className="text-sm"
                />
                <span className="text-sm">mmHg</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>SPO₂:</Label>
              <div className="flex items-center space-x-2">
                <Input
                  value={examination.spo2}
                  onChange={(e) => setExamination({...examination, spo2: e.target.value})}
                  className="text-sm"
                />
                <span className="text-sm">% in Room Air</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investigations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Investigations:</span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleFetchInvestigations}
              disabled={isInvestigationsLoading}
            >
              {isInvestigationsLoading ? 'Loading...' : 'Fetch Lab & Radiology Data'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={printRecentOnly}
              onCheckedChange={setPrintRecentOnly}
            />
            <Label>Print Recent Investigation only</Label>
          </div>
          <Textarea
            value={investigations}
            onChange={(e) => setInvestigations(e.target.value)}
            placeholder="Investigation details will be populated here..."
            className="min-h-[120px]"
          />
          <div className="text-sm text-gray-600">
            {isInvestigationsLoading ? 'Loading lab results and radiology data...' : 'Click "Fetch Lab & Radiology Data" to load latest results.'}
          </div>
        </CardContent>
      </Card>

      {/* Surgery Details - Multiple Surgery Forms */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Surgery Details</span>
            <div className="flex items-center gap-2">
              {(isSurgeryLoading || isOtNotesLoading) && (
                <div className="flex items-center text-sm text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                  {isSurgeryLoading && isOtNotesLoading ? 'Loading surgery & OT data...' :
                   isSurgeryLoading ? 'Loading surgery data...' :
                   'Loading OT notes...'}
                </div>
              )}
              {visitSurgeryData && visitSurgeryData.length > 0 && (
                <Badge variant="secondary" className="text-green-700 bg-green-100">
                  {visitSurgeryData.length} Surgery(s) Found
                </Badge>
              )}
              <Button
                size="sm"
                variant="outline"
                className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                onClick={addSurgeryRow}
              >
                + Add Surgery
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Multiple Surgery Forms */}
          {surgeryRows.map((surgery, index) => (
            <div key={surgery.id} className="border rounded-lg p-4 bg-gray-50 relative">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-700">Surgery #{index + 1}</h4>
                {surgeryRows.length > 1 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:bg-red-50 hover:text-red-700"
                    onClick={() => removeSurgeryRow(surgery.id)}
                  >
                    Remove
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date:</Label>
                  <Input
                    type="datetime-local"
                    value={surgery.date}
                    onChange={(e) => updateSurgeryRow(surgery.id, 'date', e.target.value)}
                    placeholder="Select date and time"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Procedure Performed:</Label>
                  <Input
                    value={surgery.procedurePerformed}
                    onChange={(e) => updateSurgeryRow(surgery.id, 'procedurePerformed', e.target.value)}
                    placeholder="e.g., Femoral Hernia Repair (427)"
                    className={visitSurgeryData && visitSurgeryData.length > 0 ? 'bg-green-50 border-green-200' : ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Surgeon:</Label>
                  <Input
                    value={surgery.surgeon}
                    onChange={(e) => updateSurgeryRow(surgery.id, 'surgeon', e.target.value)}
                    placeholder="Enter surgeon name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Anesthetist:</Label>
                  <Input
                    value={surgery.anesthetist}
                    onChange={(e) => updateSurgeryRow(surgery.id, 'anesthetist', e.target.value)}
                    placeholder="Enter anesthetist name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Anesthesia:</Label>
                  <Input
                    value={surgery.anesthesia}
                    onChange={(e) => updateSurgeryRow(surgery.id, 'anesthesia', e.target.value)}
                    placeholder="Enter anesthesia type"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Implant:</Label>
                  <Input
                    value={surgery.implant}
                    onChange={(e) => updateSurgeryRow(surgery.id, 'implant', e.target.value)}
                    placeholder="e.g., N/A if no implant"
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Shared Description for ALL surgeries */}
          <div className="space-y-2 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Shared Description (for all surgeries):</Label>
              <Button
                size="sm"
                variant="outline"
                className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                disabled={isChatGptLoading}
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  setIsChatGptLoading(true);
                  try {
                    toast({
                      title: "Processing",
                      description: "Generating description with AI...",
                    });

                    // Build context from all surgery details
                    const allProcedures = surgeryRows.map((s, i) =>
                      `Surgery ${i + 1}: ${s.procedurePerformed || 'Not specified'} (Surgeon: ${s.surgeon || 'Not specified'}, Anesthesia: ${s.anesthesia || 'Not specified'})`
                    ).join('\n');

                    const prompt = `You are a medical specialist. Write a comprehensive, detailed surgical summary for each procedure listed below:
${allProcedures}

For EACH surgery, write a separate detailed paragraph (3-5 sentences) including:
1. Full procedure name and indication/reason for surgery
2. Surgical approach and technique used
3. Key intraoperative findings
4. Any implants/hardware used (if applicable)
5. Estimated blood loss and patient's hemodynamic stability
6. Immediate post-operative condition and recovery status

Write in professional medical terminology. Do NOT use placeholders like "[insert reason]" - if information is not provided, write general medical facts about the procedure. Write each surgery as "Surgery 1:", "Surgery 2:", etc.`;

                    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        contents: [{
                          parts: [{
                            text: prompt
                          }]
                        }],
                        generationConfig: {
                          temperature: 0.7,
                          maxOutputTokens: 1000
                        }
                      })
                    });

                    if (!response.ok) {
                      const errorData = await response.json();
                      throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
                    }

                    const data = await response.json();
                    const generatedDescription = data.candidates?.[0]?.content?.parts?.[0]?.text;

                    if (generatedDescription) {
                      setSharedSurgeryDescription(generatedDescription);
                      toast({
                        title: "Success",
                        description: "Description generated successfully!",
                      });
                    } else {
                      throw new Error('No response from AI');
                    }
                  } catch (error) {
                    console.error('AI Generation Error:', error);
                    toast({
                      title: "Error",
                      description: `Failed to generate description: ${error instanceof Error ? error.message : 'Unknown error'}`,
                      variant: "destructive"
                    });
                  } finally {
                    setIsChatGptLoading(false);
                  }
                }}
              >
                {isChatGptLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'AI Generate'
                )}
              </Button>
            </div>
            <Textarea
              value={sharedSurgeryDescription}
              onChange={(e) => setSharedSurgeryDescription(e.target.value)}
              placeholder="Enter surgical procedure description here... This description applies to all surgeries listed above."
              className="min-h-[150px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* OT Notes / Stay Notes */}
      <Card>
        <CardHeader>
          <CardTitle>OT Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-end mb-2">
                  <Button
                    onClick={() => setShowAddTemplate(!showAddTemplate)}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white px-3"
                  >
                    {showAddTemplate ? 'Cancel' : 'Add'}
                  </Button>
                </div>

                {/* Collapsible Add New Template */}
                {showAddTemplate && (
                  <div className="mb-2 p-3 border rounded bg-gray-50 animate-in slide-in-from-top-2 duration-200">
                    <Label className="text-sm font-medium mb-2 block">Add New Template:</Label>
                    <div className="space-y-2">
                      <Input
                        placeholder="Template name..."
                        className="text-sm"
                        value={newTemplateName}
                        onChange={(e) => setNewTemplateName(e.target.value)}
                        autoFocus
                      />
                      <Textarea
                        placeholder="Template content..."
                        className="text-sm min-h-[60px]"
                        value={newTemplateContent}
                        onChange={(e) => setNewTemplateContent(e.target.value)}
                      />
                      <div className="flex space-x-2">
                        <Button
                          onClick={addNewTemplate}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white flex-1"
                          disabled={!newTemplateName.trim() || !newTemplateContent.trim()}
                        >
                          Add Template
                        </Button>
                        <Button
                          onClick={() => {
                            setShowAddTemplate(false);
                            setNewTemplateName('');
                            setNewTemplateContent('');
                          }}
                          size="sm"
                          variant="outline"
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <Label>Favorite Templates:</Label>
                <div className="border rounded p-2 h-48 overflow-y-auto bg-cyan-50">
                  {stayNotesTemplates.map((template, index) => {
                    const isEditing = editingTemplateIndex === index;

                    return (
                      <div key={index} className="p-2 hover:bg-white hover:shadow-sm rounded mb-2 border-b border-gray-100 last:border-b-0">
                        {isEditing ? (
                          <div className="space-y-2">
                            <Input
                              value={editingTemplateName}
                              onChange={(e) => setEditingTemplateName(e.target.value)}
                              className="text-sm h-8 font-medium"
                              placeholder="Template name..."
                              autoFocus
                            />
                            <Textarea
                              value={editingTemplateContent}
                              onChange={(e) => setEditingTemplateContent(e.target.value)}
                              className="text-sm min-h-[60px]"
                              placeholder="Template content..."
                            />
                            <div className="flex space-x-2">
                              <Button
                                onClick={saveEditTemplate}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white text-xs flex-1"
                              >
                                Save
                              </Button>
                              <Button
                                onClick={cancelEditTemplate}
                                size="sm"
                                variant="outline"
                                className="text-xs flex-1"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-start justify-between">
                              <div className="flex-1 cursor-pointer" onClick={() => {
                                // Build patient details context
                                let patientContext = `\n\nPATIENT DETAILS:\n`;
                                patientContext += `Name: ${patientInfo.name}\n`;
                                patientContext += `Reg ID: ${patientInfo.regId}\n`;
                                patientContext += `Age/Sex: ${patientInfo.ageSex}\n`;
                                patientContext += `Address: ${patientInfo.address}\n`;
                                patientContext += `Admission Date: ${patientInfo.doa}\n`;
                                patientContext += `Discharge Date: ${patientInfo.dateOfDischarge}\n`;
                                patientContext += `Treating Consultant: ${patientInfo.treatingConsultant}\n`;
                                if (patientInfo.corporateType) patientContext += `Corporate Type: ${patientInfo.corporateType}\n`;

                                // Add diagnosis if available
                                if (diagnosis) {
                                  patientContext += `\nDIAGNOSIS:\n${diagnosis}\n`;
                                }

                                // Add investigations if available
                                if (investigations) {
                                  patientContext += `\nINVESTIGATIONS:\n${investigations}\n`;
                                }

                                // NOTE: Surgery details are NOT added here - they are displayed separately in a table
                                // and should not be included in Gemini input to prevent duplication

                                // Add the template content with patient context to newTemplateContent textbox (above Fetch Data button)
                                // Preserve existing content if any
                                setNewTemplateContent(prev => {
                                  const newContent = template.content + patientContext;
                                  // If there's already content, append with separator, otherwise just set new content
                                  return prev ? prev + '\n\n---\n\n' + newContent : newContent;
                                });
                              }}>
                                <div className="text-sm font-medium text-gray-800 mb-1">{template.name}</div>
                                <div className="text-xs text-gray-600 line-clamp-2">{template.content}</div>
                              </div>
                              <div className="flex space-x-1 ml-2">
                                <Button
                                  onClick={() => editTemplate(index)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
                                  title="Edit template"
                                >
                                  ✏️
                                </Button>
                                <Button
                                  onClick={() => deleteTemplate(index)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                                  title="Delete template"
                                >
                                  🗑️
                                </Button>
                                <Button
                                  onClick={() => moveTemplateUp(index)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-gray-600 hover:text-gray-800"
                                  disabled={index === 0}
                                  title="Move up"
                                >
                                  ⬆️
                                </Button>
                                <Button
                                  onClick={() => moveTemplateDown(index)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-gray-600 hover:text-gray-800"
                                  disabled={index === stayNotesTemplates.length - 1}
                                  title="Move down"
                                >
                                  ⬇️
                                </Button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="space-y-2">
                  <Textarea
                    placeholder="Choose from above or type here..."
                    className="min-h-[80px] text-sm"
                    value={newTemplateContent}
                    onChange={(e) => setNewTemplateContent(e.target.value)}
                  />
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={isChatGptLoading}
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        if (!newTemplateContent.trim()) {
                          toast({
                            title: "Error",
                            description: "Please add content to send to ChatGPT",
                            variant: "destructive"
                          });
                          return;
                        }

                        setIsChatGptLoading(true);
                        try {
                          toast({
                            title: "Processing",
                            description: "Sending request to Gemini AI...",
                          });

                          console.log('🤖 Sending to Gemini:', newTemplateContent);

                          // System prompt for Gemini
                          const systemPrompt = `You are a medical documentation assistant.

CRITICAL FORMATTING RULES:
- Do NOT use any markdown formatting like ** or ## or * or _
- Write in PLAIN TEXT only - no bold, no headers with hashtags
- For tables, use simple pipe format: | Column | Column |
- Write section headers as plain text like "DIAGNOSIS:" not "**DIAGNOSIS:**"

CRITICAL - DO NOT INCLUDE PATIENT DETAILS:
- NEVER include patient name, age, gender, address, registration ID, admission date, discharge date, treating consultant, or corporate type
- Patient information is ALREADY displayed at the top of the document - do not repeat it
- If input contains patient details, IGNORE them completely

IMPORTANT INSTRUCTIONS:
1. ALWAYS follow this EXACT section order: DIAGNOSIS → CLINICAL HISTORY → EXAMINATION → HOSPITAL STAY NOTES → ADVICE. Do NOT include empty sections.
2. Do NOT include SURGERY DETAILS or OPERATION NOTES - they are displayed separately in a table.
3. Do NOT include INVESTIGATIONS section - it is displayed separately from the database.
4. Do NOT include MEDICATIONS section - it is displayed separately in a table.
5. Do NOT include the emergency contact line in the ADVICE section.
6. For DIAGNOSIS: Keep as is in simple format. Do NOT expand into detailed sentences.
7. For CLINICAL HISTORY: Write a comprehensive 4-5 sentence medical paragraph. Include: presenting complaints with severity, associated symptoms, time of onset, duration, aggravating/relieving factors, relevant past medical history, and any risk factors. Use professional medical terminology.
8. For EXAMINATION: Write a comprehensive 4-5 sentence medical paragraph. Include: general appearance, vital signs with clinical interpretation (e.g., "tachycardia suggesting..." or "normotensive"), systemic examination findings, and overall clinical impression. Use professional medical terminology.
9. For HOSPITAL STAY NOTES: Write a brief 2-3 sentence summary of the patient's hospital stay and treatment. Keep it concise.
10. For ADVICE: Write ONLY a SHORT 2-3 sentence paragraph with general post-operative care instructions. Example: "The patient is advised to follow up after 3 days or sooner if symptoms worsen. They are instructed to perform dressing changes and to use an LS belt for support. Follow up after 7 days/SOS." Do NOT include medications list, do NOT include numbered lists, do NOT include detailed wound care instructions.`;

                          // Call Google Gemini API
                          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                              contents: [{
                                parts: [{
                                  text: systemPrompt + '\n\nUser Request:\n' + newTemplateContent
                                }]
                              }],
                              generationConfig: {
                                temperature: 0.7,
                                maxOutputTokens: 2000
                              }
                            })
                          });

                          if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
                          }

                          const data = await response.json();
                          const generatedSummary = data.candidates?.[0]?.content?.parts?.[0]?.text;

                          if (generatedSummary) {
                            // Display generated summary in Stay Notes box
                            setStayNotes(generatedSummary);

                            toast({
                              title: "Success",
                              description: "Discharge summary generated successfully!",
                            });

                            console.log('✅ Generated Summary:', generatedSummary);
                          } else {
                            throw new Error('No response from ChatGPT');
                          }

                        } catch (error) {
                          console.error('❌ ChatGPT Error:', error);
                          toast({
                            title: "Error",
                            description: `Failed to generate summary: ${error.message}`,
                            variant: "destructive"
                          });
                        } finally {
                          setIsChatGptLoading(false);
                        }
                      }}
                    >
                      {isChatGptLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        'Message chat GPT as'
                      )}
                    </Button>
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={handleFetchDischargeSummaryData}
                    >
                      Fetch Data
                    </Button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Stay Notes:</Label>
                <Textarea
                  value={stayNotes}
                  onChange={(e) => setStayNotes(e.target.value)}
                  className="min-h-[280px]"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Treatment During Hospital Stay */}
      <Card>
        <CardHeader>
          <CardTitle>Treatment During Hospital Stay:</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>The condition of patient at the time of discharge was:</Label>
              <div className="flex space-x-4">
                <Select value={treatmentCondition} onValueChange={setTreatmentCondition}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Satisfactory">Satisfactory</SelectItem>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                    <SelectItem value="Unsatisfactory">Unsatisfactory</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={treatmentStatus} onValueChange={setTreatmentStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Please select">Please select</SelectItem>
                    <SelectItem value="Stable">Stable</SelectItem>
                    <SelectItem value="Improving">Improving</SelectItem>
                    <SelectItem value="Unsatisfactory">Unsatisfactory</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Review on*</Label>
              <Input
                type="date"
                value={reviewDate}
                onChange={(e) => setReviewDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Resident On Discharge*</Label>
              <Select value={residentOnDischarge} onValueChange={setResidentOnDischarge}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Please select">Please select</SelectItem>
                  {consultants.map((consultant: any) => (
                    <SelectItem key={consultant.id} value={consultant.name}>
                      {consultant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2 mt-6">
              <Checkbox
                checked={enableSmsAlert}
                onCheckedChange={setEnableSmsAlert}
              />
              <Label>Enable SMS Alert</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-center space-x-4 pb-6">
        <Button onClick={handleSave} className="px-8 py-2 bg-blue-600 hover:bg-blue-700">
          Save
        </Button>
        <Button
          onClick={() => navigate('/todays-ipd')}
          variant="outline"
          className="px-8 py-2 border-gray-300 hover:bg-gray-50"
        >
          Close
        </Button>
      </div>
      </div>
    </form>
  );
};

export default IpdDischargeSummary;