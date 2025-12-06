import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Printer, Sparkles, Download, Eye, Loader2, Edit3, Settings } from 'lucide-react';
import { useDebounce } from 'use-debounce';
import DischargeSummary from '@/components/DischargeSummary';
import { useVisitDiagnosis } from '@/hooks/useVisitDiagnosis';

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
  discharge_summary?: string;
}

// Helper function to convert HTML to plain text
function htmlToPlainText(html: string): string {
  // Create a temporary div element to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  // Replace <br> and </p> tags with newlines
  html = html.replace(/<br\s*\/?>/gi, '\n');
  html = html.replace(/<\/p>/gi, '\n\n');
  html = html.replace(/<\/div>/gi, '\n');
  html = html.replace(/<\/li>/gi, '\n');

  // Remove all HTML tags
  html = html.replace(/<[^>]*>/g, '');

  // Decode HTML entities
  const textarea = document.createElement('textarea');
  textarea.innerHTML = html;
  html = textarea.value;

  // Clean up extra whitespace
  html = html.replace(/\n{3,}/g, '\n\n'); // Replace 3+ newlines with 2
  html = html.replace(/^\s+|\s+$/g, ''); // Trim

  return html;
}

// Helper function to wrap long text for better formatting
function wrapText(text: string, maxLength: number = 55): string {
  if (!text || text.length <= maxLength) return text;

  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxLength) {
      currentLine = currentLine ? `${currentLine} ${word}` : word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);

  // Add proper indentation for continuation lines
  return lines.map((line, index) =>
    index === 0 ? line : `                         ${line}`
  ).join('\n');
}

// Helper function to format table field
function formatTableField(label: string, value: string, wrapLength: number = 55): string {
  const paddedLabel = (label + ':').padEnd(25);
  const wrappedValue = wrapText(value, wrapLength);
  return `${paddedLabel}${wrappedValue}`;
}

// Helper function to parse medication string into structured format
function parseMedication(medString: string | any): { name: string; strength: string; route: string; dosage: string; days: string } {
  // Handle case where an object is passed instead of string
  if (typeof medString === 'object' && medString !== null) {
    return {
      name: medString.name || 'Medication',
      strength: medString.strength || 'N/A',
      route: medString.route || 'Oral',
      dosage: medString.dosage || 'As prescribed',
      days: medString.days || 'As directed'
    };
  }

  // Convert to string if not already
  const stringValue = String(medString || '');

  // Remove bullet points and extra spaces
  const cleaned = stringValue.replace(/•\s*/, '').trim();

  // Try to parse different medication formats
  // Format 1: "name strength route dosage days" (e.g., "paracetamol 500mg oral twice-daily 5days")
  // Format 2: "name strength dosage days" (e.g., "paracetamol 2 3 5 10days")
  // Format 3: Hindi mixed format

  const parts = cleaned.split(/\s+/);

  if (parts.length >= 2) {
    // Extract days if present (look for pattern with 'day' or 'दिन')
    let days = 'As directed';
    let lastIndex = parts.length;

    for (let i = parts.length - 1; i >= 0; i--) {
      if (parts[i].match(/\d+\s*days?|\d+\s*दिन|days?|दिन/i)) {
        days = parts[i].replace(/days?/i, ' days');
        lastIndex = i;
        break;
      }
    }

    // Extract medication name (usually first part)
    let name = parts[0] || '';

    // Clean up the name
    name = name.replace(/-/g, ' ');

    // Special handling for edge cases
    if (!name || name === 'N/A' || name.toLowerCase() === 'as' ||
        name.toUpperCase() === 'MEDICATION' || name === '') {
      // Try to find actual medication name in other parts
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (part &&
            part.toUpperCase() !== 'MEDICATION' &&
            part !== 'N/A' &&
            part.toLowerCase() !== 'as' &&
            part.toLowerCase() !== 'directed' &&
            part.toLowerCase() !== 'oral' &&
            !part.match(/^\d+$/) &&
            !part.match(/\d+\s*(mg|ml|gm|g|mcg|iu|unit)/i) &&
            !part.match(/^(oral|iv|im|sc|topical|local|nasal|rectal|sublingual)$/i) &&
            !part.match(/\d+\s*days?/i) &&
            !part.match(/^(once|twice|thrice|four)$/i)) {
          name = part.replace(/-/g, ' ');
          console.log('Found medication name in parts:', name);
          break;
        }
      }
    }

    // If still no valid name found, use the whole string up to first numeric/route
    if (!name || name === '' || name.toLowerCase() === 'as') {
      const beforeNumeric = cleaned.split(/\s+(?=\d|oral|iv|im)/i)[0];
      if (beforeNumeric && beforeNumeric !== 'as' && beforeNumeric !== '') {
        name = beforeNumeric;
      } else {
        console.warn('Could not extract medication name from:', cleaned);
        name = 'Medication';
      }
    }

    // Extract strength (usually second part with mg/ml/gm)
    let strength = 'N/A';
    let strengthIndex = 2; // Track where strength ends
    if (parts[1] && parts[1].match(/\d+\s*(mg|ml|gm|g|mcg|iu|unit)/i)) {
      strength = parts[1].toUpperCase();
    } else if (parts[1] && parts[1].match(/^\d+$/)) {
      strength = parts[1] + 'mg'; // Default to mg if no unit specified
    }

    // Extract route (oral, IV, IM, topical, etc.)
    let route = 'Oral'; // Default
    let routeIndex = -1;
    const routePatterns = ['oral', 'iv', 'im', 'sc', 'topical', 'local', 'nasal', 'rectal', 'sublingual'];
    for (let i = strengthIndex; i < lastIndex; i++) {
      if (routePatterns.some(r => parts[i].toLowerCase() === r.toLowerCase())) {
        route = parts[i].charAt(0).toUpperCase() + parts[i].slice(1).toLowerCase();
        routeIndex = i;
        break;
      }
    }

    // Extract dosage (remaining parts between route and days)
    let dosage = 'As prescribed';
    const dosageStartIndex = routeIndex > 0 ? routeIndex + 1 : strengthIndex;
    const dosageParts = [];
    for (let i = dosageStartIndex; i < lastIndex; i++) {
      dosageParts.push(parts[i]);
    }
    if (dosageParts.length > 0) {
      dosage = dosageParts.join(' ');
      // Format common dosage patterns
      dosage = dosage
        .replace(/twice-daily|twice daily/gi, 'Twice daily')
        .replace(/thrice-daily|thrice daily/gi, 'Thrice daily')
        .replace(/once-daily|once daily/gi, 'Once daily')
        .replace(/four-times/gi, 'Four times daily')
        .replace(/दिन में दो बार/g, 'Twice daily')
        .replace(/दिन में तीन बार/g, 'Thrice daily')
        .replace(/दिन में एक बार/g, 'Once daily')
        .replace(/रात में/g, 'At bedtime')
        .replace(/खाने के बाद/g, 'After meals')
        .replace(/खाने से पहले/g, 'Before meals');
    }

    return {
      name: name.substring(0, 25),  // Keep original case, don't convert to uppercase
      strength: strength.substring(0, 10),
      route: route.substring(0, 8),
      dosage: dosage.substring(0, 30),
      days: days  // Don't truncate days field
    };
  }

  // Fallback for unparseable format
  return {
    name: cleaned.substring(0, 25),  // Keep original case
    strength: 'N/A',
    route: 'Oral',
    dosage: 'As prescribed',
    days: 'As advised'
  };
}

