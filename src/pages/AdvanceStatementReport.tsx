import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, FileText, Search, Download, Printer } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import '@/styles/print.css';

const AdvanceStatementReport = () => {
  const navigate = useNavigate();
  const { hospitalConfig, hospitalType } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL-persisted state
  const searchTerm = searchParams.get('search') || '';
  const dateFrom = searchParams.get('from') || '';
  const dateTo = searchParams.get('to') || '';
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  // Helper to update URL params
  const updateParams = (updates: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });
    setSearchParams(newParams, { replace: true });
  };

  // Setter functions
  const setSearchTerm = (value: string) => updateParams({ search: value });
  const setDateFrom = (value: string) => updateParams({ from: value });
  const setDateTo = (value: string) => updateParams({ to: value });

  // Financial data for print report
  const [billsData, setBillsData] = useState<Record<string, number>>({});
  const [advancePaymentsData, setAdvancePaymentsData] = useState<Record<string, { totalAdvance: number; lastPayment: { amount: number; date: string | null } }>>({});

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('🔍 Setting debounced search term:', searchTerm);
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch advance statement data
  const { data: allData = [], isLoading } = useQuery({
    queryKey: ['advance-statement-report-currently-admitted', hospitalConfig?.name, debouncedSearchTerm, dateFrom, dateTo],
    queryFn: async () => {
      console.log('🏥 Fetching advance statement data for hospital:', hospitalConfig?.name);
      console.log('🔍 Search params:', { debouncedSearchTerm, dateFrom, dateTo });

      let query = supabase
        .from('visits')
        .select(`
          id,
          visit_id,
          visit_date,
          status,
          created_at,
          admission_date,
          discharge_date,
          file_status,
          ward_allotted,
          room_allotted,
          comments,
          patients!inner (
            id,
            name,
            patients_id,
            age,
            gender,
            insurance_person_no,
            hospital_name,
            corporate
          ),
          visit_diagnoses (
            diagnoses (
              id,
              name
            )
          ),
          visit_surgeries (
            cghs_surgery (
              id,
              name,
              code,
              category,
              cost,
              NABH_NABL_Rate,
              Non_NABH_NABL_Rate
            )
          )
        `)
        .not('admission_date', 'is', null) // Only get visits with admission date
        .is('discharge_date', null) // Only get visits WITHOUT discharge date (currently admitted)
        .eq('patient_type', 'IPD'); // Only IPD patients (match Currently Admitted Patients)

      // Apply hospital filter if hospitalConfig exists
      if (hospitalConfig?.name) {
        query = query.eq('patients.hospital_name', hospitalConfig.name);
        console.log('🏥 Applied hospital filter for:', hospitalConfig.name);
      }

      // Remove search filter from query - we'll filter on frontend
      // if (debouncedSearchTerm) {
      //   console.log('🔍 Applying search filter:', debouncedSearchTerm);
      //   query = query.or(`visit_id.ilike.%${debouncedSearchTerm}%,patients.name.ilike.%${debouncedSearchTerm}%,patients.patients_id.ilike.%${debouncedSearchTerm}%`);
      // }

      // Apply date filters using admission_date instead of visit_date
      if (dateFrom) {
        query = query.gte('admission_date', dateFrom);
      }
      if (dateTo) {
        query = query.lte('admission_date', dateTo);
      }

      query = query
        .order('admission_date', { ascending: false });
      // Removed limit to show all currently admitted patients

      console.log('🔍 Final query before execution:', query);
      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching advance statement data:', error);
        console.error('Error details:', error.message, error.details, error.hint);
        console.error('Search term that caused error:', debouncedSearchTerm);
        throw error;
      }

      console.log(`✅ Fetched ${data?.length || 0} advance statement records for hospital: ${hospitalConfig?.name}`);
      console.log('Sample data:', data?.[0]);
      console.log('🔍 Query filters applied: admission_date not null, discharge_date is null, patient_type = IPD, hospital_name =', hospitalConfig?.name);
      console.log('🔍 Date filters: from:', dateFrom, 'to:', dateTo);
      console.log('🔍 Raw data length:', data?.length || 0);

      // Fetch room_management data for ward types
      const wardIds = data
        ?.map(visit => visit.ward_allotted)
        .filter((id): id is string => id !== null && id !== undefined) || [];

      const uniqueWardIds = Array.from(new Set(wardIds));

      let wardMapping: Record<string, string> = {};

      if (uniqueWardIds.length > 0) {
        const { data: wardData, error: wardError } = await supabase
          .from('room_management')
          .select('ward_id, ward_type')
          .in('ward_id', uniqueWardIds);

        if (wardError) {
          console.error('Error fetching ward data:', wardError);
        } else if (wardData) {
          // Create a mapping of ward_id to ward_type
          wardMapping = wardData.reduce((acc, ward) => {
            acc[ward.ward_id] = ward.ward_type;
            return acc;
          }, {} as Record<string, string>);
        }
      }

      // Merge ward data with visits
      const visitsWithRoomInfo = data?.map(visit => ({
        ...visit,
        room_management: visit.ward_allotted && wardMapping[visit.ward_allotted]
          ? { ward_type: wardMapping[visit.ward_allotted] }
          : null
      })) || [];

      return visitsWithRoomInfo;
    },
  });

  // Filter data on frontend for search
  const filteredData = allData.filter(item => {
    if (!debouncedSearchTerm) return true;

    const searchLower = debouncedSearchTerm.toLowerCase();
    const patient = item.patients;

    return (
      item.visit_id?.toLowerCase().includes(searchLower) ||
      patient?.name?.toLowerCase().includes(searchLower) ||
      patient?.patients_id?.toLowerCase().includes(searchLower)
    );
  });

  const advanceData = filteredData;

  // Fetch financial data for print report (bills and advance payments)
  useEffect(() => {
    const fetchFinancialData = async () => {
      if (!advanceData || advanceData.length === 0) return;

      const visitIds = advanceData.map(v => v.visit_id).filter(Boolean) as string[];
      const patientIds = advanceData.map(v => v.patients?.id).filter(Boolean) as string[];

      if (visitIds.length === 0) return;

      try {
        // Fetch bills data
        const { data: bills, error: billsError } = await supabase
          .from('bills')
          .select('patient_id, total_amount')
          .in('patient_id', patientIds);

        if (billsError) {
          console.error('Error fetching bills:', billsError);
        } else if (bills) {
          const billMap: Record<string, number> = {};
          bills.forEach((bill: { patient_id: string; total_amount: number | null }) => {
            if (bill.patient_id) {
              billMap[bill.patient_id] = (billMap[bill.patient_id] || 0) + (bill.total_amount || 0);
            }
          });
          setBillsData(billMap);
        }

        // Fetch advance payments data
        const { data: advances, error: advancesError } = await supabase
          .from('advance_payment')
          .select('visit_id, advance_amount, payment_date')
          .in('visit_id', visitIds)
          .order('payment_date', { ascending: false });

        if (advancesError) {
          console.error('Error fetching advance payments:', advancesError);
        } else if (advances) {
          const advanceMap: Record<string, { totalAdvance: number; lastPayment: { amount: number; date: string | null } }> = {};

          advances.forEach((payment: { visit_id: string; advance_amount: number; payment_date: string | null }) => {
            if (payment.visit_id) {
              if (!advanceMap[payment.visit_id]) {
                advanceMap[payment.visit_id] = {
                  totalAdvance: 0,
                  lastPayment: { amount: payment.advance_amount || 0, date: payment.payment_date }
                };
              }
              advanceMap[payment.visit_id].totalAdvance += (payment.advance_amount || 0);
            }
          });
          setAdvancePaymentsData(advanceMap);
        }
      } catch (error) {
        console.error('Error fetching financial data:', error);
      }
    };

    fetchFinancialData();
  }, [advanceData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const handlePrint = () => {
    // Create a print container with only the data
    const printWindow = window.open('', '', 'width=800,height=600');
    
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Advance Statement Report</title>
          <style>
            @media print {
              body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
              h1 { font-size: 18px; margin-bottom: 20px; text-align: center; }
              h2 { font-size: 16px; margin: 15px 0 10px 0; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th, td { border: 1px solid #000; padding: 8px; text-align: left; vertical-align: top; font-size: 12px; }
              th { background-color: #f5f5f5; font-weight: bold; }
              .patient-details { margin-bottom: 5px; }
              .diagnosis-item { background-color: #f0f8ff; padding: 4px; margin: 2px 0; border-radius: 3px; display: inline-block; }
              .surgery-item { background-color: #f0fff0; padding: 4px; margin: 2px 0; border-radius: 3px; }
              .stats { display: flex; justify-content: space-around; margin: 20px 0; }
              .stat-item { text-align: center; }
              .stat-number { font-size: 20px; font-weight: bold; }
              .stat-label { font-size: 12px; color: #666; }
            }
            @media screen {
              body { margin: 20px; font-family: Arial, sans-serif; }
              h1 { text-align: center; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; vertical-align: top; }
              th { background-color: #f5f5f5; }
            }
          </style>
        </head>
        <body>
          <h1>Advance Statement Report - Currently Admitted Patients</h1>
          <p style="text-align: center; margin-bottom: 20px;">Currently admitted patients with diagnosis, and planned surgery procedures with costs</p>
          
          <div class="stats">
            <div class="stat-item">
              <div class="stat-number">${advanceData.length}</div>
              <div class="stat-label">Currently Admitted</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">${advanceData.filter(item => item.visit_diagnoses && item.visit_diagnoses.length > 0).length}</div>
              <div class="stat-label">Patients with Diagnosis</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">${advanceData.reduce((sum, item) => sum + (item.visit_surgeries?.length || 0), 0)}</div>
              <div class="stat-label">Planned Surgeries</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">${new Set(advanceData.flatMap(item => item.visit_surgeries?.map(vs => vs.cghs_surgery?.category).filter(Boolean) || [])).size}</div>
              <div class="stat-label">Surgery Categories</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 3%;">Sr.</th>
                <th style="width: 12%;">Patient Details</th>
                ${hospitalType === 'hope' ? '<th style="width: 6%;">Corporate</th>' : ''}
                <th style="width: 6%;">Room/Bed</th>
                <th style="width: 6%;">Admission</th>
                <th style="width: 10%;">Diagnosis</th>
                <th style="width: 12%;">Surgery/Procedure</th>
                <th style="width: 7%;">Total Bill</th>
                <th style="width: 7%;">Advance</th>
                <th style="width: 9%;">Last Payment</th>
                <th style="width: 7%;">Balance</th>
                <th style="width: 7%;">Ask to Pay</th>
                <th style="width: 8%;">Remark</th>
              </tr>
            </thead>
            <tbody>
              ${advanceData.map((item, index) => {
                const patient = item.patients;
                const patientDetailsText = `
                  <div class="patient-details">
                    <strong>${patient?.name || 'N/A'}</strong><br/>
                    Visit ID: ${item.visit_id || 'N/A'} | Patient ID: ${patient?.patients_id || 'N/A'}<br/>
                    Age: ${patient?.age || 'N/A'} | Sex: ${patient?.gender || 'N/A'}${patient?.insurance_person_no ? `<br/>Insurance: ${patient.insurance_person_no}` : ''}
                  </div>
                `;

                const diagnoses = item.visit_diagnoses?.map(vd => vd.diagnoses?.name).filter(Boolean) || [];
                const diagnosisText = diagnoses.length > 0 ? 
                  diagnoses.map(diagnosis => `<div class="diagnosis-item">${diagnosis}</div>`).join('') : 
                  'No diagnosis recorded';

                const surgeries = item.visit_surgeries?.map(vs => vs.cghs_surgery ? {
                  name: vs.cghs_surgery.name,
                  code: vs.cghs_surgery.code,
                  category: vs.cghs_surgery.category,
                  cost: vs.cghs_surgery.cost,
                  NABH_NABL_Rate: vs.cghs_surgery.NABH_NABL_Rate,
                  Non_NABH_NABL_Rate: vs.cghs_surgery.Non_NABH_NABL_Rate
                } : null).filter(Boolean) || [];

                const surgeryText = surgeries.length > 0 ?
                  surgeries.map(surgery => {
                    let costInfo = '';
                    if (surgery.cost || surgery.NABH_NABL_Rate || surgery.Non_NABH_NABL_Rate) {
                      costInfo = '<br/><span style="color: #16a34a; font-size: 11px;">';
                      if (surgery.cost) costInfo += `Cost: ₹${surgery.cost} `;
                      if (surgery.NABH_NABL_Rate) costInfo += `| NABH/NABL: ₹${surgery.NABH_NABL_Rate} `;
                      if (surgery.Non_NABH_NABL_Rate) costInfo += `| Non-NABH/NABL: ₹${surgery.Non_NABH_NABL_Rate}`;
                      costInfo += '</span>';
                    }
                    return `<div class="surgery-item"><strong>${surgery.name}</strong><br/>Code: ${surgery.code} | Category: ${surgery.category}${costInfo}</div>`;
                  }).join('') :
                  'No surgery planned';

                // Room/Bed text
                const roomBedText = item.room_management?.ward_type && item.room_allotted
                  ? `<strong>${item.room_management.ward_type}</strong><br/>Room ${item.room_allotted}`
                  : 'Not Assigned';

                // Admission date text
                const admissionDateText = item.admission_date
                  ? format(new Date(item.admission_date), 'dd/MM/yyyy')
                  : 'N/A';

                // Corporate type text - single indigo color
                const corporateText = patient?.corporate || 'N/A';
                const corporateColor = patient?.corporate ? '#4f46e5' : '#6b7280'; // indigo-600 or gray

                // Financial calculations
                const patientId = patient?.id || '';
                const visitId = item.visit_id || '';
                const totalBill = billsData[patientId] || 0;
                const advanceInfo = advancePaymentsData[visitId] || { totalAdvance: 0, lastPayment: { amount: 0, date: null } };
                const advanceTillDate = advanceInfo.totalAdvance;
                const lastPayment = advanceInfo.lastPayment;
                const balance = totalBill - advanceTillDate;
                const askToPay = balance > 0 ? balance : 0;
                const remark = item.comments || '';

                // Format last payment text
                const lastPaymentText = lastPayment.amount > 0
                  ? `₹${lastPayment.amount.toLocaleString('en-IN')}${lastPayment.date ? '<br/>' + format(new Date(lastPayment.date), 'dd/MM/yyyy') : ''}`
                  : '-';

                return `
                  <tr>
                    <td style="text-align: center;">${index + 1}</td>
                    <td>${patientDetailsText}</td>
                    ${hospitalType === 'hope' ? `<td style="text-align: center;"><strong style="color: ${corporateColor};">${corporateText}</strong></td>` : ''}
                    <td>${roomBedText}</td>
                    <td style="text-align: center;">${admissionDateText}</td>
                    <td>${diagnosisText}</td>
                    <td>${surgeryText}</td>
                    <td style="text-align: right; font-weight: bold;">₹${totalBill.toLocaleString('en-IN')}</td>
                    <td style="text-align: right; color: #16a34a;">₹${advanceTillDate.toLocaleString('en-IN')}</td>
                    <td style="text-align: center; font-size: 11px;">${lastPaymentText}</td>
                    <td style="text-align: right; color: ${balance > 0 ? '#dc2626' : '#16a34a'}; font-weight: bold;">₹${balance.toLocaleString('en-IN')}</td>
                    <td style="text-align: right; color: #ea580c; font-weight: bold;">₹${askToPay.toLocaleString('en-IN')}</td>
                    <td style="font-size: 11px;">${remark || '-'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          
          <div style="margin-top: 30px; text-align: center; font-size: 10px; color: #666;">
            Report generated on ${format(new Date(), 'dd/MM/yyyy HH:mm')}
          </div>
        </body>
      </html>
    `;

    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      
      // Wait for content to load then print
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  const handleExport = () => {
    // Create CSV content
    const headers = ['Sr. No.', 'Patient Details', 'Corporate Type', 'Room/Bed', 'Admission Date', 'Diagnosis', 'Referral Letter', 'Planned Surgery or Procedure and Cost'];
    const csvContent = [
      headers.join(','),
      ...advanceData.map((item, index) => {
        const patient = item.patients;
        const patientDetails = `${patient?.name || 'N/A'} (Visit: ${item.visit_id || 'N/A'}, Patient ID: ${patient?.patients_id || 'N/A'}, Age: ${patient?.age || 'N/A'}, Sex: ${patient?.gender || 'N/A'})`;

        // Room/Bed
        const roomBed = item.room_management?.ward_type && item.room_allotted
          ? `${item.room_management.ward_type} - Room ${item.room_allotted}`
          : 'Not Assigned';

        // Admission Date
        const admissionDate = item.admission_date
          ? format(new Date(item.admission_date), 'dd/MM/yyyy')
          : 'N/A';

        // Corporate Type
        const corporate = patient?.corporate || 'N/A';

        const diagnoses = item.visit_diagnoses?.map(vd => vd.diagnoses?.name).filter(Boolean).join(', ') || 'No diagnosis';
        const surgeries = item.visit_surgeries?.map(vs => {
          if (!vs.cghs_surgery) return null;
          let surgeryInfo = `${vs.cghs_surgery.name} (Code: ${vs.cghs_surgery.code})`;
          const costs = [];
          if (vs.cghs_surgery.cost) costs.push(`Cost: ₹${vs.cghs_surgery.cost}`);
          if (vs.cghs_surgery.NABH_NABL_Rate) costs.push(`NABH/NABL: ₹${vs.cghs_surgery.NABH_NABL_Rate}`);
          if (vs.cghs_surgery.Non_NABH_NABL_Rate) costs.push(`Non-NABH/NABL: ₹${vs.cghs_surgery.Non_NABH_NABL_Rate}`);
          if (costs.length > 0) surgeryInfo += ` [${costs.join(', ')}]`;
          return surgeryInfo;
        }).filter(Boolean).join(', ') || 'No surgery planned';

        // Get Referral Letter status
        const getReferralLetterDisplay = (status: string | null) => {
          switch (status) {
            case 'available': return 'Sanctioned';
            case 'missing': return 'Not Sanction';
            case 'pending': return 'Initiated Sanction';
            default: return 'Not Set';
          }
        };

        const referralLetter = getReferralLetterDisplay(item.file_status);

        return [
          index + 1,
          `"${patientDetails}"`,
          `"${corporate}"`,
          `"${roomBed}"`,
          `"${admissionDate}"`,
          `"${diagnoses}"`,
          `"${referralLetter}"`,
          `"${surgeries}"`
        ].join(',');
      })
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `advance_statement_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 print:bg-white print:p-0">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate('/todays-ipd')}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 print:hidden"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-primary">Advance Statement Report - Currently Admitted</h1>
              <p className="text-muted-foreground">
                Currently admitted patients with diagnosis, and planned surgery procedures with costs
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 print:hidden">
            <Button
              onClick={handlePrint}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Print Report
            </Button>
            <Button
              onClick={handleExport}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm border print:hidden">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by patient name, ID, or visit ID..."
                value={searchTerm}
                onChange={(e) => {
                  console.log('🔍 Search input changed:', e.target.value);
                  setSearchTerm(e.target.value);
                }}
                className="pl-10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">From Date</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">To Date</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => {
                  setSearchTerm('');
                  setDateFrom('');
                  setDateTo('');
                }}
                variant="outline"
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Debug Info - Development Only */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-6">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">Debug Info</h3>
            <div className="text-xs text-yellow-700 space-y-1">
              <p>Raw data count: {allData.length}</p>
              <p>Filtered data count: {advanceData.length}</p>
              <p>Search term: "{debouncedSearchTerm}"</p>
              <p>Date from: {dateFrom || 'None'}</p>
              <p>Date to: {dateTo || 'None'}</p>
              <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-sm font-medium text-gray-500">Currently Admitted</h3>
            <p className="text-2xl font-bold text-primary">{advanceData.length}</p>
            <p className="text-xs text-gray-500">Raw data: {allData.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-sm font-medium text-gray-500">With Diagnosis</h3>
            <p className="text-2xl font-bold text-green-600">
              {advanceData.filter(item =>
                item.visit_diagnoses && item.visit_diagnoses.length > 0
              ).length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-sm font-medium text-gray-500">Planned Surgeries</h3>
            <p className="text-2xl font-bold text-blue-600">
              {advanceData.reduce((sum, item) =>
                sum + (item.visit_surgeries?.length || 0), 0
              )}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-sm font-medium text-gray-500">Surgery Categories</h3>
            <p className="text-2xl font-bold text-purple-600">
              {new Set(
                advanceData.flatMap(item =>
                  item.visit_surgeries?.map(vs => vs.cghs_surgery?.category).filter(Boolean) || []
                )
              ).size}
            </p>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Patient Details with Diagnosis and Surgery Plans</h2>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Sr. No.</TableHead>
                  <TableHead className="min-w-[250px]">Patient Details</TableHead>
                  {hospitalType === 'hope' && (
                    <TableHead className="min-w-[150px]">Corporate Type</TableHead>
                  )}
                  <TableHead className="min-w-[150px]">Room/Bed</TableHead>
                  <TableHead className="min-w-[120px]">Admission Date</TableHead>
                  <TableHead className="min-w-[200px]">Diagnosis</TableHead>
                  <TableHead className="min-w-[300px]">Planned Surgery or Procedure and Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={hospitalType === 'hope' ? 7 : 6} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : advanceData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={hospitalType === 'hope' ? 7 : 6} className="text-center py-8 text-gray-500">
                      No data found
                    </TableCell>
                  </TableRow>
                ) : (
                  advanceData.map((item, index) => {
                    const patient = item.patients;
                    const patientDetails = (
                      <div className="space-y-1">
                        <div className="font-medium">{patient?.name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">
                          Visit ID: {item.visit_id || 'N/A'} | Patient ID: {patient?.patients_id || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          Age: {patient?.age || 'N/A'} | Sex: {patient?.gender || 'N/A'}
                        </div>
                        {patient?.insurance_person_no && (
                          <div className="text-sm text-blue-600">Insurance: {patient.insurance_person_no}</div>
                        )}
                      </div>
                    );

                    const diagnoses = item.visit_diagnoses?.map(vd => vd.diagnoses?.name).filter(Boolean) || [];
                    const diagnosisDisplay = diagnoses.length > 0 ? (
                      <div className="space-y-1">
                        {diagnoses.map((diagnosis, idx) => (
                          <div key={idx} className="text-sm bg-blue-50 px-2 py-1 rounded">{diagnosis}</div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500">No diagnosis recorded</span>
                    );

                    const surgeries = item.visit_surgeries?.map(vs => vs.cghs_surgery ? {
                      name: vs.cghs_surgery.name,
                      code: vs.cghs_surgery.code,
                      category: vs.cghs_surgery.category,
                      cost: vs.cghs_surgery.cost,
                      NABH_NABL_Rate: vs.cghs_surgery.NABH_NABL_Rate,
                      Non_NABH_NABL_Rate: vs.cghs_surgery.Non_NABH_NABL_Rate
                    } : null).filter(Boolean) || [];

                    const surgeryDisplay = surgeries.length > 0 ? (
                      <div className="space-y-2">
                        {surgeries.map((surgery, idx) => (
                          <div key={idx} className="border-l-2 border-green-200 pl-3 bg-green-50 p-2 rounded">
                            <div className="font-medium text-sm">{surgery.name}</div>
                            <div className="text-xs text-gray-600">
                              Code: {surgery.code} | Category: {surgery.category}
                            </div>
                            {(surgery.cost || surgery.NABH_NABL_Rate || surgery.Non_NABH_NABL_Rate) && (
                              <div className="text-xs text-green-700 mt-1 space-y-0.5">
                                {surgery.cost && <div>Cost: ₹{surgery.cost}</div>}
                                {surgery.NABH_NABL_Rate && <div>NABH/NABL Rate: ₹{surgery.NABH_NABL_Rate}</div>}
                                {surgery.Non_NABH_NABL_Rate && <div>Non-NABH/NABL Rate: ₹{surgery.Non_NABH_NABL_Rate}</div>}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500">No surgery planned</span>
                    );

                    // Room/Bed display
                    const roomBedDisplay = item.room_management?.ward_type && item.room_allotted ? (
                      <div className="space-y-1">
                        <div className="font-semibold text-blue-700">{item.room_management.ward_type}</div>
                        <div className="text-sm text-gray-600">Room {item.room_allotted}</div>
                      </div>
                    ) : (
                      <span className="text-gray-500">Not Assigned</span>
                    );

                    // Admission date display
                    const admissionDateDisplay = item.admission_date ? (
                      <span className="text-sm">{format(new Date(item.admission_date), 'dd/MM/yyyy')}</span>
                    ) : (
                      <span className="text-gray-500">N/A</span>
                    );

                    // Corporate type display - single indigo color
                    const corporateDisplay = patient?.corporate ? (
                      <span className="text-sm font-medium text-indigo-600">{patient.corporate}</span>
                    ) : (
                      <span className="text-gray-500">N/A</span>
                    );

                    return (
                      <TableRow key={item.id}>
                        <TableCell className="text-center">{index + 1}</TableCell>
                        <TableCell>{patientDetails}</TableCell>
                        {hospitalType === 'hope' && (
                          <TableCell>{corporateDisplay}</TableCell>
                        )}
                        <TableCell>{roomBedDisplay}</TableCell>
                        <TableCell>{admissionDateDisplay}</TableCell>
                        <TableCell>{diagnosisDisplay}</TableCell>
                        <TableCell>{surgeryDisplay}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvanceStatementReport;
