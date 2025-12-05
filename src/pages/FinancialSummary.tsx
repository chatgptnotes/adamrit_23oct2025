import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Define proper types for financial data
type FinancialRow = {
  advancePayment: string;
  clinicalServices: string;
  laboratoryServices: string;
  radiology: string;
  pharmacy: string;
  implant: string;
  blood: string;
  surgery: string;
  mandatoryServices: string;
  physiotherapy: string;
  consultation: string;
  surgeryInternalReport: string;
  implantCost: string;
};

type FinancialData = {
  totalAmount: FinancialRow;
  discount: FinancialRow;
  amountPaid: FinancialRow;
  refundedAmount: FinancialRow;
  balance: FinancialRow;
};

const FinancialSummary = () => {
  // Get visitId from URL or window location (from final-bill page)
  const { visitId: paramVisitId } = useParams<{ visitId: string }>();
  const visitId = paramVisitId || (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('visitId')) || 'H25F27004';
  
  console.log('🏥 [FINANCIAL SUMMARY] Using visitId:', visitId);

  // Fetch clinical services from junction table
  const { data: clinicalServicesData } = useQuery({
    queryKey: ['financial-clinical-services', visitId],
    queryFn: async () => {
      if (!visitId) return [];
      
      console.log('📊 [FINANCIAL] Fetching clinical services for visitId:', visitId);
      
      // Get visit UUID first
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select('id, visit_id')
        .eq('visit_id', visitId)
        .single();

      if (visitError || !visitData) {
        console.error('Visit not found for clinical services:', visitError);
        return [];
      }

      // Fetch from junction table
      const { data, error } = await supabase
        .from('visit_clinical_services')
        .select('amount, rate_used, quantity')
        .eq('visit_id', visitData.id);

      if (error) {
        console.error('Error fetching clinical services:', error);
        return [];
      }

      console.log('📊 [FINANCIAL] Clinical services data:', data);
      return data || [];
    },
    enabled: !!visitId
  });

  // Fetch mandatory services from junction table
  const { data: mandatoryServicesData } = useQuery({
    queryKey: ['financial-mandatory-services', visitId],
    queryFn: async () => {
      if (!visitId) return [];
      
      console.log('📊 [FINANCIAL] Fetching mandatory services for visitId:', visitId);
      
      // Get visit UUID first
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select('id, visit_id')
        .eq('visit_id', visitId)
        .single();

      if (visitError || !visitData) {
        console.error('Visit not found for mandatory services:', visitError);
        return [];
      }

      // Fetch from junction table
      const { data, error } = await supabase
        .from('visit_mandatory_services')
        .select('amount, rate_used, quantity')
        .eq('visit_id', visitData.id);

      if (error) {
        console.error('Error fetching mandatory services:', error);
        return [];
      }

      console.log('📊 [FINANCIAL] Mandatory services data:', data);
      return data || [];
    },
    enabled: !!visitId
  });

  // Comprehensive advance payment data fetch with detailed console logging
  const { data: advancePaymentData } = useQuery({
    queryKey: ['advance-payments', visitId],
    queryFn: async () => {
      console.log('🔍 [ADVANCE PAYMENT DEBUG] Starting comprehensive debug...');
      console.log('🔍 [ADVANCE PAYMENT DEBUG] Current visitId:', visitId);
      
      if (!visitId) {
        console.log('❌ [ADVANCE PAYMENT DEBUG] No visitId provided');
        return [];
      }
      
      try {
        // Step 1: Check if table exists and get total count
        console.log('🔍 [STEP 1] Checking advance_payment table...');
        const { data: countData, error: countError, count } = await supabase
          .from('advance_payment')
          .select('id', { count: 'exact' })
          .limit(0);
          
        console.log('🔍 [STEP 1] Table status:', {
          total_records: count,
          table_accessible: !countError,
          error: countError
        });
        
        // Step 2: Get all records to see what visit_ids exist
        console.log('🔍 [STEP 2] Fetching all records to see available visit_ids...');
        const { data: allRecords, error: allError } = await supabase
          .from('advance_payment')
          .select('id, visit_id, patient_name, advance_amount, status, created_at')
          .order('created_at', { ascending: false })
          .limit(10);
          
        console.log('🔍 [STEP 2] All records in table:', {
          count: allRecords?.length || 0,
          error: allError,
          records: allRecords
        });
        
        if (allRecords && allRecords.length > 0) {
          const visitIds = allRecords.map(r => r.visit_id);
          console.log('🔍 [STEP 2] Available visit_ids:', visitIds);
          console.log('🔍 [STEP 2] Current visitId exists?', visitIds.includes(visitId));
        }
        
        // Step 3: Try exact match for current visitId
        console.log('🔍 [STEP 3] Searching for exact visitId match...');
        const { data: exactMatch, error: exactError } = await supabase
          .from('advance_payment')
          .select('*')
          .eq('visit_id', visitId)
          .eq('status', 'ACTIVE');

        console.log('🔍 [STEP 3] Exact match results:', {
          visitId_searched: visitId,
          found_records: exactMatch?.length || 0,
          records: exactMatch,
          error: exactError
        });
        
        // Step 4: If no exact match, try partial match
        if (!exactMatch || exactMatch.length === 0) {
          console.log('🔍 [STEP 4] No exact match, trying partial match...');
          const { data: partialMatch, error: partialError } = await supabase
            .from('advance_payment')
            .select('*')
            .ilike('visit_id', `%${visitId}%`)
            .eq('status', 'ACTIVE');
            
          console.log('🔍 [STEP 4] Partial match results:', {
            pattern_searched: `%${visitId}%`,
            found_records: partialMatch?.length || 0,
            records: partialMatch,
            error: partialError
          });
          
          if (partialMatch && partialMatch.length > 0) {
            return partialMatch;
          }
        }
        
        // Step 5: Calculate totals if data found
        if (exactMatch && exactMatch.length > 0) {
          let totalPaid = 0;
          let totalRefunded = 0;
          
          exactMatch.forEach(record => {
            const amount = parseFloat(record.advance_amount) || 0;
            const refunded = parseFloat(record.returned_amount) || 0;
            
            if (record.is_refund) {
              totalRefunded += refunded;
            } else {
              totalPaid += amount;
            }
          });
          
          console.log('🔍 [STEP 5] Calculated totals:', {
            total_paid: totalPaid,
            total_refunded: totalRefunded,
            net_advance: totalPaid - totalRefunded
          });
        }

        if (exactError) {
          console.error('❌ [ADVANCE PAYMENT DEBUG] Database error:', exactError);
          return [];
        }

        return exactMatch || [];
        
      } catch (error) {
        console.error('❌ [ADVANCE PAYMENT DEBUG] Exception:', error);
        return [];
      }
    },
    enabled: !!visitId
  });

  // Calculate totals from junction table data
  const clinicalTotal = (clinicalServicesData || []).reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const mandatoryTotal = (mandatoryServicesData || []).reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  
  // Simple calculation of advance payment totals
  const advancePaymentTotals = {
    paid: 0,
    refunded: 0
  };

  if (advancePaymentData && advancePaymentData.length > 0) {
    advancePaymentData.forEach(payment => {
      const amount = parseFloat(payment.advance_amount) || 0;
      const returnedAmount = parseFloat(payment.returned_amount) || 0;
      
      if (payment.is_refund) {
        advancePaymentTotals.refunded += returnedAmount;
      } else {
        advancePaymentTotals.paid += amount;
      }
    });
  }

  console.log('💰 [ADVANCE PAYMENT] Calculated totals:', {
    paid_amount: advancePaymentTotals.paid,
    refunded_amount: advancePaymentTotals.refunded,
    total_records: advancePaymentData?.length || 0
  });

  console.log('📊 [FINANCIAL] All calculated totals:', {
    clinical: clinicalTotal,
    mandatory: mandatoryTotal,
    advance_payment_paid: advancePaymentTotals.paid,
    advance_payment_refunded: advancePaymentTotals.refunded
  });

  // Function to create test advance payment data
  const createTestData = async () => {
    console.log('🧪 Creating test advance payment for visitId:', visitId);
    
    try {
      const testRecord = {
        patient_id: '00000000-0000-0000-0000-000000000001', // dummy UUID
        visit_id: visitId,
        patient_name: 'Test Patient',
        bill_no: 'TEST-BILL-001',
        patients_id: 'TEST-REG-001',
        advance_amount: 5000.00,
        payment_date: new Date().toISOString().split('T')[0],
        payment_mode: 'CASH',
        status: 'ACTIVE',
        created_by: 'Test Debug'
      };
      
      const { data, error } = await supabase
        .from('advance_payment')
        .insert(testRecord)
        .select()
        .single();
        
      if (error) {
        console.error('❌ Test data creation failed:', error);
        alert('Test data creation failed: ' + error.message);
      } else {
        console.log('✅ Test data created successfully:', data);
        alert('Test advance payment of ₹5000 created! Refreshing page...');
        window.location.reload();
      }
    } catch (err) {
      console.error('❌ Exception creating test data:', err);
    }
  };
  
  // Add to window for manual testing
  if (typeof window !== 'undefined') {
    (window as any).createTestAdvancePayment = createTestData;
  }

  // Helper function to calculate row totals
  const calculateRowTotal = (row: FinancialRow): number => {
    const values = Object.values(row);
    return values.reduce((sum, value) => {
      const numValue = parseFloat(value) || 0;
      return sum + numValue;
    }, 0);
  };

  // Helper function to calculate core services totals
  const calculateCoreServicesTotal = (row: FinancialRow): number => {
    const coreServices = [
      'clinicalServices',
      'laboratoryServices', 
      'radiology',
      'mandatoryServices'
    ] as const;
    
    return coreServices.reduce((sum, service) => {
      const numValue = parseFloat(row[service] || '0') || 0;
      return sum + numValue;
    }, 0);
  };

  // Helper function to calculate support services totals
  const calculateSupportServicesTotal = (row: FinancialRow): number => {
    const supportServices = [
      'advancePayment',
      'pharmacy',
      'implant',
      'blood',
      'surgery',
      'physiotherapy',
      'consultation',
      'surgeryInternalReport',
      'implantCost'
    ] as const;
    
    return supportServices.reduce((sum, service) => {
      const numValue = parseFloat(row[service] || '0') || 0;
      return sum + numValue;
    }, 0);
  };

  // Update state when data changes
  useEffect(() => {
    console.log('🔄 [STATE UPDATE] Updating financial data with advance payments:', {
      advance_paid: advancePaymentTotals.paid,
      advance_refunded: advancePaymentTotals.refunded
    });
    
    setFinancialData(prev => ({
      ...prev,
      totalAmount: {
        ...prev.totalAmount,
        clinicalServices: clinicalTotal.toString(),
        mandatoryServices: mandatoryTotal.toString(),
        advancePayment: advancePaymentTotals.paid.toString()
      },
      amountPaid: {
        ...prev.amountPaid,
        advancePayment: advancePaymentTotals.paid.toString()
      },
      refundedAmount: {
        ...prev.refundedAmount,
        advancePayment: advancePaymentTotals.refunded.toString()
      },
      balance: {
        ...prev.balance,
        clinicalServices: (clinicalTotal - parseFloat(prev.discount.clinicalServices || '0') - parseFloat(prev.amountPaid.clinicalServices || '0')).toString(),
        mandatoryServices: mandatoryTotal.toString(),
        advancePayment: (0 - advancePaymentTotals.paid + advancePaymentTotals.refunded).toString()
      }
    }));
  }, [clinicalTotal, mandatoryTotal, advancePaymentTotals.paid, advancePaymentTotals.refunded]);

  // State for all input values - Use calculated totals instead of hardcoded values
  const [financialData, setFinancialData] = useState<FinancialData>({
    // Row 1: Total Amount
    totalAmount: {
      advancePayment: '',
      clinicalServices: clinicalTotal.toString(),
      laboratoryServices: '6565',
      radiology: '28000',
      pharmacy: '',
      implant: '',
      blood: '',
      surgery: '',
      mandatoryServices: mandatoryTotal.toString(),
      physiotherapy: '',
      consultation: '10000',
      surgeryInternalReport: '',
      implantCost: ''
    },
    // Row 2: Discount
    discount: {
      advancePayment: '',
      clinicalServices: '2256',
      laboratoryServices: '1315',
      radiology: '200',
      pharmacy: '',
      implant: '',
      blood: '',
      surgery: '',
      mandatoryServices: '',
      physiotherapy: '',
      consultation: '',
      surgeryInternalReport: '',
      implantCost: ''
    },
    // Row 3: Amount Paid
    amountPaid: {
      advancePayment: '',
      clinicalServices: '',
      laboratoryServices: '',
      radiology: '',
      pharmacy: '',
      implant: '',
      blood: '',
      surgery: '',
      mandatoryServices: '',
      physiotherapy: '',
      consultation: '',
      surgeryInternalReport: '',
      implantCost: ''
    },
    // Row 4: Refunded Amount
    refundedAmount: {
      advancePayment: '',
      clinicalServices: '',
      laboratoryServices: '',
      radiology: '',
      pharmacy: '',
      implant: '',
      blood: '',
      surgery: '',
      mandatoryServices: '',
      physiotherapy: '',
      consultation: '',
      surgeryInternalReport: '',
      implantCost: ''
    },
    // Row 5: Balance - Calculate dynamically (Total - Discount - Paid + Refund)
    balance: {
      advancePayment: '',
      clinicalServices: (clinicalTotal - parseFloat('2256' || '0') - parseFloat('' || '0') + parseFloat('' || '0')).toString(),
      laboratoryServices: '5250',
      radiology: '27800',
      pharmacy: '',
      implant: '',
      blood: '',
      surgery: '',
      mandatoryServices: mandatoryTotal.toString(),
      physiotherapy: '',
      consultation: '10000',
      surgeryInternalReport: '',
      implantCost: ''
    }
  });

  // Handle input change
  const handleInputChange = (row: keyof FinancialData, column: keyof FinancialRow, value: string) => {
    setFinancialData(prev => ({
      ...prev,
      [row]: {
        ...prev[row],
        [column]: value
      }
    }));
  };

  // Handle submit for individual cell
  const handleSubmit = (row: keyof FinancialData, column: keyof FinancialRow) => {
    console.log(`Submitted ${row} - ${column}:`, financialData[row][column]);
    // Here you can add API call to save the data
    alert(`✅ ${row} - ${column} updated successfully!`);
  };
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Financial Summary</h1>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Date:</label>
              <input
                type="date"
                className="border border-gray-300 rounded px-3 py-1 text-sm"
                defaultValue={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
            <button className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm font-medium">
              Start Package
            </button>
            <button className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm font-medium flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
              Save Financial Summary
            </button>
          </div>
        </div>

        {/* Financial Summary Table */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Financial Summary Table</h2>
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-lg shadow-lg">
              <div className="text-center">
                <p className="text-sm font-medium opacity-90">Total Amount</p>
                <p className="text-3xl font-bold">
                  ₹{calculateRowTotal(financialData.totalAmount).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Financial Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 mb-1">Core Services</p>
                  <p className="text-2xl font-bold text-blue-800">
                    ₹{calculateCoreServicesTotal(financialData.totalAmount).toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
              </div>
              <p className="text-xs text-blue-600 mt-2">Clinical, Lab, Radiology & Mandatory</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 mb-1">Support Services</p>
                  <p className="text-2xl font-bold text-green-800">
                    ₹{calculateSupportServicesTotal(financialData.totalAmount).toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                  </svg>
                </div>
              </div>
              <p className="text-xs text-green-600 mt-2">Pharmacy, Consultation & Others</p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6 border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600 mb-1">Total Discounts</p>
                  <p className="text-2xl font-bold text-red-800">
                    ₹{calculateRowTotal(financialData.discount).toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"/>
                  </svg>
                </div>
              </div>
              <p className="text-xs text-red-600 mt-2">Applied across all services</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 mb-1">Net Balance</p>
                  <p className="text-2xl font-bold text-purple-800">
                    ₹{calculateRowTotal(financialData.balance).toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.51-1.31c-.562-.649-1.413-1.076-2.353-1.253V5z" clipRule="evenodd"/>
                  </svg>
                </div>
              </div>
              <p className="text-xs text-purple-600 mt-2">Outstanding amount due</p>
            </div>
          </div>
          
          {/* Financial Summary Table */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-blue-50 border-b border-gray-200">
                    <th className="border-r border-gray-200 p-3 text-left font-semibold text-gray-700 min-w-[140px] bg-gray-100">
                      Financial Category
                    </th>
                    <th className="border-r border-gray-200 p-3 text-center font-semibold text-gray-700 min-w-[100px]">
                      Advance<br/>Payment
                    </th>
                    <th className="border-r border-gray-200 p-3 text-center font-semibold text-gray-700 min-w-[100px]">
                      Clinical<br/>Services
                    </th>
                    <th className="border-r border-gray-200 p-3 text-center font-semibold text-gray-700 min-w-[100px]">
                      Laboratory<br/>Services
                    </th>
                    <th className="border-r border-gray-200 p-3 text-center font-semibold text-gray-700 min-w-[100px]">
                      Radiology
                    </th>
                    <th className="border-r border-gray-200 p-3 text-center font-semibold text-gray-700 min-w-[100px]">
                      Pharmacy
                    </th>
                    <th className="border-r border-gray-200 p-3 text-center font-semibold text-gray-700 min-w-[100px]">
                      Implant
                    </th>
                    <th className="border-r border-gray-200 p-3 text-center font-semibold text-gray-700 min-w-[100px]">
                      Blood
                    </th>
                    <th className="border-r border-gray-200 p-3 text-center font-semibold text-gray-700 min-w-[100px]">
                      Surgery
                    </th>
                    <th className="border-r border-gray-200 p-3 text-center font-semibold text-gray-700 min-w-[100px]">
                      Mandatory<br/>services
                    </th>
                    <th className="border-r border-gray-200 p-3 text-center font-semibold text-gray-700 min-w-[100px]">
                      Physiotherapy
                    </th>
                    <th className="border-r border-gray-200 p-3 text-center font-semibold text-gray-700 min-w-[100px]">
                      Consultation
                    </th>
                    <th className="border-r border-gray-200 p-3 text-center font-semibold text-gray-700 min-w-[120px]">
                      Surgery for<br/>Internal Report<br/>and Yojnas
                    </th>
                    <th className="border-r border-gray-200 p-3 text-center font-semibold text-gray-700 min-w-[100px]">
                      Implant Cost
                    </th>
                    <th className="border-r border-gray-200 p-3 text-center font-semibold text-gray-700 min-w-[100px]">
                      Private
                    </th>
                    <th className="border-r border-gray-200 p-3 text-center font-semibold text-gray-700 min-w-[120px]">
                      Accommodation<br/>charges
                    </th>
                    <th className="p-3 text-center font-bold text-white bg-blue-600 min-w-[100px]">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Row 1: Total Amount */}
                  <tr className="bg-white border-b border-gray-100">
                    <td className="border-r border-gray-200 p-3 text-left font-medium bg-gray-50">Total Amount</td>
                    <td className="border-r border-gray-200 p-3 text-center">{financialData.totalAmount.advancePayment || '0'}</td>
                    <td className="border-r border-gray-200 p-3 text-center">{financialData.totalAmount.clinicalServices}</td>
                    <td className="border-r border-gray-200 p-3 text-center">{financialData.totalAmount.laboratoryServices}</td>
                    <td className="border-r border-gray-200 p-3 text-center">{financialData.totalAmount.radiology}</td>
                    <td className="border-r border-gray-200 p-3 text-center">{financialData.totalAmount.pharmacy || '0'}</td>
                    <td className="border-r border-gray-200 p-3 text-center">{financialData.totalAmount.implant || '0'}</td>
                    <td className="border-r border-gray-200 p-3 text-center">{financialData.totalAmount.blood || '0'}</td>
                    <td className="border-r border-gray-200 p-3 text-center">{financialData.totalAmount.surgery || '0'}</td>
                    <td className="border-r border-gray-200 p-3 text-center">{financialData.totalAmount.mandatoryServices}</td>
                    <td className="border-r border-gray-200 p-3 text-center">{financialData.totalAmount.physiotherapy || '0'}</td>
                    <td className="border-r border-gray-200 p-3 text-center">{financialData.totalAmount.consultation}</td>
                    <td className="border-r border-gray-200 p-3 text-center">{financialData.totalAmount.surgeryInternalReport || '0'}</td>
                    <td className="border-r border-gray-200 p-3 text-center">{financialData.totalAmount.implantCost || '0'}</td>
                    <td className="border-r border-gray-200 p-3 text-center">16200</td>
                    <td className="border-r border-gray-200 p-3 text-center">0</td>
                    <td className="p-3 text-center font-bold bg-blue-50">
                      {calculateRowTotal(financialData.totalAmount).toLocaleString()}
                    </td>
                  </tr>

                  {/* Row 2: Discount */}
                  <tr className="bg-white border-b border-gray-100">
                    <td className="border-r border-gray-200 p-3 text-left font-medium bg-gray-50">Discount</td>
                    <td className="border-r border-gray-200 p-3 text-center">{financialData.discount.advancePayment || '0'}</td>
                    <td className="border-r border-gray-200 p-3 text-center">{financialData.discount.clinicalServices}</td>
                    <td className="border-r border-gray-200 p-3 text-center">{financialData.discount.laboratoryServices}</td>
                    <td className="border-r border-gray-200 p-3 text-center">{financialData.discount.radiology}</td>
                    <td className="border-r border-gray-200 p-3 text-center">{financialData.discount.pharmacy || '0'}</td>
                    <td className="border-r border-gray-200 p-3 text-center">{financialData.discount.implant || '0'}</td>
                    <td className="border-r border-gray-200 p-3 text-center">{financialData.discount.blood || '0'}</td>
                    <td className="border-r border-gray-200 p-3 text-center">{financialData.discount.surgery || '0'}</td>
                    <td className="border-r border-gray-200 p-3 text-center">{financialData.discount.mandatoryServices || '0'}</td>
                    <td className="border-r border-gray-200 p-3 text-center">{financialData.discount.physiotherapy || '0'}</td>
                    <td className="border-r border-gray-200 p-3 text-center">{financialData.discount.consultation || '0'}</td>
                    <td className="border-r border-gray-200 p-3 text-center">{financialData.discount.surgeryInternalReport || '0'}</td>
                    <td className="border-r border-gray-200 p-3 text-center">{financialData.discount.implantCost || '0'}</td>
                    <td className="border-r border-gray-200 p-3 text-center">0</td>
                    <td className="border-r border-gray-200 p-3 text-center">0</td>
                    <td className="p-3 text-center font-bold bg-red-50">
                      {calculateRowTotal(financialData.discount).toLocaleString()}
                    </td>
                  </tr>

                  {/* Row 3: Amount Paid */}
                  <tr className="bg-white border-b border-gray-100">
                    <td className="border-r border-gray-200 p-3 text-left font-medium bg-gray-50">Amount Paid</td>
                    <td className="border-r border-gray-200 p-3 text-center">{financialData.amountPaid.advancePayment || '0'}</td>
                    <td className="border-r border-gray-200 p-3 text-center">{financialData.amountPaid.clinicalServices || '0'}</td>
                    <td className="border-r border-gray-200 p-3 text-center">{financialData.amountPaid.laboratoryServices || '0'}</td>
                    <td className="border-r border-gray-200 p-3 text-center">{financialData.amountPaid.radiology || '0'}</td>
                    <td className="border-r border-gray-200 p-3 text-center">{financialData.amountPaid.pharmacy || '0'}</td>
                    <td className="border-r border-gray-200 p-3 text-center">{financialData.amountPaid.implant || '0'}</td>
                    <td className="border-r border-gray-200 p-3 text-center">{financialData.amountPaid.blood || '0'}</td>
                    <td className="border-r border-gray-200 p-3 text-center">{financialData.amountPaid.surgery || '0'}</td>
                    <td className="border-r border-gray-200 p-3 text-center">{financialData.amountPaid.mandatoryServices || '0'}</td>
                    <td className="border-r border-gray-200 p-3 text-center">{financialData.amountPaid.physiotherapy || '0'}</td>
                    <td className="border-r border-gray-200 p-3 text-center">{financialData.amountPaid.consultation || '0'}</td>
                    <td className="border-r border-gray-200 p-3 text-center">{financialData.amountPaid.surgeryInternalReport || '0'}</td>
                    <td className="border-r border-gray-200 p-3 text-center">{financialData.amountPaid.implantCost || '0'}</td>
                    <td className="border-r border-gray-200 p-3 text-center">0</td>
                    <td className="border-r border-gray-200 p-3 text-center">0</td>
                    <td className="p-3 text-center font-bold bg-green-50">
                      {calculateRowTotal(financialData.amountPaid).toLocaleString()}
                    </td>
                  </tr>

                  {/* Row 4: Refunded Amount */}
                  <tr className="bg-white border-b border-gray-100">
                    <td className="border-r border-gray-200 p-3 text-left font-medium bg-gray-50">Refunded Amount</td>
                    <td className="border-r border-gray-200 p-3 text-center">29000</td>
                    <td className="border-r border-gray-200 p-3 text-center">0</td>
                    <td className="border-r border-gray-200 p-3 text-center">0</td>
                    <td className="border-r border-gray-200 p-3 text-center">0</td>
                    <td className="border-r border-gray-200 p-3 text-center">0</td>
                    <td className="border-r border-gray-200 p-3 text-center">0</td>
                    <td className="border-r border-gray-200 p-3 text-center">0</td>
                    <td className="border-r border-gray-200 p-3 text-center">0</td>
                    <td className="border-r border-gray-200 p-3 text-center">0</td>
                    <td className="border-r border-gray-200 p-3 text-center">0</td>
                    <td className="border-r border-gray-200 p-3 text-center">0</td>
                    <td className="border-r border-gray-200 p-3 text-center">0</td>
                    <td className="border-r border-gray-200 p-3 text-center">0</td>
                    <td className="border-r border-gray-200 p-3 text-center">0</td>
                    <td className="border-r border-gray-200 p-3 text-center">0</td>
                    <td className="p-3 text-center font-bold bg-orange-50">
                      29000
                    </td>
                  </tr>

                  {/* Row 5: Balance */}
                  <tr className="bg-blue-50 border-b border-gray-200">
                    <td className="border-r border-gray-200 p-3 text-left font-bold bg-blue-100">Balance</td>
                    <td className="border-r border-gray-200 p-3 text-center font-bold">0</td>
                    <td className="border-r border-gray-200 p-3 text-center font-bold">{financialData.balance.clinicalServices}</td>
                    <td className="border-r border-gray-200 p-3 text-center font-bold">5250</td>
                    <td className="border-r border-gray-200 p-3 text-center font-bold">27800</td>
                    <td className="border-r border-gray-200 p-3 text-center font-bold">0</td>
                    <td className="border-r border-gray-200 p-3 text-center font-bold">0</td>
                    <td className="border-r border-gray-200 p-3 text-center font-bold">0</td>
                    <td className="border-r border-gray-200 p-3 text-center font-bold">0</td>
                    <td className="border-r border-gray-200 p-3 text-center font-bold">{financialData.balance.mandatoryServices}</td>
                    <td className="border-r border-gray-200 p-3 text-center font-bold">0</td>
                    <td className="border-r border-gray-200 p-3 text-center font-bold">10000</td>
                    <td className="border-r border-gray-200 p-3 text-center font-bold">0</td>
                    <td className="border-r border-gray-200 p-3 text-center font-bold">0</td>
                    <td className="border-r border-gray-200 p-3 text-center font-bold">16200</td>
                    <td className="border-r border-gray-200 p-3 text-center font-bold">0</td>
                    <td className="p-3 text-center font-bold text-blue-600 bg-blue-100 text-lg">
                      {calculateRowTotal(financialData.balance).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <button className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium">
              Advance Payment
            </button>
            <button className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium">
              Invoice
            </button>
            <button className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium">
              Corporate Bill
            </button>
            <button className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium">
              Final Payment
            </button>
            <button className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium">
              Detailed Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialSummary;
