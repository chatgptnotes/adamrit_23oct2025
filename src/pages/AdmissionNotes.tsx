import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, Printer, Loader2, FileText } from 'lucide-react';
import { useDebounce } from 'use-debounce';
import { useToast } from '@/hooks/use-toast';

interface PatientData {
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
    address?: string;
    phone?: string;
    corporate?: string;
  };
  visit_type?: string;
  appointment_with?: string;
  diagnosis?: string;
  reason_for_visit?: string;
  created_at?: string;
  admission_date?: string;
}

interface AdmissionNotesData {
  complaint: string;
  history_present_illness: string;
  past_illness: string;
  personal_history_habits: string;
  occupation_family_history: string;
  clinical_examination: string;
  investigation: string;
  provisional_diagnosis: string;
  surgery_plans_doctor: string;
  doctor_signature: string;
  review: string;
}

const AdmissionNotes = () => {
  const { visitId } = useParams<{ visitId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Form state
  const [formData, setFormData] = useState<AdmissionNotesData>({
    complaint: '',
    history_present_illness: '',
    past_illness: '',
    personal_history_habits: '',
    occupation_family_history: '',
    clinical_examination: '',
    investigation: '',
    provisional_diagnosis: '',
    surgery_plans_doctor: '',
    doctor_signature: '',
    review: '',
  });

  // Debounce form data for auto-save
  const [debouncedFormData] = useDebounce(formData, 1500);

  // Fetch patient and visit data
  useEffect(() => {
    const fetchData = async () => {
      if (!visitId) {
        toast({
          title: "Error",
          description: "Visit ID is missing",
          variant: "destructive",
        });
        navigate(-1);
        return;
      }

      try {
        // Fetch visit data with patient details
        const { data: visitData, error: visitError } = await supabase
          .from('visits')
          .select(`
            *,
            patients!inner (
              id,
              name,
              gender,
              age,
              date_of_birth,
              patients_id,
              address,
              phone,
              corporate
            )
          `)
          .eq('visit_id', visitId)
          .single();

        if (visitError) {
          console.error('Error fetching visit data:', visitError);
          throw visitError;
        }

        setPatientData(visitData);

        // Load existing admission notes if available
        if (visitData.ipd_admission_notes) {
          // Supabase returns JSONB as JavaScript object, so we can use it directly
          setFormData(visitData.ipd_admission_notes as AdmissionNotesData);
        }
      } catch (error) {
        console.error('Error in fetchData:', error);
        toast({
          title: "Error",
          description: "Failed to load patient data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [visitId, navigate, toast]);

  // Auto-save when debounced data changes
  useEffect(() => {
    const saveData = async () => {
      if (!visitId || !patientData || loading) return;

      // Check if there's actual data to save (not all empty)
      const hasData = Object.values(debouncedFormData).some(val => val.trim() !== '');
      if (!hasData) return;

      setSaving(true);

      try {
        const { error } = await supabase
          .from('visits')
          .update({
            ipd_admission_notes: debouncedFormData,
            updated_at: new Date().toISOString()
          })
          .eq('visit_id', visitId);

        if (error) {
          console.error('Error saving admission notes:', error);
          toast({
            title: "Save Failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          setLastSaved(new Date());
        }
      } catch (error) {
        console.error('Exception while saving:', error);
      } finally {
        setSaving(false);
      }
    };

    saveData();
  }, [debouncedFormData, visitId, patientData, loading, toast]);

  const handleInputChange = (field: keyof AdmissionNotesData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleManualSave = async () => {
    if (!visitId) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from('visits')
        .update({
          ipd_admission_notes: formData,
          updated_at: new Date().toISOString()
        })
        .eq('visit_id', visitId);

      if (error) {
        toast({
          title: "Save Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setLastSaved(new Date());
        toast({
          title: "Saved",
          description: "Admission notes saved successfully",
        });
      }
    } catch (error) {
      console.error('Error saving:', error);
      toast({
        title: "Error",
        description: "Failed to save admission notes",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading patient data...</p>
        </div>
      </div>
    );
  }

  if (!patientData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Patient data not found</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header with Actions */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="flex items-center gap-4">
          {lastSaved && (
            <span className="text-sm text-gray-500">
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}
          {saving && (
            <div className="flex items-center gap-2 text-blue-600 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </div>
          )}
          <Button
            onClick={handleManualSave}
            disabled={saving}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save Now
          </Button>
          <Button
            onClick={handlePrint}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      {/* Main Form */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 print:bg-white">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-blue-600" />
            <div>
              <CardTitle className="text-2xl font-bold text-blue-900">
                ADMISSION NOTES
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Visit ID: {patientData.visit_id} | Admission Date: {formatDate(patientData.admission_date)}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Patient Information Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg print:border print:border-gray-300">
            <div>
              <Label className="text-xs font-semibold text-gray-600">Name</Label>
              <p className="text-sm font-medium mt-1">{patientData.patients?.name || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-600">Age/Sex</Label>
              <p className="text-sm font-medium mt-1">
                {patientData.patients?.age || 'N/A'} / {patientData.patients?.gender || 'N/A'}
              </p>
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-600">Mobile No.</Label>
              <p className="text-sm font-medium mt-1">{patientData.patients?.phone || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-600">Reg. No</Label>
              <p className="text-sm font-medium mt-1">{patientData.patients?.patients_id || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-600">Visit ID</Label>
              <p className="text-sm font-medium mt-1">{patientData.visit_id || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-600">Admission Date</Label>
              <p className="text-sm font-medium mt-1">{formatDate(patientData.admission_date)}</p>
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-600">Address</Label>
              <p className="text-sm font-medium mt-1">{patientData.patients?.address || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-600">Name of Consultant</Label>
              <p className="text-sm font-medium mt-1">{patientData.appointment_with || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-600">Corporate</Label>
              <p className="text-sm font-medium mt-1">{patientData.patients?.corporate || 'N/A'}</p>
            </div>
          </div>

          {/* Complaint */}
          <div className="space-y-2">
            <Label className="text-lg font-semibold text-gray-800">Complaint:</Label>
            <Textarea
              value={formData.complaint}
              onChange={(e) => handleInputChange('complaint', e.target.value)}
              placeholder="Enter patient complaints..."
              className="min-h-[80px] resize-vertical print:border-gray-400"
            />
          </div>

          {/* History of Present Illness */}
          <div className="space-y-2">
            <Label className="text-lg font-semibold text-gray-800">History of Present Illness:</Label>
            <Textarea
              value={formData.history_present_illness}
              onChange={(e) => handleInputChange('history_present_illness', e.target.value)}
              placeholder="Enter history of present illness..."
              className="min-h-[100px] resize-vertical print:border-gray-400"
            />
          </div>

          {/* Past illness */}
          <div className="space-y-2">
            <Label className="text-lg font-semibold text-gray-800">Past illness:</Label>
            <Textarea
              value={formData.past_illness}
              onChange={(e) => handleInputChange('past_illness', e.target.value)}
              placeholder="Enter past medical history..."
              className="min-h-[80px] resize-vertical print:border-gray-400"
            />
          </div>

          {/* Personal history/Habits */}
          <div className="space-y-2">
            <Label className="text-lg font-semibold text-gray-800">Personal history/Habits:</Label>
            <Textarea
              value={formData.personal_history_habits}
              onChange={(e) => handleInputChange('personal_history_habits', e.target.value)}
              placeholder="Enter personal history and habits..."
              className="min-h-[80px] resize-vertical print:border-gray-400"
            />
          </div>

          {/* Occupation History & family History */}
          <div className="space-y-2">
            <Label className="text-lg font-semibold text-gray-800">Occupation History & family History:</Label>
            <Textarea
              value={formData.occupation_family_history}
              onChange={(e) => handleInputChange('occupation_family_history', e.target.value)}
              placeholder="Enter occupation and family history..."
              className="min-h-[80px] resize-vertical print:border-gray-400"
            />
          </div>

          {/* Clinical Examination */}
          <div className="space-y-2">
            <Label className="text-lg font-semibold text-gray-800">Clinical Examination:</Label>
            <Textarea
              value={formData.clinical_examination}
              onChange={(e) => handleInputChange('clinical_examination', e.target.value)}
              placeholder="Enter clinical examination findings..."
              className="min-h-[100px] resize-vertical print:border-gray-400"
            />
          </div>

          {/* Investigation */}
          <div className="space-y-2">
            <Label className="text-lg font-semibold text-gray-800">Investigation:</Label>
            <Textarea
              value={formData.investigation}
              onChange={(e) => handleInputChange('investigation', e.target.value)}
              placeholder="Enter investigation details..."
              className="min-h-[80px] resize-vertical print:border-gray-400"
            />
          </div>

          {/* Provisional Diagnosis */}
          <div className="space-y-2">
            <Label className="text-lg font-semibold text-gray-800">Provisional Diagnosis:</Label>
            <Textarea
              value={formData.provisional_diagnosis}
              onChange={(e) => handleInputChange('provisional_diagnosis', e.target.value)}
              placeholder="Enter provisional diagnosis..."
              className="min-h-[80px] resize-vertical print:border-gray-400"
            />
          </div>

          {/* Surgery plans and Doctor name */}
          <div className="space-y-2">
            <Label className="text-lg font-semibold text-gray-800">Surgery plans and Doctor name:</Label>
            <Textarea
              value={formData.surgery_plans_doctor}
              onChange={(e) => handleInputChange('surgery_plans_doctor', e.target.value)}
              placeholder="Enter surgery plans and doctor name..."
              className="min-h-[80px] resize-vertical print:border-gray-400"
            />
          </div>

          {/* Footer Information - Signature Table */}
          <div className="border-t border-gray-300 pt-4 mt-6">
            <Label className="text-sm font-semibold text-gray-700 mb-3 block">Signature</Label>

            {/* Table Structure */}
            <div className="signature-table border border-gray-300 rounded-lg overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-4 bg-gray-100 border-b border-gray-300">
                <div className="p-2 border-r border-gray-300">
                  <p className="text-xs font-semibold text-gray-700">Signature</p>
                </div>
                <div className="p-2 border-r border-gray-300">
                  <p className="text-xs font-semibold text-gray-700">Name of Doctor</p>
                </div>
                <div className="p-2 border-r border-gray-300">
                  <p className="text-xs font-semibold text-gray-700">Review</p>
                </div>
                <div className="p-2">
                  <p className="text-xs font-semibold text-gray-700">Date and Time</p>
                </div>
              </div>

              {/* Table Data Row */}
              <div className="grid grid-cols-4 bg-white">
                <div className="p-2 border-r border-gray-300 flex items-center">
                  <div className="border-b border-gray-400 h-8 w-full"></div>
                </div>
                <div className="p-2 border-r border-gray-300">
                  <Input
                    value={formData.doctor_signature}
                    onChange={(e) => handleInputChange('doctor_signature', e.target.value)}
                    placeholder="Enter doctor name..."
                    className="border-0 p-1 h-8 text-sm focus:ring-0 print:border-none print:bg-transparent"
                  />
                </div>
                <div className="p-2 border-r border-gray-300">
                  <Input
                    value={formData.review}
                    onChange={(e) => handleInputChange('review', e.target.value)}
                    placeholder="N/A"
                    className="border-0 p-1 h-8 text-sm focus:ring-0 print:border-none print:bg-transparent"
                  />
                </div>
                <div className="p-2">
                  <p className="text-xs text-gray-700">{formatDate(new Date().toISOString())}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Date: {formatDate(new Date().toISOString())}
                  </p>
                  <p className="text-xs text-gray-600">
                    Time: {new Date().toLocaleTimeString('en-IN')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Print-only Hospital Header */}
      <style>
        {`
          @media print {
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
              font-size: 9pt;
            }

            @page {
              size: A4;
              margin: 0.5cm 0.7cm;
            }

            /* Hide screen elements */
            button, .print\\:hidden {
              display: none !important;
            }

            /* Page container */
            .container {
              max-width: 100%;
              padding: 0;
            }

            /* Card styling */
            .shadow-lg {
              box-shadow: none !important;
              border: 2px solid #000;
            }

            /* Header */
            .bg-gradient-to-r {
              background: white !important;
              border-bottom: 2px solid #000;
              padding: 5px !important;
            }

            /* Patient info box */
            .bg-gray-50 {
              background: white !important;
              border: 1px solid #000 !important;
              padding: 5px !important;
              margin-bottom: 5px;
              display: grid !important;
              grid-template-columns: 1fr 1fr 1fr !important;
              gap: 2px 10px !important;
            }

            /* Patient info items */
            .bg-gray-50 > div {
              display: block !important;
            }

            .bg-gray-50 > div label {
              font-size: 7pt !important;
              font-weight: 600 !important;
              color: #333 !important;
              display: block !important;
              margin-bottom: 0px !important;
            }

            .bg-gray-50 > div p {
              font-size: 8pt !important;
              color: #000 !important;
              margin: 0 !important;
            }

            /* Section labels */
            label {
              font-weight: 600 !important;
              color: #000 !important;
              font-size: 9pt !important;
            }

            /* All textareas compact for print */
            textarea {
              border: 1px solid #000 !important;
              min-height: 35px !important;
              max-height: 35px !important;
              overflow: hidden !important;
              background: white !important;
              line-height: 1.2em !important;
              padding: 3px 6px !important;
              font-size: 9pt !important;
            }

            /* Input fields */
            input {
              border: none !important;
              border-bottom: 1px solid #000 !important;
              padding: 2px 5px !important;
              background: transparent !important;
            }

            /* Footer input field specific */
            .border-t input {
              border: none !important;
              padding: 0 !important;
              font-size: 9pt !important;
            }

            /* Section spacing */
            .space-y-2 > * + *, .space-y-3 > * + *, .space-y-4 > * + *, .space-y-6 > * + * {
              margin-top: 2px !important;
            }

            /* Footer section */
            .border-t {
              border-top: 2px solid #000 !important;
              margin-top: 6px !important;
              padding-top: 4px !important;
            }

            /* Footer grid */
            .grid-cols-2 {
              display: grid !important;
              grid-template-columns: 1fr 1fr !important;
              gap: 4px !important;
            }

            .grid-cols-3 {
              display: grid !important;
              grid-template-columns: 1fr 1fr !important;
              gap: 4px !important;
            }

            /* Signature Table for Print */
            .signature-table {
              border: 1px solid #000 !important;
              border-radius: 0 !important;
              overflow: visible !important;
              margin-top: 4px !important;
            }

            .grid-cols-4 {
              display: grid !important;
              grid-template-columns: 1fr 2fr 1.5fr 2fr !important;
              gap: 0 !important;
            }

            .grid-cols-4 > div {
              border-right: 1px solid #000 !important;
              padding: 3px 5px !important;
            }

            .grid-cols-4 > div:last-child {
              border-right: none !important;
            }

            .signature-table .bg-gray-100 {
              background: #f5f5f5 !important;
              border-bottom: 1px solid #000 !important;
            }

            .signature-table .bg-gray-100 p {
              font-size: 8pt !important;
              font-weight: 700 !important;
              margin: 0 !important;
            }

            .signature-table .bg-white {
              background: white !important;
            }

            .signature-table input {
              border: none !important;
              padding: 0 !important;
              font-size: 8pt !important;
              background: transparent !important;
            }

            .signature-table p {
              font-size: 7pt !important;
              margin: 1px 0 !important;
            }

            /* Signature line */
            .border-b {
              border-bottom: 1px solid #000 !important;
            }

            /* Signature area height */
            .h-8 {
              height: 15px !important;
            }

            .h-12 {
              height: 20px !important;
            }

            /* Footer spacing */
            .space-y-3 > * + * {
              margin-top: 2px !important;
            }

            /* Text sizing for print */
            .text-sm {
              font-size: 8pt !important;
            }

            .text-xs {
              font-size: 7pt !important;
            }

            /* Remove extra margins */
            .mb-6, .mt-6 {
              margin: 0 !important;
            }

            /* Card content padding */
            .p-6 {
              padding: 6px !important;
            }

            /* Hide review section in print */
            .print\\:hidden {
              display: none !important;
            }

            /* Show footer in print */
            .print\\:block {
              display: block !important;
            }

            /* Footer input in print */
            .print\\:border-none {
              border: none !important;
            }

            .print\\:bg-transparent {
              background: transparent !important;
            }

            .print\\:h-6 {
              height: 15px !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default AdmissionNotes;
