import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Loader2, ScanLine, Printer } from 'lucide-react';

interface ScanOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  department?: 'IPD' | 'OPD';
  visit: {
    id: string;
    visit_id: string;
    patient_id?: string;
    appointment_with?: string;
    patients?: {
      id?: string;
      name: string;
      patients_id?: string;
      age?: string | number;
      gender?: string;
    };
  };
}

interface ScanFormData {
  scanType: string;
  procedure: string;
  priority: string;
  clinicalIndication: string;
  clinicalHistory: string;
  notes: string;
  estimatedCost: string;
  isOutsource: boolean;
  outsourceCenter: string;
}

const INITIAL_FORM: ScanFormData = {
  scanType: '',
  procedure: '',
  priority: 'routine',
  clinicalIndication: '',
  clinicalHistory: '',
  notes: '',
  estimatedCost: '',
  isOutsource: false,
  outsourceCenter: '',
};

const SCAN_PROCEDURES: Record<string, string[]> = {
  MRI: [
    'MRI Brain',
    'MRI Brain with Contrast',
    'MRI Spine - Cervical',
    'MRI Spine - Thoracic',
    'MRI Spine - Lumbar',
    'MRI Knee',
    'MRI Shoulder',
    'MRI Hip',
    'MRI Abdomen',
    'MRI Pelvis',
    'MRI Whole Body',
    'MRI Chest',
    'MRI Brachial Plexus',
    'MRI Angiography - Brain',
    'MRI Angiography - Neck',
    'MRI MRCP',
    'MRI Orbit',
    'MRI Wrist / Hand',
    'MRI Ankle / Foot',
    'Other MRI (specify in notes)',
  ],
  'CT Scan': [
    'CT Brain (Plain)',
    'CT Brain with Contrast',
    'CT Brain with Angiography',
    'CT Chest (HRCT)',
    'CT Chest with Contrast',
    'CT Abdomen (Plain)',
    'CT Abdomen with Contrast',
    'CT Abdomen & Pelvis',
    'CT Spine - Cervical',
    'CT Spine - Thoracic',
    'CT Spine - Lumbar',
    'CT KUB',
    'CT Angiography - Coronary (CTCA)',
    'CT Angiography - Peripheral',
    'CT PNS (Sinuses)',
    'CT Neck',
    'CT Pelvis',
    'CT Extremity',
    'CT Whole Body',
    'Other CT Scan (specify in notes)',
  ],
  USG: [
    'USG Abdomen',
    'USG Abdomen & Pelvis',
    'USG Pelvis',
    'USG Obstetric (OB)',
    'USG Transvaginal (TVS)',
    'USG Neck / Thyroid',
    'USG Scrotal',
    'USG Breast',
    'USG KUB',
    'USG Guided Aspiration / Biopsy',
    'USG Soft Tissue',
    'USG Doppler - Venous',
    'USG Doppler - Arterial',
    'USG Doppler - Portal',
    'USG Musculoskeletal',
    'Echocardiography (Echo)',
    'Other USG (specify in notes)',
  ],
  'X-Ray': [
    'X-Ray Chest (PA View)',
    'X-Ray Chest (AP View)',
    'X-Ray Spine - Cervical',
    'X-Ray Spine - Thoracic',
    'X-Ray Spine - Lumbar',
    'X-Ray Pelvis',
    'X-Ray Hip',
    'X-Ray Knee',
    'X-Ray Ankle',
    'X-Ray Shoulder',
    'X-Ray Wrist',
    'X-Ray Hand / Finger',
    'X-Ray Foot',
    'X-Ray Skull',
    'X-Ray PNS (Sinuses)',
    'X-Ray Abdomen (Erect)',
    'X-Ray KUB',
    'Other X-Ray (specify in notes)',
  ],
  'Outsource Scan': [
    'PET CT Scan',
    'PET MRI',
    'Bone Scan (Nuclear Medicine)',
    'DEXA Scan (Bone Density)',
    'Mammography',
    'OPG (Dental Panoramic)',
    'Fluoroscopy',
    'Angiography (DSA)',
    'Myelography',
    'ERCP',
    'Interventional Radiology',
    'Other Outsource (specify in notes)',
  ],
};

const SCAN_TYPE_COLORS: Record<string, string> = {
  MRI: '#7c3aed',
  'CT Scan': '#0369a1',
  USG: '#065f46',
  'X-Ray': '#92400e',
  'Outsource Scan': '#9f1239',
};

