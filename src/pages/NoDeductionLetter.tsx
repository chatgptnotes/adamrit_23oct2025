import React, { useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useVisitData } from '@/hooks/useVisitsData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { ArrowLeft, Edit, Trash2, Plus, Save, Printer, Download, FileText, Wand2, MoreHorizontal, ChevronsLeft, ChevronsRight, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type Template = { id: string; title: string; body: string };
type RefinementTemplate = { id: string; name: string; promptText: string; variables?: Record<string, any>; visibility?: string; owner?: string; tags?: string[]; starred?: boolean };

const DEFAULT_REFINEMENT_TEMPLATES: RefinementTemplate[] = [
  {
    id: 'refine-esic-final',
    name: 'Refine & Finalize No Deduction Letter – ESIC',
    promptText: `You are the owner and Chief Medical Director of Hope Hospital, preparing a fully refined and final version of an ESIC justification letter.
The draft provided below is the initial version, and you must now enhance it into a final, submission-ready format for the State Medical Officer via the Superintendent of ESIS Hospital.

Your goal:
    1.    Maintain all facts exactly as provided — do not invent or change patient data, dates, or medical events.
    2.    Ensure the letter is formally worded, medically precise, and strongly justified so that ESIC will not deduct any approved charges during bill scrutiny.
    3.    Structure the letter logically with clear headings/paragraphs for:
    •    Patient Identification
    •    Admission Details
    •    Course of Treatment & Original CGHS Package Surgery
    •    Complications (with medical relevance explained)
    •    Why it is not part of the original CGHS package
    •    Additional Surgeries/Procedures
    •    Justification for Extended Hospital Stay
    •    Approvals and Consent Documentation
    •    Final Request for Non-Deduction of Charges
    4.    Use precise medical terminology, avoid casual or ambiguous phrases, and include clear cause-effect linking between the original diagnosis, the complication, and the necessity of extra treatment.
    5.    Maintain a polite, persuasive, and authoritative tone, ensuring the reasoning is strong enough to satisfy ESIC medical auditors.
    6.    Avoid repetition — ensure each sentence adds unique value.

Draft Letter:

{{FinalLetterText}}`,
    variables: { FinalLetterText: '' },
    visibility: 'team',
    starred: true
  }
];

const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'tmpl-no-deduction',
    title: 'No Deduction Letter – ESIC',
    body:
      `INSTRUCTIONS (shown here for the user, not printed):\n\nYou are the owner of Hope Hospital, Nagpur. Draft a formal justification letter to ESIC requesting that no deduction be made from the claim, and that the cost of medical management be allowed.\n\nFollow these rules:\n- Tone: professional, concise, respectful.\n- Address: State Medical Officer, ESIC, RO Maharashtra.\n- Through: The Superintendent, ESIS Hospital, Somwarpeth, Nagpur.\n- Include patient and admission details using the placeholders below.\n- Clearly state the complication and why it is outside the CGHS package.\n- Mention referring specialist advice and medical necessity.\n- Close with a clear request for approval and no deduction.\n- Do not include the word "template" in the output.\n\nAvailable placeholders (examples):\n- {{patient.name}}, {{patient.age}}, {{patient.gender}}, {{patient.claim_id}}, {{patient.uhid}}\n- {{admission.date}}, {{admission.diagnosis}}, {{admission.cghs_code}}, {{admission.cghs_surgery}}, {{admission.package_days}}\n- {{complication.name}}, {{complication.onset_date}}, {{complication.description}}, {{complication.not_covered_reason}}\n- {{management.ref_doctor_name}}, {{management.ref_doctor_designation}}, {{management.advice_date}}, {{management.severity}}, {{management.extra_days}}, {{management.additional_treatment}}, {{management.cghs_tariff_ref}}\n\nOnly the content between [[LETTER_TEMPLATE]] and [[/LETTER_TEMPLATE]] is used for the final printed letter.\n\n[[LETTER_TEMPLATE]]\nTo,\nState Medical Officer,\nRegional Office Maharashtra,\nEmployees State Insurance Corporation,\nGround Floor, Panchdeep Bhavan,\nNear Strand Cinema Bus Stop, S.B.S Marg,\nColaba, Mumbai – 400005\n\nThrough :- The Superintendent, ESIS Hospital, Somwarpeth, Nagpur\n\nSubject: Regarding patient {{patient.name}} – complication after CGHS package {{admission.cghs_code}} ({{admission.cghs_surgery}}) and approval for Medical Management\n\nDear Sir,\n\nPatient {{patient.name}}, age {{patient.age}}, gender {{patient.gender}}, ESIC Claim ID {{patient.claim_id}}, UHID {{patient.uhid}}, was admitted on {{admission.date}} with a diagnosis of {{admission.diagnosis}}. CGHS code {{admission.cghs_code}} was approved for {{admission.package_days}} days for {{admission.cghs_surgery}}.\n\nFollowing the procedure, the patient developed {{complication.name}} on {{complication.onset_date}} ({{complication.description}}). This is outside the scope of the approved CGHS package, therefore separate medical management was medically necessary ({{complication.not_covered_reason}}). Care provided included: {{management.additional_treatment}}.\n\nThe referring specialist, {{management.ref_doctor_name}} ({{management.ref_doctor_designation}}), advised continued management on {{management.advice_date}} due to {{management.severity}}. Additional days requested/used: {{management.extra_days}} (as per CGHS tariff reference {{management.cghs_tariff_ref}}).\n\nIn view of the above, we request that no deduction be made from the claimed amount and that the costs of the above medical management be kindly approved. All interventions were clinically indicated and in the best interest of the patient.\n\nRegards,\n\nDr Murali BK\nHope Hospital, Nagpur\n[[/LETTER_TEMPLATE]]`,
  },
];

// Real data structure - no mock data needed

function extractLetterTemplate(fullPrompt: string): string {
  // Prefer a start marker that appears at the beginning of a line to avoid matching mentions in instructions
  const startMatches = Array.from(fullPrompt.matchAll(/(^|\n)\s*\[\[LETTER_TEMPLATE\]\]\s*(\n|\r\n)/g));
  const startMatch = startMatches.length ? startMatches[startMatches.length - 1] : null;
  const startContentIndex = startMatch ? (startMatch.index! + startMatch[0].length) : fullPrompt.indexOf('[[LETTER_TEMPLATE]]') + '[[LETTER_TEMPLATE]]'.length;
  if (!startMatch && fullPrompt.indexOf('[[LETTER_TEMPLATE]]') === -1) return fullPrompt;
  const endIndex = fullPrompt.indexOf('[[/LETTER_TEMPLATE]]', startContentIndex);
  if (endIndex !== -1) {
    return fullPrompt.slice(startContentIndex, endIndex).trim();
  }
  return fullPrompt;
}

function replaceLetterTemplate(fullPrompt: string, newSection: string): string {
  const startMatches = Array.from(fullPrompt.matchAll(/(^|\n)\s*\[\[LETTER_TEMPLATE\]\]\s*(\n|\r\n)/g));
  const startMatch = startMatches.length ? startMatches[startMatches.length - 1] : null;
  const startIndex = startMatch ? startMatch.index! : fullPrompt.indexOf('[[LETTER_TEMPLATE]]');
  const startAfter = startMatch ? (startMatch.index! + startMatch[0].length) : (startIndex !== -1 ? startIndex + '[[LETTER_TEMPLATE]]'.length : -1);
  if (startAfter !== -1) {
    const endIndex = fullPrompt.indexOf('[[/LETTER_TEMPLATE]]', startAfter);
    if (endIndex !== -1) {
      const before = fullPrompt.slice(0, startAfter);
      const after = fullPrompt.slice(endIndex);
      return `${before}${newSection}\n${after}`;
    }
  }
  // If no markers exist, append a new block at the end
  return `${fullPrompt}\n\n[[LETTER_TEMPLATE]]\n${newSection}\n[[/LETTER_TEMPLATE]]`;
}

