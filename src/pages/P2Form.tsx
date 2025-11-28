import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Save, Printer, Download, Plus, Trash2, ChevronsLeft, ChevronsRight, RefreshCw, FileText, Edit, MoreHorizontal } from 'lucide-react';

interface P2FormData {
  visitId: string;
  claimId: string;
  patientName: string;
  ageSex: string;
  contactNo: string;
  dateOfReferral: string;
  dateOfAdmission: string;
  address: string;
  diagnosis: string;
  conditionAtDischarge: string;
  treatmentProcedure: string;
  billDate: string;
  packageProcedures: Array<{
    srNo: string;
    chargeableProcedure: string;
    cdisCode: string;
    otherCode: string;
    rate: string;
    date: string;
    amountClaimed: string;
    amountSubmitted: string;
    remarks: string;
  }>;
  nonPackageProcedures: Array<{
    srNo: string;
    chargeableProcedure: string;
    amountClaimed: string;
    amountSubmitted: string;
    remarks: string;
    code?: string;
    description?: string;
    unit?: string;
    esicRate?: string;
    hospRate?: string;
    totalAmt?: string;
  }>;
  additionalProcedures: Array<{
    srNo: string;
    chargeableProcedure: string;
    cdisCode: string;
    otherCode: string;
    rate: string;
    date: string;
    amountClaimed: string;
    amountSubmitted: string;
    remarks: string;
  }>;
  totalAmountClaimed: string;
  totalAmountAdmitted: string;
}

const initialFormData: P2FormData = {
  visitId: '',
  claimId: 'H20230000',
  patientName: 'usa',
  ageSex: '25 / male',
  contactNo: '9172740454',
  dateOfReferral: '2025-06-25',
  dateOfAdmission: '2025-06-20',
  address: 'Kamtee Road',
  diagnosis: 'Abdominal Injury - Blunt',
  conditionAtDischarge: 'From condition at discharge',
  treatmentProcedure: 'From treatment/procedure details',
  billDate: '2025-08-26',
  packageProcedures: [],
  nonPackageProcedures: [],
  additionalProcedures: [],
  totalAmountClaimed: '0.00',
  totalAmountAdmitted: '0.00'
};