const printScanOrder = (
  visit: ScanOrderModalProps['visit'],
  formData: ScanFormData
) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const orderNo = `RAD-${Date.now().toString(36).toUpperCase()}`;
  const priorityLabel = formData.priority === 'stat'
    ? 'STAT (Emergency)'
    : formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1);
  const accentColor = SCAN_TYPE_COLORS[formData.scanType] || '#374151';

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Scan Requisition - ${visit.patients?.name || 'Patient'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: A4; margin: 15mm 15mm 15mm 15mm; }
    body { font-family: Arial, sans-serif; font-size: 11pt; color: #111; background: #fff; }
    .print-btn {
      position: fixed; top: 10px; right: 10px;
      background: ${accentColor}; color: white; border: none;
      padding: 8px 20px; cursor: pointer; font-size: 14px;
      border-radius: 4px; z-index: 1000;
    }
    .header { text-align: center; border-bottom: 2px solid ${accentColor}; padding-bottom: 10px; margin-bottom: 14px; }
    .hospital-name { font-size: 18pt; font-weight: bold; color: ${accentColor}; letter-spacing: 1px; }
    .form-title { font-size: 13pt; font-weight: bold; margin-top: 4px; text-transform: uppercase; letter-spacing: 2px; }
    .order-meta { display: flex; justify-content: space-between; font-size: 9pt; color: #555; margin-top: 6px; }
    .section { margin-bottom: 12px; }
    .section-title { font-size: 9pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;
      color: ${accentColor}; border-bottom: 1px solid #e5e7eb; padding-bottom: 2px; margin-bottom: 8px; }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 20px; }
    .field { margin-bottom: 4px; }
    .field-label { font-size: 8.5pt; color: #555; margin-bottom: 1px; }
    .field-value { font-size: 11pt; font-weight: 600; border-bottom: 1px solid #ccc; padding-bottom: 2px; min-height: 18px; }
    .field-value.block { font-weight: normal; white-space: pre-wrap; min-height: 40px; padding: 4px; border: 1px solid #ccc; border-radius: 3px; font-size: 10pt; }
    .scan-badge { display: inline-block; padding: 3px 14px; border-radius: 4px; font-size: 11pt; font-weight: bold; color: white; background: ${accentColor}; }
    .outsource-tag { display: inline-block; margin-left: 8px; padding: 2px 8px; background: #fee2e2; color: #991b1b; border-radius: 4px; font-size: 9pt; font-weight: bold; }
    .priority-badge { display: inline-block; padding: 2px 12px; border-radius: 12px; font-size: 10pt; font-weight: bold; }
    .priority-routine { background: #d1fae5; color: #065f46; }
    .priority-urgent  { background: #fef3c7; color: #92400e; }
    .priority-stat    { background: #fee2e2; color: #991b1b; }
    .footer { margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .sign-box { border-top: 1px solid #333; padding-top: 4px; text-align: center; font-size: 9pt; color: #555; }
    @media print { .print-btn { display: none !important; } }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">Print</button>

  <div class="header">
    <div class="hospital-name">Hope Hospital</div>
    <div class="form-title">Radiology / Scan Requisition Form</div>
    <div class="order-meta">
      <span>Order No: <strong>${orderNo}</strong></span>
      <span>Date: <strong>${dateStr}</strong> &nbsp; Time: <strong>${timeStr}</strong></span>
      <span>Dept: <strong>IPD</strong></span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Patient Information</div>
    <div class="grid2">
      <div class="field">
        <div class="field-label">Patient Name</div>
        <div class="field-value">${visit.patients?.name || '—'}</div>
      </div>
      <div class="field">
        <div class="field-label">Patient ID / UHID</div>
        <div class="field-value">${visit.patients?.patients_id || '—'}</div>
      </div>
      <div class="field">
        <div class="field-label">Visit ID</div>
        <div class="field-value">${visit.visit_id || '—'}</div>
      </div>
      <div class="field">
        <div class="field-label">Age / Gender</div>
        <div class="field-value">${visit.patients?.age || '—'} / ${visit.patients?.gender || '—'}</div>
      </div>
      <div class="field">
        <div class="field-label">Referring Doctor</div>
        <div class="field-value">${visit.appointment_with || '—'}</div>
      </div>
      <div class="field">
        <div class="field-label">Priority</div>
        <div class="field-value">
          <span class="priority-badge priority-${formData.priority}">${priorityLabel}</span>
        </div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Scan Details</div>
    <div class="field" style="margin-bottom:10px">
      <div class="field-label">Scan Type</div>
      <div class="field-value">
        <span class="scan-badge">${formData.scanType}</span>
        ${formData.isOutsource ? '<span class="outsource-tag">OUTSOURCE</span>' : ''}
      </div>
    </div>
    <div class="field" style="margin-bottom:10px">
      <div class="field-label">Procedure Requested</div>
      <div class="field-value" style="font-size:13pt">${formData.procedure || '—'}</div>
    </div>
    ${formData.isOutsource && formData.outsourceCenter ? `
    <div class="field" style="margin-bottom:10px">
      <div class="field-label">Outsource Center</div>
      <div class="field-value">${formData.outsourceCenter}</div>
    </div>` : ''}
    <div class="field" style="margin-bottom:10px">
      <div class="field-label">Clinical Indication</div>
      <div class="field-value block">${formData.clinicalIndication || '—'}</div>
    </div>
    <div class="field" style="margin-bottom:10px">
      <div class="field-label">Clinical History</div>
      <div class="field-value block">${formData.clinicalHistory || '—'}</div>
    </div>
    ${formData.notes ? `
    <div class="field">
      <div class="field-label">Additional Notes</div>
      <div class="field-value block">${formData.notes}</div>
    </div>` : ''}
    ${formData.estimatedCost ? `
    <div class="field" style="margin-top:6px">
      <div class="field-label">Estimated Cost</div>
      <div class="field-value">₹${parseFloat(formData.estimatedCost).toLocaleString('en-IN')}</div>
    </div>` : ''}
  </div>

  <div class="footer">
    <div class="sign-box">Referring Doctor's Signature</div>
    <div class="sign-box">Radiologist / Technologist</div>
  </div>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
    win.onload = () => win.print();
  } else {
    alert('Please allow pop-ups to print the scan requisition.');
  }
};

export const MriOrderModal: React.FC<ScanOrderModalProps> = ({ isOpen, onClose, visit, department = 'IPD' }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<ScanFormData>(INITIAL_FORM);

  const handleChange = <K extends keyof ScanFormData>(field: K, value: ScanFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const procedureOptions = formData.scanType ? SCAN_PROCEDURES[formData.scanType] ?? [] : [];

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!formData.scanType) throw new Error('Please select a scan type');
      if (!formData.procedure) throw new Error('Please select a procedure');
      if (!formData.clinicalIndication.trim()) throw new Error('Clinical indication is required');

      const orderNumber = `RAD-${Date.now().toString(36).toUpperCase()}`;
      const noteParts = [`visit_id:${visit.visit_id}`, `Type: ${formData.scanType}`, `Procedure: ${formData.procedure}`];
      if (formData.isOutsource && formData.outsourceCenter) noteParts.push(`Outsource: ${formData.outsourceCenter}`);
      if (formData.notes.trim()) noteParts.push(formData.notes.trim());

      // Get patient_id from either visit.patient_id or visit.patients.id
      const patientId = visit.patient_id || visit.patients?.id;

      const payload = {
        patient_id: patientId || null,
        ordering_physician: visit.appointment_with || null,
        ordering_department: department,
        priority: formData.priority,
        clinical_indication: formData.clinicalIndication.trim(),
        clinical_history: formData.clinicalHistory.trim() || null,
        notes: noteParts.join('. '),
        estimated_cost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : null,
        status: 'Ordered',
        order_number: orderNumber,
      };

      const { data, error } = await supabase.from('radiology_orders').insert([payload]).select();
      if (error) {
        throw new Error(`Failed to save scan order: ${error.message || 'Unknown error'}`);
      }
      return data;
    },
    onSuccess: () => {
      const patientId = visit.patient_id || visit.patients?.id;
      toast({ title: 'Scan Order Created', description: `${formData.scanType} order for ${visit.patients?.name} submitted successfully.` });
      // Invalidate the radiology orders query with the correct patient ID
      queryClient.invalidateQueries({ queryKey: ['radiology-orders', patientId] });
      queryClient.invalidateQueries({ queryKey: ['radiology-orders'] });
      setFormData(INITIAL_FORM);
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error Creating Scan Order',
        description: error.message || 'Failed to create scan order',
        variant: 'destructive',
        duration: 10000 // Show for 10 seconds
      });
    },
  });

  const handleClose = () => {
    setFormData(INITIAL_FORM);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="h-5 w-5 text-purple-600" />
            New Scan / Radiology Order
          </DialogTitle>
          <div className="text-sm text-muted-foreground mt-1">
            Patient: <span className="font-semibold text-foreground">{visit.patients?.name || 'N/A'}</span>
            {visit.patients?.patients_id && (
              <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">
                {visit.patients.patients_id}
              </span>
            )}
            <span className="ml-2">| Visit: <span className="font-mono">{visit.visit_id}</span></span>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Scan Type */}
          <div>
            <Label htmlFor="scanType">Scan Type <span className="text-red-500">*</span></Label>
            <Select
              value={formData.scanType}
              onValueChange={(v) => { handleChange('scanType', v); handleChange('procedure', ''); }}
            >
              <SelectTrigger className="mt-1" id="scanType">
                <SelectValue placeholder="Select scan type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MRI">MRI</SelectItem>
                <SelectItem value="CT Scan">CT Scan</SelectItem>
                <SelectItem value="USG">USG (Ultrasound)</SelectItem>
                <SelectItem value="X-Ray">X-Ray</SelectItem>
                <SelectItem value="Outsource Scan">Outsource Scan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Procedure */}
          {formData.scanType && (
            <div>
              <Label htmlFor="procedure">Procedure <span className="text-red-500">*</span></Label>
              <Select value={formData.procedure} onValueChange={(v) => handleChange('procedure', v)}>
                <SelectTrigger className="mt-1" id="procedure">
                  <SelectValue placeholder="Select procedure" />
                </SelectTrigger>
                <SelectContent>
                  {procedureOptions.map((proc) => (
                    <SelectItem key={proc} value={proc}>{proc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Outsource toggle + center name */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isOutsource"
              checked={formData.isOutsource}
              onChange={(e) => handleChange('isOutsource', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="isOutsource" className="cursor-pointer">Outsource (send to external center)</Label>
          </div>
          {formData.isOutsource && (
            <div>
              <Label htmlFor="outsourceCenter">Outsource Center Name</Label>
              <Input
                id="outsourceCenter"
                className="mt-1"
                placeholder="e.g., City Diagnostics, Apollo Imaging"
                value={formData.outsourceCenter}
                onChange={(e) => handleChange('outsourceCenter', e.target.value)}
              />
            </div>
          )}

          {/* Priority */}
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select value={formData.priority} onValueChange={(v) => handleChange('priority', v)}>
              <SelectTrigger className="mt-1" id="priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="routine">Routine</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="stat">Stat (Emergency)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clinical Indication */}
          <div>
            <Label htmlFor="clinicalIndication">Clinical Indication <span className="text-red-500">*</span></Label>
            <Textarea
              id="clinicalIndication"
              className="mt-1 min-h-[70px]"
              placeholder="Reason for scan (e.g., headache, abdominal pain, post-op evaluation...)"
              value={formData.clinicalIndication}
              onChange={(e) => handleChange('clinicalIndication', e.target.value)}
            />
          </div>

          {/* Clinical History */}
          <div>
            <Label htmlFor="clinicalHistory">Clinical History (optional)</Label>
            <Textarea
              id="clinicalHistory"
              className="mt-1 min-h-[60px]"
              placeholder="Relevant past history, medications, allergies..."
              value={formData.clinicalHistory}
              onChange={(e) => handleChange('clinicalHistory', e.target.value)}
            />
          </div>

          {/* Notes + Cost */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="notes">Additional Notes (optional)</Label>
              <Input
                id="notes"
                className="mt-1"
                placeholder="Any special instructions"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="estimatedCost">Estimated Cost (₹, optional)</Label>
              <Input
                id="estimatedCost"
                type="number"
                className="mt-1"
                placeholder="0"
                min={0}
                value={formData.estimatedCost}
                onChange={(e) => handleChange('estimatedCost', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => printScanOrder(visit, formData)}
            disabled={!formData.scanType || !formData.procedure}
            title="Print scan requisition slip"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose} disabled={submitMutation.isPending}>
              Cancel
            </Button>
            <Button
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {submitMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ScanLine className="h-4 w-4 mr-2" />
              )}
              Submit Order
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MriOrderModal;
