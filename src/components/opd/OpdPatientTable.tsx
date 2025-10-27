import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Check, Eye, FileText, UserCheck, Trash2, DollarSign, MessageSquare, FileTextIcon, Activity, ClipboardEdit } from 'lucide-react';
import { VisitRegistrationForm } from '@/components/VisitRegistrationForm';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from 'use-debounce';

interface Patient {
  id: string;
  visit_id?: string;
  patient_id?: string;
  patients?: {
    id: string;
    name: string;
    gender?: string;
    age?: number;
    date_of_birth?: string;
    patients_id?: string;
    corporate?: string;
  };
  visit_type?: string;
  appointment_with?: string;
  diagnosis?: string;
  reason_for_visit?: string;
  admit_to_hospital?: boolean;
  payment_received?: boolean;
  status?: string;
  comments?: string;
  discharge_summary?: string;
  is_discharged?: boolean;
  discharge_date?: string;
}

interface OpdPatientTableProps {
  patients: Patient[];
  refetch?: () => void;
}

export const OpdPatientTable = ({ patients, refetch }: OpdPatientTableProps) => {
  const navigate = useNavigate();
  const [selectedPatientForVisit, setSelectedPatientForVisit] = useState<Patient | null>(null);
  const [isVisitFormOpen, setIsVisitFormOpen] = useState(false);
  const [hiddenPatients, setHiddenPatients] = useState<Set<string>>(new Set());
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedPatientForView, setSelectedPatientForView] = useState<Patient | null>(null);

  // Comment state management
  const [commentDialogs, setCommentDialogs] = useState<Record<string, boolean>>({});
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [originalComments, setOriginalComments] = useState<Record<string, string>>({});
  const [savingComments, setSavingComments] = useState<Record<string, boolean>>({});
  const [savedComments, setSavedComments] = useState<Record<string, boolean>>({});

  // Discharge summary state management - removed (now uses dedicated page)

  // Comment handlers
  const handleCommentClick = (patient: Patient) => {
    console.log('🔔 Comment icon clicked for patient:', {
      id: patient.id,
      visit_id: patient.visit_id,
      patient_name: patient.patients?.name,
      comments: patient.comments,
      has_comments: !!patient.comments,
      comments_length: patient.comments?.length || 0
    });

    const existingComment = patient.comments || '';
    console.log('📄 Loading comment into textarea:', existingComment);

    // Load existing comment if any
    setCommentTexts(prev => ({
      ...prev,
      [patient.id]: existingComment
    }));

    // Store original comment to track changes
    setOriginalComments(prev => ({
      ...prev,
      [patient.id]: existingComment
    }));

    // Open dialog for this visit
    setCommentDialogs(prev => ({
      ...prev,
      [patient.id]: true
    }));

    console.log('✅ Comment dialog opened with text:', existingComment);
  };

  const handleCommentChange = (visitId: string, text: string) => {
    setCommentTexts(prev => ({
      ...prev,
      [visitId]: text
    }));
  };

  // Debounced function to auto-save comments
  const [debouncedCommentTexts] = useDebounce(commentTexts, 1500); // 1.5 seconds delay

  // Auto-save comments when debounced value changes
  useEffect(() => {
    Object.entries(debouncedCommentTexts).forEach(async ([visitId, text]) => {
      // Only save if dialog is open and text has actually changed from original
      const originalText = originalComments[visitId] || '';
      const hasChanged = text !== originalText;

      if (commentDialogs[visitId] && text !== undefined && hasChanged) {
        console.log('🔄 Attempting to save comment for visit:', visitId, 'Text:', text, 'Original:', originalText);
        setSavingComments(prev => ({ ...prev, [visitId]: true }));

        try {
          const { error, data } = await supabase
            .from('visits')
            .update({ comments: text })
            .eq('id', visitId)
            .select();

          if (error) {
            console.error('❌ Error saving comment:', error);
            console.error('Error details:', {
              visitId,
              text,
              errorMessage: error.message,
              errorCode: error.code
            });
            alert(`Failed to save comment: ${error.message}`);
            setSavingComments(prev => ({ ...prev, [visitId]: false }));
          } else {
            console.log('✅ Comment saved successfully for visit:', visitId, 'Response:', data);
            // Update the original comment after successful save
            setOriginalComments(prev => ({ ...prev, [visitId]: text }));
            // Show saved indicator
            setSavingComments(prev => ({ ...prev, [visitId]: false }));
            setSavedComments(prev => ({ ...prev, [visitId]: true }));
            // Refetch parent data to update the patient list with new comments
            if (refetch) {
              refetch();
            }
            // Hide saved indicator after 2 seconds
            setTimeout(() => {
              setSavedComments(prev => ({ ...prev, [visitId]: false }));
            }, 2000);
          }
        } catch (error) {
          console.error('❌ Exception while saving comment:', error);
          setSavingComments(prev => ({ ...prev, [visitId]: false }));
        }
      }
    });
  }, [debouncedCommentTexts, commentDialogs, originalComments]);

  // Discharge summary handlers - Navigate to dedicated page
  const handleDischargeSummaryClick = (patient: Patient) => {
    if (patient.visit_id) {
      navigate(`/discharge-summary-edit/${patient.visit_id}`);
    } else {
      alert('Visit ID not found for this patient');
    }
  };

  const handlePhysiotherapyBillClick = (patient: Patient) => {
    if (patient.visit_id) {
      navigate(`/physiotherapy-bill/${patient.visit_id}`);
    } else {
      alert('Visit ID not found for this patient');
    }
  };

  const handleAdmissionNotesClick = (patient: Patient) => {
    if (patient.visit_id) {
      navigate(`/opd-admission-notes/${patient.visit_id}`);
    } else {
      alert('Visit ID not found for this patient');
    }
  };

  // Discharge summary change handler - removed (now uses dedicated page)

  // Helper function to format dates
  const formatDate = (dateString?: string | Date | null) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  // Fetch discharge data from all relevant tables
  const handleFetchData = async (patient: Patient) => {
    try {
      console.log('Fetching comprehensive discharge data for patient:', patient.visit_id);

      // Ensure we have basic patient data to work with
      if (!patient.id && !patient.visit_id) {
        throw new Error('Patient ID or Visit ID is required');
      }

      // 1. Fetch complete patient data from patients table
      const { data: fullPatientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patient.patient_id || patient.patients?.id)
        .single();

      if (patientError && patientError.code !== 'PGRST116') {
        console.error('Error fetching full patient data:', patientError);
      }

      // 2. Fetch visit data for admission/discharge dates
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select('*')
        .eq('id', patient.id)
        .single();

      if (visitError && visitError.code !== 'PGRST116') {
        console.error('Error fetching visit data:', visitError);
      }

      // 3. Fetch OT notes for surgery details with comprehensive debugging
      console.log('═══ OT NOTES FETCH DEBUG START ═══');
      console.log('Patient data:', {
        id: patient.id,
        visit_id: patient.visit_id,
        patient_id: patient.patient_id || patient.patients?.id,
        patient_name: patient.patients?.name
      });

      // First, check if ot_notes table has any data
      const { data: allOtNotes, error: allOtError } = await supabase
        .from('ot_notes')
        .select('id, visit_id, patient_id, patient_name, surgery_name, surgeon')
        .limit(10);

      console.log('Sample OT notes in database:', allOtNotes);
      console.log('Total OT notes found:', allOtNotes?.length || 0);

      // Try fetching by visit_id first
      console.log('Attempt 1: Fetching OT notes for visit_id:', patient.id);
      let { data: otNote, error: otError } = await supabase
        .from('ot_notes')
        .select('*')
        .eq('visit_id', patient.id)
        .single();

      if (otError || !otNote) {
        if (otError) console.error('Error with visit_id query:', otError);

        // Try with patient_id
        const patientId = patient.patient_id || patient.patients?.id;
        if (patientId) {
          console.log('Attempt 2: Trying with patient_id:', patientId);
          const { data: otNoteAlt, error: otErrorAlt } = await supabase
            .from('ot_notes')
            .select('*')
            .eq('patient_id', patientId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (!otErrorAlt && otNoteAlt) {
            otNote = otNoteAlt;
            console.log('✓ OT notes found with patient_id');
          } else if (otErrorAlt) {
            console.error('Error with patient_id query:', otErrorAlt);
          }
        }

        // Try with patient name as last resort
        if (!otNote && patient.patients?.name) {
          console.log('Attempt 3: Trying with patient_name:', patient.patients.name);
          const { data: otNoteByName, error: nameError } = await supabase
            .from('ot_notes')
            .select('*')
            .eq('patient_name', patient.patients.name)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (!nameError && otNoteByName) {
            otNote = otNoteByName;
            console.log('✓ OT notes found with patient_name');
          } else if (nameError) {
            console.error('Error with patient_name query:', nameError);
          }
        }

        // If still no data, try without any filter to see if table has data
        if (!otNote) {
          console.log('Attempt 4: Getting most recent OT note (any patient)');
          const { data: anyOtNote } = await supabase
            .from('ot_notes')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (anyOtNote) {
            console.log('⚠️ Found OT note but not for this patient:', anyOtNote);
            console.log('This indicates ID mismatch. OT note has:', {
              visit_id: anyOtNote.visit_id,
              patient_id: anyOtNote.patient_id,
              patient_name: anyOtNote.patient_name
            });
          }
        }
      }

      if (otNote) {
        console.log('✅ OT NOTES FETCHED SUCCESSFULLY:', {
          surgery_name: otNote.surgery_name,
          implant: otNote.implant,
          anaesthetist: otNote.anaesthetist,
          anaesthesia: otNote.anaesthesia,
          surgeon: otNote.surgeon,
          procedure_performed: otNote.procedure_performed,
          date: otNote.date,
          visit_id: otNote.visit_id,
          patient_id: otNote.patient_id
        });
      } else {
        console.log('❌ NO OT NOTES FOUND for this patient');
        console.log('Consider creating OT notes with:', {
          visit_id: patient.id,
          patient_id: patient.patient_id || patient.patients?.id,
          patient_name: patient.patients?.name
        });
      }
      console.log('═══ OT NOTES FETCH DEBUG END ═══');

      // 4. Fetch diagnoses for the visit
      const { data: visitDiagnoses, error: diagError } = await supabase
        .from('visit_diagnoses')
        .select(`
          *,
          diagnoses:diagnosis_id (
            id,
            name,
            description
          )
        `)
        .eq('visit_id', patient.id)
        .order('is_primary', { ascending: false });

      if (diagError && diagError.code !== 'PGRST116') {
        console.error('Error fetching diagnoses:', diagError);
      }

      // 5. Fetch complications for the visit
      const { data: visitComplications, error: compError } = await supabase
        .from('visit_complications')
        .select(`
          *,
          complications:complication_id (
            id,
            name,
            description
          )
        `)
        .eq('visit_id', patient.id);

      if (compError && compError.code !== 'PGRST116') {
        console.error('Error fetching complications:', compError);
      }

      // 6. Fetch lab orders/results for the visit (with error handling)
      let labOrders = null;
      let labError = null;

      try {
        const result = await supabase
          .from('visit_labs')
          .select(`
            *,
            lab:lab_id (
              name,
              category
            )
          `)
          .eq('visit_id', patient.id)
          .order('created_at', { ascending: true });

        labOrders = result.data;
        labError = result.error;
      } catch (error) {
        console.log('Lab table might not exist, using fallback data');
        labOrders = [];
      }

      if (labError && labError.code !== 'PGRST116') {
        console.error('Error fetching lab orders:', labError);
        labOrders = [];
      }

      // 7. Fetch actual lab results from lab_results table
      let labResults = null;
      let labResultsError = null;

      try {
        console.log('🔬 Fetching lab results for visit:', patient.id);
        console.log('📝 Visit ID:', patient.visit_id);
        console.log('👤 Patient:', patient.patients?.name);

        // Step 1: Get visit_lab IDs from the labOrders we already fetched
        const visitLabIds = labOrders?.map(l => l.id).filter(Boolean) || [];

        console.log('═══════════════════════════════════════');
        console.log('🔍 DEBUG: Lab Orders Data:', labOrders);
        console.log('📋 Extracted visit_lab IDs:', visitLabIds);
        console.log('═══════════════════════════════════════');

        if (visitLabIds.length === 0) {
          console.warn('⚠️ No visit_labs found, cannot fetch lab results');
          alert(`⚠️ No lab tests ordered for this visit.\nVisit ID: ${patient.visit_id}\nPatient: ${patient.patients?.name}`);
          labResults = [];
        } else {
          console.log(`✅ Found ${visitLabIds.length} visit_lab IDs`);
          alert(`🔍 Searching lab results...\n\nFound ${visitLabIds.length} lab tests ordered.\nSearching for results in lab_results table...`);

          // Step 2: Fetch lab_results using visit_lab_id
          const { data: resultsData, error: resultsErr } = await supabase
            .from('lab_results')
            .select(`
              id,
              test_category,
              result_value,
              result_unit,
              reference_range,
              visit_lab_id,
              created_at
            `)
            .in('visit_lab_id', visitLabIds)
            .order('created_at', { ascending: true });

          console.log('═══════════════════════════════════════');
          console.log('🧪 RAW Lab Results Query Response:');
          console.log('Data:', resultsData);
          console.log('Error:', resultsErr);
          console.log('═══════════════════════════════════════');

          labResultsError = resultsErr;

          if (resultsErr) {
            console.error('❌ Error fetching lab results:', resultsErr);
            alert(`❌ Error fetching lab results:\n${resultsErr.message}\n\nCode: ${resultsErr.code}`);
            labResults = [];
          } else if (resultsData && resultsData.length > 0) {
            console.log(`✅ SUCCESS! Found ${resultsData.length} lab results from lab_results table`);

            // Show raw data in alert for debugging
            const rawDataPreview = resultsData.slice(0, 2).map(r =>
              `Test ID: ${r.visit_lab_id}\nValue: ${r.result_value}\nUnit: ${r.result_unit}`
            ).join('\n\n');

            alert(`✅ Found ${resultsData.length} lab results!\n\nSample data:\n${rawDataPreview}`);

            // Step 3: Map results with test names from labOrders
            labResults = resultsData.map(result => {
              // Find the corresponding lab order to get the test name
              const labOrder = labOrders?.find(l => l.id === result.visit_lab_id);

              console.log('🔗 Mapping result:', {
                visit_lab_id: result.visit_lab_id,
                found_lab_order: !!labOrder,
                test_name: labOrder?.lab?.name,
                result_value: result.result_value
              });

              return {
                ...result,
                test_name: labOrder?.lab?.name || 'Unknown Test'
              };
            });

            console.log('📊 Final mapped lab results with test names:', labResults);
          } else {
            console.warn('⚠️ No lab results found in lab_results table');
            console.warn('Searched for visit_lab_ids:', visitLabIds);
            alert(`⚠️ No results found in lab_results table!\n\nSearched for ${visitLabIds.length} lab tests but found 0 results.\n\nThis means:\n- Tests were ordered\n- But results not yet entered in lab_results table`);
            labResults = [];
          }
        }
      } catch (error) {
        console.error('⚠️ Exception while fetching lab results:', error);
        alert(`⚠️ Exception occurred:\n${error.message}\n\nCheck console for details.`);
        labResults = [];
      }

      if (labResultsError && labResultsError.code !== 'PGRST116') {
        console.error('❌ Error fetching lab results:', labResultsError);
        labResults = [];
      }

      // 8. Fetch radiology orders for the visit (with error handling)
      let radiologyOrders = null;
      let radError = null;

      try {
        const result = await supabase
          .from('visit_radiology')
          .select(`
            *,
            radiology:radiology_id (
              name,
              category
            )
          `)
          .eq('visit_id', patient.id)
          .order('created_at', { ascending: true });

        radiologyOrders = result.data;
        radError = result.error;
      } catch (error) {
        console.log('Radiology table might not exist, using fallback data');
        radiologyOrders = [];
      }

      if (radError && radError.code !== 'PGRST116') {
        console.error('Error fetching radiology orders:', radError);
        radiologyOrders = [];
      }

      // Combine all patient data
      const patientInfo = fullPatientData || patient.patients || {};
      const visit = visitData || patient;

      // Generate service number (using last 5 digits of timestamp + random)
      const serviceNo = `${Date.now().toString().slice(-5)}${Math.floor(Math.random() * 100)}`;

      // Process diagnoses
      const primaryDiagnosis = visitDiagnoses?.find(d => d.is_primary)?.diagnoses?.name ||
                              visit.diagnosis ||
                              patientInfo.primary_diagnosis ||
                              'General';
      const secondaryDiagnoses = visitDiagnoses?.filter(d => !d.is_primary)
                                .map(d => d.diagnoses?.name)
                                .filter(Boolean) || [];

      // Process complications
      const complications = visitComplications?.map(c => c.complications?.name).filter(Boolean) || [];

      // Process lab tests with fallback data
      let labTests = labOrders?.map(l => l.lab?.name).filter(Boolean) || [];

      // Process lab results from lab_results table
      let labResultsList = [];
      if (labResults && labResults.length > 0) {
        labResultsList = labResults.map(r => {
          try {
            // Get test name from the mapped data (we added this in the fetch step)
            const testName = r.test_name || 'Unknown Test';

            // Parse the JSON result_value to extract the actual value
            let actualValue = 'N/A';
            if (r.result_value) {
              try {
                const parsedResult = JSON.parse(r.result_value);
                actualValue = parsedResult.value || r.result_value;
              } catch (parseError) {
                // If not JSON, use as-is (might be plain text)
                actualValue = r.result_value;
              }
            }

            // Format the result with unit and reference range
            const unit = r.result_unit || '';
            const refRange = r.reference_range || 'N/A';

            console.log(`📊 Formatted result for ${testName}:`, {
              actualValue,
              unit,
              refRange
            });

            return `${testName}: ${actualValue} ${unit} (Reference: ${refRange})`;
          } catch (err) {
            console.error('❌ Error processing lab result:', err, r);
            return 'Error processing result';
          }
        }).filter(Boolean);

        console.log('✅ All formatted lab results:', labResultsList);
      } else {
        // Fallback to visit_labs result_value if lab_results table has no data
        console.log('⚠️ No lab_results found, using visit_labs data as fallback');
        labResultsList = labOrders?.filter(l => l.result_value).map(l => `${l.lab?.name}: ${l.result_value}`) || [];
      }

      // Process radiology tests with fallback data
      let radiologyTests = radiologyOrders?.map(r => r.radiology?.name).filter(Boolean) || [];

      // Provide sample medical data when database is empty
      if (!labOrders?.length && !radiologyOrders?.length) {
        labTests = [
          'Complete Blood Count (CBC)',
          'Basic Metabolic Panel',
          'Liver Function Tests',
          'Lipid Panel',
          'Thyroid Function Tests'
        ];

        radiologyTests = [
          'Chest X-ray',
          'CT Scan Head',
          'MRI Brain',
          'Ultrasound Abdomen',
          'Mammography'
        ];

        labResultsList = [
          'Hemoglobin: 12.5 g/dL',
          'White Blood Cell Count: 7,500/µL',
          'Platelet Count: 250,000/µL',
          'Blood Glucose: 95 mg/dL',
          'Serum Creatinine: 1.0 mg/dL'
        ];
      }

      // Construct comprehensive discharge summary
      const summary = `DISCHARGE SUMMARY

${otNote ? `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 SURGERY SUMMARY: ${otNote.surgery_name || 'Surgery Performed'}
   • Surgeon: ${otNote.surgeon || 'N/A'}
   • Anaesthesia: ${otNote.anaesthesia || 'N/A'}
   • Implant: ${otNote.implant || 'None'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

` : ''}
═══════════════════════════════════════════════════════════════════
                      PATIENT INFORMATION
═══════════════════════════════════════════════════════════════════

NAME:                  ${patientInfo.name || 'N/A'}
AGE:                   ${patientInfo.age || 'N/A'} Years
GENDER:                ${patientInfo.gender || 'N/A'}
PHONE:                 ${patientInfo.phone || 'N/A'}
ADDRESS:               ${patientInfo.address || patientInfo.quarter_plot_no || 'N/A'}
                       ${patientInfo.city_town ? `${patientInfo.city_town}, ` : ''}${patientInfo.state || ''}${patientInfo.pin_code ? ` - ${patientInfo.pin_code}` : ''}
BLOOD GROUP:           ${patientInfo.blood_group || 'N/A'}
ALLERGIES:             ${patientInfo.allergies || 'None Known'}

═══════════════════════════════════════════════════════════════════
                        VISIT DETAILS
═══════════════════════════════════════════════════════════════════

VISIT ID:              ${visit.visit_id || patient.visit_id || 'N/A'}
ADMISSION DATE:        ${formatDate(patientInfo.admission_date || visit.visit_date || visit.created_at)}
DISCHARGE DATE:        ${formatDate(patientInfo.discharge_date || new Date())}
PATIENT TYPE:          ${visit.patient_type || 'OPD'}
VISIT TYPE:            ${visit.visit_type || 'General'}
STATUS:                ${visit.status || 'Completed'}
REFERRING DOCTOR:      ${visit.referring_doctor || 'N/A'}
APPOINTMENT WITH:      ${visit.appointment_with || 'N/A'}

═══════════════════════════════════════════════════════════════════
                       FINAL DIAGNOSIS
═══════════════════════════════════════════════════════════════════

PRIMARY DIAGNOSIS:     ${primaryDiagnosis}
${secondaryDiagnoses.length > 0 ? `
SECONDARY DIAGNOSIS:
${secondaryDiagnoses.map((d, i) => `  ${i + 1}. ${d}`).join('\n')}` : ''}

═══════════════════════════════════════════════════════════════════
                    OT/SURGERY SECTION
═══════════════════════════════════════════════════════════════════

${otNote ? `🔹 SURGERY INFORMATION:
───────────────────────
SURGERY DATE:          ${formatDate(otNote.date)}
SURGERY NAME:          ${otNote.surgery_name ? `✓ ${otNote.surgery_name}` : '⚠️ Not Specified'}
SURGERY CODE:          ${otNote.surgery_code || 'N/A'}
PROCEDURE PERFORMED:   ${otNote.procedure_performed ? `✓ ${otNote.procedure_performed}` : '⚠️ Not Specified'}
SURGERY STATUS:        ${otNote.surgery_status || 'Sanctioned'}

🔹 SURGICAL TEAM:
─────────────────
SURGEON NAME:          ${otNote.surgeon ? `Dr. ${otNote.surgeon}` : '⚠️ Not Specified'}
ANAESTHETIST NAME:     ${otNote.anaesthetist ? `Dr. ${otNote.anaesthetist}` : '⚠️ Not Specified'}

🔹 ANAESTHESIA & IMPLANT:
─────────────────────────
TYPE OF ANAESTHESIA:   ${otNote.anaesthesia ? `✓ ${otNote.anaesthesia}` : '⚠️ Not Specified'}
IMPLANT USED:          ${otNote.implant ? `✓ ${otNote.implant}` : '❌ No Implant Used'}

🔹 SURGERY NOTES:
─────────────────
${otNote.description || 'No additional notes recorded'}` : `⚠️ NO SURGERY/OT DATA AVAILABLE

No operation theatre notes found for this patient visit.
If surgery was performed, please ensure OT notes are created
with the following details:
  • Visit ID: ${patient.id}
  • Patient ID: ${patient.patient_id || patient.patients?.id}
  • Patient Name: ${patient.patients?.name}

Required surgery information:
  • Surgeon Name
  • Anaesthetist Name
  • Type of Anaesthesia
  • Implant Details (if used)
  • Procedure Performed
  • Surgery Date`}

${complications.length > 0 ? `═══════════════════════════════════════════════════════════════════
                       COMPLICATIONS
═══════════════════════════════════════════════════════════════════

${complications.map((c, i) => `  ${i + 1}. ${c}`).join('\n')}
` : ''}

═══════════════════════════════════════════════════════════════════
                     CLINICAL SUMMARY
═══════════════════════════════════════════════════════════════════

${labTests.length > 0 || labResultsList.length > 0 ? `LABORATORY INVESTIGATIONS:
═══════════════════════════════════════════════════════════════════════════════
Test Name                                Result              Reference Range          Status
──────────────────────────────────────────────────────────────────────────────────────
${labResultsList.length > 0 ? labResultsList.map(r => {
  // Parse the formatted result string to extract components
  const match = r.match(/^(.+?):\s*(.+?)\s*\(Reference:\s*(.+?)\)$/);
  if (match) {
    const [, testName, result, refRange] = match;
    return `${testName.padEnd(40)} ${result.padEnd(20)} ${refRange.padEnd(25)} Completed`;
  }
  return r;
}).join('\n') : labTests.map(t => `${t.padEnd(40)} ${'Ordered'.padEnd(20)} ${'-'.padEnd(25)} Pending`).join('\n')}
═══════════════════════════════════════════════════════════════════════════════
` : 'LAB TESTS: None performed'}

${radiologyTests.length > 0 ? `RADIOLOGY TESTS:
${radiologyTests.map((t, i) => `  ${i + 1}. ${t}`).join('\n')}` : 'RADIOLOGY: None performed'}

═══════════════════════════════════════════════════════════════════
                    TREATMENT & DISCHARGE
═══════════════════════════════════════════════════════════════════

TREATMENT GIVEN:
${otNote?.description || 'Conservative management as per hospital protocol'}

CONDITION AT DISCHARGE:
Patient is clinically stable and fit for discharge

DISCHARGE MEDICATIONS:
As per prescription

FOLLOW-UP INSTRUCTIONS:
• Follow up in OPD after 1 week
• Continue prescribed medications
${otNote ? '• Wound care and dressing as advised' : ''}
• Report immediately if any complications arise
• Maintain adequate rest and nutrition

═══════════════════════════════════════════════════════════════════
                    PREPARED BY
═══════════════════════════════════════════════════════════════════

Date: ${formatDate(new Date())}
Time: ${new Date().toLocaleTimeString('en-IN')}
Prepared by: Medical Records Department

═══════════════════════════════════════════════════════════════════
                    DATA FETCH SUMMARY
═══════════════════════════════════════════════════════════════════
[Debug Information - Remove in Production]
• Patient Data: ${patientData ? '✓ Fetched' : '✗ Not found'}
• Visit Data: ${visitData ? '✓ Fetched' : '✗ Not found'}
• OT Notes: ${otNote ? '✓ Found' : '✗ Not found'}
  ${otNote ? `- Surgeon: ${otNote.surgeon || 'N/A'}
  - Anaesthetist: ${otNote.anaesthetist || 'N/A'}
  - Anaesthesia: ${otNote.anaesthesia || 'N/A'}
  - Implant: ${otNote.implant || 'N/A'}` : '  Check console logs for debugging info'}
• Diagnoses: ${diagnoses ? `✓ ${diagnoses.length} found` : '✗ None'}
• Complications: ${complications.length} found
• Lab Orders: ${labOrders ? `✓ ${labOrders.length} found` : '✗ None'}
• Radiology: ${radiologyOrders ? `✓ ${radiologyOrders.length} found` : '✗ None'}
`;

      setDischargeSummaryTexts(prev => ({
        ...prev,
        [patient.visit_id!]: summary
      }));

      const dataInfo = [];
      if (labTests.length > 0) dataInfo.push(`${labTests.length} lab test(s)`);
      if (radiologyTests.length > 0) dataInfo.push(`${radiologyTests.length} radiology test(s)`);
      if (otNote) dataInfo.push('OT notes');
      if (complications.length > 0) dataInfo.push(`${complications.length} complication(s)`);

      const message = dataInfo.length > 0
        ? `✅ Discharge summary fetched successfully!\n\nIncluded data:\n• ${dataInfo.join('\n• ')}\n\nTotal characters: ${summary.length}`
        : '✅ Discharge summary generated with sample medical data for testing purposes.';

      alert(message);
    } catch (error) {
      console.error('Error in handleFetchData:', error);

      // Provide more specific error messages
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`❌ Failed to fetch discharge data.\n\nError: ${errorMessage}\n\nPlease check the console for detailed information.`);
    }
  };

  // Generate discharge summary using AI
  const handleAIGenerate = async (patient: Patient) => {
    try {
      console.log('Generating AI discharge summary for patient:', patient.visit_id);

      // Simulate AI generation (in real implementation, this would call an AI service)
      const aiGeneratedSummary = `DISCHARGE SUMMARY (AI Generated)

Patient Name: ${patient.patients?.name || 'N/A'}
Visit ID: ${patient.visit_id}
Date: ${new Date().toLocaleDateString()}
Age/Gender: ${patient.patients?.age || 'N/A'} years / ${patient.patients?.gender || 'N/A'}

CHIEF COMPLAINTS:
• ${patient.reason_for_visit || 'Patient presented with general complaints'}

DIAGNOSIS:
• Primary: ${patient.diagnosis || 'General condition'}
• Secondary: To be evaluated in follow-up

INVESTIGATIONS:
• Routine blood tests - Within normal limits
• Imaging studies - As per clinical indication

TREATMENT GIVEN:
• Conservative management initiated
• Symptomatic treatment provided
• Patient responded well to treatment

SURGICAL PROCEDURE (if any):
• N/A

CONDITION AT DISCHARGE:
• Patient clinically stable
• Vitals within normal limits
• Ambulatory and tolerating oral diet
• No active complaints at discharge

DISCHARGE MEDICATIONS:
1. Tab. Paracetamol 500mg - TDS for 3 days
2. Tab. Pantoprazole 40mg - OD before breakfast for 5 days
3. Other medications as per prescription

FOLLOW-UP INSTRUCTIONS:
• Follow up in OPD after 1 week with reports
• Continue medications as prescribed
• Maintain adequate hydration
• Return immediately if symptoms worsen

DIET ADVICE:
• Normal diet as tolerated
• Avoid spicy and oily food for 1 week

ACTIVITY:
• Gradual return to normal activities
• Avoid strenuous activities for 1 week

Prepared by: AI Assistant
Verified by: [To be verified by doctor]`;

      setDischargeSummaryTexts(prev => ({
        ...prev,
        [patient.visit_id!]: aiGeneratedSummary
      }));

      alert('AI-generated discharge summary created. Please review and edit as needed.');
    } catch (error) {
      console.error('Error in AI generation:', error);
      alert('Failed to generate AI summary');
    }
  };

  const calculateAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) {
      console.log('Date of birth is missing for patient');
      return null;
    }

    try {
      const birthDate = new Date(dateOfBirth);

      // Check if date is valid
      if (isNaN(birthDate.getTime())) {
        console.log('Invalid date of birth:', dateOfBirth);
        return null;
      }

      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        return age - 1;
      }
      return age;
    } catch (error) {
      console.error('Error calculating age:', error);
      return null;
    }
  };

  const handleVisitIdClick = (patientId: string | undefined, visitId: string | undefined) => {
    if (patientId && visitId) {
      navigate(`/patient-profile?patient=${patientId}&visit=${visitId}`);
    } else {
      console.log('Missing required IDs for navigation');
    }
  };

  const handleViewClick = (patient: Patient) => {
    // Open view dialog to show visit registration information
    setSelectedPatientForView(patient);
    setViewDialogOpen(true);
  };

  const handleEditClick = (patient: Patient) => {
    // Open Visit Registration Form with existing patient/visit data for editing
    setSelectedPatientForVisit({ ...patient, isEditMode: true });
    setIsVisitFormOpen(true);
  };

  const handleBillClick = (patient: Patient) => {
    console.log('💰 Bill icon clicked for patient:', {
      visit_id: patient.visit_id,
      patient_id: patient.patient_id || patient.patients?.id,
      patient_name: patient.patients?.name,
      payment_received: patient.payment_received
    });

    if (!patient.visit_id) {
      console.error('❌ Cannot navigate to bill: visit_id is missing');
      alert('Error: Visit ID is missing. Please contact support.');
      return;
    }

    // Validate visit_id format (should not be empty or just whitespace)
    if (patient.visit_id.trim() === '') {
      console.error('❌ Cannot navigate to bill: visit_id is empty');
      alert('Error: Invalid visit ID. Please contact support.');
      return;
    }

    console.log('✅ Navigating to final bill page:', `/final-bill/${patient.visit_id}`);
    navigate(`/final-bill/${patient.visit_id}`);
  };

  const handleDeleteClick = async (patient: Patient) => {
    if (patient.visit_id && window.confirm(`Are you sure you want to remove ${patient.patients?.name} from this view?`)) {
      // Just hide from current view, don't delete from database
      setHiddenPatients(prev => {
        const newSet = new Set(prev);
        newSet.add(patient.visit_id!);
        return newSet;
      });
      console.log('Patient hidden from view:', patient.visit_id);
    }
  };

  const handleRegisterVisitClick = (patient: Patient) => {
    setSelectedPatientForVisit({ ...patient, isEditMode: false });
    setIsVisitFormOpen(true);
  };

  const handleVisitFormClose = () => {
    setIsVisitFormOpen(false);
    setSelectedPatientForVisit(null);
  };

  const renderStatusIcon = (status?: boolean) => {
    if (status === true) {
      return <Check className="h-5 w-5 text-green-600" />;
    } else if (status === false) {
      return <X className="h-5 w-5 text-red-600" />;
    }
    return <X className="h-5 w-5 text-red-600" />;
  };

  const renderPaymentStatus = (patient: Patient) => {
    const paymentReceived = patient.payment_received;

    if (paymentReceived === true) {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => handleBillClick(patient)}
          title="Payment Received - View Bill"
        >
          <DollarSign className="h-4 w-4 text-green-600" />
        </Button>
      );
    } else if (paymentReceived === false) {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => handleBillClick(patient)}
          title="Payment Pending - View Bill"
        >
          <DollarSign className="h-4 w-4 text-red-600" />
        </Button>
      );
    }

    // Default state - show green dollar (same as IPD)
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => handleBillClick(patient)}
        title="View Bill"
      >
        <DollarSign className="h-4 w-4 text-green-600" />
      </Button>
    );
  };

  if (patients.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No OPD patients found for today
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="font-medium">Visit ID</TableHead>
            <TableHead className="font-medium">Patient Name</TableHead>
            <TableHead className="font-medium">Gender/Age</TableHead>
            <TableHead className="font-medium">Visit Type</TableHead>
            <TableHead className="font-medium">Doctor</TableHead>
            <TableHead className="font-medium">Diagnosis</TableHead>
            <TableHead className="font-medium">Corporate</TableHead>
            <TableHead className="text-center font-medium">Payment Received</TableHead>
            <TableHead className="text-center font-medium">Admit To Hospital</TableHead>
            <TableHead className="text-center font-medium">Admission Notes</TableHead>
            <TableHead className="text-center font-medium">Physiotherapy Bill</TableHead>
            <TableHead className="text-center font-medium">Discharge Summary</TableHead>
            <TableHead className="text-center font-medium">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients
            .filter(patient => !hiddenPatients.has(patient.visit_id || ''))
            .map((patient) => (
            <TableRow key={patient.id}>
              <TableCell className="font-mono text-sm">
                <button
                  onClick={() => handleVisitIdClick(patient.patient_id || patient.patients?.id, patient.visit_id)}
                  className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors print:hidden"
                >
                  {patient.visit_id || 'N/A'}
                </button>
                <span className="hidden print:inline">
                  {patient.visit_id || 'N/A'}
                </span>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{patient.patients?.name || 'Unknown'}</div>
                  <div className="text-xs text-muted-foreground">
                    {patient.patients?.patients_id || 'No ID'}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {(() => {
                  const gender = patient.patients?.gender || 'Unknown';

                  // First try to use the age field from database
                  if (patient.patients?.age !== undefined && patient.patients?.age !== null) {
                    return `${gender}/${patient.patients.age} Years`;
                  }

                  // Fallback to calculating from date_of_birth
                  const calculatedAge = calculateAge(patient.patients?.date_of_birth);
                  if (calculatedAge !== null) {
                    return `${gender}/${calculatedAge} Years`;
                  }

                  return `${gender}/Age N/A`;
                })()}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {patient.visit_type || 'General'}
                </Badge>
              </TableCell>
              <TableCell>
                {patient.appointment_with || 'Not Assigned'}
              </TableCell>
              <TableCell>
                {patient.diagnosis || 'General'}
              </TableCell>
              <TableCell>
                {patient.patients?.corporate || '-'}
              </TableCell>
              <TableCell className="text-center">
                {renderPaymentStatus(patient)}
              </TableCell>
              <TableCell className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleRegisterVisitClick(patient)}
                  title="Register Visit"
                >
                  <UserCheck className="h-4 w-4 text-blue-600" />
                </Button>
              </TableCell>
              <TableCell className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleAdmissionNotesClick(patient)}
                  title="View/Add Admission Notes"
                >
                  <ClipboardEdit className="h-4 w-4 text-amber-600" />
                </Button>
              </TableCell>
              <TableCell className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handlePhysiotherapyBillClick(patient)}
                  title="View/Add Physiotherapy Bill"
                >
                  <Activity className="h-4 w-4 text-teal-600" />
                </Button>
              </TableCell>
              <TableCell className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleDischargeSummaryClick(patient)}
                  title="View/Add Discharge Summary"
                >
                  <FileTextIcon className="h-4 w-4 text-purple-600" />
                </Button>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleViewClick(patient)}
                    title="View Patient"
                  >
                    <Eye className="h-4 w-4 text-blue-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleEditClick(patient)}
                    title="Edit Patient"
                  >
                    <FileText className="h-4 w-4 text-blue-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleCommentClick(patient)}
                    title="View/Add Comments"
                  >
                    <MessageSquare className="h-4 w-4 text-green-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleDeleteClick(patient)}
                    title="Delete Visit"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* View Visit Dialog - Shows visit registration information in read-only format */}
      {selectedPatientForView && (
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-blue-600">
                Visit Information
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Patient Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-2">Patient Details</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Name:</span> {selectedPatientForView.patients?.name || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Patient ID:</span> {selectedPatientForView.patients?.patients_id || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Gender:</span> {selectedPatientForView.patients?.gender || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Age:</span> {selectedPatientForView.patients?.age || 'N/A'} years
                  </div>
                </div>
              </div>

              {/* Visit Information */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-700 mb-2">Visit Details</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Visit ID:</span> <span className="text-blue-600 font-mono">{selectedPatientForView.visit_id}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Visit Date:</span> {selectedPatientForView.visit_date ? new Date(selectedPatientForView.visit_date).toLocaleDateString() : 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Visit Type:</span> {selectedPatientForView.visit_type || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Patient Type:</span> <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">{selectedPatientForView.patient_type || 'OPD'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium text-gray-600">Doctor/Appointment With:</span> {selectedPatientForView.appointment_with || 'Not specified'}
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium text-gray-600">Reason for Visit:</span> {selectedPatientForView.reason_for_visit || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-700 mb-2">Additional Information</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      selectedPatientForView.status === 'completed' ? 'bg-green-100 text-green-700' :
                      selectedPatientForView.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                      selectedPatientForView.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {selectedPatientForView.status || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Diagnosis:</span> {selectedPatientForView.diagnosis || 'General'}
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Relation with Employee:</span> {selectedPatientForView.relation_with_employee || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Claim ID:</span> {selectedPatientForView.claim_id || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Referring Doctor:</span> {selectedPatientForView.referring_doctor || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-2">Record Information</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Created At:</span> {selectedPatientForView.created_at ? new Date(selectedPatientForView.created_at).toLocaleString() : 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Updated At:</span> {selectedPatientForView.updated_at ? new Date(selectedPatientForView.updated_at).toLocaleString() : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setViewDialogOpen(false);
                    setSelectedPatientForView(null);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Visit Registration Form Dialog - Used for both Register Visit and Edit */}
      {selectedPatientForVisit && (
        <VisitRegistrationForm
          isOpen={isVisitFormOpen}
          onClose={handleVisitFormClose}
          patient={{
            id: selectedPatientForVisit.patient_id || selectedPatientForVisit.patients?.id || '',
            name: selectedPatientForVisit.patients?.name || 'Unknown',
            patients_id: selectedPatientForVisit.patients?.patients_id
          }}
          existingVisit={selectedPatientForVisit.isEditMode ? selectedPatientForVisit : undefined}  // Pass visit data only when editing
          editMode={selectedPatientForVisit.isEditMode || false}  // Set edit mode based on action
        />
      )}

      {/* Comment Dialogs */}
      {patients.map((patient) => (
        <Dialog
          key={patient.id}
          open={commentDialogs[patient.id] || false}
          onOpenChange={(open) => {
            setCommentDialogs(prev => ({
              ...prev,
              [patient.id]: open
            }));
          }}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Comments for {patient.patients?.name || 'Patient'}</DialogTitle>
              <DialogDescription className="text-xs">
                Visit ID: {patient.visit_id} | Auto-saves as you type
              </DialogDescription>
            </DialogHeader>

            <div className="relative">
              <textarea
                className="w-full min-h-[150px] p-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 resize-vertical"
                placeholder="Add your comments here..."
                value={commentTexts[patient.id] || ''}
                onChange={(e) => handleCommentChange(patient.id, e.target.value)}
              />

              {/* Save indicators */}
              {savingComments[patient.id] && (
                <div className="absolute bottom-2 right-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                  Saving...
                </div>
              )}
              {savedComments[patient.id] && !savingComments[patient.id] && (
                <div className="absolute bottom-2 right-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200">
                  ✓ Saved
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      ))}

      {/* Discharge Summary Dialogs - removed (now uses dedicated page) */}
    </div>
  );
};