export default function P2Form() {
  const { visitId } = useParams<{ visitId: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<P2FormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);
  const [search, setSearch] = useState('');
  const [isLoadingSurgeries, setIsLoadingSurgeries] = useState(false);

  useEffect(() => {
    if (visitId) {
      setFormData(prev => ({ ...prev, visitId }));
      fetchVisitSurgeries(visitId);
    }
  }, [visitId]);

  const fetchVisitSurgeries = async (visitId: string) => {
    try {
      setIsLoadingSurgeries(true);
      console.log('Fetching surgeries for visitId:', visitId);
      
      // First, find the visit by visit_id to get the UUID
      const { data: visit, error: visitError } = await supabase
        .from('visits')
        .select('id')
        .eq('visit_id', visitId)
        .single();

      if (visitError) {
        console.error('Error finding visit:', visitError);
        toast.error('Visit not found');
        return;
      }

      console.log('Found visit UUID:', visit.id);
      
      // Now fetch visit surgeries using the UUID
      const { data: visitSurgeries, error: surgeriesError } = await supabase
        .from('visit_surgeries')
        .select(`
          id,
          surgery_id,
          status,
          sanction_status,
          notes,
          created_at
        `)
        .eq('visit_id', visit.id);

      if (surgeriesError) {
        console.error('Error fetching visit surgeries:', surgeriesError);
        toast.error('Failed to fetch surgeries');
        return;
      }

      console.log('Fetched visit surgeries:', visitSurgeries);

      if (visitSurgeries && visitSurgeries.length > 0) {
        // Get unique surgery IDs
        const surgeryIds = [...new Set(visitSurgeries.map(vs => vs.surgery_id).filter(Boolean))];
        
        // Fetch surgery details separately
        let surgeryDetails = {};
        if (surgeryIds.length > 0) {
          const { data: surgeries, error: surgeryError } = await supabase
            .from('cghs_surgery')
            .select(`
              id,
              code,
              name,
              "Procedure_Name",
              "Non_NABH_NABL_Rate",
              "NABH_NABL_Rate"
            `)
            .in('id', surgeryIds);

          if (surgeryError) {
            console.error('Error fetching surgery details:', surgeryError);
            // Continue without surgery details
          } else {
            surgeryDetails = surgeries.reduce((acc, surgery) => {
              acc[surgery.id] = surgery;
              return acc;
            }, {});
          }
        }

        const packageProcedures = visitSurgeries.map((vs: any, index: number) => {
          const surgery = surgeryDetails[vs.surgery_id];
          
          // Format date properly for HTML date input (YYYY-MM-DD)
          let formattedDate = '';
          if (vs.created_at) {
            const date = new Date(vs.created_at);
            formattedDate = date.toISOString().split('T')[0];
          }
          
          return {
            srNo: (index + 1).toString(),
            chargeableProcedure: surgery?.name || surgery?.Procedure_Name || 'Unknown Procedure',
            cdisCode: surgery?.code || '',
            otherCode: '',
            rate: surgery?.Non_NABH_NABL_Rate?.toString() || surgery?.NABH_NABL_Rate?.toString() || '',
            date: formattedDate,
            amountClaimed: surgery?.Non_NABH_NABL_Rate?.toString() || surgery?.NABH_NABL_Rate?.toString() || '',
            amountSubmitted: surgery?.Non_NABH_NABL_Rate?.toString() || surgery?.NABH_NABL_Rate?.toString() || '',
            remarks: `${vs.status || 'Unknown'} | ${vs.sanction_status || 'Unknown'}${vs.notes ? ' | ' + vs.notes : ''}`
          };
        });

        setFormData(prev => ({
          ...prev,
          packageProcedures: packageProcedures
        }));

        toast.success(`${visitSurgeries.length} surgeries loaded successfully`);
      } else {
        console.log('No surgeries found for visitId:', visitId);
        toast.info('No surgeries found for this visit');
      }
    } catch (error) {
      console.error('Error in fetchVisitSurgeries:', error);
      toast.error('Failed to fetch surgeries');
    } finally {
      setIsLoadingSurgeries(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePackageProcedureChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      packageProcedures: prev.packageProcedures.map((proc, i) =>
        i === index ? { ...proc, [field]: value } : proc
      )
    }));
  };

  const addPackageProcedure = () => {
    setFormData(prev => ({
      ...prev,
      packageProcedures: [...prev.packageProcedures, {
        srNo: (prev.packageProcedures.length + 1).toString(),
        chargeableProcedure: '',
        cdisCode: '',
        otherCode: '',
        rate: '',
        date: '',
        amountClaimed: '',
        amountSubmitted: '',
        remarks: ''
      }]
    }));
  };

  const removePackageProcedure = (index: number) => {
    setFormData(prev => ({
      ...prev,
      packageProcedures: prev.packageProcedures.filter((_, i) => i !== index)
    }));
  };

  const handleNonPackageProcedureChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      nonPackageProcedures: prev.nonPackageProcedures.map((proc, i) =>
        i === index ? { ...proc, [field]: value } : proc
      )
    }));
  };

  const addNonPackageProcedure = () => {
    setFormData(prev => ({
      ...prev,
      nonPackageProcedures: [...prev.nonPackageProcedures, {
        srNo: (prev.nonPackageProcedures.length + 1).toString(),
        chargeableProcedure: '',
        amountClaimed: '',
        amountSubmitted: '',
        remarks: ''
      }]
    }));
  };

  const removeNonPackageProcedure = (index: number) => {
    setFormData(prev => ({
      ...prev,
      nonPackageProcedures: prev.nonPackageProcedures.filter((_, i) => i !== index)
    }));
  };

  const handleAdditionalProcedureChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      additionalProcedures: prev.additionalProcedures.map((proc, i) =>
        i === index ? { ...proc, [field]: value } : proc
      )
    }));
  };

  const addAdditionalProcedure = () => {
    setFormData(prev => ({
      ...prev,
      additionalProcedures: [...prev.additionalProcedures, {
        srNo: (prev.additionalProcedures.length + 1).toString(),
        chargeableProcedure: '',
        cdisCode: '',
        otherCode: '',
        rate: '',
        date: '',
        amountClaimed: '',
        amountSubmitted: '',
        remarks: ''
      }]
    }));
  };

  const removeAdditionalProcedure = (index: number) => {
    setFormData(prev => ({
      ...prev,
      additionalProcedures: prev.additionalProcedures.filter((_, i) => i !== index)
    }));
  };



  const saveForm = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('p2_forms')
        .upsert({
          visit_id: visitId,
          ...formData
        });

      if (error) throw error;
      toast.success('P2Form saved successfully!');
    } catch (error) {
      console.error('Error saving form:', error);
      toast.error('Failed to save form');
    } finally {
      setIsLoading(false);
    }
  };

  const printForm = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Individual Bill Format</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px; }
              .section { margin-bottom: 25px; }
              .section-title { font-weight: bold; font-size: 16px; margin-bottom: 15px; text-decoration: underline; }
              table { width: 100%; border-collapse: collapse; margin: 15px 0; }
              th, td { border: 1px solid #000; padding: 10px; text-align: left; vertical-align: top; }
              th { background-color: #f0f0f0; font-weight: bold; }
              .field { margin-bottom: 12px; }
              .field-label { font-weight: bold; display: inline-block; min-width: 200px; }
              .field-value { margin-left: 10px; }
              .underline { border-bottom: 1px solid #000; display: inline-block; min-width: 300px; }
              .financial-summary { background-color: #f9f9f9; padding: 15px; border: 1px solid #ccc; margin: 20px 0; }
              .remarks-section { margin: 20px 0; }
              .signature-section { margin: 30px 0; }
              .checklist { margin: 20px 0; }
              .checklist ol { margin-left: 20px; }
              .checklist li { margin-bottom: 8px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>INDIVIDUAL BILL FORMAT</h1>
            </div>
            
            <div class="section">
              <div class="field">
                <span class="field-label">CLAIM ID:</span>
                <span class="field-value">${formData.claimId}</span>
              </div>
              <div class="field">
                <span class="field-label">Bill Date:</span>
                <span class="field-value">${formData.billDate}</span>
              </div>
              <div class="field">
                <span class="field-label">Name of Patient:</span>
                <span class="field-value">${formData.patientName}</span>
              </div>
              <div class="field">
                <span class="field-label">Age / Sex:</span>
                <span class="field-value">${formData.ageSex}</span>
              </div>
              <div class="field">
                <span class="field-label">Address:</span>
                <span class="field-value">${formData.address}</span>
              </div>
              <div class="field">
                <span class="field-label">Contact No.:</span>
                <span class="field-value">${formData.contactNo}</span>
              </div>
              <div class="field">
                <span class="field-label">Date of Referral:</span>
                <span class="field-value">${formData.dateOfReferral}</span>
              </div>
              <div class="field">
                <span class="field-label">Diagnosis:</span>
                <span class="field-value">${formData.diagnosis}</span>
              </div>
              <div class="field">
                <span class="field-label">Date of Admission:</span>
                <span class="field-value">${formData.dateOfAdmission}</span>
              </div>
              <div class="field">
                <span class="field-label">Condition of the patient at discharge:</span>
                <span class="field-value">${formData.conditionAtDischarge}</span>
              </div>
              <div class="field">
                <span class="field-label">(For package Rates)</span>
              </div>
              <div class="field">
                <span class="field-label">Treatment / Procedure done / performed:</span>
                <span class="field-value">${formData.treatmentProcedure}</span>
              </div>
            </div>

            <div class="section">
              <div class="section-title">I. Existing in the package rate list (CGHS/Other Code No/Nos for Chargeable procedures)</div>
              <table>
                <thead>
                  <tr>
                    <th>Sr. No.</th>
                    <th>Chargeable Procedures</th>
                    <th>CGHS Code</th>
                    <th>Other Code</th>
                    <th>Rate</th>
                    <th>Amount Claimed<br>with Date</th>
                    <th>Amount Admitted<br>with Date(X)</th>
                    <th>Remarks X</th>
                  </tr>
                </thead>
                <tbody>
                  ${formData.packageProcedures.length > 0 ? formData.packageProcedures.map(proc => `
                    <tr>
                      <td>${proc.srNo}</td>
                      <td>${proc.chargeableProcedure}</td>
                      <td>${proc.cdisCode}</td>
                      <td>${proc.otherCode || ''}</td>
                      <td>${proc.rate || ''}</td>
                      <td>${proc.amountClaimed}</td>
                      <td>${proc.amountSubmitted}</td>
                      <td>${proc.remarks}</td>
                    </tr>
                  `).join('') : '<tr><td colspan="8" style="text-align: center; padding: 20px;">No package procedures found</td></tr>'}
                </tbody>
              </table>
            </div>



            <div class="section">
              <div class="section-title">II. (Non-Package Rates) For Procedures done (Not existing in the list of Package)</div>
              <table>
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Chargeable Procedure</th>
                    <th>Amt claimed with date</th>
                    <th>Amount Admitted with date(X)</th>
                    <th>Remarks(X)</th>
                  </tr>
                </thead>
                <tbody>
                  ${formData.nonPackageProcedures.length > 0 ? formData.nonPackageProcedures.map(proc => `
                    <tr>
                      <td>${proc.srNo}</td>
                      <td>${proc.chargeableProcedure}</td>
                      <td>${proc.amountClaimed}</td>
                      <td>${proc.amountSubmitted}</td>
                      <td>${proc.remarks}</td>
                    </tr>
                  `).join('') : '<tr><td colspan="5" style="text-align: center; padding: 20px;">No non-package procedures found</td></tr>'}
                </tbody>
              </table>
            </div>

            <div class="section">
              <div class="section-title">III. Additional Procedure done with rationale and documented permission</div>
              <table>
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Chargeable Procedure</th>
                    <th>CGHS Code no. with page no.1</th>
                    <th>Other if not on (1)<br/>Prescribed code no<br/>with page no</th>
                    <th>Rate</th>
                    <th>Amt Claimed with date</th>
                    <th>Amount Submitted with date(₹)</th>
                    <th>Remarks(*)</th>
                  </tr>
                </thead>
                <tbody>
                  ${formData.additionalProcedures.length > 0 ? formData.additionalProcedures.map(proc => `
                    <tr>
                      <td>${proc.srNo}</td>
                      <td>${proc.chargeableProcedure}</td>
                      <td>${proc.cdisCode}</td>
                      <td>${proc.otherCode || ''}</td>
                      <td>${proc.rate || ''}</td>
                      <td>${proc.amountClaimed}</td>
                      <td>${proc.amountSubmitted}</td>
                      <td>${proc.remarks}</td>
                    </tr>
                  `).join('') : '<tr><td colspan="8" style="text-align: center; padding: 20px;">No additional procedures found</td></tr>'}
                </tbody>
              </table>
            </div>

            <div class="financial-summary">
              <div class="field">
                <span class="field-label">Total Amount Claimed (I + II + III):</span>
                <span class="field-value">Rs. ${calculateTotalAmount()}/-</span>
              </div>
              <div class="field">
                <span class="field-label">Total Amount Admitted (X) (I + II + III):</span>
                <span class="field-value">Rs. ${calculateTotalAmount()}/-</span>
              </div>
            </div>

            <div class="remarks-section">
              <div class="section-title">Remarks:</div>
              <p>Certified that the treatment/procedure has been done performed as per laid down norms and the charges in the bill has/have been claimed as per the terms & conditions laid down in the agreement signed with ESIC.</p>
              <p>Further certified that the treatment/procedure have been performed on cashless basis. No money has been received/demanded/charged from the patient/his/her relative.</p>
            </div>

            <div class="signature-section">
              <div class="field">
                <span class="field-label">Patient Signature:</span>
                <span class="field-value">Sign/Thumb impression of patient with date</span>
              </div>
              <div style="margin: 20px 0;">
                <span class="underline">_________________</span> <span style="margin-left: 20px;">Date: <span class="underline">_________________</span></span>
              </div>
              
              <div class="field">
                <span class="field-label">Authorized Signatory:</span>
                <span class="field-value">Sign & stamp of Authorized Signatory with Date</span>
              </div>
              <div style="margin: 20px 0;">
                <span class="underline">_________________</span> <span style="margin-left: 20px;">Date: <span class="underline">_________________</span></span>
              </div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <strong>(The official use of ESIC)</strong>
            </div>

            <div class="field">
              <span class="field-label">Total Amt Payable:</span>
              <span class="underline">_________________</span>
            </div>
            <div class="field">
              <span class="field-label">Date of payment:</span>
              <span class="underline">_________________</span>
            </div>
            <div class="field">
              <span class="field-label">Signature of Dealing Assistant:</span>
              <span class="underline">_________________</span>
              <span style="margin-left: 20px;">Signature of Superintendent: <span class="underline">_________________</span></span>
            </div>
            <div class="field">
              <span class="field-label">Date:</span>
              <span class="underline">_________________</span>
              <span style="margin-left: 20px;">Signature of ESIC Competent Authority: <span class="underline">_________________</span></span>
            </div>
            <div style="text-align: center; margin: 10px 0;">
              <strong>(MB/BMC/BBMC)</strong>
            </div>

            <div class="checklist">
              <div class="section-title">Required Documents/Checklist:</div>
              <ol>
                <li>Discharge slip containing treatment summary & detailed treatment record.</li>
                <li>Bill(s) of Implant(s)/stent(s)/device along with pouch/packet/invoice etc.</li>
                <li>Photocopies of referral proforma, Insurance card/photo ID card of IP/referral, recommendation of medical officer, & entitlement certificate. Approval letter from BMC/BBMC in case of emergency treatment or additional procedure performed.</li>
                <li>Sign & stamp of Authorised Signatory.</li>
                <li>Patient/attendant satisfaction certificate.</li>
                <li>Document in favour of permission taken for additional procedure/treatment or Investigation.</li>
              </ol>
            </div>

            <div class="checklist">
              <div class="section-title">(X) To be filled by ESIC Officials.</div>
              <p>Photocopy of duly filled format to be sent to Tie-up Hospital and original to be kept in record by ESIC while informing Tie-up Hospital about approval of claim.</p>
              
              <div class="section-title">Checklist</div>
              <ol>
                <li>Investigation Report of each Individual/Pt.</li>
                <li>Copy of Referral Document of each Individual/Pt.</li>
                <li>Serialization of individual bill as per the Br. No. in the bill.</li>
              </ol>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const downloadForm = () => {
    const element = document.createElement('a');
    const file = new Blob([JSON.stringify(formData, null, 2)], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    element.download = `p2form-${visitId}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const applyLabData = () => {
    const fetchedData = (document.getElementById('fetchedPatientData') as HTMLTextAreaElement)?.value;
    if (!fetchedData) {
      toast.error('No data to apply.');
      return;
    }

    try {
      // Parse the lab data from the textarea
      const lines = fetchedData.split('\n').filter(line => line.trim());
      const labProcedures = [];
      
      // Try to detect the data format and parse accordingly
      let currentProcedure = null;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip empty lines
        if (!line) continue;
        
        // Check if this line contains a procedure description (starts with Lab -, Proc -, etc.)
        if (line.startsWith('Lab -') || line.startsWith('Proc -') || line.startsWith('Radio.')) {
          // If we have a previous procedure, save it
          if (currentProcedure) {
            labProcedures.push(currentProcedure);
          }
          
          // Start new procedure
          currentProcedure = {
            srNo: (labProcedures.length + 1).toString(),
            chargeableProcedure: line,
            amountClaimed: '',
            amountSubmitted: '',
            remarks: '',
            code: '',
            description: line,
            unit: '',
            esicRate: '',
            hospRate: '',
            totalAmt: ''
          };
        } else if (currentProcedure && !isNaN(parseFloat(line))) {
          // This is a number, try to assign it to the current procedure
          const num = parseFloat(line);
          
          if (!currentProcedure.unit) {
            currentProcedure.unit = num.toString();
          } else if (!currentProcedure.esicRate) {
            currentProcedure.esicRate = num.toString();
          } else if (!currentProcedure.hospRate) {
            currentProcedure.hospRate = num.toString();
          } else if (!currentProcedure.totalAmt) {
            currentProcedure.totalAmt = num.toString();
            currentProcedure.amountClaimed = num.toString();
            currentProcedure.amountSubmitted = num.toString();
          }
        }
      }
      
      // Add the last procedure if exists
      if (currentProcedure) {
        labProcedures.push(currentProcedure);
      }
      
      // If no procedures found with the above method, try alternative parsing
      if (labProcedures.length === 0) {
        // Try to parse as single line format
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line || line.toLowerCase().includes('code') || line.toLowerCase().includes('description')) {
            continue;
          }
          
          const parts = line.split(/\s+/);
          if (parts.length >= 6) {
            const code = parts[0];
            const description = parts.slice(1, -4).join(' ');
            const unit = parts[parts.length - 4];
            const esicRate = parts[parts.length - 3];
            const hospRate = parts[parts.length - 2];
            const totalAmt = parts[parts.length - 1];
            
            if (code && description && !isNaN(parseFloat(unit)) && !isNaN(parseFloat(esicRate))) {
              // Calculate total: Unit × ESIC Rate
              const calculatedTotal = (parseFloat(unit) * parseFloat(esicRate)).toFixed(2);
              
              labProcedures.push({
                srNo: (labProcedures.length + 1).toString(),
                chargeableProcedure: `${code} - ${description}`,
                amountClaimed: calculatedTotal, // Use calculated total
                amountSubmitted: calculatedTotal, // Use calculated total
                remarks: `Code: ${code}, Unit: ${unit}, ESIC: ${esicRate}, Hosp: ${hospRate}, Calculation: ${unit} × ${esicRate} = ${calculatedTotal}`,
                code: code,
                description: description,
                unit: unit,
                esicRate: esicRate, // ESIC Rate fetched from data
                hospRate: hospRate,
                totalAmt: calculatedTotal
              });
            }
          }
        }
      }
      
      if (labProcedures.length > 0) {
        // Clear existing data and add new data
        setFormData(prev => ({
          ...prev,
          nonPackageProcedures: labProcedures
        }));
        toast.success(`${labProcedures.length} procedures added with ESIC rates!`);
      } else {
        toast.error('No valid procedures found in the data. Please check the data format.');
      }
    } catch (error) {
      console.error('Error parsing lab data:', error);
      toast.error('Failed to parse lab data.');
    }
  };

  const calculateSectionITotal = () => {
    const total = formData.packageProcedures.reduce((sum, proc) => {
      const amount = parseFloat(proc.amountClaimed || '0');
      return sum + amount;
    }, 0);
    return total.toFixed(2);
  };

  const calculateSectionIITotal = () => {
    const total = formData.nonPackageProcedures.reduce((sum, proc) => {
      const amount = parseFloat(proc.totalAmt || proc.amountClaimed || '0');
      return sum + amount;
    }, 0);
    return total.toFixed(2);
  };

  const calculateSectionIIITotal = () => {
    const total = formData.additionalProcedures.reduce((sum, proc) => {
      const amount = parseFloat(proc.amountClaimed || '0');
      return sum + amount;
    }, 0);
    return total.toFixed(2);
  };

  const calculateTotalAmount = () => {
    const sectionI = parseFloat(calculateSectionITotal());
    const sectionII = parseFloat(calculateSectionIITotal());
    const sectionIII = parseFloat(calculateSectionIIITotal());
    return (sectionI + sectionII + sectionIII).toFixed(2);
  };

  const clearNonPackageTable = () => {
    setFormData(prev => ({
      ...prev,
      nonPackageProcedures: []
    }));
    toast.success('Non-package procedures table cleared!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Loading P2Form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-4">
      <div className="mx-auto max-w-[1400px]">
        {/* Header */}
        <header className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)} title="Go back">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <h1 className="text-xl font-semibold tracking-tight">P2Form - Individual Bill Format</h1>
            <span className="text-sm text-neutral-600">• {formData.patientName} (Visit ID: {visitId})</span>
          </div>
          <div className="text-sm text-neutral-500">Preview and print-ready page</div>
        </header>

        <div className={`grid gap-4 ${isLeftCollapsed ? 'md:grid-cols-2' : 'grid-cols-1 lg:grid-cols-3'}`}>
          {/* Center: Main Form Content */}
          <section className={`rounded-xl bg-white p-6 border ${isLeftCollapsed ? 'lg:col-span-2' : 'lg:col-span-2'}`}>
            {/* Action Buttons */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button onClick={saveForm} disabled={isLoading}>
                  <Save className="h-4 w-4 mr-1" /> Save
                </Button>
                <Button variant="outline" onClick={printForm}>
                  <Printer className="h-4 w-4 mr-1" /> Print
                </Button>
                <Button variant="outline" onClick={downloadForm}>
                  <Download className="h-4 w-4 mr-1" /> Download
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="billDate" className="text-sm font-medium text-gray-700">Bill Date:</Label>
                <Input
                  id="billDate"
                  type="date"
                  value={formData.billDate}
                  onChange={(e) => handleInputChange('billDate', e.target.value)}
                  className="w-40"
                />
              </div>
            </div>

            <h2 className="text-xl font-semibold text-gray-800 mb-6">Individual Bill Format</h2>

            {/* Patient and Admission Information */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Patient and Admission Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <Label className="w-32 text-sm font-medium text-gray-700">CLAIM ID:</Label>
                  <Input
                    value={formData.claimId}
                    onChange={(e) => handleInputChange('claimId', e.target.value)}
                    className="flex-1"
                  />
                </div>
                <div className="flex items-center">
                  <Label className="w-32 text-sm font-medium text-gray-700">Name of Patient:</Label>
                  <Input
                    value={formData.patientName}
                    onChange={(e) => handleInputChange('patientName', e.target.value)}
                    className="flex-1"
                  />
                </div>
                <div className="flex items-center">
                  <Label className="w-32 text-sm font-medium text-gray-700">Age / Sex:</Label>
                  <Input
                    value={formData.ageSex}
                    onChange={(e) => handleInputChange('ageSex', e.target.value)}
                    className="flex-1"
                  />
                </div>
                <div className="flex items-center">
                  <Label className="w-32 text-sm font-medium text-gray-700">Contact No.:</Label>
                  <Input
                    value={formData.contactNo}
                    onChange={(e) => handleInputChange('contactNo', e.target.value)}
                    className="flex-1"
                  />
                </div>
                <div className="flex items-center">
                  <Label className="w-32 text-sm font-medium text-gray-700">Date of Referral:</Label>
                  <Input
                    type="date"
                    value={formData.dateOfReferral}
                    onChange={(e) => handleInputChange('dateOfReferral', e.target.value)}
                    className="flex-1"
                  />
                </div>
                <div className="flex items-center">
                  <Label className="w-32 text-sm font-medium text-gray-700">Date of Admission:</Label>
                  <Input
                    type="date"
                    value={formData.dateOfAdmission}
                    onChange={(e) => handleInputChange('dateOfAdmission', e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="mt-4 space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Address:</Label>
                  <Textarea
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    rows={3}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Diagnosis:</Label>
                  <Textarea
                    value={formData.diagnosis}
                    onChange={(e) => handleInputChange('diagnosis', e.target.value)}
                    rows={3}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Condition of the patient at discharge:</Label>
                  <Textarea
                    value={formData.conditionAtDischarge}
                    onChange={(e) => handleInputChange('conditionAtDischarge', e.target.value)}
                    rows={3}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Treatment / Procedure done / performed:</Label>
                  <Textarea
                    value={formData.treatmentProcedure}
                    onChange={(e) => handleInputChange('treatmentProcedure', e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Package Procedures */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">I. Package Rates For Procedures done (Existing in the list of Packages)</h3>
                <div className="flex items-center gap-2">
                  {isLoadingSurgeries && <RefreshCw className="h-4 w-4 animate-spin" />}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => visitId && fetchVisitSurgeries(visitId)}
                    disabled={isLoadingSurgeries}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Load Surgeries
                  </Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Sr. no.</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Chargeable Procedures</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">CGHS Code</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Other Code</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Rate</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">AmountClaimed with Date</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Amount Admitted with Date(X)</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Remarks X</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.packageProcedures.map((proc, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 px-3 py-2">
                          <Input
                            value={proc.srNo}
                            onChange={(e) => handlePackageProcedureChange(index, 'srNo', e.target.value)}
                            className="w-16"
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          <Input
                            value={proc.chargeableProcedure}
                            onChange={(e) => handlePackageProcedureChange(index, 'chargeableProcedure', e.target.value)}
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          <Input
                            value={proc.cdisCode}
                            onChange={(e) => handlePackageProcedureChange(index, 'cdisCode', e.target.value)}
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          <Input
                            value={proc.otherCode || ''}
                            onChange={(e) => handlePackageProcedureChange(index, 'otherCode', e.target.value)}
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          <Textarea
                            value={proc.rate || ''}
                            onChange={(e) => handlePackageProcedureChange(index, 'rate', e.target.value)}
                            className="min-h-[80px] resize-y"
                            placeholder="Enter rate"
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          <Textarea
                            value={proc.amountClaimed}
                            onChange={(e) => handlePackageProcedureChange(index, 'amountClaimed', e.target.value)}
                            className="min-h-[80px] resize-y"
                            placeholder="Enter amount claimed"
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          <Textarea
                            value={proc.amountSubmitted}
                            onChange={(e) => handlePackageProcedureChange(index, 'amountSubmitted', e.target.value)}
                            className="min-h-[80px] resize-y"
                            placeholder="Enter amount admitted"
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          <Input
                            value={proc.remarks}
                            onChange={(e) => handlePackageProcedureChange(index, 'remarks', e.target.value)}
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removePackageProcedure(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {formData.packageProcedures.length === 0 && !isLoadingSurgeries && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No surgeries found for this visit</p>
                  <p className="text-xs mb-4">Click "Load Surgeries" to fetch from database or add manually</p>
                  {visitId && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchVisitSurgeries(visitId)}
                      className="mx-auto"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Load Surgeries
                    </Button>
                  )}
                </div>
              )}
              
              <div className="flex gap-2 mt-2">
                <Button onClick={addPackageProcedure} className="mt-2">
                  <Plus className="h-4 w-4 mr-1" /> Add Package Procedure
                </Button>
                {formData.packageProcedures.length > 0 && (
                  <Button 
                    variant="outline" 
                    onClick={() => setFormData(prev => ({ ...prev, packageProcedures: [] }))}
                    className="mt-2"
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Clear All
                  </Button>
                )}
              </div>
            </div>



            {/* Non-Package Procedures */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">II. Non - Package Rates For Procedures done (Not existing in the list of Packages)</h3>
              

              
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700 w-16">Code</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700 w-80">Description</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700 w-20">Unit</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700 w-32">ESIC Rate (Rs)</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700 w-32">Hosp Rate (Rs)</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700 w-32">Total Amt</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700 w-20">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.nonPackageProcedures.map((proc, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 px-3 py-2">
                          <Input
                            value={proc.code || proc.srNo}
                            onChange={(e) => handleNonPackageProcedureChange(index, 'code', e.target.value)}
                            className="w-16"
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          <Input
                            value={proc.description || proc.chargeableProcedure}
                            onChange={(e) => handleNonPackageProcedureChange(index, 'description', e.target.value)}
                            className="w-80"
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          <Input
                            value={proc.unit}
                            onChange={(e) => handleNonPackageProcedureChange(index, 'unit', e.target.value)}
                            className="w-20"
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          <Input
                            value={proc.esicRate}
                            onChange={(e) => handleNonPackageProcedureChange(index, 'esicRate', e.target.value)}
                            className="w-32"
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          <Input
                            value={proc.hospRate}
                            onChange={(e) => handleNonPackageProcedureChange(index, 'hospRate', e.target.value)}
                            className="w-32"
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          <Input
                            value={proc.totalAmt || proc.amountClaimed}
                            onChange={(e) => handleNonPackageProcedureChange(index, 'totalAmt', e.target.value)}
                            className="w-32"
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeNonPackageProcedure(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button onClick={addNonPackageProcedure} className="mt-2">
                <Plus className="h-4 w-4 mr-1" /> Add Non-Package Procedure
              </Button>
              <Button onClick={clearNonPackageTable} className="mt-2 ml-2 bg-red-600 hover:bg-red-700">
                <Trash2 className="h-4 w-4 mr-1" /> Clear Non-Package Table
              </Button>
            </div>

            {/* Additional Procedures */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">III. Additional Procedure done with rationale and documented permission</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">S.No</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Chargeable Procedure</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">CGHS Code no. with page no.1</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Other if not on (1)<br/>Prescribed code no<br/>with page no</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Rate</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Amt claimed with date</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Amount Submitted with date(₹)</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Remarks(*)</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.additionalProcedures.map((proc, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 px-3 py-2">
                          <Input
                            value={proc.srNo}
                            onChange={(e) => handleAdditionalProcedureChange(index, 'srNo', e.target.value)}
                            className="w-16"
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          <Input
                            value={proc.chargeableProcedure}
                            onChange={(e) => handleAdditionalProcedureChange(index, 'chargeableProcedure', e.target.value)}
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          <Input
                            value={proc.cdisCode}
                            onChange={(e) => handleAdditionalProcedureChange(index, 'cdisCode', e.target.value)}
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          <Input
                            value={proc.otherCode}
                            onChange={(e) => handleAdditionalProcedureChange(index, 'otherCode', e.target.value)}
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          <Input
                            value={proc.rate}
                            onChange={(e) => handleAdditionalProcedureChange(index, 'rate', e.target.value)}
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          <Input
                            value={proc.amountClaimed}
                            onChange={(e) => handleAdditionalProcedureChange(index, 'amountClaimed', e.target.value)}
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          <Input
                            value={proc.amountSubmitted}
                            onChange={(e) => handleAdditionalProcedureChange(index, 'amountSubmitted', e.target.value)}
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          <Input
                            value={proc.remarks}
                            onChange={(e) => handleAdditionalProcedureChange(index, 'remarks', e.target.value)}
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeAdditionalProcedure(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button onClick={addAdditionalProcedure} className="mt-2">
                <Plus className="h-4 w-4 mr-1" /> Add Additional Procedure
              </Button>
            </div>

            {/* Summary of Charges */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Summary of Charges</h3>
              
              {/* Section Breakdown */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-md font-semibold text-gray-700 mb-3">Section-wise Breakdown:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-white rounded border">
                    <div className="text-sm font-medium text-gray-600">Section I</div>
                    <div className="text-lg font-bold text-blue-600">₹{calculateSectionITotal()}</div>
                    <div className="text-xs text-gray-500">Package Procedures</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded border">
                    <div className="text-sm font-medium text-gray-600">Section II</div>
                    <div className="text-lg font-bold text-green-600">₹{calculateSectionIITotal()}</div>
                    <div className="text-xs text-gray-500">Non-Package Procedures</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded border">
                    <div className="text-sm font-medium text-gray-600">Section III</div>
                    <div className="text-lg font-bold text-purple-600">₹{calculateSectionIIITotal()}</div>
                    <div className="text-xs text-gray-500">Additional Procedures</div>
                  </div>
                </div>
              </div>

              {/* Total Amounts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="totalAmountClaimed" className="text-sm font-medium text-gray-700">
                    Total Amount Claimed (I + II + III):
                  </Label>
                  <Input
                    id="totalAmountClaimed"
                    value={`₹${calculateTotalAmount()}/-`}
                    readOnly
                    className="bg-gray-50 font-semibold"
                    placeholder="Auto-calculated from Total Amt"
                  />
                </div>
                <div>
                  <Label htmlFor="totalAmountAdmitted" className="text-sm font-medium text-gray-700">
                    Total Amount Admitted (X) (I + II + III):
                  </Label>
                  <Input
                    id="totalAmountAdmitted"
                    value={`₹${calculateTotalAmount()}/-`}
                    readOnly
                    className="bg-gray-50 font-semibold"
                    placeholder="Auto-calculated from Total Amt"
                  />
                </div>
              </div>
              
              <div className="mt-3 p-3 bg-blue-50 rounded border">
                <div className="text-sm text-gray-700">
                  <strong>Summary:</strong> Section I: ₹{calculateSectionITotal()} + Section II: ₹{calculateSectionIITotal()} + Section III: ₹{calculateSectionIIITotal()} = <strong>₹{calculateTotalAmount()}/-</strong>
                </div>
              </div>
            </div>
          </section>

          {/* Right: Data Panel */}
          {!isRightCollapsed && (
            <section className="rounded-xl bg-white p-3 border">
              <div className="mb-3 flex items-center gap-2">
                <h4 className="text-sm font-medium text-gray-700">Fetched Patient Data</h4>
                <Button size="icon" variant="ghost" title="Collapse data panel" onClick={() => setIsRightCollapsed(true)}>
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="mb-4">
                <div className="flex gap-2 mb-2">
                  <Button size="sm" variant="default">Real</Button>
                  <Button size="sm" variant="outline">
                    <RefreshCw className="h-3 w-3 mr-1" /> Refresh
                  </Button>
                  <Button size="sm" variant="outline">Test Fetch</Button>
                  <Button size="sm" variant="outline">Create Sample</Button>
                </div>
                
                <div className="bg-gray-50 p-3 rounded border">
                  <Textarea
                    placeholder="Enter data in format: code description unit esic hosp total"
                    className="w-full h-64 text-xs font-mono"
                    rows={15}
                    id="fetchedPatientData"
                    defaultValue={`3 Proc - Dressings of wounds 3 300 300 900
1600 Lab - Arterial Colour Doppler 2 830 830 1660
1608 Lab - Chest PA view (one film) 1 230 230 230
1444 Lab - Blood Glucose Random 36 24 24 864
1394 Lab - Complete Haemogram/CBC, Hb,RBC count and indices,TLC, DLC, Platelet, ESR, Peripheral smear examination 12 135 135 1620
1513 Lab - Kidney Function Test (KFT) 12 203 203 2436
1424 Lab - Liver Function Test (LFT) 12 203 203 2436
1425 Lab - Hepatitis B surface antigen (HBsAg) 1 92 92 92
1426 Lab - Hepatitis C virus (HCV) 1 128 128 128
1459 Lab - Human immunodeficiency virus- HIV I and II 1 150 150 150
1492 Lab - C-reactive Protein (CRP) Quantitative 6 144 144 864
1518 Lab - Prothrombin Time (PT) 1 99 99 99
1552 Lab - Vitamin B12 assay. 1 250 250 250
1510 Lab - Calcidiol / 25-hydroxycholecalciferol / Vitamin D3 assay (Vit D3) 1 495 495 495
1514 Lab - Glycosylated Haemoglobin (HbA1c) 1 130 130 130
1392 Lab - Lipid Profile. (Total cholesterol, LDL, HDL, Triglycerides) 1 200 200 200
1559 Lab - Erythrocyte Sedimentation Rate (ESR) 1 25 25 25
- Lab - T3, T4, TSH 1 200 200 200
0 Radio. - 0 0 0 0`}
                  />
                </div>
                <div className="mt-3">
                  <Button 
                    onClick={applyLabData} 
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    Apply Lab Data to Table
                  </Button>
                  <Button 
                    onClick={clearNonPackageTable} 
                    className="w-full mt-2 bg-red-600 hover:bg-red-700"
                  >
                    Clear Table
                  </Button>
                </div>
                
                <p className="text-xs text-gray-600 mt-2">
                  Real patient data fetched from database. You can edit the JSON and click Apply, then Re-merge to update the form.
                </p>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