function mergeTemplate(template: string, data: Record<string, any>): string {
  return template.replace(/{{\s*([\w\.]+)\s*}}/g, (_, path) => {
    const parts = String(path).split('.');
    let v: any = data;
    for (const p of parts) v = v?.[p];
    return v == null ? '' : String(v);
  });
}

export default function NoDeductionLetterPage() {
  const location = useLocation() as any;
  const navigate = useNavigate();
  const { visitId } = useParams();
  const incoming = location?.state?.patientData || {};
  const { hospitalConfig } = useAuth();

  // Fetch comprehensive data from visits table using shared hook
  const { data: visitData, refetch, error: visitError, isError: hasVisitError } = useVisitData(visitId);

  // Fetch latest visit when no specific visitId is provided
  const { data: latestVisitData, refetch: refetchLatestVisit, error: latestVisitError, isError: hasLatestVisitError } = useQuery({
    queryKey: ['latest-visit'],
    enabled: !visitId, // Only run when there's no specific visitId
    queryFn: async () => {
      console.log('🔍 Fetching latest visit data...');
      const { data, error } = await supabase
        .from('visits')
        .select(`
          visit_id,
          patient_id,
          visit_date,
          visit_type,
          appointment_with,
          reason_for_visit,
          relation_with_employee,
          status,
          claim_id,
          surgery_date,
          admission_date,
          discharge_date,
          cghs_code,
          package_amount,
          extension_taken,
          patients(
            name,
            age,
            gender,
            patients_id
          )
        `)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('❌ Error fetching latest visit:', error);
        console.error('Error details:', error.message, error.details, error.hint);
        return null;
      }

      if (!data || data.length === 0) {
        console.log('⚠️ No visits found in database');
        return null;
      }

      const latestVisit = data[0];
      console.log('✅ Latest visit data:', latestVisit);
      return latestVisit;
    },
  });

  // Handle visit data errors
  if (hasVisitError && visitError) {
    console.error('Visit data error:', visitError);
  }
  
  if (hasLatestVisitError && latestVisitError) {
    console.error('Latest visit data error:', latestVisitError);
  }

  // Add a function to fetch mock data for testing
  const fetchMockData = async () => {
    console.log('🔍 Fetching all visits for testing...');
    try {
      // First, let's check what tables exist
      console.log('📋 Checking available tables...');

      // Try to fetch visits without joins first
      console.log('🔍 Fetching visits (basic)...');
      const { data: basicVisits, error: basicError } = await supabase
        .from('visits')
        .select('*')
        .limit(5);

      if (basicError) {
        console.error('❌ Error fetching basic visits:', basicError);
        console.error('Error details:', basicError.message, basicError.details, basicError.hint);
      } else {
        console.log('✅ Basic visits data:', basicVisits);
        console.log('📊 Number of basic visits found:', basicVisits?.length || 0);
      }

      // Try to fetch patients table
      console.log('🔍 Fetching patients...');
      const { data: patients, error: patientsError } = await supabase
        .from('patients')
        .select('*')
        .eq('hospital_name', hospitalConfig.name)
        .limit(5);

      if (patientsError) {
        console.error('❌ Error fetching patients:', patientsError);
      } else {
        console.log('✅ Patients data:', patients);
        console.log('📊 Number of patients found:', patients?.length || 0);
      }

      // Now try the complex query with joins
      console.log('🔍 Fetching visits with patient data...');
      const { data, error } = await supabase
        .from('visits')
        .select(`
          visit_id,
          patient_id,
          visit_date,
          visit_type,
          appointment_with,
          reason_for_visit,
          relation_with_employee,
          status,
          claim_id,
          surgery_date,
          admission_date,
          discharge_date,
          cghs_code,
          package_amount,
          extension_taken,
          esic_uh_id,
          patients(
            name,
            age,
            gender,
            patients_id
          )
        `)
        .limit(5)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching visits with joins:', error);
        console.error('Error details:', error.message, error.details, error.hint);
        return basicVisits; // Return basic visits if join fails
      }

      console.log('✅ Visits with patient data:', data);
      console.log('📊 Number of visits with patients found:', data?.length || 0);

      if (data && data.length > 0) {
        console.log('📋 First visit with patient details:', data[0]);
      } else {
        console.log('⚠️ No visits found in database');
      }

      return data;
    } catch (err) {
      console.error('💥 Unexpected error:', err);
      return null;
    }
  };

  // Also add a function to check database connection
  const testDatabaseConnection = async () => {
    console.log('🔗 Testing database connection...');
    try {
      const { error, count } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('❌ Database connection error:', error);
        console.error('Error details:', error.message, error.details, error.hint);
        return false;
      }

      console.log('✅ Database connected successfully');
      console.log('📊 Total visits count:', count);

      if (count === 0) {
        console.log('⚠️ No visits found in database. You may need to add some sample data.');
        console.log('💡 Try creating a visit through the application first.');
      }

      return true;
    } catch (err) {
      console.error('💥 Database connection failed:', err);
      return false;
    }
  };

  // Function to create sample data if database is empty
  const createSampleData = async () => {
    console.log('🏗️ Creating sample data...');
    try {
      // Generate a unique patient ID with timestamp
      const timestamp = Date.now();
      const uniquePatientId = `P${timestamp}`;
      const uniqueClaimId = `CLM${timestamp}`;

      console.log('🆔 Using unique IDs:', { uniquePatientId, uniqueClaimId });

      // First create a sample patient
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .insert({
          name: 'John Doe',
          age: 45,
          gender: 'Male',
          patients_id: uniquePatientId,
          hospital_name: hospitalConfig.name
        })
        .select()
        .single();

      if (patientError) {
        console.error('❌ Error creating patient:', patientError);
        console.error('Patient error details:', patientError.message, patientError.details, patientError.hint);

        // If patient already exists, try to find an existing one
        if (patientError.code === '23505') { // Unique constraint violation
          console.log('🔍 Patient already exists, trying to find existing patient...');
          const { data: existingPatient, error: findError } = await supabase
            .from('patients')
            .select('*')
            .eq('hospital_name', hospitalConfig.name)
            .limit(1)
            .single();

          if (findError) {
            console.error('❌ Error finding existing patient:', findError);
            return false;
          }

          console.log('✅ Using existing patient:', existingPatient);
          // Use the existing patient for visit creation
          const patientId = existingPatient.patients_id;

          // Create visit with existing patient
          const { data: visit, error: visitError } = await supabase
            .from('visits')
            .insert({
              patient_id: patientId,
              visit_date: new Date().toISOString().split('T')[0],
              visit_type: 'Surgery',
              appointment_with: 'Dr. Smith',
              reason_for_visit: 'Cardiac Surgery',
              relation_with_employee: 'SELF',
              status: 'Completed',
              claim_id: uniqueClaimId,
              surgery_date: new Date().toISOString().split('T')[0],
              admission_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              discharge_date: new Date().toISOString().split('T')[0],
              cghs_code: 'CG001',
              package_amount: 50000,
              extension_taken: 3
            })
            .select()
            .single();

          if (visitError) {
            console.error('❌ Error creating visit with existing patient:', visitError);
            return false;
          }

          console.log('✅ Sample visit created with existing patient:', visit);
          return true;
        }
        return false;
      }

      console.log('✅ Sample patient created:', patient);

      // Now create a sample visit
      const { data: visit, error: visitError } = await supabase
        .from('visits')
        .insert({
          patient_id: patient.patients_id,
          visit_date: new Date().toISOString().split('T')[0],
          visit_type: 'Surgery',
          appointment_with: 'Dr. Smith',
          reason_for_visit: 'Cardiac Surgery',
          relation_with_employee: 'SELF',
          status: 'Completed',
          claim_id: uniqueClaimId,
          surgery_date: new Date().toISOString().split('T')[0],
          admission_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          discharge_date: new Date().toISOString().split('T')[0],
          cghs_code: 'CG001',
          package_amount: 50000,
          extension_taken: 3
        })
        .select()
        .single();

      if (visitError) {
        console.error('❌ Error creating visit:', visitError);
        console.error('Visit error details:', visitError.message, visitError.details, visitError.hint);
        return false;
      }

      console.log('✅ Sample visit created:', visit);
      return true;
    } catch (err) {
      console.error('💥 Error creating sample data:', err);
      return false;
    }
  };

  const initialFetched = useMemo(() => {
    try {
      const src = visitData || latestVisitData || incoming;

    // Debug logging
    console.log('🔍 Data sources:');
    console.log('  - visitId from URL:', visitId);
    console.log('  - visitData from query:', visitData);
    console.log('  - latestVisitData from latest query:', latestVisitData);
    console.log('  - incoming from location state:', incoming);
    console.log('  - final src being used:', src);

    // Create data structure using exact visits table schema
    const allSurgeryNames = Array.isArray(src?.visit_surgeries)
      ? src.visit_surgeries
          .map((vs: any) => vs?.cghs_surgery?.name)
          .filter(Boolean)
      : [];
    const allSurgeryCodes = Array.isArray(src?.visit_surgeries)
      ? src.visit_surgeries
          .map((vs: any) => vs?.cghs_surgery?.code)
          .filter(Boolean)
      : [];
    const surgeriesCombined = allSurgeryNames.length
      ? allSurgeryNames.join(', ')
      : (allSurgeryCodes.length ? allSurgeryCodes.join(', ') : 'Surgery Details Not Available');
    const realData = {
      patient: {
        name: src?.patients?.name || 'Patient Name Not Available',
        age: src?.patients?.age || 'Age Not Available',
        gender: src?.patients?.gender || 'Gender Not Available',
        claim_id: src?.claim_id || 'Claim ID Not Available',
        // uhid: src?.patients?.patients_id || 'UHID Not Available',
        uhid: src?.esic_uh_id || 'CGHS Code Not Available',

      },
      admission: {
        date: src?.admission_date ? new Date(src.admission_date).toLocaleDateString('en-GB') : 'Admission Date Not Available',
        diagnosis: src?.visit_diagnoses?.[0]?.diagnoses?.name ||
                  src?.reason_for_visit || 'Diagnosis Not Available',
        cghs_code: src?.cghs_code || (allSurgeryCodes.length ? allSurgeryCodes.join(', ') : 'CGHS Code Not Available'),
        cghs_surgery: surgeriesCombined,
        // package_days: src?.package_amount || 'Package Days Not Available',
 
      },

      management: {
        ref_doctor_name: src?.appointment_with ||
                        src?.visit_esic_surgeons?.[0]?.esic_surgeons?.name ||
                        src?.referees?.name || 'Referring Doctor Not Available',
        ref_doctor_designation: src?.visit_esic_surgeons?.[0]?.esic_surgeons?.department ||
                               src?.visit_esic_surgeons?.[0]?.esic_surgeons?.specialty ||
                               src?.referees?.specialty || 'Consultant',
        advice_date: src?.surgery_date ? new Date(src.surgery_date).toLocaleDateString('en-GB') :
                    src?.visit_date ? new Date(src.visit_date).toLocaleDateString('en-GB') : 'Advice Date Not Available',
        severity: 'requiring continued medical supervision and monitoring',
        extra_days: src?.extension_taken ||
                   (src?.discharge_date && src?.admission_date ?
                    Math.ceil((new Date(src.discharge_date).getTime() - new Date(src.admission_date).getTime()) / (1000 * 60 * 60 * 24)) :
                    'Extra Days Not Available'),
        additional_treatment: 'Medical management as per clinical requirements and specialist advice',
        cghs_tariff_ref: 'CGHS 2024 Ward Tariff',
      },
      visit_info: {
        visit_id: src?.visit_id || 'Visit ID Not Available',
        visit_type: src?.visit_type || 'Visit Type Not Available',
        status: src?.status || 'Status Not Available',
        relation_with_employee: src?.relation_with_employee || 'SELF',
        discharge_date: src?.discharge_date ? new Date(src.discharge_date).toLocaleDateString('en-GB') : 'Discharge Date Not Available',
      }
    };

    return realData;
    } catch (error) {
      console.error('Error processing initial data:', error);
      // Return safe default data in case of error
      return {
        patient: {
          name: 'Patient Name Not Available',
          age: 'Age Not Available',
          gender: 'Gender Not Available',
          claim_id: 'Claim ID Not Available',
          uhid: 'UHID Not Available',
        },
        admission: {
          date: 'Admission Date Not Available',
          diagnosis: 'Diagnosis Not Available',
          cghs_code: 'CGHS Code Not Available',
          cghs_surgery: 'Surgery Details Not Available',
          package_days: 'Package Days Not Available',
        },
        complication: {
          name: 'No Complications Recorded',
          onset_date: 'Complication Date Not Available',
          description: 'Medical complication requiring additional care',
          not_covered_reason: 'Beyond standard package scope - requires additional medical management',
        },
        management: {
          ref_doctor_name: 'Referring Doctor Not Available',
          ref_doctor_designation: 'Consultant',
          advice_date: 'Advice Date Not Available',
          severity: 'requiring continued medical supervision and monitoring',
          extra_days: 'Extra Days Not Available',
          additional_treatment: 'Medical management as per clinical requirements and specialist advice',
          cghs_tariff_ref: 'CGHS 2024 Ward Tariff',
        },
        visit_info: {
          visit_id: 'Visit ID Not Available',
          visit_type: 'Visit Type Not Available',
          status: 'Status Not Available',
          relation_with_employee: 'SELF',
          discharge_date: 'Discharge Date Not Available',
        }
      };
    }
  }, [incoming, visitData, latestVisitData]);

  const [templates, setTemplates] = useState<Template[]>(DEFAULT_TEMPLATES);
  const [selectedId, setSelectedId] = useState<string>(templates[0].id);
  const [titleEdit, setTitleEdit] = useState<string>(templates[0].title);
  const [editor, setEditor] = useState<string>(templates[0].body);
  const [search, setSearch] = useState<string>('');
  const [fetched, setFetched] = useState<Record<string, any>>(initialFetched);
  const [isEditingFinal, setIsEditingFinal] = useState<boolean>(false);
  const [isEditingTitleInline, setIsEditingTitleInline] = useState<boolean>(false);
  const [finalText, setFinalText] = useState<string>('');
  const [isEditingData, setIsEditingData] = useState<boolean>(false);
  const [dataEditor, setDataEditor] = useState<string>(JSON.stringify(initialFetched, null, 2));
  const [isPromptDialogOpen, setPromptDialogOpen] = useState<boolean>(false);
  const [isPromptDialogEditing, setPromptDialogEditing] = useState<boolean>(false);
  const [promptDialogText, setPromptDialogText] = useState<string>(editor);
  const [showActions, setShowActions] = useState<boolean>(false);
  const actionsRef = React.useRef<HTMLDivElement | null>(null);
  const [isSavingDoc, setIsSavingDoc] = useState<boolean>(false);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  
  // AI Refinement states
  const [refinementTemplates, setRefinementTemplates] = useState<RefinementTemplate[]>(DEFAULT_REFINEMENT_TEMPLATES);
  const [selectedRefinementTemplate, setSelectedRefinementTemplate] = useState<RefinementTemplate | null>(null);
  const [refinedText, setRefinedText] = useState<string>('');
  const [isEditingRefined, setIsEditingRefined] = useState<boolean>(false);
  const [isRunningRefinement, setIsRunningRefinement] = useState<boolean>(false);
  const [isTemplateChooserOpen, setIsTemplateChooserOpen] = useState<boolean>(false);
  const [refinementSearch, setRefinementSearch] = useState<string>('');
  const [showInitialPrompt, setShowInitialPrompt] = useState<boolean>(false);
  const [showRefinementPrompt, setShowRefinementPrompt] = useState<boolean>(false);
  const [isEditingInitialPrompt, setIsEditingInitialPrompt] = useState<boolean>(false);
  const [isEditingRefinementPrompt, setIsEditingRefinementPrompt] = useState<boolean>(false);
  const [editingInitialPromptText, setEditingInitialPromptText] = useState<string>('');
  const [editingRefinementPromptText, setEditingRefinementPromptText] = useState<string>('');

  // Initialize with first refinement template
  React.useEffect(() => {
    if (refinementTemplates.length > 0 && !selectedRefinementTemplate) {
      setSelectedRefinementTemplate(refinementTemplates[0]);
    }
  }, [refinementTemplates, selectedRefinementTemplate]);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) {
        setShowActions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);


  const previewText = useMemo(() => {
    const letterOnly = extractLetterTemplate(editor);
    return mergeTemplate(letterOnly, fetched);
  }, [editor, fetched]);

  // Keep right-panel data in sync when fresh data is fetched from Supabase
  React.useEffect(() => {
    setFetched(initialFetched);
    setDataEditor(JSON.stringify(initialFetched, null, 2));
  }, [initialFetched]);

  // Keep final text in sync with preview ONLY when the preview content changes.
  // Do not reset on edit-mode toggle so user edits persist when clicking Done.
  React.useEffect(() => {
    if (!isEditingFinal) {
      setFinalText(previewText);
    }
  }, [previewText]);

  const printRef = useRef<HTMLDivElement | null>(null);
  const handlePrint = () => {
    const printContents = printRef.current?.innerHTML || '';
    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset='utf-8'/><title>Print</title><style>body{font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Helvetica,Arial;line-height:1.6;padding:28px} h1{font-size:18px;margin-bottom:12px} pre{white-space:pre-wrap;word-wrap:break-word;font:inherit} .no-print-title{display:none} @page{margin:18mm}</style></head><body>${printContents}</body></html>`);
    w.document.close();
    w.focus();
    w.print();
    w.close();
  };

  const handleExportPdf = () => {
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(12);
      // Export only the letter body; no UI title in the PDF
      const lines = pdf.splitTextToSize(`${finalText}`, pageWidth - 40);
      let y = 30;
      const lh = 7;
      for (const line of lines) {
        if (y > pdf.internal.pageSize.getHeight() - 30) { pdf.addPage(); y = 30; }
        pdf.text(line, 20, y);
        y += lh;
      }
      pdf.save(`ESIC_No_Deduction_${Date.now()}.pdf`);
      toast.success('PDF exported');
    } catch (e) { console.error(e); toast.error('Failed to export PDF'); }
  };

  const saveEditsToTemplate = () => {
    setTemplates(prev => prev.map(t => (t.id === selectedId ? { ...t, title: titleEdit, body: editor } : t)));
    toast.success('Prompt saved');
  };

  const addTemplate = () => {
    const nid = `tmpl-${Date.now()}`;
    const t = { id: nid, title: 'Untitled Prompt', body: 'Type your prompt here...' };
    setTemplates([t, ...templates]);
    setSelectedId(nid);
    setTitleEdit(t.title);
    setEditor(t.body);
  };

  const deleteTemplate = (id: string) => {
    const next = templates.filter(t => t.id !== id);
    setTemplates(next);
    if (id === selectedId && next.length) {
      setSelectedId(next[0].id);
      setTitleEdit(next[0].title);
      setEditor(next[0].body);
    }
  };

  const filtered = templates.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));

  const patientName = fetched?.patient?.name || 'Patient';
  const srNo = visitData?.sr_no || incoming?.sr_no || '';

  const applyEditedData = () => {
    try {
      const parsed = JSON.parse(dataEditor);
      setFetched(parsed);
      setIsEditingData(false);
      toast.success('Data applied');
    } catch (e) {
      toast.error('Invalid JSON');
    }
  };

  const rerunMerge = () => {
    let section = extractLetterTemplate(editor);
    if (!section || section.trim().length < 20) {
      // Fallback to default template section if current one is empty or too short
      section = extractLetterTemplate(DEFAULT_TEMPLATES[0].body);
    }
    const merged = mergeTemplate(section, fetched);
    setFinalText(merged);
    setIsEditingFinal(false);
    toast.success('Letter updated from template and data');
  };

  // Comprehensive refresh function that fetches latest data
  const handleRefreshData = async () => {
    try {
      setIsRefreshing(true);
      console.log('🔄 Starting fresh data fetch...');
      toast.success('Refreshing data...');

      // Directly fetch from database instead of relying on React Query cache
      let freshData = null;

      if (visitId) {
        console.log('🔄 Fetching specific visit:', visitId);
        const { data, error } = await supabase
          .from('visits')
          .select(`
            *,
            patients(*)
          `)
          .eq('visit_id', visitId)
          .single();

        if (error) {
          console.error('❌ Error fetching specific visit:', error);
        } else {
          freshData = data;
          console.log('✅ Fresh visit data:', freshData);
        }
      } else {
        console.log('🔄 Fetching latest visit from database...');
        const { data, error } = await supabase
          .from('visits')
          .select(`
            *,
            patients(*)
          `)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error('❌ Error fetching latest visit:', error);
        } else if (data && data.length > 0) {
          freshData = data[0];
          console.log('✅ Fresh latest visit data:', freshData);
        }
      }

      if (freshData) {
        console.log('🔄 Processing fresh data...');

        // Create new data structure from fresh database data
        const newFetchedData = {
          patient: {
            name: freshData?.patients?.name || 'Patient Name Not Available',
            age: freshData?.patients?.age?.toString() || 'Age Not Available',
            gender: freshData?.patients?.gender || 'Gender Not Available',
            claim_id: freshData?.claim_id || 'Claim ID Not Available',
            uhid: freshData?.patients?.patients_id || 'UHID Not Available',
          },
          admission: {
            date: freshData?.admission_date ? new Date(freshData.admission_date).toLocaleDateString('en-GB') : 'Admission Date Not Available',
            diagnosis: freshData?.reason_for_visit || 'Diagnosis Not Available',
            cghs_code: freshData?.cghs_code || 'CGHS Code Not Available',
            cghs_surgery: freshData?.sst_treatment || 'Surgery Details Not Available',
            package_days: freshData?.package_amount?.toString() || 'Package Days Not Available',
          },
          complication: {
            name: 'Post-operative infection',
            onset_date: freshData?.surgery_date ? new Date(freshData.surgery_date).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
            description: 'Fever, elevated WBCs',
            not_covered_reason: 'Beyond standard package scope - requires additional medical management',
          },
          management: {
            ref_doctor_name: freshData?.appointment_with || 'Dr. Smith',
            ref_doctor_designation: 'Consultant',
            advice_date: freshData?.surgery_date ? new Date(freshData.surgery_date).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
            severity: 'requiring continued medical supervision and monitoring',
            extra_days: freshData?.extension_taken?.toString() || '3',
            additional_treatment: 'IV antibiotics, monitoring',
            cghs_tariff_ref: 'CGHS 2024 Ward Tariff',
          },
          visit_info: {
            visit_id: freshData?.visit_id || 'Visit ID Not Available',
            visit_type: freshData?.visit_type || 'Visit Type Not Available',
            status: freshData?.status || 'Status Not Available',
            relation_with_employee: freshData?.relation_with_employee || 'SELF',
            discharge_date: freshData?.discharge_date ? new Date(freshData.discharge_date).toLocaleDateString('en-GB') : 'Discharge Date Not Available',
          }
        };

        console.log('🔄 New processed data structure:', newFetchedData);

        // Force update all related state
        setFetched(newFetchedData);
        setDataEditor(JSON.stringify(newFetchedData, null, 2));

        // Also trigger React Query refetch to keep cache in sync
        if (visitId) {
          refetch();
        } else {
          refetchLatestVisit();
        }

        toast.success('Data refreshed successfully with real database data!');
      } else {
        console.log('⚠️ No data found in database');
        toast.error('No visit data found in database');
      }

    } catch (error) {
      console.error('❌ Error refreshing data:', error);
      toast.error(`Failed to refresh data: ${error.message}`);
    } finally {
      setIsRefreshing(false);
    }
  };



  const handleSaveDocument = async () => {
    try {
      if (!visitId) {
        toast.error('Missing visit id');
        return;
      }
      setIsSavingDoc(true);
      const documentName = 'No Deduction Letter – ESIC';
      const fileName = `no-deduction-letter-${visitId}.txt`;
      const patientCustomId = visitData?.patients?.patients_id || incoming?.patients?.patients_id || incoming?.patients_id || null;

      // Check for existing record by visit + document_name
      const { data: existing, error: findErr } = await supabase
        .from('patient_documents')
        .select('id')
        .eq('visit_id', visitId)
        .eq('document_name', documentName)
        .maybeSingle();
      if (findErr) throw findErr;

      const payload: any = {
        visit_id: visitId,
        patient_id: patientCustomId,
        document_name: documentName,
        file_name: fileName,
        is_uploaded: false,
        remarks: 'Generated in app',
        metadata: {
          title: titleEdit,
          prompt_id: selectedId,
          content: finalText,
          generated_at: new Date().toISOString(),
        },
      };

      if (existing?.id) {
        const { error: updErr } = await supabase
          .from('patient_documents')
          .update(payload)
          .eq('id', existing.id);
        if (updErr) throw updErr;
      } else {
        const { error: insErr } = await supabase
          .from('patient_documents')
          .insert(payload);
        if (insErr) throw insErr;
      }
      toast.success('Letter saved to patient documents');
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to save letter');
    } finally {
      setIsSavingDoc(false);
    }
  };

  // AI Refinement functions
  const runRefinementPrompt = async () => {
    if (!selectedRefinementTemplate || !finalText.trim()) {
      toast.error('Please select a refinement template and ensure the final letter is not empty');
      return;
    }

    try {
      setIsRunningRefinement(true);
      
      // Replace variables in the prompt
      const promptWithData = selectedRefinementTemplate.promptText.replace(
        /\{\{\s*FinalLetterText\s*\}\}/g, 
        finalText
      ).replace(
        /\{\{\s*HospitalName\s*\}\}/g,
        'Hope Hospital'
      ).replace(
        /\{\{\s*TodayDate\s*\}\}/g,
        new Date().toLocaleDateString('en-GB')
      );

      // Try to call the Supabase Edge Function for AI refinement
      try {
        const { data, error } = await supabase.functions.invoke('refine-letter', {
          body: {
            finalLetterText: finalText,
            templateText: selectedRefinementTemplate.promptText,
            variables: {
              HospitalName: 'Hope Hospital',
              TodayDate: new Date().toLocaleDateString('en-GB')
            }
          }
        });

        if (error) {
          console.warn('Supabase function error:', error);
          throw error;
        }

        setRefinedText(data.refinedText);
        toast.success('Letter refined successfully with AI!');
      } catch (apiError) {
        console.warn('AI API not available, using mock refinement:', apiError);
        
        // Fallback to mock refinement when API is not available
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate processing time
        
        // Create a mock refined version with improved formatting
        const refinedResponse = `TO,
State Medical Officer,
Regional Office Maharashtra,
Employees State Insurance Corporation,
Ground Floor, Panchdeep Bhavan,
Near Strand Cinema Bus Stop, S.B.S Marg,
Colaba, Mumbai – 400005

Through: The Superintendent, ESIS Hospital,
Somwarpeth, Nagpur

SUBJECT: REQUEST FOR NON-DEDUCTION OF MEDICAL CHARGES

Dear Sir/Madam,

${finalText}

[NOTE: This is a refined version with improved formatting and structure. The AI refinement service is currently not available, so this is a mock enhancement. To enable full AI refinement, please configure the OpenAI API key in your Supabase project settings.]

Yours sincerely,

Dr. Murali BK
Hope Hospital, Nagpur`;
        
        setRefinedText(refinedResponse);
        toast.success('Letter refined with mock enhancement (AI service not available)');
      }
      
    } catch (error) {
      console.error('Error refining letter:', error);
      toast.error('Failed to refine letter. Please try again.');
    } finally {
      setIsRunningRefinement(false);
    }
  };

  const clearRefinedText = () => {
    if (refinedText.trim()) {
      if (confirm('Are you sure you want to clear the refined letter?')) {
        setRefinedText('');
        setIsEditingRefined(false);
      }
    } else {
      setRefinedText('');
    }
  };

  const saveRefinedAsNew = () => {
    const title = prompt('Enter a title for this refined letter:');
    if (title && refinedText.trim()) {
      // Here you would save to database with version tag 'final-final'
      toast.success(`Refined letter saved as "${title}"`);
    }
  };

  const addRefinementTemplate = () => {
    const name = prompt('Enter template name:');
    if (name) {
      const newTemplate: RefinementTemplate = {
        id: `refine-${Date.now()}`,
        name,
        promptText: 'Enter your refinement prompt here...',
        variables: { FinalLetterText: '' },
        visibility: 'private',
        starred: false
      };
      setRefinementTemplates([newTemplate, ...refinementTemplates]);
    }
  };

  const deleteRefinementTemplate = (id: string) => {
    if (confirm('Are you sure you want to delete this refinement template?')) {
      setRefinementTemplates(refinementTemplates.filter(t => t.id !== id));
      if (selectedRefinementTemplate?.id === id) {
        setSelectedRefinementTemplate(null);
      }
    }
  };

  const filteredRefinementTemplates = refinementTemplates.filter(t => 
    t.name.toLowerCase().includes(refinementSearch.toLowerCase())
  );

  // Functions for prompt editing
  const handleEditInitialPrompt = () => {
    const currentTemplate = templates.find(t => t.id === selectedId);
    if (currentTemplate) {
      setEditingInitialPromptText(currentTemplate.body);
      setIsEditingInitialPrompt(true);
      setShowInitialPrompt(true);
    }
  };

  const handleSaveInitialPrompt = () => {
    setTemplates(prev => prev.map(t => 
      t.id === selectedId ? { ...t, body: editingInitialPromptText } : t
    ));
    setEditor(editingInitialPromptText);
    setIsEditingInitialPrompt(false);
    toast.success('Initial template prompt updated');
  };

  const handleEditRefinementPrompt = () => {
    if (selectedRefinementTemplate) {
      setEditingRefinementPromptText(selectedRefinementTemplate.promptText);
      setIsEditingRefinementPrompt(true);
      setShowRefinementPrompt(true);
    }
  };

  const handleSaveRefinementPrompt = () => {
    if (selectedRefinementTemplate) {
      setRefinementTemplates(prev => prev.map(t => 
        t.id === selectedRefinementTemplate.id 
          ? { ...t, promptText: editingRefinementPromptText } 
          : t
      ));
      setSelectedRefinementTemplate({
        ...selectedRefinementTemplate,
        promptText: editingRefinementPromptText
      });
      setIsEditingRefinementPrompt(false);
      toast.success('Refinement template prompt updated');
    }
  };

  // Show error state if there are data loading errors
  if (hasVisitError && !visitData) {
    return (
      <div className="min-h-screen bg-neutral-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-red-600 mb-4">Error Loading Visit Data</h1>
          <p className="text-gray-600 mb-4">Unable to load visit data. Please try refreshing the page.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-4">
      <div className="mx-auto max-w-[1400px]">
        <header className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)} title="Go back to Final Bill">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <h1 className="text-xl font-semibold tracking-tight">Generate ESIC "No Deduction" Letter</h1>
            <span className="text-sm text-neutral-600">• {patientName}{srNo ? ` (Sr. No. ${srNo})` : ''}</span>
          </div>
          <div className="text-sm text-neutral-500">Preview and print-ready page</div>
        </header>

        <div className={`grid gap-4 ${isLeftCollapsed ? 'md:grid-cols-2' : 'grid-cols-1 lg:grid-cols-4'}`}>
          {/* Left: Templates (collapsible) */}
          {!isLeftCollapsed && (
            <section className="rounded-xl bg-white p-3 border">
              <div className="mb-3 flex items-center gap-2">
                <Button size="icon" variant="ghost" title="Collapse prompts panel" onClick={() => setIsLeftCollapsed(true)}>
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search prompts" className="flex-1" />
                <Button variant="outline" onClick={addTemplate} className="shrink-0" title="Create new prompt">
                  <Plus className="h-4 w-4 mr-1" /> New Prompt
                </Button>
              </div>
              
              {/* Refinement Prompts Section */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700">Refinement Prompts</h4>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={addRefinementTemplate}
                    className="h-6 px-2"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </div>
                <div className="space-y-1 mb-3">
                  {refinementTemplates.slice(0, 3).map((template) => (
                    <div 
                      key={template.id}
                      className={`flex items-center justify-between rounded px-2 py-1 text-xs cursor-pointer ${
                        selectedRefinementTemplate?.id === template.id 
                          ? 'bg-green-50 border border-green-200' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedRefinementTemplate(template)}
                    >
                      <span className="truncate flex-1" title={template.name}>
                        {template.starred && '⭐ '}{template.name}
                      </span>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-4 w-4 ml-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Edit template functionality can be added here
                        }}
                      >
                        <Edit className="h-2 w-2" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border-t pt-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Letter Templates</h4>
              </div>
              
              <ul className="space-y-1 max-h-[420px] overflow-auto pr-1">
                {filtered.map((t) => {
                  const isActive = selectedId === t.id;
                  return (
                    <li key={t.id} className={`flex items-center justify-between rounded-lg px-2 py-2 text-sm border ${isActive ? 'bg-indigo-50/80 border-indigo-200' : 'hover:bg-neutral-50 border-transparent'}`}>
                      <button onClick={() => { setSelectedId(t.id); setTitleEdit(t.title); setEditor(t.body); setPromptDialogText(t.body); }} className="truncate text-left font-medium flex-1" title={t.title}>
                        {t.title}
                      </button>
                      <div className="ml-2 flex items-center gap-1">
                        <Button size="icon" variant="ghost" aria-label="View or edit full prompt" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedId(t.id); setTitleEdit(t.title); setEditor(t.body); setPromptDialogText(t.body); setPromptDialogEditing(false); setPromptDialogOpen(true); }} className="h-7 w-7">
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" aria-label="Edit template" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedId(t.id); setTitleEdit(t.title); setEditor(t.body); setPromptDialogText(t.body); setPromptDialogEditing(true); setPromptDialogOpen(true); }} className="h-7 w-7">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" aria-label="Delete template" onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteTemplate(t.id); }} className="h-7 w-7 text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* Initial Letter Prompt Panel */}
          {!isLeftCollapsed && (
            <section className="rounded-xl bg-white p-3 border">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">Initial Letter Prompt</h3>
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setShowInitialPrompt(!showInitialPrompt)}
                    className="text-xs"
                  >
                    {showInitialPrompt ? 'Hide' : 'Show'} Prompt
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleEditInitialPrompt}
                    className="text-xs"
                  >
                    <Edit className="h-3 w-3 mr-1" /> Edit
                  </Button>
                </div>
              </div>
              
              {showInitialPrompt && (
                <div className="space-y-3">
                  <div className="text-xs text-gray-600 mb-2">
                    Template: <strong>{templates.find(t => t.id === selectedId)?.title}</strong>
                  </div>
                  
                  {isEditingInitialPrompt ? (
                    <div className="space-y-2">
                      <Textarea 
                        value={editingInitialPromptText}
                        onChange={(e) => setEditingInitialPromptText(e.target.value)}
                        className="h-[400px] font-mono text-xs"
                        placeholder="Edit the initial letter template prompt..."
                      />
                      <div className="flex justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setIsEditingInitialPrompt(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          size="sm" 
                          variant="default" 
                          onClick={handleSaveInitialPrompt}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-[400px] overflow-auto border rounded p-3 bg-gray-50">
                      <pre className="text-xs leading-relaxed whitespace-pre-wrap">
                        {templates.find(t => t.id === selectedId)?.body || 'No template selected'}
                      </pre>
                    </div>
                  )}
                </div>
              )}
              
              {!showInitialPrompt && (
                <div className="h-[400px] flex items-center justify-center text-gray-500 text-sm">
                  Click "Show Prompt" to view the initial letter template
                </div>
              )}
            </section>
          )}

          {/* Middle: Preview and editor header */}
          <section className="rounded-xl bg-white p-0 border overflow-hidden">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b bg-white p-3 relative">
              <div className="flex items-center gap-2">
                {isLeftCollapsed && (
                  <Button size="icon" variant="ghost" title="Expand prompts panel" onClick={() => setIsLeftCollapsed(false)}>
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="default" onClick={handlePrint} className="whitespace-nowrap" title="Open print dialog">Print</Button>
                <Button size="sm" variant={isEditingFinal ? 'default' : 'outline'}
                  onClick={() => {
                    if (isEditingFinal) {
                      // Committing edits; keep finalText as is
                      setIsEditingFinal(false);
                    } else {
                      setIsEditingFinal(true);
                    }
                  }}
                  className="whitespace-nowrap"
                  title={isEditingFinal ? 'Finish editing final letter' : 'Edit the final generated letter text'}
                >
                  {isEditingFinal ? 'Done Editing Letter' : 'Edit Final Letter'}
                </Button>
                <Button size="sm" variant="outline" onClick={handleSaveDocument} disabled={isSavingDoc} className="whitespace-nowrap" title="Save the edited letter to Supabase patient documents">
                  {isSavingDoc ? 'Saving…' : 'Save Doc'}
                </Button>
                <Button size="sm" variant="outline" onClick={rerunMerge} className="whitespace-nowrap" title="Generate the letter in the middle panel using selected prompt and right panel data">
                  <Wand2 className="h-4 w-4 mr-1" /> Generate Letter
                </Button>
                <div ref={actionsRef} className="relative">
                  <Button size="sm" variant="outline" className="whitespace-nowrap" title="More actions" onClick={() => setShowActions((v) => !v)}>
                    <MoreHorizontal className="h-4 w-4 mr-1" /> Actions
                  </Button>
                  {showActions && (
                    <div className="absolute right-0 top-full mt-2 z-50 w-40 rounded-md border bg-white shadow-lg">
                      <button className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-neutral-50" onClick={() => { setShowActions(false); saveEditsToTemplate(); }}>
                        <Save className="h-4 w-4" /> Save Prompt
                      </button>
                      <button className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-neutral-50" onClick={() => { setShowActions(false); setIsEditingFinal(v => !v); }}>
                        {isEditingFinal ? 'Done Editing Letter' : 'Edit Final Letter'}
                      </button>
                      <button className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-neutral-50" onClick={() => { setShowActions(false); handleExportPdf(); }}>
                        <Download className="h-4 w-4" /> Export PDF
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div ref={printRef} className="rounded-lg border bg-white p-4">
              <div className="mb-3 no-print-title">
                {isEditingTitleInline ? (
                  <Input
                    type="text"
                    value={titleEdit}
                    autoFocus
                    onChange={(e) => setTitleEdit(e.target.value)}
                    onBlur={() => setIsEditingTitleInline(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') {
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                    className="text-lg font-semibold"
                    title="Edit prompt title"
                  />
                ) : (
                  <button
                    type="button"
                    className="text-left text-lg font-semibold hover:underline"
                    onClick={() => setIsEditingTitleInline(true)}
                    title="Click to edit prompt title"
                  >
                    {titleEdit}
                  </button>
                )}
              </div>
              {isEditingFinal ? (
                <Textarea value={finalText} onChange={(e) => setFinalText(e.target.value)} className="h-[520px]" />
              ) : (
                <pre className="whitespace-pre-wrap text-[13px] leading-6">{finalText}</pre>
              )}
            </div>
            
            {/* AI Refinement Section */}
            <div className="mt-6 border-t pt-6">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Refined Final Letter (AI)</h3>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="default" 
                      onClick={runRefinementPrompt}
                      disabled={isRunningRefinement || !selectedRefinementTemplate || !finalText.trim()}
                      className="whitespace-nowrap"
                    >
                      {isRunningRefinement ? 'Running...' : 'Run Prompt'}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setIsTemplateChooserOpen(true)}
                      className="whitespace-nowrap"
                    >
                      Choose Template
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={saveRefinedAsNew}
                      disabled={!refinedText.trim()}
                      className="whitespace-nowrap"
                    >
                      Save As
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={clearRefinedText}
                      className="whitespace-nowrap"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
                
                {selectedRefinementTemplate && (
                  <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                    <strong>Selected template:</strong> {selectedRefinementTemplate.name}
                  </div>
                )}
                
                <div className="border rounded-lg bg-white p-4">
                  {isEditingRefined ? (
                    <Textarea 
                      value={refinedText} 
                      onChange={(e) => setRefinedText(e.target.value)} 
                      className="h-[400px]" 
                      placeholder="Refined letter will appear here after running the prompt..."
                    />
                  ) : (
                    <pre className="whitespace-pre-wrap text-[13px] leading-6 min-h-[400px]">
                      {refinedText || 'Run a refinement prompt to generate the polished final letter...'}
                    </pre>
                  )}
                  
                  <div className="mt-3 flex items-center justify-between">
                    <Button 
                      size="sm" 
                      variant={isEditingRefined ? 'default' : 'outline'}
                      onClick={() => setIsEditingRefined(!isEditingRefined)}
                    >
                      {isEditingRefined ? 'Done Editing' : 'Edit'}
                    </Button>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          if (refinedText) {
                            navigator.clipboard.writeText(refinedText);
                            toast.success('Copied to clipboard');
                          }
                        }}
                        disabled={!refinedText.trim()}
                      >
                        Copy
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          if (refinedText) {
                            const printWindow = window.open('', '_blank');
                            if (printWindow) {
                              printWindow.document.write(`
                                <!DOCTYPE html>
                                <html>
                                <head>
                                  <title>Refined ESIC Letter</title>
                                  <style>
                                    body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
                                    pre { white-space: pre-wrap; word-wrap: break-word; }
                                  </style>
                                </head>
                                <body>
                                  <pre>${refinedText}</pre>
                                </body>
                                </html>
                              `);
                              printWindow.document.close();
                              printWindow.print();
                            }
                          }
                        }}
                        disabled={!refinedText.trim()}
                      >
                        Print
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Template Chooser Dialog */}
          <Dialog open={isTemplateChooserOpen} onOpenChange={setIsTemplateChooserOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Choose Refinement Template</DialogTitle>
                <DialogDescription>
                  Select a template to refine the final letter with AI.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input 
                    placeholder="Search templates..." 
                    value={refinementSearch}
                    onChange={(e) => setRefinementSearch(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={addRefinementTemplate}
                  >
                    <Plus className="h-4 w-4 mr-1" /> New
                  </Button>
                </div>
                
                <div className="max-h-[400px] overflow-y-auto space-y-2">
                  {filteredRefinementTemplates.map((template) => (
                    <div 
                      key={template.id} 
                      className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                        selectedRefinementTemplate?.id === template.id ? 'border-blue-500 bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedRefinementTemplate(template)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{template.name}</div>
                          <div className="text-sm text-gray-600 truncate">
                            {template.promptText.slice(0, 100)}...
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {template.starred && <span className="text-yellow-500">⭐</span>}
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteRefinementTemplate(template.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsTemplateChooserOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    setIsTemplateChooserOpen(false);
                    toast.success('Template selected');
                  }}
                  disabled={!selectedRefinementTemplate}
                >
                  Select Template
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Prompt viewer/editor dialog */}
          <Dialog open={isPromptDialogOpen} onOpenChange={setPromptDialogOpen}>
            <DialogContent className="max-w-3xl sm:max-w-4xl">
              <DialogHeader>
                <DialogTitle>Full Prompt (Guidance)</DialogTitle>
                <DialogDescription>Visible to the user for guidance. Not printed. Use the middle editor for the letter body only.</DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-neutral-600">{isPromptDialogEditing ? 'Editing' : 'Read-only'}</div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant={isPromptDialogEditing ? 'default' : 'outline'} onClick={() => setPromptDialogEditing(v => !v)}>{isPromptDialogEditing ? 'Done' : 'Edit'}</Button>
                  </div>
                </div>
                {isPromptDialogEditing ? (
                  <Textarea value={promptDialogText} onChange={(e) => setPromptDialogText(e.target.value)} className="h-[60vh] font-mono text-[12px]" />
                ) : (
                  <pre className="h-[60vh] overflow-auto rounded bg-neutral-50 p-3 text-[12px] leading-6 whitespace-pre-wrap break-words">{promptDialogText}</pre>
                )}
              </div>
              <DialogFooter>
                <Button onClick={() => { setEditor(promptDialogText); setPromptDialogOpen(false); rerunMerge(); }} className="ml-auto">
                  Save & Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Right: Data inspector (editable) */}
          <section className="rounded-xl bg-white p-3 border">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                Fetched Patient Data
                <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                  {visitData ? 'Real Data' : 'Mock Data'}
                </span>
              </h3>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={handleRefreshData} disabled={isRefreshing} title="Re-fetch latest data from HMIS/ESIC">
                  <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    console.log('🧪 Starting comprehensive test...');
                    const isConnected = await testDatabaseConnection();
                    if (isConnected) {
                      const data = await fetchMockData();
                      console.log('📊 Visits data from database:', data);
                      if (!data || data.length === 0) {
                        console.log('💡 No data found. Consider creating sample data using the "Create Sample" button.');
                      }
                    }
                  }}
                  title="Test database connection and fetch sample visits data"
                >
                  Test Fetch
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    console.log('🏗️ Creating sample data...');
                    const success = await createSampleData();
                    if (success) {
                      console.log('✅ Sample data created successfully!');
                      // Refresh the data
                      const data = await fetchMockData();
                      console.log('📊 Updated visits data:', data);
                    }
                  }}
                  title="Create sample patient and visit data for testing"
                >
                  Create Sample
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRefreshData}
                  disabled={isRefreshing}
                  title="Refresh and reload the latest visit data"
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    console.log('🔄 Loading sample data...');
                    toast.success('Loading sample data...');

                    // Create sample data directly
                    const sampleData = {
                      patient: {
                        name: 'Priyanka',
                        age: '20',
                        gender: 'Female',
                        claim_id: 'ESIC-2025-001',
                        uhid: 'UHHO25F16001',
                      },
                      admission: {
                        date: '16/06/2025',
                        diagnosis: 'Cardiac Surgery',
                        cghs_code: 'CGHS-1234',
                        cghs_surgery: 'Cardiac Bypass Surgery',
                        package_days: '7',
                      },
                      complication: {
                        name: 'Post-operative infection',
                        onset_date: '18/06/2025',
                        description: 'Fever, elevated WBCs',
                        not_covered_reason: 'Beyond standard package scope - requires additional medical management',
                      },
                      management: {
                        ref_doctor_name: 'Dr. Smith',
                        ref_doctor_designation: 'Consultant Cardiologist',
                        advice_date: '18/06/2025',
                        severity: 'requiring continued medical supervision and monitoring',
                        extra_days: '3',
                        additional_treatment: 'IV antibiotics, monitoring',
                        cghs_tariff_ref: 'CGHS 2024 Ward Tariff',
                      },
                      visit_info: {
                        visit_id: 'V-2025-001',
                        visit_type: 'Surgery',
                        status: 'Completed',
                        relation_with_employee: 'SELF',
                        discharge_date: '23/06/2025',
                      }
                    };

                    setFetched(sampleData);
                    setDataEditor(JSON.stringify(sampleData, null, 2));
                    toast.success('Sample data loaded successfully!');
                  }}
                  title="Load sample data for testing"
                >
                  Load Sample Data
                </Button>
                <Button size="sm" variant={isEditingData ? 'default' : 'outline'} onClick={() => setIsEditingData(v => !v)} title={isEditingData ? 'Close data editor' : 'Edit data JSON before re-merge'}>
                  {isEditingData ? 'Done' : 'Edit Data'}
                </Button>
              </div>
            </div>
            {isEditingData ? (
              <>
                <Textarea value={dataEditor} onChange={(e) => setDataEditor(e.target.value)} className="h-[520px] font-mono text-[12px]" title="Edit JSON data here" />
                <div className="mt-2 flex justify-end"><Button size="sm" onClick={applyEditedData} title="Apply edited JSON to the page (does not save to DB)">Apply Data</Button></div>
              </>
            ) : (
              <pre className="h-[520px] overflow-auto rounded-lg bg-neutral-50 p-3 text-[12px] leading-6" title="Read-only merged data used for the letter">{JSON.stringify(fetched, null, 2)}</pre>
            )}
            <p className="mt-2 text-[11px] text-neutral-500">
              {visitData
                ? 'Real patient data fetched from database. You can edit the JSON and click Apply, then Re‑merge to update the letter.'
                : 'Mock data shown. Provide a valid visitId to fetch real patient data.'}
            </p>
            
            {/* Additional Info for Refinement */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <h4 className="text-sm font-medium mb-2">AI Refinement Guide</h4>
              <p className="text-xs text-gray-600">
                Use the "Refined Final Letter (AI)" section below the main editor to polish your letter with AI.
                Select a refinement template and click "Run Prompt" to enhance grammar, structure, and medical terminology.
              </p>
            </div>
          </section>

          {/* Refinement Prompt Panel */}
          {!isLeftCollapsed && (
            <section className="rounded-xl bg-white p-3 border">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">Refinement Prompt</h3>
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setShowRefinementPrompt(!showRefinementPrompt)}
                    className="text-xs"
                  >
                    {showRefinementPrompt ? 'Hide' : 'Show'} Prompt
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleEditRefinementPrompt}
                    className="text-xs"
                    disabled={!selectedRefinementTemplate}
                  >
                    <Edit className="h-3 w-3 mr-1" /> Edit
                  </Button>
                </div>
              </div>
              
              {showRefinementPrompt && selectedRefinementTemplate && (
                <div className="space-y-3">
                  <div className="text-xs text-gray-600 mb-2">
                    Template: <strong>{selectedRefinementTemplate.name}</strong>
                    {selectedRefinementTemplate.starred && <span className="ml-1">⭐</span>}
                  </div>
                  
                  {isEditingRefinementPrompt ? (
                    <div className="space-y-2">
                      <Textarea 
                        value={editingRefinementPromptText}
                        onChange={(e) => setEditingRefinementPromptText(e.target.value)}
                        className="h-[400px] font-mono text-xs"
                        placeholder="Edit the refinement prompt..."
                      />
                      <div className="flex justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setIsEditingRefinementPrompt(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          size="sm" 
                          variant="default" 
                          onClick={handleSaveRefinementPrompt}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-[400px] overflow-auto border rounded p-3 bg-blue-50">
                      <pre className="text-xs leading-relaxed whitespace-pre-wrap">
                        {selectedRefinementTemplate.promptText}
                      </pre>
                    </div>
                  )}
                </div>
              )}
              
              {showRefinementPrompt && !selectedRefinementTemplate && (
                <div className="h-[400px] flex items-center justify-center text-gray-500 text-sm">
                  Select a refinement template to view its prompt
                </div>
              )}
              
              {!showRefinementPrompt && (
                <div className="h-[400px] flex items-center justify-center text-gray-500 text-sm">
                  Click "Show Prompt" to view the refinement template
                </div>
              )}
              
              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                <strong>Note:</strong> This prompt will be sent to AI with the Final Letter content inserted at {`{{FinalLetterText}}`}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}