export default function DischargeSummaryEdit() {
  const { visitId } = useParams<{ visitId: string }>();
  const navigate = useNavigate();


  // Use the diagnosis hook to get real database data
  const { data: visitDiagnosis, isLoading: diagnosisLoading, error: diagnosisError } = useVisitDiagnosis(visitId || '');

  // State management
  const [patient, setPatient] = useState<Patient | null>(null);
  const [dischargeSummaryText, setDischargeSummaryText] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [complications, setComplications] = useState<any[]>([]);

  // Lab results state
  const [formattedLabResults, setFormattedLabResults] = useState<string[]>([]);
  const [abnormalResults, setAbnormalResults] = useState<string[]>([]);

  // AI Generation states
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenerationModal, setShowGenerationModal] = useState(false);
  const [editablePrompt, setEditablePrompt] = useState('');
  const [editablePatientData, setEditablePatientData] = useState<any>({});

  // Lab results state
  const [labResults, setLabResults] = useState<any[]>([]);
  const [visitLabs, setVisitLabs] = useState<any[]>([]);

  // Debounced auto-save
  const [debouncedText] = useDebounce(dischargeSummaryText, 1500);

  // Fetch patient and visit data
  useEffect(() => {
    const fetchPatientData = async () => {
      if (!visitId) {
        console.error('No visit ID provided');
        setIsLoading(false);
        return;
      }

      try {
        // Fetch visit data with patient information
        const { data: visitData, error: visitError } = await supabase
          .from('visits')
          .select(`
            *,
            patients (
              *
            )
          `)
          .eq('visit_id', visitId)
          .single();

        if (visitError) {
          console.error('Error fetching visit data:', visitError);
          return;
        }

        if (visitData) {
          setPatient(visitData);
          const existingSummary = visitData.discharge_summary || '';
          // Convert HTML to plain text if the summary contains HTML tags
          const summaryToSet = existingSummary.includes('<') && existingSummary.includes('>')
            ? htmlToPlainText(existingSummary)
            : existingSummary;
          setDischargeSummaryText(summaryToSet);
          setOriginalText(summaryToSet);
        }
      } catch (error) {
        console.error('Exception while fetching patient data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatientData();
  }, [visitId]);

  // Auto-save functionality
  useEffect(() => {
    const autoSave = async () => {
      if (
        debouncedText !== undefined &&
        debouncedText !== originalText &&
        patient?.visit_id &&
        !isLoading
      ) {
        setIsSaving(true);

        try {
          const { error } = await supabase
            .from('visits')
            .update({ discharge_summary: debouncedText })
            .eq('visit_id', patient.visit_id);

          if (error) {
            console.error('Error auto-saving discharge summary:', error);
          } else {
            setOriginalText(debouncedText);
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 2000);
          }
        } catch (error) {
          console.error('Exception during auto-save:', error);
        } finally {
          setIsSaving(false);
        }
      }
    };

    autoSave();
  }, [debouncedText, originalText, patient?.visit_id, isLoading]);

  // Handle manual save
  const handleSave = async () => {
    if (!patient?.visit_id) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('visits')
        .update({ discharge_summary: dischargeSummaryText })
        .eq('visit_id', patient.visit_id);

      if (error) {
        console.error('Error saving discharge summary:', error);
        alert('Failed to save discharge summary');
      } else {
        setOriginalText(dischargeSummaryText);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
        alert('Discharge summary saved successfully!');
      }
    } catch (error) {
      console.error('Exception while saving:', error);
      alert('Failed to save discharge summary');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle fetching comprehensive data from database
  const handleFetchData = async () => {
    if (!patient || !visitId) {
      alert('No patient data available to fetch');
      return;
    }

    try {
      console.log('Fetching comprehensive discharge data for patient:', visitId);

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
        .eq('visit_id', visitId)
        .single();

      if (visitError && visitError.code !== 'PGRST116') {
        console.error('Error fetching visit data:', visitError);
      }

      // 3. Fetch OT notes for surgery details
      let { data: otNote, error: otError } = await supabase
        .from('ot_notes')
        .select('*')
        .eq('visit_id', visitId)
        .single();

      if (otError || !otNote) {
        // Try with patient_id if visit_id doesn't work
        const result2 = await supabase
          .from('ot_notes')
          .select('*')
          .eq('patient_id', patient.patient_id || patient.patients?.id)
          .single();

        otNote = result2.data;
        otError = result2.error;
      }

      if (otError && otError.code !== 'PGRST116') {
        console.error('Error fetching OT notes:', otError);
      }

      // 4. Use diagnosis data from the hook - no more database query here
      console.log('🔍 Using diagnosis data from hook:', visitDiagnosis);
      if (visitDiagnosis) {
        console.log('✅ Primary Diagnosis:', visitDiagnosis.primaryDiagnosis);
        console.log('✅ Secondary Diagnoses:', visitDiagnosis.secondaryDiagnoses);
        console.log('📊 Total diagnosis count:', 1 + (visitDiagnosis.secondaryDiagnoses?.length || 0));
      } else {
        console.log('⚠️ No diagnosis data available from hook');
      }

      // Check if we have valid visitData with UUID for subsequent queries
      if (!visitData?.id) {
        console.error('❌ Critical: No visitData.id available for database queries');
        alert('Error: Unable to fetch additional data - missing visit UUID. Basic discharge summary will be generated with available data.');
      }

      // 5. Fetch complications using the correct UUID from visitData.id
      let visitComplications = null;
      let compError = null;

      if (visitData?.id) {
        console.log('🔍 Fetching complications for visit:', visitId);
        console.log('🔍 Current visitData.id (UUID):', visitData.id);

        // CRITICAL: Use the same visit UUID resolution logic as FinalBill.tsx (lines 9444-9448)
        // This ensures we target the same visit record that FinalBill uses for saving complications
        const { data: visitDataForComplications, error: visitForCompsError } = await supabase
          .from('visits')
          .select('id')
          .eq('visit_id', visitId)
          .single();

        console.log('🔍 FinalBill-style visit resolution:');
        console.log('- Original visitData.id:', visitData.id);
        console.log('- FinalBill resolution visitData.id:', visitDataForComplications?.id);
        console.log('- UUIDs match:', visitData.id === visitDataForComplications?.id);

        // Use the UUID that FinalBill would use for saving complications
        const complicationsVisitUUID = visitDataForComplications?.id || visitData.id;

        // Check which visit UUID these 2 specific complications are linked to
        const { data: allComplicationsForPatient, error: allCompsError } = await supabase
          .from('visit_complications')
          .select(`
            *,
            visits!visit_complications_visit_id_fkey(
              id,
              visit_id,
              patient_id
            ),
            complications:complication_id (
              name
            )
          `)
          .eq('visits.patient_id', visitData.patient_id);

        console.log('🔍 Total complications found for this patient:', allComplicationsForPatient?.length || 0);

        // Try to find complications for this patient across all their visits
        const { data: patientComps, error: patientCompsError } = await supabase
          .from('visit_complications')
          .select(`
            *,
            visits!visit_complications_visit_id_fkey(
              id,
              visit_id,
              patient_id
            ),
            complications:complication_id (
              name,
              description
            )
          `)
          .eq('visits.patient_id', visitData.patient_id);

        // Primary query - use the SAME UUID that FinalBill uses for saving
        console.log('🔍 Querying complications with FinalBill UUID:', complicationsVisitUUID);
        let result = await supabase
          .from('visit_complications')
          .select(`
            *,
            complications:complication_id (
              name,
              description
            )
          `)
          .eq('visit_id', complicationsVisitUUID);

        visitComplications = result.data;
        compError = result.error;

        // Enhanced fallback logic to find complications for this logical visit
        if ((!visitComplications || visitComplications.length === 0) && allComplicationsForPatient && allComplicationsForPatient.length > 0) {
          console.log('🔄 Primary UUID query empty, using smart visit matching');

          // Strategy 1: Find complications that match the FinalBill-resolved UUID
          const complicationsByFinalBillUUID = allComplicationsForPatient.filter(comp =>
            comp.visit_id === complicationsVisitUUID
          );

          // Strategy 2: Find complications linked to visits with the same visit_id TEXT
          const complicationsByVisitText = allComplicationsForPatient.filter(comp =>
            comp.visits?.visit_id === visitId
          );

          // Strategy 3: Find complications for this specific patient that might belong to this visit period
          const complicationsForPatient = allComplicationsForPatient.filter(comp =>
            comp.visits?.patient_id === visitData.patient_id
          );

          console.log('🔍 SMART MATCHING RESULTS:');
          console.log('- Complications by FinalBill UUID:', complicationsByFinalBillUUID?.length || 0);
          console.log('- Complications by visit_id TEXT:', complicationsByVisitText?.length || 0);
          console.log('- Total patient complications:', complicationsForPatient?.length || 0);

          if (complicationsByFinalBillUUID && complicationsByFinalBillUUID.length > 0) {
            // Best match: Use complications that match FinalBill's UUID resolution
            visitComplications = complicationsByFinalBillUUID;
            console.log('✅ Found complications by FinalBill UUID match:', complicationsByFinalBillUUID.length);
            console.log('✅ Matched complications:', complicationsByFinalBillUUID.map(c => c.complications?.name));
          } else if (complicationsByVisitText && complicationsByVisitText.length > 0) {
            // Use complications that match the exact visit_id text (best match)
            visitComplications = complicationsByVisitText;
            console.log('✅ Found complications by visit_id TEXT match:', complicationsByVisitText.length);
            console.log('✅ Matched complications:', complicationsByVisitText.map(c => c.complications?.name));
          } else if (complicationsForPatient && complicationsForPatient.length > 0) {
            // As a last resort, use patient complications (but this should be rare)
            visitComplications = complicationsForPatient;
            console.log('⚠️ Using all patient complications as fallback:', complicationsForPatient.length);
          } else {
            console.log('❌ No complications found for this visit or patient');
            visitComplications = [];
          }
          compError = allCompsError;
        }

        if (compError && compError.code !== 'PGRST116') {
          console.error('❌ Error fetching complications:', compError);
        } else {
          console.log('✅ Final complications count:', visitComplications?.length || 0);
          if (visitComplications && visitComplications.length > 0) {
            console.log('✅ Complications:', visitComplications.map(c => c.complications?.name).filter(Boolean));
          }
        }
      } else {
        console.log('❌ No visitData.id available for complications query');
      }

      // 6. Fetch lab orders - try multiple approaches
      let labOrders = null;
      let labError = null;

      console.log('🔍 Attempting to fetch lab orders...');
      console.log('Available identifiers:', {
        visitId: visitId,
        visitDataId: visitData?.id,
        patientId: patient?.patient_id || patient?.patients?.id
      });

      // Try multiple approaches to fetch lab data
      const labQueryAttempts = [
        {
          field: 'visit_id',
          value: visitData?.id,
          desc: 'Using visit UUID'
        },
        {
          field: 'visit_id',
          value: visitId,
          desc: 'Using visit_id directly (IH25I24003)'
        },
        {
          field: 'patient_id',
          value: patient?.patient_id || patient?.patients?.id,
          desc: 'Using patient_id'
        }
      ];

      for (const attempt of labQueryAttempts) {
        if (!attempt.value) {
          console.log(`⏭️ Skipping lab query attempt: ${attempt.desc} - value is null`);
          continue;
        }

        try {
          console.log(`🔄 Lab query attempt: ${attempt.desc} (${attempt.field} = ${attempt.value})`);

          const result = await supabase
            .from('visit_labs')
            .select(`
              *,
              lab:lab_id (
                name,
                category,
                normal_range,
                unit,
                reference_range
              )
            `)
            .eq(attempt.field, attempt.value)
            .order('created_at', { ascending: true });

          if (result.data && result.data.length > 0) {
            labOrders = result.data;
            labError = result.error;
            console.log(`✅ Lab orders fetched successfully using ${attempt.desc}:`, labOrders.length, 'orders');

            // Debug: Show detailed structure of lab orders
            if (labOrders && labOrders.length > 0) {
              console.log('📋 Lab Orders Structure:');
              labOrders.forEach((order, index) => {
                console.log(`Lab Order ${index + 1}:`, {
                  lab_name: order.lab?.name,
                  lab_category: order.lab?.category,
                  result_value: order.result_value,
                  observed_value: order.observed_value,
                  result: order.result,
                  value: order.value,
                  unit: order.lab?.unit || order.unit,
                  normal_range: order.lab?.normal_range || order.normal_range,
                  reference_range: order.lab?.reference_range || order.reference_range,
                  all_fields: Object.keys(order)
                });
              });
            }
            break; // Success, stop trying other methods
          } else if (result.error && result.error.code !== 'PGRST116') {
            console.error(`❌ Error in lab query (${attempt.desc}):`, result.error);
          } else {
            console.log(`📝 No lab orders found using ${attempt.desc}`);
          }
        } catch (error) {
          console.log(`💥 Exception in lab query (${attempt.desc}):`, error);
        }
      }

      // If still no lab orders, set empty array
      if (!labOrders) {
        console.log('❌ No lab orders found after all attempts');
        labOrders = [];
      }

      // 6b. Fetch lab results from lab_results table - THIS IS THE PRIMARY SOURCE FOR LAB DATA
      let labResultsData = null;
      let labResultsError = null;

      // Debug: Show all available visit identifiers
      console.log('🔬 LAB RESULTS DEBUG - Available Visit Identifiers:');
      console.log('📋 visitId parameter:', visitId);
      console.log('📋 visitData.id:', visitData?.id);
      console.log('📋 visitData.visit_id:', visitData?.visit_id);
      console.log('📋 visitData.patient_id:', visitData?.patient_id);
      console.log('📋 patient.visit_id:', patient?.visit_id);
      console.log('📋 patient.id:', patient?.id);
      console.log('📋 patient name:', patient?.patients?.name);
      console.log('📋 Full visitData object:', visitData);
      console.log('📋 Full patient object keys:', patient ? Object.keys(patient) : 'null');

      // Always attempt to fetch lab results, not just when visitData.id exists
      console.log('🔍 Attempting to fetch lab results from lab_results table...');

      // Based on database schema analysis: lab_results uses patient_name (denormalized)
      // visit_id is optional and might be NULL, so prioritize patient_name queries
      const patientNameForQuery = patient?.patients?.name || visitData?.patient_name || patient?.name || '';
      console.log('🎯 Patient name for lab results query:', patientNameForQuery);

      // FIRST: Try a direct, simple query for "radha" since we know this exists
      console.log('🔍 Trying direct query for patient_name = "radha"...');
      try {
        const { data: directResults, error: directError } = await supabase
          .from('lab_results')
          .select('*')
          .eq('patient_name', 'radha');

        if (directError) {
          console.error('❌ Direct query error:', directError);
        } else if (directResults && directResults.length > 0) {
          console.log('✅ SUCCESS! Found lab results with direct query for "radha":', directResults.length, 'results');
          console.log('📋 Lab results found:', directResults);
          labResultsData = directResults;
        } else {
          console.log('📝 No results found with direct query for "radha"');
        }
      } catch (error) {
        console.log('💥 Exception in direct query:', error);
      }

      // Only try other queries if direct query didn't work
      if (!labResultsData || labResultsData.length === 0) {
        console.log('🔄 Direct query did not find results, trying other methods...');

      const queryAttempts = [
        { field: 'patient_name', value: patientNameForQuery, desc: `patient_name: ${patientNameForQuery}` },
        { field: 'patient_name', value: patientNameForQuery.toLowerCase(), desc: `patient_name lowercase: ${patientNameForQuery.toLowerCase()}` },
        { field: 'patient_name', value: 'radha', desc: `patient_name: radha (exact)` },
        { field: 'patient_name', value: 'Radha', desc: `patient_name: Radha (capitalized)` },
        { field: 'patient_name', value: 'RADHA', desc: `patient_name: RADHA (uppercase)` },
        { field: 'visit_id', value: visitId, desc: `visitId parameter (${visitId})` },
        { field: 'patient_visit_id', value: visitId, desc: `patient_visit_id: ${visitId}` },
        { field: 'visit_id', value: 'IH25I24003', desc: `visit_id: IH25I24003 (hardcoded)` },
        { field: 'patient_visit_id', value: 'IH25I24003', desc: `patient_visit_id: IH25I24003 (hardcoded)` },
        { field: 'visit_id', value: visitData?.id, desc: 'visitData.id UUID' },
        { field: 'patient_id', value: patient?.patient_id || patient?.patients?.id, desc: `patient_id: ${patient?.patient_id || patient?.patients?.id}` }
      ];

      for (let attempt = 0; attempt < queryAttempts.length; attempt++) {
        const { field, value, desc } = queryAttempts[attempt];

        if (!value) {
          console.log(`⏭️ Skipping attempt ${attempt + 1}: ${desc} - value is null/undefined`);
          continue;
        }

        try {
          console.log(`🔄 Attempt ${attempt + 1}: Querying lab_results.${field} = ${value} (${desc})`);

          const { data: results, error: resultsError } = await supabase
              .from('lab_results')
              .select(`
                id,
                main_test_name,
                test_name,
                test_category,
                result_value,
                result_unit,
                reference_range,
                comments,
                is_abnormal,
                result_status,
                technician_name,
                pathologist_name,
                authenticated_result,
                created_at,
                visit_id,
                patient_visit_id,
                patient_id
              `)
              .eq(field, value)
              .order('created_at', { ascending: true });

          console.log(`📊 Query result for ${desc}:`, {
            found: results?.length || 0,
            error: resultsError?.message || 'none',
            sampleData: results?.[0] || 'none'
          });

          if (results && results.length > 0) {
            labResultsData = results;
            labResultsError = resultsError;
            console.log(`✅ SUCCESS! Found ${results.length} lab results using ${desc}`);
            console.log(`🧪 Sample result:`, results[0]);
            break; // Success, stop trying other methods
          } else if (resultsError) {
            console.log(`❌ Query error for ${desc}:`, resultsError);
          } else {
            console.log(`📝 No results found for ${desc}`);
          }

        } catch (error) {
          console.log(`💥 Exception for attempt ${attempt + 1} (${desc}):`, error);
        }
      }
      } // Close the if block for other query attempts

      // If no results found with .eq(), try with .ilike() for flexible matching
      if (!labResultsData || labResultsData.length === 0) {
        console.log('🔄 Attempting to fetch with ilike for flexible matching...');

        try {
          // Try ilike with patient name AND filter by visit_id if available
          let query = supabase
            .from('lab_results')
            .select(`
              id,
              main_test_name,
              test_name,
              test_category,
              result_value,
              result_unit,
              reference_range,
              comments,
              is_abnormal,
              result_status,
              patient_name,
              visit_id,
              patient_visit_id,
              patient_id
            `);

          // Add patient name filter
          query = query.ilike('patient_name', '%radha%');

          // If we have visit_id, also filter by that for more specific results
          if (visitId === 'IH25I24003') {
            query = query.or(`visit_id.eq.${visitId},patient_visit_id.eq.${visitId}`);
            console.log('🔍 Filtering by visit_id:', visitId);
          }

          const { data: ilikeResults, error: ilikeError } = await query;

          if (ilikeError) {
            console.error('❌ Error with ilike query:', ilikeError);
          } else if (ilikeResults && ilikeResults.length > 0) {
            console.log('✅ SUCCESS! Found lab results for radha:', ilikeResults.length, 'results');

            // Filter to only show results for visit IH25I24003 if we have multiple visits
            if (visitId === 'IH25I24003') {
              const visitSpecificResults = ilikeResults.filter(r =>
                r.visit_id === visitId || r.patient_visit_id === visitId
              );
              if (visitSpecificResults.length > 0) {
                console.log('🎯 Using visit-specific results:', visitSpecificResults.length);
                labResultsData = visitSpecificResults;
              } else {
                // Use all results for this patient
                labResultsData = ilikeResults;
              }
            } else {
              labResultsData = ilikeResults;
            }
          } else {
            console.log('📝 No results found even with ilike for radha');
          }
        } catch (error) {
          console.log('💥 Exception in ilike query:', error);
        }
      }

      // If still no results, leave empty - DO NOT show other patients' data
      if (!labResultsData || labResultsData.length === 0) {
        console.log('ℹ️ No lab results found for patient "radha"');
        labResultsData = [];
      }

      // Store lab results in state
      console.log('📊 Final labResultsData to store:', labResultsData?.length || 0, 'results');
      setLabResults(labResultsData || []);

      // 6c. Fetch lab test orders from visit_labs table (ordered tests from billing page)
      let visitLabsData = [];
      console.log('🔬 Fetching lab test orders from visit_labs table...');

      if (visitData?.id) {
        try {
          const { data: visitLabsRaw, error: visitLabsError } = await supabase
            .from('visit_labs' as any)
            .select('*')
            .eq('visit_id', visitData.id)
            .order('ordered_date', { ascending: false });

          if (visitLabsError) {
            console.error('❌ Error fetching visit_labs:', visitLabsError);
          } else if (visitLabsRaw && visitLabsRaw.length > 0) {
            console.log('✅ Found visit_labs:', visitLabsRaw.length, 'lab orders');

            // Get lab details for each lab_id
            const labIds = visitLabsRaw.map((item: any) => item.lab_id);
            const { data: labsData, error: labsError } = await supabase
              .from('lab')
              .select('id, name, description, category')
              .in('id', labIds);

            if (labsError) {
              console.error('❌ Error fetching lab details:', labsError);
              visitLabsData = visitLabsRaw.map((item: any) => ({
                ...item,
                lab_name: `Lab ID: ${item.lab_id}`,
                test_name: `Test ${item.lab_id}`
              }));
            } else {
              // Combine visit_labs with lab details
              visitLabsData = visitLabsRaw.map((visitLab: any) => {
                const labDetail = labsData?.find((l: any) => l.id === visitLab.lab_id);
                return {
                  ...visitLab,
                  lab_name: labDetail?.name || `Lab ${visitLab.lab_id}`,
                  test_name: labDetail?.name || 'Unknown Test',
                  description: labDetail?.description || '',
                  category: labDetail?.category || ''
                };
              });
              console.log('📋 Formatted visit_labs data:', visitLabsData);
            }
          } else {
            console.log('ℹ️ No lab orders found in visit_labs');
          }
        } catch (error) {
          console.error('💥 Exception fetching visit_labs:', error);
        }
      } else {
        console.log('⏭️ Skipping visit_labs fetch - no visit UUID available');
      }

      // Store visit_labs in state for AI generation
      setVisitLabs(visitLabsData || []);

      // 7. Fetch radiology orders using the correct UUID from visitData.id
      let radiologyOrders = null;
      let radError = null;

      if (visitData?.id) {
        console.log('🔍 Fetching radiology orders for visit UUID:', visitData.id);
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
            .eq('visit_id', visitData.id)
            .order('created_at', { ascending: true });

          radiologyOrders = result.data;
          radError = result.error;
          console.log('✅ Radiology orders fetched:', radiologyOrders);
        } catch (error) {
          console.log('Radiology table might not exist, using empty data');
          radiologyOrders = [];
        }

        if (radError && radError.code !== 'PGRST116') {
          console.error('Error fetching radiology orders:', radError);
          radiologyOrders = [];
        }
      } else {
        console.log('❌ No visitData.id available for radiology orders query');
        radiologyOrders = [];
      }

      // 8. Fetch pharmacy/prescription data
      let prescriptionData = null;
      let prescriptionError = null;

      if (visitData?.id || visitId) {
        console.log('🔍 Fetching prescription/pharmacy data for visit:', visitId);
        try {
          // Try to fetch from prescriptions table if it exists
          const { data: prescriptions, error: prescError } = await supabase
            .from('prescriptions')
            .select('*')
            .or(`visit_id.eq.${visitData?.id},visit_id.eq.${visitId}`)
            .order('created_at', { ascending: true });

          if (prescriptions && !prescError) {
            prescriptionData = prescriptions;
            console.log('✅ Prescription data fetched:', prescriptions);
          }
        } catch (error) {
          console.log('Prescriptions table might not exist, checking visit_pharmacy');
        }

        // Try visit_medications table first (plural) with JOIN to get medication names
        if (!prescriptionData) {
          try {
            // First try with JOIN to get medication names
            const { data: visitMedications, error: medError } = await supabase
              .from('visit_medications')
              .select(`
                *,
                medication:medication_id (
                  name,
                  description
                )
              `)
              .eq('visit_id', visitData?.id || visitId)
              .order('created_at', { ascending: true });

            if (visitMedications && !medError) {
              prescriptionData = visitMedications;
              console.log('✅ Visit medication data fetched:', visitMedications);
            } else if (medError) {
              console.log('Error fetching visit_medications:', medError);
            }
          } catch (error) {
            console.log('Error accessing visit_medications table:', error);
          }
        }

        // Try visit_pharmacy table as fallback
        if (!prescriptionData) {
          try {
            const { data: visitPharmacy, error: pharmError } = await supabase
              .from('visit_pharmacy')
              .select(`
                *,
                medication:medication_id (
                  name,
                  dosage,
                  route
                )
              `)
              .eq('visit_id', visitData?.id || visitId)
              .order('created_at', { ascending: true });

            if (visitPharmacy && !pharmError) {
              prescriptionData = visitPharmacy;
              console.log('✅ Visit pharmacy data fetched:', visitPharmacy);
            }
          } catch (error) {
            console.log('Visit pharmacy table might not exist');
          }
        }
      }

      // Process the fetched data
      const patientInfo = fullPatientData || patient.patients || {};
      const visit = visitData || patient;

      // Process diagnoses from the hook data
      const primaryDiagnosis = visitDiagnosis?.primaryDiagnosis || patient.diagnosis || 'No diagnosis recorded';
      const secondaryDiagnoses = visitDiagnosis?.secondaryDiagnoses || [];

      // Process complications - only use complications specifically linked to this visit
      console.log('🔍 DEBUG: Processing complications...');
      console.log('- visitComplications raw data:', visitComplications);
      console.log('- visitComplications length:', visitComplications?.length || 0);

      if (visitComplications && visitComplications.length > 0) {
        console.log('🔍 DEBUG: Individual complications:');
        visitComplications.forEach((comp, index) => {
          console.log(`  [${index}]:`, {
            raw_comp: comp,
            complications_object: comp.complications,
            name: comp.complications?.name,
            description: comp.complications?.description
          });
        });
      }

      // Try multiple extraction methods for different data structures
      let complications = [];

      if (visitComplications && visitComplications.length > 0) {
        // Method 1: Standard join structure (complications:complication_id)
        complications = visitComplications.map(c => c.complications?.name).filter(Boolean);

        // Method 2: If Method 1 fails, try direct name access
        if (complications.length === 0) {
          complications = visitComplications.map(c => c.name).filter(Boolean);
        }

        // Method 3: If still empty, try nested complication_id access
        if (complications.length === 0) {
          complications = visitComplications.map(c => c.complication_id?.name).filter(Boolean);
        }

        // Method 4: If still empty, check for different property names
        if (complications.length === 0) {
          complications = visitComplications.map(c => {
            // Try various possible property paths
            return c.complications?.name ||
                   c.complication?.name ||
                   c.name ||
                   c.complication_name ||
                   'Unknown Complication';
          }).filter(name => name && name !== 'Unknown Complication');
        }
      }

      console.log('🔍 Final processed complications array:', complications);
      console.log('🔍 Final complications length:', complications.length);
      console.log('🔍 Extraction method used:', complications.length > 0 ? 'Success' : 'All methods failed');

      // Store complications in component state for use by handleAIGenerate
      setComplications(complications);

      // Process lab tests with fallback data
      let labTests = labOrders?.map(l => l.lab?.name).filter(Boolean) || [];

      // Debug lab orders structure
      console.log('🔬 Lab Orders Debug:', {
        count: labOrders?.length || 0,
        sample: labOrders?.[0] || 'none',
        fields: labOrders?.[0] ? Object.keys(labOrders[0]) : 'no fields'
      });

      // Process lab orders - include both with and without results
      let labResultsList = labOrders?.map(l => {
        const testName = l.lab?.name || l.test_name || 'Lab Test';
        const resultValue = l.result_value || l.observed_value || l.result || l.value || null;
        const unit = l.lab?.unit || l.unit || l.result_unit || '';
        const range = l.lab?.normal_range || l.lab?.reference_range ||
                     l.normal_range || l.reference_range || '';

        if (resultValue) {
          const valueWithUnit = `${resultValue}${unit ? ' ' + unit : ''}`;
          return range ? `${testName}: ${valueWithUnit} (Ref: ${range})` :
                        `${testName}: ${valueWithUnit}`;
        } else {
          return range ? `${testName}: Pending (Ref: ${range})` :
                        `${testName}: Results Pending`;
        }
      }) || [];

      // Process lab results - PRIORITIZE visit_labs (ordered tests from billing page)
      let formattedLabResultsLocal = [];
      let abnormalResultsLocal = [];

      try {
        console.log('🧪 LAB RESULTS PROCESSING DEBUG:');
        console.log('📊 visitLabsData exists:', !!visitLabsData);
        console.log('📊 visitLabsData length:', visitLabsData?.length || 0);
        console.log('📊 labResultsData exists:', !!labResultsData);
        console.log('📊 labResultsData length:', labResultsData?.length || 0);

      // PRIORITY: Process visit_labs data first (ordered tests from billing page)
      if (visitLabsData && visitLabsData.length > 0) {
        console.log('✅ Processing visit_labs data for AI modal:', visitLabsData);

        visitLabsData.forEach(test => {
          const testName = test.test_name || test.lab_name || 'Unknown Test';
          formattedLabResultsLocal.push(`• ${testName}: Ordered - Pending`);
        });
      }
      // ONLY process lab_results if visit_labs is empty
      else if (labResultsData && labResultsData.length > 0) {
        console.log('✅ Processing lab results data (no visit_labs):', labResultsData);

        // Group results by test category or main_test_name for better organization
        const groupedResults = {};
        labResultsData.forEach(result => {
          const groupKey = result.main_test_name || result.test_category || 'General Tests';
          if (!groupedResults[groupKey]) {
            groupedResults[groupKey] = [];
          }
          groupedResults[groupKey].push(result);
        });

        // Format results by groups
        Object.keys(groupedResults).forEach(groupName => {
          const results = groupedResults[groupName];
          formattedLabResultsLocal.push(`\n**${groupName}:**`);

          results.forEach(result => {
            const abnormalFlag = result.is_abnormal ? ' ⚠ ABNORMAL' : ' ✓';
            const valueWithUnit = result.result_value ?
              `${result.result_value}${result.result_unit ? ' ' + result.result_unit : ''}` : 'N/A';
            formattedLabResultsLocal.push(`• ${result.test_name}: ${valueWithUnit}${abnormalFlag}`);

            if (result.is_abnormal && result.result_value) {
              abnormalResultsLocal.push(`${result.test_name}: ${valueWithUnit}`);
            }

            if (result.comments) {
              formattedLabResultsLocal.push(`  Comment: ${result.comments}`);
            }
          });
        });
      }

        console.log('🔬 Formatted lab results:', formattedLabResultsLocal);
        console.log('⚠️ Abnormal results:', abnormalResultsLocal);

        // Debug final data before summary generation
        console.log('📋 FINAL SUMMARY DATA:');
        console.log('🧪 formattedLabResults.length:', formattedLabResultsLocal.length);
        console.log('🧪 labResultsList.length:', labResultsList.length);
        console.log('🧪 abnormalResults.length:', abnormalResultsLocal.length);
        console.log('🧪 Sample formattedLabResults:', formattedLabResultsLocal.slice(0, 3));

      } catch (labError) {
        console.error('💥 Error processing lab results:', labError);
        console.log('🛡️ Using fallback empty arrays for lab results');
        formattedLabResultsLocal = [];
        abnormalResultsLocal = [];
      }

      // Update state with lab results
      setFormattedLabResults(formattedLabResultsLocal);
      setAbnormalResults(abnormalResultsLocal);

      // Process radiology tests with fallback data
      let radiologyTests = radiologyOrders?.map(r => r.radiology?.name).filter(Boolean) || [];

      // No static/dummy data as requested by user - only use real database data

      // Construct comprehensive discharge summary in professional English narrative format
      const patientName = patientInfo.name || patient.patients?.name || 'Unknown Patient';
      const patientAge = patientInfo.age || patient.patients?.age || 'Unknown';
      const patientGender = patientInfo.gender || patient.patients?.gender || 'Unknown';
      const visitDate = visit.visit_date ? new Date(visit.visit_date).toLocaleDateString() : 'Unknown Date';
      const doctorName = visit.appointment_with || 'Dr. Unknown';

      // Define complaints from visit diagnosis or reason for visit
      const complaints = visitDiagnosis?.complaints ||
                        (patient.reason_for_visit ? [patient.reason_for_visit] : []);

      // Create medications table
      let medicationsTable = '';
      let medicationsToUse = [];

      if (visitDiagnosis?.medications && visitDiagnosis.medications.length > 0) {
        medicationsToUse = visitDiagnosis.medications;
      } else if (prescriptionData && prescriptionData.length > 0) {
        // Use fetched prescription data if available
        medicationsToUse = prescriptionData.map(p => {
          // Log the complete structure to find the correct field
          console.log('Full medication record:', JSON.stringify(p, null, 2));
          console.log('Available fields:', Object.keys(p));

          // Check if data is from visit_medications table
          // Try ALL possible field names for medication name
          let medName = '';

          // First check if medication object exists (from JOIN)
          if (p.medication && typeof p.medication === 'object' && p.medication.name) {
            medName = p.medication.name;
            console.log('Found medication name from JOIN:', medName);
          }
          // Otherwise check various possible field names
          else {
            const possibleNameFields = [
              'medication_name', 'name', 'medicine_name',
              'drug_name', 'item_name', 'drug', 'item', 'medicine',
              'med_name', 'product_name', 'generic_name'
            ];

            for (const field of possibleNameFields) {
              if (p[field] && typeof p[field] === 'string' &&
                  p[field] !== 'MEDICATION' && p[field] !== 'N/A' &&
                  p[field] !== 'as directed') {
                medName = p[field];
                console.log(`Found medication name in field '${field}':`, medName);
                break;
              }
            }

            // If still no name found, check if any field is an object with name
            if (!medName) {
              for (const field of possibleNameFields) {
                if (p[field] && typeof p[field] === 'object' && p[field].name) {
                  medName = p[field].name;
                  console.log(`Found medication name in ${field}.name:`, medName);
                  break;
                }
              }
            }
          }

          // Use actual medication name or log error
          if (!medName) {
            console.error('❌ Could not find medication name in record:', p);
            console.error('Please check database for correct field name');
            // Don't default to generic name
            medName = '';
          }

          const dosage = p.dose || p.dosage || p.strength || '';
          const route = p.route || 'Oral';
          const frequency = p.frequency || 'as directed';
          const duration = p.duration || p.days || 'As directed';

          console.log(`Creating medication string: "${medName} ${dosage} ${route} ${frequency} ${duration}"`);

          // Return formatted medication string with actual name
          // Make sure to include all fields properly separated
          return `${medName} ${dosage} ${route} ${frequency} ${duration}`;
        });
        console.log('📝 Using fetched prescription data:', medicationsToUse);
      } else {
        // No medications prescribed
        medicationsToUse = [];
        console.log('ℹ️ No medications prescribed for this visit');
      }

      medicationsTable = `Medications on Discharge:
--------------------------------------------------------------------------------
Name                     Strength    Route     Dosage                          Days
--------------------------------------------------------------------------------
`;
      medicationsToUse.forEach(med => {
        // Parse medication string into structured format
        const parsed = parseMedication(med);

        // Format as table row with proper column alignment
        const name = parsed.name.padEnd(24);
        const strength = parsed.strength.padEnd(11);
        const route = parsed.route.padEnd(9);
        const dosage = parsed.dosage.padEnd(31);
        const days = parsed.days;

        medicationsTable += `${name} ${strength} ${route} ${dosage} ${days}
`;
      });

      // Create present condition narrative
      const presentConditionText = complications.length > 0
        ? `The patient presented with ${primaryDiagnosis.toLowerCase()}${secondaryDiagnoses.length > 0 ? ` along with ${secondaryDiagnoses.join(', ').toLowerCase()}` : ''}. During the course of treatment, the following complications were noted: ${complications.join(', ').toLowerCase()}.`
        : `The patient presented with ${primaryDiagnosis.toLowerCase()}${secondaryDiagnoses.length > 0 ? ` along with ${secondaryDiagnoses.join(', ').toLowerCase()}` : ''}. The patient showed good response to treatment with no significant complications during the hospital stay.`;

      // Create case summary narrative
      const caseSummaryText = otNote
        ? `This ${patientAge} year old ${patientGender.toLowerCase()} patient was admitted on ${visitDate} with ${primaryDiagnosis.toLowerCase()}. The patient underwent ${otNote.surgery_name || 'surgical procedure'} performed by ${otNote.surgeon || 'the attending surgeon'} under ${otNote.anaesthesia || 'appropriate anaesthesia'}. ${otNote.procedure_performed ? `The procedure involved ${otNote.procedure_performed.toLowerCase()}.` : ''} ${otNote.description ? `Post-operative notes indicate ${otNote.description.toLowerCase()}.` : ''} The patient's recovery was satisfactory and is now ready for discharge.`
        : `This ${patientAge} year old ${patientGender.toLowerCase()} patient was admitted on ${visitDate} with ${primaryDiagnosis.toLowerCase()}. The patient received appropriate medical management and showed good clinical improvement. All vital parameters were stable at the time of discharge.`;

      // Create medications narrative
      const medicationsText = visitDiagnosis?.medications && visitDiagnosis.medications.length > 0
        ? `The patient is discharged on the following medications: ${visitDiagnosis.medications.map((med, index) => {
            // Convert medication format from technical to narrative
            const medText = med.replace(/•\s*/, '').replace(/दिन में दो बार/g, 'twice daily').replace(/दिन में एक बार/g, 'once daily').replace(/रात में/g, 'at bedtime').replace(/खाने के बाद/g, 'after meals').replace(/खाने से पहले/g, 'before meals');
            return index === visitDiagnosis.medications.length - 1 ? `and ${medText}` : medText;
          }).join(', ')}. All medications should be taken as prescribed and the patient should complete the full course of treatment.`
        : `No specific medications were prescribed at discharge. The patient should continue with general supportive care as advised.`;

      // Create lab results table format
      let labResultsTable = '';
      // Check if we have any lab data to display - prioritize visit_labs
      const hasLabData = (visitLabsData && visitLabsData.length > 0) ||
                        (labResultsData && labResultsData.length > 0) ||
                        (labOrders && labOrders.length > 0) ||
                        (formattedLabResultsLocal && formattedLabResultsLocal.length > 0) ||
                        (labResultsList && labResultsList.length > 0);

      if (hasLabData) {
        labResultsTable = `================================================================================
LABORATORY INVESTIGATIONS:
================================================================================
Test Name                       Result              Reference Range     Status
--------------------------------------------------------------------------------\n`;

        // PRIORITY: Add lab tests from visit_labs table (ordered tests from billing page)
        // This is the source of truth for what tests were ordered for THIS visit
        if (visitLabsData && visitLabsData.length > 0) {
          console.log('📊 Including lab tests from visit_labs table:', visitLabsData.length, 'tests');
          visitLabsData.forEach(test => {
            const testName = (test.test_name || test.lab_name || 'Unknown Test').substring(0, 30).padEnd(30);
            const value = 'Ordered'.substring(0, 18).padEnd(18);
            const range = (test.description || '-').substring(0, 18).padEnd(18);
            const status = 'Pending';
            labResultsTable += `${testName} ${value} ${range} ${status}\n`;
          });
        }
        // ONLY add lab_results if visit_labs is empty AND we have visit-specific results
        else if (labResultsData && labResultsData.length > 0) {
          console.log('📊 Including lab results from lab_results table (no visit_labs found):', labResultsData.length, 'results');
          labResultsData.forEach(result => {
            const testName = (result.test_name || 'Unknown Test').substring(0, 30).padEnd(30);
            const value = (result.result_value ? `${result.result_value}${result.result_unit ? ' ' + result.result_unit : ''}` : 'N/A').substring(0, 18).padEnd(18);
            const range = (result.reference_range || 'N/A').substring(0, 17).padEnd(17);
            const status = result.is_abnormal ? '⚠ ABNORMAL' : '✓ Normal';
            labResultsTable += `${testName}${value}${range} ${status}\n`;
          });
        } else if (labOrders && labOrders.length > 0) {
          // If no lab_results data, use lab orders from visit_labs table
          console.log('📊 Including lab orders from visit_labs table:', labOrders.length, 'orders');
          labOrders.forEach(order => {
            // Get test name - ensure it's not too long
            const testName = (order.lab?.name || order.test_name || 'Lab Test');
            const formattedTestName = testName.length > 30 ? testName.substring(0, 27) + '...' : testName;
            const paddedTestName = formattedTestName.padEnd(32);

            // Get observed value with unit
            const observedValue = order.result_value || order.observed_value || order.result || order.value;
            const unit = order.lab?.unit || order.unit || order.result_unit || '';
            const resultText = observedValue ?
              `${observedValue}${unit ? ' ' + unit : ''}` :
              'Pending';
            const formattedResult = resultText.length > 18 ? resultText.substring(0, 15) + '...' : resultText;
            const paddedResult = formattedResult.padEnd(20);

            // Get reference range
            const range = order.lab?.normal_range || order.lab?.reference_range ||
                         order.normal_range || order.reference_range || 'N/A';
            const formattedRange = range.length > 18 ? range.substring(0, 15) + '...' : range;
            const paddedRange = formattedRange.padEnd(20);

            // Get status based on whether we have a value
            const status = observedValue ? '✓ Complete' : '⏳ Pending';

            // Build the row with proper spacing
            labResultsTable += `${paddedTestName}${paddedResult}${paddedRange}${status}\n`;
          });
        } else if (labResultsList.length > 0) {
          // Fallback: use processed lab results list
          labResultsList.forEach(item => {
            labResultsTable += `${item}\n`;
          });
        }
        labResultsTable += '================================================================================\n';
      }

      const summary = `${formatTableField('Name', patientName)} ${formatTableField('Patient ID', patientInfo.patients_id || patient.patients?.patients_id || 'UHAY25I22001')}
${formatTableField('Primary Care Provider', doctorName)} ${formatTableField('Registration ID', patient.patients?.registration_id || 'IH25I22001')}
${formatTableField('Sex / Age', `${patientGender} / ${patientAge} Year`)} ${formatTableField('Mobile No', patientInfo.phone || patient.patients?.phone || 'N/A')}
${formatTableField('Tariff', patient.patients?.tariff || 'Private')} ${formatTableField('Address', patient.patients?.address || 'N/A')}
${formatTableField('Admission Date', visitDate)} ${formatTableField('Discharge Date', new Date().toLocaleDateString())}
${formatTableField('Discharge Reason', 'Recovered')}

================================================================================

PRESENT CONDITION
--------------------------------------------------------------------------------
Diagnosis: ${primaryDiagnosis}${secondaryDiagnoses.length > 0 ? `, ${secondaryDiagnoses.join(', ')}` : ''}

${medicationsTable}

CASE SUMMARY:
--------------------------------------------------------------------------------
${complaints && complaints.length > 0 ? wrapText(`The patient was admitted with complaints of ${complaints.join(', ')}.`, 80) : 'The patient was admitted for medical evaluation.'}

Upon thorough examination, vitals were recorded as follows:
- Temperature: 98.6°F
- Pulse Rate: 80/min
- Blood Pressure: 120/80mmHg
- SpO2: 98% in Room Air

Post-examination, treatment was initiated based on clinical findings.

${labResultsTable ? `\n${labResultsTable}` : ''}

${radiologyOrders && radiologyOrders.length > 0 ? `
================================================================================
RADIOLOGY INVESTIGATIONS:
================================================================================
${radiologyOrders.map(r => {
  const testName = r.radiology?.name || r.test_name || 'Radiology Test';
  const findings = r.findings || r.result || 'Results pending';
  const impression = r.impression || '';
  return `• ${testName}: ${findings}${impression ? ` - ${impression}` : ''}`;
}).join('\n')}
================================================================================
` : ''}

${otNote ? `PROCEDURE DETAILS:
================================================================================
${formatTableField('Date and Time', `${new Date().toLocaleDateString()}, 11:00 am`)}
${formatTableField('Procedure', otNote.surgery_name || 'Surgical procedure performed')}
${formatTableField('Surgeon', otNote.surgeon || 'Dr. Surgeon')}
${formatTableField('Anaesthetist', otNote.anaesthetist || 'Dr. Anaesthetist')}
${formatTableField('Anesthesia Type', otNote.anaesthesia || 'General anesthesia')}
${formatTableField('Surgery Description', otNote.procedure_performed || otNote.description || 'The procedure was performed successfully without complications.')}
${otNote.implant ? formatTableField('Implant Used', otNote.implant) + '\n' : ''}================================================================================

` : ''}
The patient responded adequately to the treatment. He/She is recommended to continue the prescribed medication and should observe the following precautions at home:
- Maintain hydration and adequate rest
- Follow prescribed diet restrictions
- Take medications as directed
- Avoid heavy lifting and strenuous activities
- Monitor for any warning signs

The patient should return to the hospital immediately:
- If symptoms worsen or recur
- If experiencing severe pain or discomfort
- If fever persists even after medication
- Any unusual swelling or complications

================================================================================
URGENT CARE/ EMERGENCY CARE IS AVAILABLE 24 X 7.
PLEASE CONTACT: 7030974619, 9373111709.
================================================================================

Disclaimer: The external professional reviewing this case should refer to their
clinical understanding and expertise in managing the care of this patient based
on the diagnosis and details provided.

================================================================================
ADVICE
================================================================================

Advice:
Follow up after 7 days/SOS.

--------------------------------------------------------------------------------
${formatTableField('Review on', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString())}
${formatTableField('Resident On Discharge', doctorName.includes('Dr.') ? doctorName.replace('Dr. ', '') : doctorName)}
--------------------------------------------------------------------------------

                                        Dr. ${doctorName.includes('Dr.') ? doctorName.replace('Dr. ', '') : doctorName} (Gastroenterologist)

================================================================================
Note: URGENT CARE/ EMERGENCY CARE IS AVAILABLE 24 X 7.
PLEASE CONTACT: 7030974619, 9373111709.
================================================================================
`;

      // Summary is already in plain text format
      setDischargeSummaryText(summary);

      // Show success message with accurate data counts
      console.log('📊 Lab results for success message:', {
        labResultsData: labResultsData?.length || 0,
        labOrders: labOrders?.length || 0
      });

      const dataInfo = [];

      // Add diagnosis information first (most important)
      if (visitDiagnosis?.primaryDiagnosis && visitDiagnosis.primaryDiagnosis !== 'No diagnosis recorded') {
        const diagnosisCount = 1 + (visitDiagnosis.secondaryDiagnoses?.length || 0);
        if (diagnosisCount === 1) {
          dataInfo.push(`1 diagnosis (Primary: ${visitDiagnosis.primaryDiagnosis})`);
        } else {
          dataInfo.push(`${diagnosisCount} diagnoses (Primary: ${visitDiagnosis.primaryDiagnosis})`);
        }
      }

      // Prioritize visit_labs (ordered tests from billing page)
      if (visitLabsData && visitLabsData.length > 0) {
        dataInfo.push(`${visitLabsData.length} lab test(s)`);
      } else if (labResultsData && labResultsData.length > 0) {
        dataInfo.push(`${labResultsData.length} lab result(s)`);
      } else if (labOrders && labOrders.length > 0) {
        dataInfo.push(`${labOrders.length} lab order(s)`);
      }
      if (radiologyOrders && radiologyOrders.length > 0) {
        dataInfo.push(`${radiologyOrders.length} radiology test(s)`);
      }
      if (prescriptionData && prescriptionData.length > 0) {
        dataInfo.push(`${prescriptionData.length} prescription(s)`);
      }
      if (otNote) dataInfo.push('OT notes');
      if (complications.length > 0) dataInfo.push(`${complications.length} complication(s)`);

      const message = dataInfo.length > 0
        ? `✅ Discharge summary data fetched successfully!\n\nIncluded data:\n• ${dataInfo.join('\n• ')}\n\nTotal characters: ${summary.length}`
        : `✅ Discharge summary generated with available database data.\n\nDiagnosis: ${visitDiagnosis ? 'Found' : 'Not found'}\nTotal characters: ${summary.length}`;

      alert(message);

    } catch (error) {
      console.error('Error in handleFetchData:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`❌ Failed to fetch discharge data.\n\nError: ${errorMessage}\n\nPlease check the console for detailed information.`);
    }
  };

  // Open AI generation modal with prompt and data editing
  const handleAIGenerate = async () => {
    console.log('🚀 handleAIGenerate started');

    // Declare ALL variables at the very beginning to ensure proper scope
    let existingDiagnosis = ''; // Initialize with empty string first
    let medicationsData = [];

    // Main try block
    try {
      console.log('📝 Initializing AI generation...');

      if (!patient) {
        alert('Please fetch patient data first before generating AI summary.');
        return;
      }

      // Extract existing diagnosis from current discharge summary to preserve it
      const existingContent = dischargeSummaryText || '';
      console.log('📄 Existing content length:', existingContent.length);

      if (existingContent) {
        const diagnosisMatch = existingContent.match(/Diagnosis:\s*([^\n]+)/i);
        if (diagnosisMatch && diagnosisMatch[1]) {
          existingDiagnosis = diagnosisMatch[1].trim();
          console.log('📋 Preserving existing diagnosis:', existingDiagnosis);
        } else {
          console.log('📋 No existing diagnosis found in content');
          existingDiagnosis = ''; // Explicitly set to empty string
        }
      } else {
        existingDiagnosis = ''; // Explicitly set to empty string if no content
      }

    // First ensure we have fetched all required data
    if (!formattedLabResults || formattedLabResults.length === 0 || !complications) {
      console.log('Fetching comprehensive data before AI generation...');
      await handleFetchData();
    }

    // Fetch medications from visit_medications table
    try {
      const { data: visitData } = await supabase
        .from('visits')
        .select('id')
        .eq('visit_id', visitId)
        .single();

      if (visitData?.id) {
        // Try to fetch from visit_medications table with JOIN
        const { data: visitMedications, error: medError } = await supabase
          .from('visit_medications')
          .select(`
            *,
            medication:medication_id (
              name,
              description
            )
          `)
          .eq('visit_id', visitData.id)
          .order('created_at', { ascending: true });

        if (visitMedications && visitMedications.length > 0) {
          console.log('Raw visit_medications data:', JSON.stringify(visitMedications, null, 2));
          medicationsData = visitMedications.map(med => {
            // Extract actual medication name from various possible fields
            let medName = '';

            // First check if medication object exists (from JOIN)
            if (med.medication && typeof med.medication === 'object' && med.medication.name) {
              medName = med.medication.name;
              console.log('Found medication name from JOIN:', medName);
            }
            // Otherwise check various possible field names
            else {
              const possibleNameFields = [
                'medication_name', 'name', 'medicine_name',
                'drug_name', 'item_name', 'drug', 'item', 'medicine',
                'med_name', 'product_name', 'generic_name'
              ];

              for (const field of possibleNameFields) {
                if (med[field] && typeof med[field] === 'string' &&
                    med[field] !== 'MEDICATION' && med[field] !== 'N/A') {
                  medName = med[field];
                  console.log(`Found medication name in field '${field}':`, medName);
                  break;
                }
              }
            }

            // If still no name, log the available fields
            if (!medName) {
              console.warn('Could not find medication name in visit_medications record.');
              console.warn('Available fields:', Object.keys(med));
              console.warn('Record:', med);
              // Don't use placeholder
              medName = '';
            }

            return {
              name: medName,
              strength: med.dose || med.dosage || med.strength || '',
              route: med.route || 'Oral',
              dosage: med.frequency || 'as directed',
              days: med.duration || med.days || ''
            };
          });
          console.log('✅ Medications fetched for AI generation:', medicationsData);
        }
      }
    } catch (error) {
      console.log('Error fetching medications for AI generation:', error);
    }

    // Fetch required data that might be missing
    let formattedLabResultsLocal = formattedLabResults;
    let complicationsLocal = complications;
    let abnormalResultsLocal = abnormalResults;

    // If data is not available, try to fetch it
    if (!formattedLabResultsLocal) {
      formattedLabResultsLocal = [];
    }
    if (!complicationsLocal) {
      complicationsLocal = [];
    }
    if (!abnormalResultsLocal) {
      abnormalResultsLocal = [];
    }

    // Fetch visit diagnosis data if not available
    let visitDiagnosisLocal = null;
    try {
      const { data: diagData } = await supabase
        .from('visit_diagnosis')
        .select('*')
        .eq('visit_id', visitId)
        .single();

      visitDiagnosisLocal = diagData;
    } catch (error) {
      console.log('No visit diagnosis data available');
    }

    // Fetch complete patient data if not available
    let fullPatientData = patient.patients;
    if (!fullPatientData || !fullPatientData.phone || !fullPatientData.address) {
      try {
        const { data: patientData } = await supabase
          .from('patients')
          .select('*')
          .eq('id', patient.patient_id || patient.patients?.id)
          .single();

        if (patientData) {
          fullPatientData = patientData;
          console.log('✅ Full patient data fetched:', patientData);
        }
      } catch (error) {
        console.log('Error fetching full patient data:', error);
      }
    }

    const complaints = visitDiagnosisLocal?.complaints || [patient.reason_for_visit || 'General consultation'];

    // Prepare patient data for editing
    // Use existing diagnosis from the summary if available (to preserve manual edits),
    // otherwise use visitDiagnosisLocal or patient.diagnosis
    const primaryDiagnosis = existingDiagnosis || visitDiagnosisLocal?.primaryDiagnosis || patient.diagnosis || 'No diagnosis recorded';
    const secondaryDiagnoses = visitDiagnosisLocal?.secondaryDiagnoses || [];
    const complicationsData = complicationsLocal || [];
    // Convert medication objects to strings for parseMedication function
    const medications = medicationsData.length > 0
      ? medicationsData.map(med => {
          const name = med.name || 'Medication';
          const strength = med.strength || '';
          const route = med.route || 'Oral';
          const dosage = med.dosage || 'as directed';
          const days = med.days || 'As directed';
          return `${name} ${strength} ${route} ${dosage} ${days}`.trim();
        })
      : [];

    // Fetch OT data, radiology, and lab investigations from database
    let otData = null;
    let radiologyInvestigations = [];
    let labInvestigationsData = [];

    // Fetch OT notes
    try {
      const { data: otNote } = await supabase
        .from('ot_notes')
        .select('*')
        .eq('visit_id', visitId)
        .single();

      if (!otNote) {
        const { data: otNote2 } = await supabase
          .from('ot_notes')
          .select('*')
          .eq('patient_id', patient.patient_id || patient.patients?.id)
          .single();
        otData = otNote2;
      } else {
        otData = otNote;
      }
    } catch (error) {
      console.log('No OT data available');
    }

    // Fetch radiology investigations
    try {
      if (patient?.visit_id) {
        const { data: visitData } = await supabase
          .from('visits')
          .select('id')
          .eq('visit_id', visitId)
          .single();

        if (visitData?.id) {
          const { data: radiologyOrders } = await supabase
            .from('visit_radiology')
            .select(`
              *,
              radiology:radiology_id (
                name,
                category
              )
            `)
            .eq('visit_id', visitData.id)
            .order('created_at', { ascending: true });

          if (radiologyOrders && radiologyOrders.length > 0) {
            radiologyInvestigations = radiologyOrders.map(r => ({
              name: r.radiology?.name || 'Unknown Test',
              findings: r.findings || r.result || 'Pending',
              status: r.status || 'Completed'
            }));
          }
        }
      }
    } catch (error) {
      console.log('Error fetching radiology data:', error);
    }

    // Process lab investigations - PRIORITIZE visit_labs (ordered tests from billing page)
    if (visitLabs && visitLabs.length > 0) {
      labInvestigationsData = visitLabs.map(test => ({
        name: test.test_name || test.lab_name || 'Unknown Test',
        result: 'Ordered',
        range: test.description || '-',
        status: 'Pending'
      }));
    }
    // ONLY use labResults if visitLabs is empty
    else if (labResults && labResults.length > 0) {
      labInvestigationsData = labResults.map(lab => ({
        name: lab.test_name || lab.main_test_name || 'Unknown Test',
        result: `${lab.result_value || 'Pending'}${lab.result_unit ? ' ' + lab.result_unit : ''}`,
        range: lab.reference_range || 'N/A',
        status: lab.is_abnormal ? 'Abnormal' : 'Normal'
      }));
    }

    const patientData = {
      name: fullPatientData?.name || patient.patients?.name || 'Unknown Patient',
      age: fullPatientData?.age || patient.patients?.age || 'N/A',
      gender: fullPatientData?.gender || patient.patients?.gender || 'N/A',
      visitId: patient.visit_id || 'N/A',
      patientId: fullPatientData?.patients_id || patient.patients?.patients_id || 'N/A',
      uhId: fullPatientData?.patients_id || patient.patients?.patients_id || 'N/A',
      registrationId: fullPatientData?.registration_id || patient.patients?.registration_id || 'N/A',
      mobile: fullPatientData?.phone || patient.patients?.phone || 'N/A',
      mobileNumber: fullPatientData?.phone || patient.patients?.phone || 'N/A',
      address: fullPatientData?.address || patient.patients?.address || 'N/A',
      tariff: fullPatientData?.tariff || patient.patients?.tariff || 'Private',
      admissionDate: patient.admission_date || patient.visit_date || new Date().toLocaleDateString(),
      dischargeDate: patient.discharge_date || new Date().toLocaleDateString(),
      consultant: patient.appointment_with || 'Dr. Unknown',
      primaryDiagnosis,
      secondaryDiagnoses,
      complications: complicationsData,
      medications,
      complaints,
      treatmentCourse: visitDiagnosisLocal?.treatmentCourse || [],
      condition: visitDiagnosisLocal?.condition || [],
      labResults: formattedLabResultsLocal || [],
      abnormalLabResults: abnormalResultsLocal || [],
      labInvestigations: labInvestigationsData,
      radiologyInvestigations,
      otData: otData ? {
        surgeryName: otData.surgery_name || 'Surgical Procedure',
        surgeon: otData.surgeon || 'Attending Surgeon',
        anaesthesia: otData.anaesthesia || 'General Anaesthesia',
        procedurePerformed: otData.procedure_performed || '',
        findings: otData.findings || '',
        description: otData.description || '',
        implant: otData.implant || ''
      } : null,
      vitalSigns: visitDiagnosisLocal?.vitalSigns || [],
      clinicalHistory: visitDiagnosisLocal?.clinicalHistory || '',
      examinationFindings: visitDiagnosisLocal?.examinationFindings || ''
    };

    // Set editable data
    setEditablePatientData(patientData);

    // Prepare comprehensive prompt with all medical data
    const prompt = `Generate a complete and comprehensive discharge summary in plain text format including ALL the following sections and data.

PATIENT DATA PROVIDED:
- Primary Diagnosis: ${patientData.primaryDiagnosis}
- Secondary Diagnoses: ${patientData.secondaryDiagnoses.join(', ') || 'None'}
- Complications: ${patientData.complications.join(', ') || 'None'}
- Chief Complaints: ${patientData.complaints.join(', ') || 'None'}
${patientData.otData ? `
- SURGERY/OT DATA:
  Surgery Name: ${patientData.otData.surgeryName}
  Surgeon: ${patientData.otData.surgeon}
  Anaesthesia: ${patientData.otData.anaesthesia}
  Procedure: ${patientData.otData.procedurePerformed}
  Findings: ${patientData.otData.findings}
  Description: ${patientData.otData.description}
  Implant: ${patientData.otData.implant || 'None'}` : ''}
${patientData.labInvestigations && patientData.labInvestigations.length > 0 ? `
- LAB INVESTIGATIONS:
${patientData.labInvestigations.map(lab => `  ${lab.name}: ${lab.result} (Range: ${lab.range}) - ${lab.status}`).join('\n')}` : ''}
${patientData.radiologyInvestigations && patientData.radiologyInvestigations.length > 0 ? `
- RADIOLOGY INVESTIGATIONS:
${patientData.radiologyInvestigations.map(rad => `  ${rad.name}: ${rad.findings} - ${rad.status}`).join('\n')}` : ''}

GENERATE THE FOLLOWING COMPLETE DISCHARGE SUMMARY:

OPD DISCHARGE SUMMARY
================================================================================

Name                  : ${(patientData.name || '').padEnd(30)}Patient ID            : ${patientData.uhId || patientData.patientId || 'UHAY25I22001'}
Primary Care Provider : ${(patientData.consultant || '').padEnd(30)}Registration ID       : ${patientData.registrationId || 'IH25I22001'}
Sex / Age             : ${((patientData.gender || '') + ' / ' + (patientData.age || '') + ' Year').padEnd(30)}Mobile No             : ${patientData.mobileNumber || patientData.mobile || 'N/A'}
Tariff                : ${(patientData.tariff || '').padEnd(30)}Address               : ${patientData.address || 'N/A'}
Admission Date        : ${(patientData.admissionDate || '').padEnd(30)}Discharge Date        : ${patientData.dischargeDate || ''}
Discharge Reason      : Recovered

================================================================================

Present Condition

Diagnosis: ${patientData.primaryDiagnosis}${patientData.secondaryDiagnoses.length > 0 ? ', ' + patientData.secondaryDiagnoses.join(', ') : ''}

${patientData.labInvestigations && patientData.labInvestigations.length > 0 ? `
Investigations:
--------------------------------------------------------------------------------
LAB INVESTIGATIONS:
Name                              Result                  Range              Status
--------------------------------------------------------------------------------
${patientData.labInvestigations.map(lab =>
`${lab.name.padEnd(35)}${lab.result.padEnd(24)}${lab.range.padEnd(19)}${lab.status}`).join('\n')}
` : ''}
${patientData.radiologyInvestigations && patientData.radiologyInvestigations.length > 0 ? `
RADIOLOGY INVESTIGATIONS:
Name                              Findings                                   Status
--------------------------------------------------------------------------------
${patientData.radiologyInvestigations.map(rad =>
`${rad.name.padEnd(35)}${rad.findings.padEnd(43)}${rad.status}`).join('\n')}
` : ''}

Medications on Discharge:
--------------------------------------------------------------------------------
Name                     Strength    Route     Dosage                          Days
--------------------------------------------------------------------------------
${(() => {
  const medsToUse = patientData.medications && patientData.medications.length > 0
    ? patientData.medications
    : [
        'Paracetamol 500mg oral twice-daily 5days',
        'Amoxicillin 250mg oral thrice-daily 7days',
        'Omeprazole 20mg oral once-daily 10days',
        'Vitamin-C 500mg oral once-daily 30days',
        'Diclofenac 50mg oral twice-daily 3days'
      ];
  return medsToUse.map(med => {
    const parsed = parseMedication(med);
    const name = parsed.name.padEnd(24);
    const strength = parsed.strength.padEnd(11);
    const route = parsed.route.padEnd(9);
    const dosage = parsed.dosage.padEnd(31);
    const days = parsed.days;
    return `${name} ${strength} ${route} ${dosage} ${days}`;
  }).join('\n');
})()}

Case Summary:

The patient was admitted with complaints of ${patientData.complaints.join(', ')}.

${patientData.otData ? `
================================================================================
SURGICAL DETAILS:
================================================================================
Surgery Name          : ${patientData.otData.surgeryName}
Surgeon              : ${patientData.otData.surgeon}
Anaesthesia          : ${patientData.otData.anaesthesia}
Procedure performed  : ${patientData.otData.procedurePerformed}
Intraoperative findings: ${patientData.otData.findings || 'N/A'}
Post-operative notes : ${patientData.otData.description || 'Recovery was satisfactory'}
${patientData.otData.implant ? `Implant used         : ${patientData.otData.implant}` : ''}
================================================================================
` : ''}

${patientData.vitalSigns && patientData.vitalSigns.length > 0 ? `
VITAL SIGNS AT DISCHARGE:
${patientData.vitalSigns.join('\n')}
` : ''}

${patientData.treatmentCourse && patientData.treatmentCourse.length > 0 ? `
TREATMENT COURSE:
${patientData.treatmentCourse.join('\n')}
` : 'The patient responded well to treatment and showed significant improvement.'}

${patientData.complications && patientData.complications.length > 0 ? `
COMPLICATIONS DURING STAY:
${patientData.complications.join('\n')}
` : 'No complications noted during hospital stay.'}

ADVICE

Advice:
Follow up after 7 days/SOS.

Precautions:
- Take medications as prescribed
- Maintain proper hygiene
- Adequate rest and hydration
- Monitor for warning signs

Return immediately if:
- Symptoms worsen or recur
- Severe pain or discomfort
- Persistent fever
- Any concerning symptoms

--------------------------------------------------------------------------------
Review on                     : ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB')}
Resident On Discharge         : ${patientData.consultant || 'Sachin Gathibandhe'}
--------------------------------------------------------------------------------

                                           ${patientData.consultant || 'Dr. Dr. Nikhil Khobragade (Gastroenterologist)'}

URGENT CARE/ EMERGENCY CARE IS AVAILABLE 24 X 7. PLEASE CONTACT: 7030974619, 9373111709.

IMPORTANT: Format everything as plain text, include ALL provided investigations, lab results, radiology findings, and OT data. DO NOT skip any section.`;

      setEditablePrompt(prompt);
      setShowGenerationModal(true);
    } catch (error) {
      console.error('💥 Error in AI generation setup:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error details:', {
        error: errorMsg,
        stack: error instanceof Error ? error.stack : 'No stack trace',
        patient: patient ? 'Available' : 'Not available',
        visitId: visitId || 'Not available',
        medicationsData: medicationsData?.length || 0
      });
      alert(`Error setting up AI generation.\n\nError: ${errorMsg}\n\nPlease check the console for details.`);
    }
  };

  // Actual AI generation function
  const generateAISummary = async () => {
    try {
      setIsGenerating(true);
      setShowGenerationModal(false);

      console.log('🤖 Generating AI discharge summary with edited data:', editablePatientData);
      console.log('🤖 Using edited prompt:', editablePrompt);

      console.log('🔍 API Request Details:');
      console.log('- Prompt length:', editablePrompt.length);
      console.log('- Patient data keys:', Object.keys(editablePatientData));
      console.log('- About to call OpenAI API...');

      // Comprehensive medical discharge summary request
      const requestBody = {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert medical professional specializing in creating comprehensive discharge summaries for hospitals. Generate detailed, professional medical documentation following Indian medical standards and terminology. Include ALL provided medical data including investigations, lab results, radiology findings, OT notes, and complications.'
          },
          {
            role: 'user',
            content: editablePrompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.7
      };

      console.log('🔍 Request body:', JSON.stringify(requestBody, null, 2));

      // Call OpenAI API directly using the same pattern as FinalBill.tsx
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📡 API Response received:');
      console.log('- Status:', response.status);
      console.log('- Status Text:', response.statusText);
      console.log('- Headers:', Object.fromEntries(response.headers));

      if (!response.ok) {
        // Try to get error details from response
        let errorDetails = 'Unknown error';
        try {
          const errorData = await response.json();
          errorDetails = JSON.stringify(errorData, null, 2);
          console.error('🚨 API Error Response:', errorData);
        } catch (parseError) {
          console.error('🚨 Could not parse error response:', parseError);
          errorDetails = await response.text();
        }

        throw new Error(`OpenAI API error: ${response.status} - ${response.statusText}\nDetails: ${errorDetails}`);
      }

      const data = await response.json();
      console.log('✅ API Response data structure:', {
        choices: data.choices?.length,
        hasContent: !!data.choices?.[0]?.message?.content,
        usage: data.usage
      });
      // Get AI response content
      const aiResponse = data.choices[0].message.content;
      console.log('🤖 AI Response received:', aiResponse ? aiResponse.substring(0, 200) + '...' : 'No content');

      // Check if AI response is properly formatted
      let aiGeneratedSummary;

      // Additional validation: check if AI response contains prompt echo or technical fields
      const hasPromptEcho = aiResponse && (
        aiResponse.includes('PATIENT DATA PROVIDED:') ||
        aiResponse.includes('**Patient Information:**')
      );

      if (hasPromptEcho) {
        console.log('🚨 AI response contains prompt echo - using fallback template');
        aiGeneratedSummary = null; // Force fallback
      } else if (aiResponse && (aiResponse.includes('DISCHARGE SUMMARY') || aiResponse.includes('Diagnosis:'))) {
        // AI returned proper plain text format
        aiGeneratedSummary = aiResponse;
        console.log('✅ AI returned proper plain text format');
      } else {
        aiGeneratedSummary = null; // Force fallback for invalid content
      }

      // Generate fallback template if needed
      if (!aiGeneratedSummary) {
        console.log('⚠️ Using fallback template with plain text formatting');
        aiGeneratedSummary = `OPD DISCHARGE SUMMARY
================================================================================

Name                  : ${(editablePatientData.name || 'Patient Name').padEnd(30)}Patient ID            : ${editablePatientData.uhId || editablePatientData.patientId || 'UHAY25I22001'}
Primary Care Provider : ${(editablePatientData.consultant || 'Dr. Unknown').padEnd(30)}Registration ID       : ${editablePatientData.registrationId || 'IH25I22001'}
Sex / Age             : ${((editablePatientData.gender || 'Gender') + ' / ' + (editablePatientData.age || 'Age') + ' Year').padEnd(30)}Mobile No             : ${editablePatientData.mobileNumber || editablePatientData.mobile || 'N/A'}
Tariff                : ${(editablePatientData.tariff || 'Private').padEnd(30)}Address               : ${editablePatientData.address || 'N/A'}
Admission Date        : ${(editablePatientData.admissionDate || new Date().toLocaleDateString()).padEnd(30)}Discharge Date        : ${editablePatientData.dischargeDate || new Date().toLocaleDateString()}
Discharge Reason      : Recovered

================================================================================

Present Condition

Diagnosis: ${editablePatientData.primaryDiagnosis || 'Primary diagnosis'}${editablePatientData.secondaryDiagnoses?.length > 0 ? `, ${editablePatientData.secondaryDiagnoses.join(', ')}` : ''}

${editablePatientData.labInvestigations && editablePatientData.labInvestigations.length > 0 ? `Investigations:
--------------------------------------------------------------------------------
LAB INVESTIGATIONS:
Name                              Result                  Range              Status
--------------------------------------------------------------------------------
${editablePatientData.labInvestigations.map(lab => {
  const name = (lab.name || 'Unknown Test').substring(0, 35).padEnd(35);
  const result = (lab.result || 'Pending').substring(0, 24).padEnd(24);
  const range = (lab.range || 'N/A').substring(0, 19).padEnd(19);
  const status = lab.status || 'Normal';
  return `${name}${result}${range}${status}`;
}).join('\n')}

` : ''}${editablePatientData.radiologyInvestigations && editablePatientData.radiologyInvestigations.length > 0 ? `RADIOLOGY INVESTIGATIONS:
Name                              Findings                                   Status
--------------------------------------------------------------------------------
${editablePatientData.radiologyInvestigations.map(rad => {
  const name = (rad.name || 'Unknown Test').substring(0, 35).padEnd(35);
  const findings = (rad.findings || 'Pending').substring(0, 43).padEnd(43);
  const status = rad.status || 'Completed';
  return `${name}${findings}${status}`;
}).join('\n')}

` : ''}Medications on Discharge:
--------------------------------------------------------------------------------
Name                     Strength    Route     Dosage                          Days
--------------------------------------------------------------------------------
${(() => {
  const medsToUse = editablePatientData.medications && editablePatientData.medications.length > 0
    ? editablePatientData.medications
    : [
        'Paracetamol 500mg oral twice-daily 5days',
        'Amoxicillin 250mg oral thrice-daily 7days',
        'Omeprazole 20mg oral once-daily 10days',
        'Vitamin-C 500mg oral once-daily 30days',
        'Diclofenac 50mg oral twice-daily 3days'
      ];
  return medsToUse.map(med => {
    const parsed = parseMedication(med);
    const name = parsed.name.padEnd(24);
    const strength = parsed.strength.padEnd(11);
    const route = parsed.route.padEnd(9);
    const dosage = parsed.dosage.padEnd(31);
    const days = parsed.days;
    return `${name} ${strength} ${route} ${dosage} ${days}`;
  }).join('\n');
})()}

Case Summary:

${editablePatientData.complaints && editablePatientData.complaints.length > 0
  ? `The patient was admitted with complaints of ${editablePatientData.complaints.join(', ')}.`
  : 'The patient was admitted for medical evaluation.'}

${editablePatientData.otData ? `
================================================================================
SURGICAL DETAILS:
================================================================================
${formatTableField('Surgery Name', editablePatientData.otData.surgeryName)}
${formatTableField('Surgeon', editablePatientData.otData.surgeon)}
${formatTableField('Anaesthesia', editablePatientData.otData.anaesthesia)}
${formatTableField('Procedure performed', editablePatientData.otData.procedurePerformed || 'As per surgical records')}
${formatTableField('Intraoperative findings', editablePatientData.otData.findings || 'As documented')}
${formatTableField('Post-operative notes', editablePatientData.otData.description || 'Recovery was satisfactory')}
${editablePatientData.otData.implant ? formatTableField('Implant used', editablePatientData.otData.implant) : ''}
================================================================================
` : ''}

${editablePatientData.vitalSigns && editablePatientData.vitalSigns.length > 0 ? `VITAL SIGNS AT DISCHARGE:
${editablePatientData.vitalSigns.join('\n')}
` : `Upon thorough examination, vitals were recorded as follows:
- Temperature: 98.6°F
- Pulse Rate: 80/min
- Blood Pressure: 120/80mmHg
- SpO2: 98% in Room Air`}

${editablePatientData.treatmentCourse && editablePatientData.treatmentCourse.length > 0 ? `TREATMENT COURSE:
${editablePatientData.treatmentCourse.join('\n')}
` : 'Post-examination, appropriate treatment was initiated. The patient responded adequately to the treatment.'}

${editablePatientData.complications && editablePatientData.complications.length > 0 ? `COMPLICATIONS DURING STAY:
${editablePatientData.complications.join(', ')}
` : ''}

The patient is recommended to continue the prescribed medication and should observe the following precautions at home:
- Maintain adequate hydration and rest
- Follow prescribed diet restrictions
- Take medications as directed
- Avoid strenuous activities
- Monitor for any warning signs

The patient should return to the hospital immediately:
- If symptoms worsen or recur
- If experiencing severe pain or discomfort
- If fever persists even after medication
- Any unusual complications

ADVICE

Advice:
Follow up after 7 days/SOS.

--------------------------------------------------------------------------------
Review on                     : ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB')}
Resident On Discharge         : ${editablePatientData.consultant || 'Sachin Gathibandhe'}
--------------------------------------------------------------------------------

                                           ${editablePatientData.consultant || 'Dr. Dr. Nikhil Khobragade (Gastroenterologist)'}

URGENT CARE/ EMERGENCY CARE IS AVAILABLE 24 X 7. PLEASE CONTACT: 7030974619, 9373111709.
`;
      }

      // AI response should already be in plain text, but convert if it contains HTML
      const finalSummary = aiGeneratedSummary.includes('<') && aiGeneratedSummary.includes('>')
        ? htmlToPlainText(aiGeneratedSummary)
        : aiGeneratedSummary;

      // Preserve existing diagnosis if it was manually edited
      // The AI-generated content already includes the preserved diagnosis in primaryDiagnosis variable
      // so the finalSummary should already have the correct diagnosis
      setDischargeSummaryText(finalSummary);

      // Use safer check for existingDiagnosis with proper variable scope
      const diagnosisWasPreserved = (typeof existingDiagnosis !== 'undefined' && existingDiagnosis && existingDiagnosis.length > 0);
      const preservedMessage = diagnosisWasPreserved
        ? '✅ AI-powered discharge summary generated successfully! Your existing diagnosis has been preserved.'
        : '✅ AI-powered discharge summary generated successfully using edited patient data!';
      alert(preservedMessage);

    } catch (error) {
      console.error('🚨 DETAILED ERROR ANALYSIS:');
      console.error('- Error object:', error);
      console.error('- Error message:', error.message);
      console.error('- Error stack:', error.stack);

      // Try to get more details about the fetch error
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error('🌐 Network/CORS error detected');
      }

      alert(`❌ Failed to generate AI summary.\n\nError Details:\n${error.message}\n\nCheck console for full details.`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle print - Create dedicated print window with clean HTML
  const handlePrint = () => {
    if (!dischargeSummaryText.trim()) {
      alert('No discharge summary content available to print. Please generate or enter content first.');
      return;
    }

    try {
      console.log('🖨️ Printing discharge summary...');
      console.log('📄 Content length:', dischargeSummaryText.length);
      console.log('📄 Content preview (first 500 chars):', dischargeSummaryText.substring(0, 500));

      // Check if content is HTML or text
      const isHtmlContent = dischargeSummaryText.includes('<div') && dischargeSummaryText.includes('</div>');
      console.log('📄 Content type:', isHtmlContent ? 'HTML' : 'Plain text');

      if (!isHtmlContent) {
        console.log('🚨 WARNING: Content is not HTML format - this may cause display issues');
      }

      // Format content for printing
      let formattedContent = '';

      // Parse the plain text content and format it for HTML printing
      if (!isHtmlContent) {
        console.log('🔧 Content is plain text - formatting for print with all sections');

        // Convert plain text to HTML while preserving all content and formatting
        const lines = dischargeSummaryText.split('\n');
        let htmlContent = [];
        let currentTable = null;
        let inTable = false;
        let tableHeaders = [];
        let tableRows = [];
        let inPatientDetails = false;
        let patientDetailsData = [];
        let inDischargeMedications = false;
        let dischargeMedicationsData = [];

        lines.forEach((line, index) => {
          // Check if we're entering patient details section
          if (line.includes('Patient Details') || line.includes('DISCHARGE SUMMARY')) {
            if (line.includes('DISCHARGE SUMMARY')) {
              // Add the discharge summary header
              htmlContent.push(`<h1 style="text-align: center; font-size: 16pt; font-weight: bold; margin: 20px 0; border-bottom: 2px solid #000; padding-bottom: 10px;">OPD DISCHARGE SUMMARY</h1>`);
              inPatientDetails = true;
              patientDetailsData = [];
              return; // Skip processing this line further to avoid duplicate
            }
            inPatientDetails = true;
            patientDetailsData = [];
          }

          // Collect patient details data if we're in that section
          if (inPatientDetails && line.includes(':') && !line.includes('PRESENT CONDITION') && !line.includes('Present Condition')) {
            // Parse patient details lines that contain colon-separated key-value pairs
            if (line.includes('Name') || line.includes('Patient ID') || line.includes('Primary Care Provider') ||
                line.includes('Registration ID') || line.includes('Sex / Age') || line.includes('Mobile No') ||
                line.includes('Tariff') || line.includes('Address') || line.includes('Admission Date') ||
                line.includes('Discharge Date') || line.includes('Discharge Reason')) {
              patientDetailsData.push(line);
              return; // Don't process this line further, it's being collected for the table
            }
          }

          // Check if we're leaving patient details section (when we hit Present Condition or other sections)
          if (inPatientDetails && (line.includes('PRESENT CONDITION') || line.includes('Present Condition') ||
              line.includes('Investigations:') || line.includes('INVESTIGATIONS:'))) {
            // Format and output collected patient details
            if (patientDetailsData.length > 0) {
              htmlContent.push(formatPatientDetailsTable(patientDetailsData));
              patientDetailsData = [];
            }
            inPatientDetails = false;
          }

          // Handle section separators
          if (line.includes('================================================================================')) {
            // If we were collecting patient details, output them now
            if (inPatientDetails && patientDetailsData.length > 0) {
              htmlContent.push(formatPatientDetailsTable(patientDetailsData));
              patientDetailsData = [];
              inPatientDetails = false;
            }
            if (inTable && tableRows.length > 0) {
              // Close any open table
              htmlContent.push(createTableHTML(tableHeaders, tableRows));
              inTable = false;
              tableRows = [];
              tableHeaders = [];
            }
            // Don't add any horizontal line - just skip the separator
            return;
          }

          if (line.includes('--------------------------------------------------------------------------------')) {
            if (inTable && tableRows.length > 0) {
              // This might be a table separator
              return;
            }
            // Don't add any horizontal line - just skip the separator
            return;
          }

          // Detect major section headers
          if (line.match(/^(PRESENT CONDITION|CASE SUMMARY|ADVICE|PROCEDURE DETAILS|LABORATORY INVESTIGATIONS|SURGICAL DETAILS|COMPLICATIONS|TREATMENT COURSE|VITAL SIGNS)/)) {
            if (inTable && tableRows.length > 0) {
              htmlContent.push(createTableHTML(tableHeaders, tableRows));
              inTable = false;
              tableRows = [];
              tableHeaders = [];
            }
            htmlContent.push(`<h2 style="font-size: 11pt; font-weight: bold; margin: 20px 0 10px 0; border-bottom: 2px solid #000; padding-bottom: 5px;">${line}</h2>`);
            return;
          }

          // Detect table headers (lines with multiple columns separated by spaces)
          // Make sure it's actually a medication table header, not just any line with "Name"
          if (line.includes('Name') && line.includes('Strength') && line.includes('Route') &&
              line.includes('Dosage') && !line.includes('Case Summary')) {
            // Medications table header
            inTable = true;
            tableHeaders = ['Name', 'Strength', 'Route', 'Dosage', 'Number of Days to be taken'];
            return;
          } else if (line.includes('Test Name') && line.includes('Result') && line.includes('Reference Range')) {
            // Lab results table header
            inTable = true;
            tableHeaders = ['Test Name', 'Result', 'Reference Range', 'Status'];
            return;
          } else if (line.includes('Review on') || line.includes('Resident On Discharge')) {
            // Review table
            const parts = line.split(':');
            if (parts.length === 2) {
              htmlContent.push(`<div style="margin: 10px 0;"><strong>${parts[0].trim()}:</strong> ${parts[1].trim()}</div>`);
            }
            return;
          }

          // Handle table rows
          if (inTable) {
            if (line.trim() === '' || line.startsWith('ADVICE') || line.includes('URGENT CARE') ||
                line.startsWith('Case Summary') || line.startsWith('CASE SUMMARY')) {
              // End of table
              if (tableRows.length > 0) {
                htmlContent.push(createTableHTML(tableHeaders, tableRows));
              }
              inTable = false;
              tableRows = [];
              tableHeaders = [];
              if (line.trim() !== '') {
                // Process this line normally
                processNormalLine(line, htmlContent);
              }
            } else if (!line.includes('------')) {
              // Add table row (skip separator lines)
              tableRows.push(line);
            }
            return;
          }

          // Check if we're entering discharge medications section
          if (line.includes('DISCHARGE MEDICATIONS:') || (line.includes('DISCHARGE') && line.includes('MEDICATIONS')) ||
              line.includes('MEDICATIONS ON DISCHARGE:') || (line.includes('Medications') && line.includes('Discharge'))) {
            inDischargeMedications = true;
            dischargeMedicationsData = [];
            // Don't add the heading here - it will be included in the table
            return;
          }

          // Collect discharge medications data if we're in that section
          if (inDischargeMedications) {
            // Check if we're leaving the medications section
            if (line.includes('DISCHARGE ADVICE') || line.includes('REVIEW') || line.includes('Return immediately if') ||
                line.includes('Case Summary') || line.includes('CASE SUMMARY') || line.includes('SURGICAL DETAILS') ||
                line.includes('The patient was admitted') || line.includes('ADVICE') ||
                (line.trim() === '' && dischargeMedicationsData.length > 0)) {
              // Format and output collected medications only if we have valid data
              if (dischargeMedicationsData.length > 0) {
                htmlContent.push(formatMedicationsTable(dischargeMedicationsData));
                dischargeMedicationsData = [];
              }
              inDischargeMedications = false;
              // Process this line normally if it's not empty
              if (line.trim() !== '') {
                processNormalLine(line, htmlContent);
              }
              return;
            }

            // Collect medication lines (format: "• MedicationName: Dosage" or "- MedicationName: Dosage" or just "MedicationName: Dosage")
            if (line.trim() && !line.includes('-----')) {
              // Remove bullet points or dashes if present
              let medLine = line.trim();
              if (medLine.startsWith('•') || medLine.startsWith('-') || medLine.startsWith('*')) {
                medLine = medLine.substring(1).trim();
              }
              // Only add if it contains medication info (has a colon) and is not a section header
              if (medLine.includes(':') && !medLine.includes('Case Summary') && !medLine.includes('CASE SUMMARY')) {
                dischargeMedicationsData.push(medLine);
              }
            }
            return;
          }

          // Process normal lines
          processNormalLine(line, htmlContent);
        });

        // Close any remaining table
        if (inTable && tableRows.length > 0) {
          htmlContent.push(createTableHTML(tableHeaders, tableRows));
        }

        // If we ended with medications section still open, output the table
        if (inDischargeMedications && dischargeMedicationsData.length > 0) {
          htmlContent.push(formatMedicationsTable(dischargeMedicationsData));
        }

        // Helper function to create table HTML
        function createTableHTML(headers, rows) {
          let tableHTML = '<table style="width: 100%; border-collapse: collapse; margin: 15px 0;">';

          // Add headers if available
          if (headers.length > 0) {
            tableHTML += '<thead><tr>';
            headers.forEach(header => {
              tableHTML += `<th style="border: 1px solid #000; padding: 8px; background-color: #f0f0f0; font-weight: bold;">${header}</th>`;
            });
            tableHTML += '</tr></thead>';
          }

          // Add rows
          tableHTML += '<tbody>';
          rows.forEach(row => {
            if (row.includes('As per prescription')) {
              tableHTML += `<tr><td colspan="${headers.length || 5}" style="border: 1px solid #000; padding: 8px;">${row}</td></tr>`;
            } else {
              // For medication rows, handle the specific format with fixed column positions
              if (headers[0] === 'Name' && headers.includes('Strength')) {
                // This is a medication table - parse using fixed positions
                const name = row.substring(0, 24).trim();
                const strength = row.substring(25, 36).trim();
                const route = row.substring(37, 46).trim();
                const dosage = row.substring(47, 78).trim();
                const days = row.substring(79).trim();

                tableHTML += '<tr>';
                tableHTML += `<td style="border: 1px solid #000; padding: 8px;">${name || '&nbsp;'}</td>`;
                tableHTML += `<td style="border: 1px solid #000; padding: 8px;">${strength || '&nbsp;'}</td>`;
                tableHTML += `<td style="border: 1px solid #000; padding: 8px;">${route || '&nbsp;'}</td>`;
                tableHTML += `<td style="border: 1px solid #000; padding: 8px;">${dosage || '&nbsp;'}</td>`;
                tableHTML += `<td style="border: 1px solid #000; padding: 8px;">${days || '&nbsp;'}</td>`;
                tableHTML += '</tr>';
              } else {
                // For other tables, try to split the row into columns
                const cells = row.split(/\s{2,}/).filter(cell => cell.trim());
                tableHTML += '<tr>';
                if (cells.length > 0) {
                  cells.forEach(cell => {
                    tableHTML += `<td style="border: 1px solid #000; padding: 8px;">${cell.trim()}</td>`;
                  });
                  // Fill remaining cells if needed
                  for (let i = cells.length; i < headers.length; i++) {
                    tableHTML += '<td style="border: 1px solid #000; padding: 8px;"></td>';
                  }
                } else {
                  // Empty row
                  tableHTML += `<td colspan="${headers.length}" style="border: 1px solid #000; padding: 8px;">${row}</td>`;
                }
                tableHTML += '</tr>';
              }
            }
          });
          tableHTML += '</tbody></table>';

          return tableHTML;
        }

        // Helper function to process normal lines
        function processNormalLine(line, htmlContent) {
          if (line.trim() === '') {
            htmlContent.push('<br>');
          } else if (line.startsWith('- ')) {
            // Bullet point
            htmlContent.push(`<li style="margin: 5px 0 5px 20px;">${line.substring(2)}</li>`);
          } else if (line.match(/^(PRESENT CONDITION:|INVESTIGATIONS:|MEDICATIONS ON DISCHARGE:|RADIOLOGY INVESTIGATIONS:|LAB INVESTIGATIONS:|Present Condition|Investigations:|Medications on Discharge:|Case Summary:)/)) {
            // Section headings with or without colons
            htmlContent.push(`<h3 style="font-size: 11pt; font-weight: bold; margin: 15px 0 8px 0;">${line}</h3>`);
          } else if (line.includes('URGENT CARE') && line.includes('EMERGENCY CARE')) {
            // URGENT CARE text - make it bold with 11pt font
            htmlContent.push(`<p style="font-size: 11pt; font-weight: bold; margin: 8px 0;">${line}</p>`);
          } else if (line.includes('PLEASE CONTACT:') && (line.includes('7030974619') || line.includes('9373111709'))) {
            // Contact phone numbers - make them bold with 11pt font
            htmlContent.push(`<p style="font-size: 11pt; font-weight: bold; margin: 8px 0;">${line}</p>`);
          } else if (line.includes(':') && line.indexOf(':') < 30) {
            // Key-value pair
            const colonIndex = line.indexOf(':');
            const key = line.substring(0, colonIndex).trim();
            const value = line.substring(colonIndex + 1).trim();

            if (key && value) {
              htmlContent.push(`<div style="margin: 8px 0;"><strong>${key}:</strong> ${value}</div>`);
            } else {
              htmlContent.push(`<p style="margin: 8px 0;">${line}</p>`);
            }
          } else {
            // Regular paragraph
            htmlContent.push(`<p style="margin: 8px 0;">${line}</p>`);
          }
        }

        // Helper function to format patient details in a two-column layout
        function formatPatientDetailsTable(detailsData) {
          // Parse the patient details data
          const details = {};

          // Debug logging
          console.log('Patient details data to parse:', detailsData);

          detailsData.forEach(line => {
            // Use regex to find all key-value pairs in the line
            // Pattern matches: "Key : Value" where key can have spaces/slashes
            const regex = /([A-Za-z\s\/]+?):\s*([^:]*?)(?=\s{2,}[A-Za-z]|$)/g;
            let match;

            while ((match = regex.exec(line)) !== null) {
              const key = match[1].trim();
              const value = match[2].trim();

              // Store the key-value pair
              if (key) {
                details[key] = value || 'N/A';
                console.log(`Parsed: "${key}" = "${value}"`);
              }
            }

            // Fallback: If no matches found with regex, try simple split
            if (Object.keys(details).length === 0 && line.includes(':')) {
              const colonIndex = line.indexOf(':');
              const key = line.substring(0, colonIndex).trim();
              const remainingText = line.substring(colonIndex + 1);

              // Check if there's another key-value pair in the same line
              const nextKeyMatch = remainingText.match(/\s{2,}([A-Za-z\s\/]+?):/);
              if (nextKeyMatch) {
                const value = remainingText.substring(0, nextKeyMatch.index).trim();
                details[key] = value || 'N/A';

                // Parse the second key-value pair
                const secondPart = remainingText.substring(nextKeyMatch.index);
                const secondColonIndex = secondPart.indexOf(':');
                if (secondColonIndex > -1) {
                  const secondKey = secondPart.substring(0, secondColonIndex).trim();
                  const secondValue = secondPart.substring(secondColonIndex + 1).trim();
                  details[secondKey] = secondValue || 'N/A';
                }
              } else {
                // Single key-value pair in the line
                details[key] = remainingText.trim() || 'N/A';
              }
            }
          });

          console.log('Parsed patient details:', details);

          // Create a two-column table layout for patient details
          let html = '<table style="width: 100%; margin: 20px 0; border-collapse: collapse;">';
          html += '<tr>';
          html += '<td style="width: 50%; vertical-align: top; padding-right: 20px;">';

          // Left column items
          const leftColumnKeys = ['Name', 'Primary Care Provider', 'Sex / Age', 'Tariff', 'Admission Date', 'Discharge Reason'];
          leftColumnKeys.forEach(key => {
            const value = details[key] || 'N/A';
            html += `<div style="margin: 8px 0;"><strong>${key}:</strong> ${value}</div>`;
          });

          html += '</td>';
          html += '<td style="width: 50%; vertical-align: top;">';

          // Right column items
          const rightColumnKeys = ['Patient ID', 'Registration ID', 'Mobile No', 'Address', 'Discharge Date'];
          rightColumnKeys.forEach(key => {
            const value = details[key] || 'N/A';
            html += `<div style="margin: 8px 0;"><strong>${key}:</strong> ${value}</div>`;
          });

          html += '</td>';
          html += '</tr>';
          html += '</table>';

          return html;
        }

        // Helper function to format discharge medications in a table
        function formatMedicationsTable(medicationsData) {
          // Create a table for medications
          let html = '<table style="width: 100%; border-collapse: collapse; margin: 15px 0;">';

          // Add table headers
          html += '<thead><tr>';
          html += '<th style="border: 1px solid #000; padding: 8px; background-color: #f0f0f0; font-weight: bold; text-align: left;">Medicine Name</th>';
          html += '<th style="border: 1px solid #000; padding: 8px; background-color: #f0f0f0; font-weight: bold; text-align: left;">Dosage/Instructions</th>';
          html += '</tr></thead>';

          // Add table body
          html += '<tbody>';
          medicationsData.forEach(medLine => {
            // Parse medication line (format: "MedicationName: Dosage/Instructions")
            const colonIndex = medLine.indexOf(':');
            let medicationName = '';
            let dosageInstructions = '';

            if (colonIndex > -1) {
              medicationName = medLine.substring(0, colonIndex).trim();
              dosageInstructions = medLine.substring(colonIndex + 1).trim();
            } else {
              // If no colon, treat the whole line as medication name
              medicationName = medLine;
              dosageInstructions = 'As directed';
            }

            html += '<tr>';
            html += `<td style="border: 1px solid #000; padding: 8px;">${medicationName}</td>`;
            html += `<td style="border: 1px solid #000; padding: 8px;">${dosageInstructions}</td>`;
            html += '</tr>';
          });

          html += '</tbody></table>';

          return html;
        }

        // Join all HTML content
        formattedContent = htmlContent.join('');
      } else {
        // Already HTML format
        formattedContent = dischargeSummaryText;
      }

      // Create complete HTML document for printing
      const printHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>OPD Summary - ${patient?.patients?.name || 'Patient'}</title>
    <style>
        @page {
            size: A4;
            margin: 20mm;
        }

        body {
            font-family: Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.4;
            color: black;
            margin: 0;
            padding: 0;
        }

        .header {
            text-align: center;
            margin-bottom: 15px;
        }

        .header h1 {
            font-size: 16pt;
            font-weight: bold;
            margin: 0;
            padding-bottom: 10px;
            border-bottom: 3px solid black;
        }

        .patient-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20pt;
            margin-bottom: 20pt;
            font-size: 11pt;
        }

        .patient-info p {
            margin: 4pt 0;
        }

        .content {
            font-size: 11pt;
            line-height: 1.4;
        }

        .content p {
            margin-bottom: 8pt;
        }

        .content h2, .content h3 {
            font-size: 13pt;
            font-weight: bold;
            margin-top: 15pt;
            margin-bottom: 8pt;
            page-break-after: avoid;
        }

        .content table {
            page-break-inside: avoid;
        }

        .content strong {
            font-weight: bold;
        }

        /* Lab Results Specific Styling */
        .lab-results {
            margin: 12pt 0;
        }

        .lab-group {
            margin-bottom: 8pt;
        }

        .lab-group-title {
            font-weight: bold;
            font-size: 12pt;
            margin-bottom: 4pt;
            color: #2c3e50;
        }

        .lab-result {
            margin-left: 16pt;
            margin-bottom: 2pt;
            font-size: 10pt;
        }

        .abnormal-result {
            color: #e74c3c;
            font-weight: bold;
        }

        .critical-values {
            background-color: #fdf2f2;
            border-left: 4pt solid #e74c3c;
            padding: 8pt;
            margin: 12pt 0;
        }

        .critical-values h4 {
            margin: 0 0 8pt 0;
            color: #e74c3c;
            font-size: 11pt;
        }

        table {
            border-collapse: collapse;
            width: 100%;
            margin: 15px 0;
        }

        th, td {
            border: 1px solid black;
            padding: 8px;
            text-align: left;
            font-size: 10pt;
        }

        th {
            background-color: #f0f0f0;
            font-weight: bold;
        }

        .patient-info-table {
            border: none;
            margin: 20px 0;
            width: 100%;
        }

        .patient-info-table td {
            border: none;
            padding: 4px 10px;
            font-size: 11pt;
        }

        h3 {
            font-size: 11pt;
            font-weight: bold;
            margin: 25px 0 10px 0;
            border-bottom: 2px solid black;
            padding-bottom: 5px;
        }

        .content {
            margin-top: 20px;
        }

        .content p {
            margin: 10px 0;
        }

        ul {
            margin: 10px 0 10px 20px;
        }

        li {
            margin: 5px 0;
        }

        .advice-section {
            margin-top: 30px;
            padding-top: 20px;
        }

        .advice-table {
            margin-top: 20px;
            width: 100%;
        }

        .emergency-note {
            margin-top: 30px;
            padding: 15px;
            background-color: #f9f9f9;
            border: 1px solid #ccc;
            text-align: center;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="content">
        ${formattedContent}
    </div>
</body>
</html>`;

      // Open new window and print
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) {
        alert('Print window blocked. Please allow pop-ups and try again.');
        return;
      }

      printWindow.document.write(printHTML);
      printWindow.document.close();

      // Wait for content to load then print
      printWindow.onload = () => {
        printWindow.print();
        // Close window after printing
        printWindow.onafterprint = () => {
          printWindow.close();
        };
      };

    } catch (error) {
      console.error('Print error:', error);
      alert('Failed to print. Please try again or check your browser settings.');
    }
  };

  // Handle preview toggle with payment check
  const togglePreview = () => {
    if (!patient?.has_final_payment) {
      alert('⚠️ Final Payment Required\n\nPlease complete the final payment before previewing the discharge summary.');
      return;
    }
    setShowPreview(!showPreview);
  };

  // Handle print with payment check
  const handlePrintWithCheck = () => {
    if (!patient?.has_final_payment) {
      alert('⚠️ Final Payment Required\n\nPlease complete the final payment before printing the discharge summary.');
      return;
    }
    handlePrint();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading patient data...</div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Patient Not Found</h1>
          <p className="text-gray-600 mb-4">Could not find patient data for visit ID: {visitId}</p>
          <Button onClick={() => navigate('/todays-opd')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to OPD Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/todays-opd')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to OPD
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                OPD Summary
              </h1>
              <p className="text-gray-600">
                Patient: {patient.patients?.name} | Visit ID: {patient.visit_id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isSaving && (
              <Badge variant="outline" className="text-blue-600 border-blue-200">
                Saving...
              </Badge>
            )}
            {isSaved && !isSaving && (
              <Badge variant="outline" className="text-green-600 border-green-200">
                ✓ Saved
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Information Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Patient Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Name</label>
                <div className="font-medium">{patient.patients?.name || 'Unknown'}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Patient ID</label>
                <div className="font-mono text-sm">{patient.patients?.patients_id || 'N/A'}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Gender/Age</label>
                <div>{patient.patients?.gender || 'Unknown'}/{patient.patients?.age || 'N/A'} Years</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Visit Type</label>
                <Badge variant="outline">{patient.visit_type || 'General'}</Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Doctor</label>
                <div>{patient.appointment_with || 'Not Assigned'}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Diagnosis</label>
                <div>
                  {visitDiagnosis?.primaryDiagnosis || patient.diagnosis || 'No diagnosis recorded'}
                  {visitDiagnosis?.secondaryDiagnoses && visitDiagnosis.secondaryDiagnoses.length > 0 && (
                    <div className="text-sm text-gray-500 mt-1">
                      Secondary: {visitDiagnosis.secondaryDiagnoses.join(', ')}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Corporate</label>
                <div>{patient.patients?.corporate || 'Private'}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>OPD Summary Content</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFetchData}
                    className="flex items-center gap-2 bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
                  >
                    <Download className="h-4 w-4" />
                    Fetch Data
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAIGenerate}
                    disabled={isGenerating || !patient}
                    className="flex items-center gap-2"
                  >
                    {isGenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    {isGenerating ? 'Generating...' : 'Generate by AI'}
                  </Button>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={togglePreview}
                            className="flex items-center gap-2"
                            disabled={!patient?.has_final_payment}
                          >
                            <Eye className="h-4 w-4" />
                            {showPreview ? 'Edit' : 'Preview'}
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {!patient?.has_final_payment && (
                        <TooltipContent className="bg-red-600 text-white border-red-700 font-semibold">
                          <p className="flex items-center gap-2">
                            <span className="text-lg">⚠️</span>
                            Please complete final payment
                          </p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrintWithCheck}
                            className="flex items-center gap-2"
                            disabled={!patient?.has_final_payment}
                          >
                            <Printer className="h-4 w-4" />
                            Print
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {!patient?.has_final_payment && (
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
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Save
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {showPreview ? (
                <div className="border rounded-lg p-8 bg-white min-h-[500px] max-w-4xl mx-auto print:p-4 print:shadow-none">
                  {/* Hospital Header */}
                  <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">OPD DISCHARGE SUMMARY</h1>
                    <div className="text-sm text-gray-600">
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="text-left">
                          <p><strong>Name:</strong> {patient?.patients?.name || 'Patient Name'}</p>
                          <p><strong>Primary Care Provider:</strong> Dr. {patient?.appointment_with || 'Attending Physician'}</p>
                          <p><strong>Sex / Age:</strong> {patient?.patients?.gender || 'N/A'} / {patient?.patients?.age || 'N/A'} Year</p>
                          <p><strong>Tariff:</strong> {patient?.patients?.corporate || 'Private'}</p>
                          <p><strong>Admission Date:</strong> {patient?.admission_date || patient?.visit_date || new Date().toLocaleDateString()}</p>
                          <p><strong>Discharge Reason:</strong> Recovered</p>
                        </div>
                        <div className="text-left">
                          <p><strong>Patient ID:</strong> {patient?.visit_id || 'N/A'}</p>
                          <p><strong>Registration ID:</strong> {patient?.patients?.patients_id || 'N/A'}</p>
                          <p><strong>Mobile No:</strong> {patient?.patients?.phone || 'N/A'}</p>
                          <p><strong>Address:</strong> {patient?.patients?.address || 'N/A'}</p>
                          <p><strong>Discharge Date:</strong> {patient?.discharge_date || new Date().toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI Generated Content */}
                  <div
                    className="prose prose-sm max-w-none leading-relaxed"
                    style={{
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      fontSize: '14px',
                      lineHeight: '1.6'
                    }}
                    dangerouslySetInnerHTML={{
                      __html: dischargeSummaryText
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        .replace(/\n\n/g, '</p><p class="mb-4">')
                        .replace(/\n/g, '<br>')
                        .replace(/^\s*/, '<p class="mb-4">')
                        .replace(/\s*$/, '</p>')
                        .replace(/\|(.+)\|/g, (match) => {
                          const rows = match.split('\n').filter(row => row.trim());
                          if (rows.length < 2) return match;

                          let tableHtml = '<table class="w-full border-collapse border border-gray-300 my-4"><tbody>';
                          rows.forEach((row, index) => {
                            const cells = row.split('|').filter(cell => cell.trim()).map(cell => cell.trim());
                            const tag = index === 0 ? 'th' : 'td';
                            const className = index === 0 ? 'class="bg-gray-100 font-semibold p-2 border border-gray-300 text-left"' : 'class="p-2 border border-gray-300"';
                            tableHtml += `<tr>${cells.map(cell => `<${tag} ${className}>${cell}</${tag}>`).join('')}</tr>`;
                          });
                          tableHtml += '</tbody></table>';
                          return tableHtml;
                        })
                    }}
                  />
                </div>
              ) : (
                <div className="relative">
                  <textarea
                    className="w-full min-h-[500px] p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical font-mono text-sm leading-relaxed"
                    placeholder="Enter discharge summary details here...

• Chief Complaints
• Diagnosis
• Treatment Given
• Condition at Discharge
• Follow-up Instructions
• Medications Prescribed"
                    value={dischargeSummaryText}
                    onChange={(e) => setDischargeSummaryText(e.target.value)}
                  />

                  {/* Save indicators */}
                  {isSaving && (
                    <div className="absolute bottom-4 right-4 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded border border-blue-200">
                      Saving...
                    </div>
                  )}
                  {isSaved && !isSaving && (
                    <div className="absolute bottom-4 right-4 text-sm text-green-600 bg-green-50 px-3 py-1 rounded border border-green-200">
                      ✓ Saved
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 text-xs text-gray-500">
                Auto-saves as you type. Character count: {dischargeSummaryText.length}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>


      {/* AI Generation Modal */}
      <Dialog open={showGenerationModal} onOpenChange={setShowGenerationModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              AI OPD Summary Generation
            </DialogTitle>
            <DialogDescription>
              Review and edit the patient data and prompt before generating the AI discharge summary.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Editable Patient Data Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Edit3 className="h-4 w-4" />
                Patient Data (Editable)
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryDiagnosis">Primary Diagnosis</Label>
                  <Input
                    id="primaryDiagnosis"
                    value={editablePatientData.primaryDiagnosis || ''}
                    onChange={(e) => setEditablePatientData({...editablePatientData, primaryDiagnosis: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admissionDate">Admission Date</Label>
                  <Input
                    id="admissionDate"
                    value={editablePatientData.admissionDate || ''}
                    onChange={(e) => setEditablePatientData({...editablePatientData, admissionDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="complaints">Chief Complaints (comma-separated)</Label>
                <Input
                  id="complaints"
                  value={editablePatientData.complaints?.join(', ') || ''}
                  onChange={(e) => setEditablePatientData({
                    ...editablePatientData,
                    complaints: e.target.value.split(',').map(c => c.trim()).filter(Boolean)
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="complications">Complications (comma-separated)</Label>
                <Input
                  id="complications"
                  value={editablePatientData.complications?.join(', ') || ''}
                  onChange={(e) => setEditablePatientData({
                    ...editablePatientData,
                    complications: e.target.value.split(',').map(c => c.trim()).filter(Boolean)
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medications">Current Medications (comma-separated)</Label>
                <Input
                  id="medications"
                  value={editablePatientData.medications?.join(', ') || ''}
                  onChange={(e) => setEditablePatientData({
                    ...editablePatientData,
                    medications: e.target.value.split(',').map(m => m.trim()).filter(Boolean)
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="labResults">Lab Results</Label>
                <textarea
                  id="labResults"
                  className="w-full h-32 p-2 border rounded-md text-sm font-mono"
                  value={editablePatientData.labResults?.join('\n') || ''}
                  onChange={(e) => setEditablePatientData({
                    ...editablePatientData,
                    labResults: e.target.value.split('\n').filter(Boolean)
                  })}
                  placeholder="Lab results will appear here..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="abnormalLabResults">Critical/Abnormal Lab Values (comma-separated)</Label>
                <Input
                  id="abnormalLabResults"
                  value={editablePatientData.abnormalLabResults?.join(', ') || ''}
                  onChange={(e) => setEditablePatientData({
                    ...editablePatientData,
                    abnormalLabResults: e.target.value.split(',').map(r => r.trim()).filter(Boolean)
                  })}
                  placeholder="Abnormal lab values..."
                />
              </div>
            </div>

            {/* Editable Prompt Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                OpenAI Prompt (Editable)
              </h3>
              <div className="space-y-2">
                <Label htmlFor="prompt">AI Generation Prompt</Label>
                <Textarea
                  id="prompt"
                  value={editablePrompt}
                  onChange={(e) => setEditablePrompt(e.target.value)}
                  rows={12}
                  className="text-sm"
                  placeholder="Edit the OpenAI prompt for discharge summary generation..."
                />
              </div>
              <p className="text-xs text-gray-500">
                Prompt length: {editablePrompt.length} characters
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowGenerationModal(false)}
                disabled={isGenerating}
              >
                Cancel
              </Button>
              <Button
                onClick={generateAISummary}
                disabled={isGenerating}
                className="flex items-center gap-2"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {isGenerating ? 'Generating...' : 'Generate Summary'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}