import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "@/hooks/use-toast";

const DeathCertificate = () => {
  const { visitId } = useParams();
  const navigate = useNavigate();
  const { hospitalConfig } = useAuth();

  // Form state
  const [expiredOn, setExpiredOn] = useState('');
  const [causeOfDeath, setCauseOfDeath] = useState('');
  const [certificateDate, setCertificateDate] = useState('');

  // Fetch patient data
  const { data: patientData, isLoading } = useQuery({
    queryKey: ['death-certificate-data', visitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('visits')
        .select('*, patients(*)')
        .eq('visit_id', visitId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!visitId,
  });

  // Fetch existing death certificate data
  const { data: existingCertificate } = useQuery({
    queryKey: ['existing-death-certificate', patientData?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('death_certificates')
        .select('*')
        .eq('visit_id', patientData?.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!patientData?.id,
  });

  // Pre-populate form with existing data
  useEffect(() => {
    if (existingCertificate) {
      setExpiredOn(existingCertificate.expired_on
        ? new Date(existingCertificate.expired_on).toISOString().slice(0, 16)
        : '');
      setCauseOfDeath(existingCertificate.cause_of_death || '');
      setCertificateDate(existingCertificate.certificate_date
        ? new Date(existingCertificate.certificate_date).toISOString().slice(0, 16)
        : '');
    }
  }, [existingCertificate]);

  // Extract patient info
  const patientName = patientData?.patients?.name || '';
  const patientAddress = patientData?.patients?.address || '';
  const patientAge = patientData?.patients?.age || '';
  const patientSex = patientData?.patients?.sex || '';
  const patientRegId = patientData?.patients?.patients_id || '';
  const consultantName = patientData?.doctor_name || patientData?.appointment_with || '';

  // Format date for display
  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  // Get DOA (Date of Admission)
  const doaDate = patientData?.created_at ? formatDateTime(patientData.created_at) : '';
  // Get DOD (Date of Death) - use expiredOn
  const dodDate = expiredOn ? formatDateTime(expiredOn) : '';

  // Handle Print
  const handlePrint = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Death Certificate - ${patientName}</title>
        <style>
          @page { size: A4; margin: 10mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 10pt; line-height: 1.4; background: #f5f5f5; padding: 20px; }
          .container { max-width: 700px; margin: 0 auto; background: #fff; border: 2px solid #000; padding: 30px 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); display: flex; flex-direction: column; }
          .spacer { flex: 1; }
          .header { text-align: center; margin-bottom: 40px; padding-bottom: 15px; border-bottom: 2px solid #000; }
          .header h1 { font-size: 16pt; font-weight: bold; text-decoration: underline; margin: 0; }
          .info-table { width: 100%; margin-bottom: 15px; border-collapse: collapse; }
          .info-table td { padding: 2px 5px; vertical-align: top; font-size: 10pt; }
          .info-table .label { font-weight: bold; width: 130px; white-space: nowrap; }
          .info-table .value { width: 200px; }
          .info-table .right-label { font-weight: bold; width: 100px; white-space: nowrap; }
          .info-table .right-value { width: auto; }
          .certification { margin: 35px 0 20px 0; line-height: 1.6; font-size: 12pt; }
          .expired-section { margin: 15px 0; font-size: 12pt; }
          .cause-section { margin: 10px 0; font-size: 12pt; }
          .cause-section .cause-label { font-weight: bold; }
          .cause-section .cause-text { margin-top: 3px; text-transform: uppercase; }
          .signature-wrapper { margin-top: 40px; padding: 0; }
          .signature-table { width: 100%; }
          .signature-table td { vertical-align: top; padding: 5px; }
          .signature-table .date-col { width: 10%; vertical-align: top; }
          .signature-table .middle-col { width: 55%; padding-left: 40px; }
          .signature-table .right-col { width: 35%; text-align: right; }
          .received-title { font-weight: bold; margin-bottom: 10px; }
          .field-row { margin: 8px 0; display: flex; align-items: center; }
          .field-label { width: auto; font-size: 10pt; margin-right: 5px; white-space: nowrap; }
          .field-line { flex: 1; border-bottom: 1px solid #000; min-width: 100px; }
          .doctor-name { font-weight: bold; font-size: 10pt; }
          .doctor-details { font-size: 10pt; margin-top: 3px; }
          .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #000; text-align: center; }
          .footer .contact-header { font-weight: bold; margin-bottom: 8px; font-size: 10pt; }
          .footer .urgent { color: #dc2626; font-weight: bold; margin: 5px 0; font-size: 10pt; }
          .footer .phone { color: #dc2626; font-weight: bold; font-size: 10pt; }
          @media print {
            @page { size: A4; margin: 10mm; }
            html, body { height: 100%; margin: 0; padding: 0; }
            body { background: #fff; display: flex; justify-content: center; }
            .container { box-shadow: none; width: auto; border: 2px solid #000 !important; padding: 15mm; margin: 0; display: flex; flex-direction: column; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .spacer { flex: 1; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="spacer"></div>

          <div class="header">
            <h1>DEATH CERTIFICATE</h1>
          </div>

          <table class="info-table">
            <tr>
              <td class="label">Name:</td>
              <td class="value">${patientName}</td>
              <td class="right-label">Reg ID :</td>
              <td class="right-value">${patientRegId}</td>
            </tr>
            <tr>
              <td class="label">Address:</td>
              <td class="value">${patientAddress}</td>
              <td class="right-label">Age/Sex :</td>
              <td class="right-value">${patientAge} Yrs / ${patientSex}</td>
            </tr>
            <tr>
              <td class="label">Treating Consultant:</td>
              <td class="value">${consultantName}</td>
              <td class="right-label">DOA:</td>
              <td class="right-value">${doaDate}</td>
            </tr>
            <tr>
              <td class="label">Other Consultants:</td>
              <td class="value"></td>
              <td class="right-label">DOD:</td>
              <td class="right-value">${dodDate}</td>
            </tr>
            <tr>
              <td class="label">Reason Of Discharge:</td>
              <td class="value">Death</td>
              <td class="right-label">Corporate Type:</td>
              <td class="right-value">Private</td>
            </tr>
          </table>

          <div class="certification">
            <p>This is to certify that <strong>${patientName}</strong>, aged about <strong>${patientAge}Y Yrs.</strong>, residing at ${patientAddress}.</p>
          </div>

          <div class="expired-section">
            <p><strong>Expired on :</strong> ${dodDate}</p>
          </div>

          <div class="cause-section">
            <p><span class="cause-label">Cause of Death:</span> <span class="cause-text">${causeOfDeath}</span></p>
          </div>

          <div class="signature-wrapper">
            <table class="signature-table">
              <tr>
                <td class="date-col">
                  <div style="height: 50px;"></div>
                  <div class="field-row">
                    <span class="field-label" style="font-weight: bold;">Date:</span>
                  </div>
                </td>
                <td class="middle-col">
                  <div class="received-title">Received by</div>
                  <div class="field-row">
                    <span class="field-label">Date Received:</span>
                    <span class="field-line" style="max-width: 150px;"></span>
                  </div>
                  <div class="field-row">
                    <span class="field-label">Sign:</span>
                    <span class="field-line" style="max-width: 120px;"></span>
                  </div>
                  <div class="field-row">
                    <span class="field-label">Name of Relative:</span>
                    <span class="field-line" style="max-width: 130px;"></span>
                  </div>
                  <div class="field-row">
                    <span class="field-label">Relationship with Patient:</span>
                    <span class="field-line" style="max-width: 100px;"></span>
                  </div>
                </td>
                <td class="right-col">
                  <div style="height: 18px;"></div>
                  <div class="doctor-name">Dr. B.K. Murali</div>
                  <div class="doctor-details">MS (Orth.)</div>
                  <div class="doctor-details">Director</div>
                  <div class="doctor-details">Orthopaedic Surgeon</div>
                </td>
              </tr>
            </table>
          </div>

          <div class="spacer"></div>

          <div class="footer">
            <div class="contact-header">==== CONTACT INFORMATION FOR URGENT QUERIES ====</div>
            <div class="urgent">⚠ URGENT CARE/EMERGENCY CARE IS AVAILABLE 24 X 7.</div>
            <div class="phone">📞 PLEASE CONTACT: 7030974619, 9373111709</div>
          </div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
    }
  };

  // Handle Submit
  const handleSubmit = async () => {
    if (!expiredOn) {
      toast({
        title: "Error",
        description: "Please enter the Expired On date",
        variant: "destructive",
      });
      return;
    }

    if (!causeOfDeath) {
      toast({
        title: "Error",
        description: "Please enter the Cause of Death",
        variant: "destructive",
      });
      return;
    }

    try {
      const visitUUID = patientData?.id;
      const patientUUID = patientData?.patients?.id;

      const deathCertData = {
        visit_id: visitUUID,
        patient_id: patientUUID,
        patient_name: patientName,
        registration_id: patientRegId,
        address: patientAddress,
        age_sex: `${patientAge} Year / ${patientSex}`,
        consultant: consultantName,
        expired_on: expiredOn,
        cause_of_death: causeOfDeath,
        certificate_date: certificateDate || null,
        updated_at: new Date().toISOString(),
      };

      // Check if record exists for this visit
      const { data: existingRecord } = await supabase
        .from('death_certificates')
        .select('id')
        .eq('visit_id', visitUUID)
        .maybeSingle();

      if (existingRecord) {
        // Update existing record
        const { error } = await supabase
          .from('death_certificates')
          .update(deathCertData)
          .eq('id', existingRecord.id);

        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('death_certificates')
          .insert(deathCertData);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Death certificate saved successfully!",
      });
    } catch (error) {
      console.error('Error saving death certificate:', error);
      toast({
        title: "Error",
        description: "Failed to save death certificate",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="w-full p-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-full p-6">
      {/* Header */}
      <h1 className="text-2xl font-bold text-red-600 border-b-2 border-red-600 pb-2 mb-6">
        DEATH CERTIFICATE
      </h1>

      {/* Patient Info Grid */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-6">
        <div className="flex">
          <span className="w-24 font-semibold">Name:</span>
          <span>{patientName}</span>
        </div>
        <div className="flex">
          <span className="w-40 font-semibold">Registration ID:</span>
          <span>{patientRegId}</span>
        </div>

        <div className="flex">
          <span className="w-24 font-semibold">Address:</span>
          <span>{patientAddress}</span>
        </div>
        <div className="flex">
          <span className="w-40 font-semibold">Age/Sex:</span>
          <span>{patientAge} Year / {patientSex}</span>
        </div>

        <div className="flex">
          <span className="w-24 font-semibold">Consultant:</span>
          <span>{consultantName}</span>
        </div>
        <div className="flex">
          <span className="w-40 font-semibold">Result Published On:</span>
          <span></span>
        </div>
      </div>

      {/* Certification Text */}
      <p className="mb-6 text-sm">
        This is to certify that <strong>{patientName}</strong> aged about <strong>{patientAge} Yrs.</strong> residing at {patientAddress}
      </p>

      {/* Editable Fields */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Label className="w-24">Expired On*</Label>
          <Input
            type="datetime-local"
            value={expiredOn}
            onChange={(e) => setExpiredOn(e.target.value)}
            className="w-64"
          />
        </div>

        <div>
          <Label className="block mb-2">Cause of Death</Label>
          <Textarea
            rows={5}
            value={causeOfDeath}
            onChange={(e) => setCauseOfDeath(e.target.value)}
            className="w-full"
            placeholder="Enter cause of death..."
          />
        </div>

        <div className="flex items-center gap-2">
          <Label className="w-24">Date:</Label>
          <Input
            type="datetime-local"
            value={certificateDate}
            onChange={(e) => setCertificateDate(e.target.value)}
            className="w-64"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-2 mt-6">
        <Button variant="outline" onClick={handlePrint}>
          Print
        </Button>
        <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
          Submit
        </Button>
        <Button variant="secondary" onClick={() => navigate('/todays-ipd')}>
          Back
        </Button>
      </div>
    </div>
  );
};

export default DeathCertificate;
