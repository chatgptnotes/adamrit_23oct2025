import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Convert amount to words (Indian format)
const convertAmountToWords = (amount: number): string => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertToWords = (num: number): string => {
    if (num === 0) return '';
    if (num < 10) return ones[num];
    if (num < 20) return teens[num - 10];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ones[num % 10] : '');
    if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 !== 0 ? ' ' + convertToWords(num % 100) : '');
    if (num < 100000) return convertToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 !== 0 ? ' ' + convertToWords(num % 1000) : '');
    if (num < 10000000) return convertToWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 !== 0 ? ' ' + convertToWords(num % 100000) : '');
    return convertToWords(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 !== 0 ? ' ' + convertToWords(num % 10000000) : '');
  };

  if (amount === 0) return 'Zero Rupees Only';
  return 'Rupee ' + convertToWords(Math.floor(amount)) + ' Only';
};

const Invoice = () => {
  const [showPharmacyCharges, setShowPharmacyCharges] = useState(false);
  const [discountRemoved, setDiscountRemoved] = useState(false);
  const [chargeFilter, setChargeFilter] = useState('all'); // 'all', 'lab', 'radiology', 'surgery'
  const [hideLabRadiology, setHideLabRadiology] = useState(false);
  const navigate = useNavigate();
  const { visitId } = useParams<{ visitId: string }>();
  const { hospitalConfig } = useAuth();
  const hospitalName = hospitalConfig?.name === 'ayushman' ? 'Ayushman Hospital Nagpur' : 'Hope Hospital Nagpur';

  // Fetch patient and visit data
  const { data: visitData, isLoading } = useQuery({
    queryKey: ['invoice-visit', visitId],
    queryFn: async () => {
      if (!visitId) return null;

      const { data, error } = await supabase
        .from('visits')
        .select(`
          *,
          patients (*)
        `)
        .eq('visit_id', visitId)
        .single();

      if (error) {
        console.error('Error fetching visit data:', error);
        return null;
      }

      return data;
    },
    enabled: !!visitId
  });

  // Fetch bill data for financial information
  const { data: billData } = useQuery({
    queryKey: ['invoice-bill', visitId],
    queryFn: async () => {
      if (!visitId) return null;

      const { data, error } = await supabase
        .from('bills')
        .select(`
          *,
          bill_sections (
            *,
            bill_line_items (*)
          )
        `)
        .eq('visit_id', visitId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching bill data:', error);
        return null;
      }

      return data;
    },
    enabled: !!visitId
  });

  // Fetch payment data
  const { data: paymentData } = useQuery({
    queryKey: ['invoice-payments', visitId],
    queryFn: async () => {
      console.log('=== FETCHING PAYMENTS FROM accounting_transactions TABLE ===');
      console.log('visitId:', visitId);

      if (!visitId) {
        console.log('No visit ID found for payments');
        return [];
      }

      // First get the UUID from visits table using visit_id string
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select('id')
        .eq('visit_id', visitId)
        .single();

      console.log('Visit UUID query result for payments:', { visitData, visitError });

      if (visitError || !visitData?.id) {
        console.error('Could not find visit UUID for payments:', visitError);
        return [];
      }

      const visitUUID = visitData.id;
      console.log('Found visit UUID for payments:', visitUUID);

      // Try querying accounting_transactions with UUID first
      let { data, error } = await supabase
        .from('accounting_transactions')
        .select('*')
        .eq('visit_id', visitUUID)
        .eq('transaction_type', 'payment');

      console.log('Payments query with UUID result:', { data, error });

      // If UUID query returns empty, try with string visit_id
      if ((!data || data.length === 0) && !error) {
        console.log('UUID query returned empty, trying with string visit_id...');
        const result = await supabase
          .from('accounting_transactions')
          .select('*')
          .eq('visit_id', visitId)
          .eq('transaction_type', 'payment');

        data = result.data;
        error = result.error;
        console.log('Payments query with string visit_id result:', { data, error });
      }

      if (error) {
        console.error('Error fetching payment data:', error);
        return [];
      }

      console.log('✅ Payments fetched:', data);
      return data || [];
    },
    enabled: !!visitId
  });

  // Fetch advance payments
  const { data: advanceData } = useQuery({
    queryKey: ['invoice-advances', visitId],
    queryFn: async () => {
      console.log('=== FETCHING ADVANCES FROM accounting_transactions TABLE ===');
      console.log('visitId:', visitId);

      if (!visitId) {
        console.log('No visit ID found for advances');
        return [];
      }

      // First get the UUID from visits table using visit_id string
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select('id')
        .eq('visit_id', visitId)
        .single();

      console.log('Visit UUID query result for advances:', { visitData, visitError });

      if (visitError || !visitData?.id) {
        console.error('Could not find visit UUID for advances:', visitError);
        return [];
      }

      const visitUUID = visitData.id;
      console.log('Found visit UUID for advances:', visitUUID);

      // Try querying accounting_transactions with UUID first
      let { data, error } = await supabase
        .from('accounting_transactions')
        .select('*')
        .eq('visit_id', visitUUID)
        .eq('transaction_type', 'advance');

      console.log('Advances query with UUID result:', { data, error });

      // If UUID query returns empty, try with string visit_id
      if ((!data || data.length === 0) && !error) {
        console.log('UUID query returned empty, trying with string visit_id...');
        const result = await supabase
          .from('accounting_transactions')
          .select('*')
          .eq('visit_id', visitId)
          .eq('transaction_type', 'advance');

        data = result.data;
        error = result.error;
        console.log('Advances query with string visit_id result:', { data, error });
      }

      if (error) {
        console.error('Error fetching advance data:', error);
        return [];
      }

      console.log('✅ Advances fetched:', data);
      return data || [];
    },
    enabled: !!visitId
  });

  // Fetch advance payment data from advance_payment table (same as Financial Summary)
  const { data: advancePaymentData } = useQuery({
    queryKey: ['invoice-advance-payment', visitId],
    queryFn: async () => {
      console.log('=== FETCHING ADVANCE PAYMENT FROM advance_payment TABLE ===');
      console.log('visitId:', visitId);

      if (!visitId) {
        console.log('No visit ID found for advance payment');
        return [];
      }

      try {
        // Fetch advance payments with exact visitId match and ACTIVE status
        const { data: exactMatch, error: exactError } = await supabase
          .from('advance_payment')
          .select('*')
          .eq('visit_id', visitId)
          .eq('status', 'ACTIVE');

        console.log('Advance payment query result:', { exactMatch, exactError });

        if (exactError) {
          console.error('Error fetching advance payment data:', exactError);
          return [];
        }

        // Calculate totals
        let totalPaid = 0;
        let totalRefunded = 0;

        if (exactMatch && exactMatch.length > 0) {
          exactMatch.forEach(record => {
            const amount = parseFloat(record.advance_amount) || 0;
            const refunded = parseFloat(record.returned_amount) || 0;

            if (record.is_refund) {
              totalRefunded += refunded;
            } else {
              totalPaid += amount;
            }
          });

          console.log('✅ Advance payment totals:', {
            total_paid: totalPaid,
            total_refunded: totalRefunded,
            net_advance: totalPaid - totalRefunded
          });
        }

        return exactMatch || [];
      } catch (error) {
        console.error('Exception fetching advance payment:', error);
        return [];
      }
    },
    enabled: !!visitId
  });

  // Fetch final payment from final_payments table
  const { data: finalPaymentData } = useQuery({
    queryKey: ['invoice-final-payment', visitId],
    queryFn: async () => {
      if (!visitId) return null;

      const { data, error } = await supabase
        .from('final_payments')
        .select('*')
        .eq('visit_id', visitId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching final payment:', error);
        return null;
      }

      console.log('Final payment data:', data);
      return data;
    },
    enabled: !!visitId
  });

  // Fetch discount from visit_discounts table (same as Final Bill)
  const { data: discountData } = useQuery({
    queryKey: ['invoice-discount', visitId],
    queryFn: async () => {
      console.log('=== FETCHING DISCOUNT FROM visit_discounts TABLE ===');
      console.log('visitId:', visitId);

      if (!visitId) {
        console.log('No visit ID found for discount');
        return 0;
      }

      // First get the UUID from visits table using visit_id string
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select('id')
        .eq('visit_id', visitId)
        .single();

      console.log('Visit UUID query result for discount:', { visitData, visitError });

      if (visitError || !visitData?.id) {
        console.error('Could not find visit UUID for discount:', visitError);
        return 0;
      }

      const visitUUID = visitData.id;
      console.log('Found visit UUID for discount:', visitUUID);

      // Fetch discount from visit_discounts table
      const { data, error } = await supabase
        .from('visit_discounts')
        .select('discount_amount')
        .eq('visit_id', visitUUID)
        .maybeSingle();

      console.log('Discount query result:', { data, error });

      if (error) {
        console.error('Error fetching discount:', error);
        return 0;
      }

      const discountAmount = data?.discount_amount || 0;
      console.log('✅ Discount fetched from visit_discounts:', discountAmount);

      return discountAmount;
    },
    enabled: !!visitId
  });

  // Fetch lab tests from visit_labs table (Service Selection data)
  const { data: labOrdersData } = useQuery({
    queryKey: ['invoice-visit-labs', visitId],
    queryFn: async () => {
      console.log('=== VISIT LABS DEBUG ===');
      console.log('visitId:', visitId);

      if (!visitId) {
        console.log('No visit ID found');
        return [];
      }

      // First get the UUID from visits table using visit_id string
      console.log('Getting visit UUID for visit_id:', visitId);
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select('id')
        .eq('visit_id', visitId)
        .single();

      console.log('Visit UUID query result:', { visitData, visitError });

      if (visitError || !visitData?.id) {
        console.error('Could not find visit UUID:', visitError);
        return [];
      }

      const visitUUID = visitData.id;
      console.log('Found visit UUID:', visitUUID);

      // Now fetch visit_labs using the UUID
      console.log('Fetching visit_labs for visit UUID:', visitUUID);

      const { data, error } = await supabase
        .from('visit_labs')
        .select(`
          *,
          lab:lab_id (
            id,
            name,
            private,
            "NABH_rates_in_rupee",
            "Non-NABH_rates_in_rupee",
            bhopal_nabh_rate,
            bhopal_non_nabh_rate,
            category,
            description
          )
        `)
        .eq('visit_id', visitUUID)
        .order('ordered_date', { ascending: false });

      console.log('Visit labs query result:', { data, error });

      if (error) {
        console.error('Error fetching visit labs:', error);
        return [];
      }

      console.log('Visit labs data fetched successfully:', data);
      return data || [];
    },
    enabled: !!visitId
  });

  // Fetch radiology tests from visit_radiology (service selection data)
  const { data: radiologyOrdersData } = useQuery({
    queryKey: ['invoice-visit-radiology', visitId],
    queryFn: async () => {
      if (!visitId) {
        console.log('No visit ID found for radiology tests');
        return [];
      }

      // First get the UUID from visits table using visit_id string
      console.log('=== RADIOLOGY DEBUG ===');
      console.log('Getting visit UUID for radiology, visit_id:', visitId);
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select('id')
        .eq('visit_id', visitId)
        .single();

      console.log('Visit UUID query for radiology result:', { visitData, visitError });

      if (visitError || !visitData?.id) {
        console.error('Could not find visit UUID for radiology:', visitError);
        return [];
      }

      const visitUUID = visitData.id;
      console.log('Found visit UUID for radiology:', visitUUID);

      // Now fetch visit_radiology using the UUID
      console.log('Fetching visit radiology tests for visit UUID:', visitUUID);

      const { data, error } = await supabase
        .from('visit_radiology')
        .select(`
          *,
          radiology:radiology_id (
            id,
            name,
            category,
            description
          )
        `)
        .eq('visit_id', visitUUID)
        .order('ordered_date', { ascending: false });

      if (error) {
        console.error('Error fetching visit radiology tests:', error);
        return [];
      }

      console.log('Visit radiology tests data fetched successfully:', data);

      // Also try to fetch all visit_radiology records for debugging
      if (!data || data.length === 0) {
        console.log('No radiology data found, checking all visit_radiology records...');
        const { data: allRadiologyData, error: allRadiologyError } = await supabase
          .from('visit_radiology')
          .select('*')
          .limit(10);
        console.log('All visit_radiology records (sample):', { allRadiologyData, allRadiologyError });
      }

      return data || [];
    },
    enabled: !!visitId
  });

  // Fetch surgeries from visit_surgeries table
  const { data: surgeryOrdersData } = useQuery({
    queryKey: ['invoice-visit-surgeries', visitId],
    queryFn: async () => {
      console.log('=== SURGERY ORDERS FETCH ===');
      console.log('Fetching surgeries for visitId:', visitId);

      if (!visitId) return [];

      // Get visit UUID first
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select('id')
        .eq('visit_id', visitId)
        .single();

      if (visitError || !visitData?.id) {
        console.error('Visit not found for surgeries:', visitError);
        return [];
      }

      const { data, error } = await supabase
        .from('visit_surgeries')
        .select(`
          *,
          cghs_surgery:surgery_id (
            id,
            name,
            code,
            NABH_NABL_Rate
          )
        `)
        .eq('visit_id', visitData.id);

      console.log('Surgery orders query result:', { data, error });

      if (error) {
        console.error('Error fetching surgery orders:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!visitId
  });

  // Fetch anesthetists from visit_anesthetists table
  const { data: anesthetistData } = useQuery({
    queryKey: ['invoice-visit-anesthetists', visitId],
    queryFn: async () => {
      console.log('=== ANESTHETIST FETCH ===');
      if (!visitId) return [];

      // Get visit UUID first
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select('id')
        .eq('visit_id', visitId)
        .single();

      if (visitError || !visitData?.id) {
        console.error('Visit not found for anesthetists:', visitError);
        return [];
      }

      const { data, error } = await supabase
        .from('visit_anesthetists')
        .select('*')
        .eq('visit_id', visitData.id);

      console.log('Anesthetist query result:', { data, error });

      if (error) {
        console.error('Error fetching anesthetists:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!visitId
  });

  // Fetch implants from visit_implants table
  const { data: implantOrdersData } = useQuery({
    queryKey: ['invoice-visit-implants', visitId],
    queryFn: async () => {
      console.log('=== IMPLANT ORDERS FETCH ===');
      console.log('Fetching implants for visitId:', visitId);

      if (!visitId) return [];

      // Get visit UUID first
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select('id')
        .eq('visit_id', visitId)
        .single();

      if (visitError || !visitData?.id) {
        console.error('Visit not found for implants:', visitError);
        return [];
      }

      const { data, error } = await supabase
        .from('visit_implants' as any)
        .select('*')
        .eq('visit_id', visitData.id)
        .eq('status', 'Active');

      console.log('Implant orders query result:', { data, error });

      if (error) {
        console.error('Error fetching implant orders:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!visitId
  });

  // Fetch mandatory services from junction table (actual saved services for this visit)
  const { data: mandatoryServicesData } = useQuery({
    queryKey: ['invoice-mandatory-services-junction', visitId],
    queryFn: async () => {
      console.log('=== MANDATORY SERVICES JUNCTION FETCH ===');
      console.log('Fetching mandatory services for visitId:', visitId);

      if (!visitId) {
        console.log('No visitId provided');
        return [];
      }

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

      console.log('Visit found:', visitData);

      // Fetch from junction table
      const { data, error } = await supabase
        .from('visit_mandatory_services')
        .select(`
          id,
          quantity,
          rate_used,
          rate_type,
          amount,
          selected_at,
          start_date,
          end_date,
          mandatory_services!mandatory_service_id (
            id,
            service_name,
            tpa_rate,
            private_rate,
            nabh_rate,
            non_nabh_rate
          )
        `)
        .eq('visit_id', visitData.id)
        .order('selected_at', { ascending: false });

      console.log('Mandatory services junction query result:', { data, error });

      if (error) {
        console.error('Error fetching mandatory services from junction table:', error);
        return [];
      }

      // Map junction data to expected format
      const mappedData = (data || []).map(item => ({
        id: item.mandatory_services?.id,
        service_name: item.mandatory_services?.service_name,
        tpa_rate: item.mandatory_services?.tpa_rate,
        private_rate: item.mandatory_services?.private_rate,
        nabh_rate: item.mandatory_services?.nabh_rate,
        non_nabh_rate: item.mandatory_services?.non_nabh_rate,
        // Junction table specific data
        quantity: item.quantity,
        rate_used: item.rate_used,
        rate_type: item.rate_type,
        amount: item.amount,
        selected_at: item.selected_at,
        start_date: item.start_date,
        end_date: item.end_date
      }));

      console.log('Mandatory services data mapped:', mappedData);
      return mappedData;
    },
    enabled: !!visitId
  });

  // Fetch clinical services from junction table (actual saved services for this visit)
  const { data: clinicalServicesData } = useQuery({
    queryKey: ['invoice-clinical-services-junction', visitId],
    queryFn: async () => {
      console.log('=== CLINICAL SERVICES JUNCTION FETCH ===');
      console.log('Fetching clinical services for visitId:', visitId);

      if (!visitId) {
        console.log('No visitId provided');
        return [];
      }

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

      console.log('Visit found:', visitData);

      // Fetch from junction table
      const { data, error } = await supabase
        .from('visit_clinical_services')
        .select(`
          id,
          quantity,
          rate_used,
          rate_type,
          amount,
          selected_at,
          start_date,
          end_date,
          clinical_services!clinical_service_id (
            id,
            service_name,
            tpa_rate,
            private_rate,
            nabh_rate,
            non_nabh_rate
          )
        `)
        .eq('visit_id', visitData.id)
        .order('selected_at', { ascending: false });

      console.log('Clinical services junction query result:', { data, error });

      if (error) {
        console.error('Error fetching clinical services from junction table:', error);
        return [];
      }

      // Map junction data to expected format
      const mappedData = (data || []).map(item => ({
        id: item.clinical_services?.id,
        service_name: item.clinical_services?.service_name,
        tpa_rate: item.clinical_services?.tpa_rate,
        private_rate: item.clinical_services?.private_rate,
        nabh_rate: item.clinical_services?.nabh_rate,
        non_nabh_rate: item.clinical_services?.non_nabh_rate,
        // Junction table specific data
        quantity: item.quantity,
        rate_used: item.rate_used,
        rate_type: item.rate_type,
        amount: item.amount,
        selected_at: item.selected_at,
        start_date: item.start_date,
        end_date: item.end_date
      }));

      console.log('Clinical services data mapped:', mappedData);
      return mappedData;
    },
    enabled: !!visitId
  });

  // Fetch accommodation charges from visit_accommodations table
  const { data: accommodationData } = useQuery({
    queryKey: ['invoice-visit-accommodations', visitId],
    queryFn: async () => {
      console.log('=== ACCOMMODATION FETCH ===');
      console.log('Fetching accommodations for visitId:', visitId);

      if (!visitId) return [];

      // Get visit UUID first
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select('id')
        .eq('visit_id', visitId)
        .single();

      if (visitError || !visitData?.id) {
        console.error('Visit not found for accommodations:', visitError);
        return [];
      }

      const { data, error } = await supabase
        .from('visit_accommodations')
        .select(`
          *,
          accommodation:accommodation_id (
            id,
            room_type,
            private_rate,
            nabh_rate,
            non_nabh_rate,
            tpa_rate
          )
        `)
        .eq('visit_id', visitData.id)
        .order('start_date', { ascending: false });

      console.log('Accommodation query result:', { data, error });

      if (error) {
        console.error('Error fetching accommodations:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!visitId
  });

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoice data...</p>
        </div>
      </div>
    );
  }

  // Show error if no data found
  if (!visitData) {
    return (
      <div className="min-h-screen bg-white p-4 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">Invoice Not Found</h2>
          <p className="text-gray-600 mb-4">Unable to load invoice data for visit ID: {visitId}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const patient = visitData.patients;

  // Calculate age string
  const calculateAge = (birthDate: string) => {
    if (!birthDate) return 'N/A';
    const birth = new Date(birthDate);
    const today = new Date();
    const years = today.getFullYear() - birth.getFullYear();
    const months = today.getMonth() - birth.getMonth();
    const days = today.getDate() - birth.getDate();

    let ageYears = years;
    let ageMonths = months;

    if (days < 0) {
      ageMonths--;
    }
    if (ageMonths < 0) {
      ageYears--;
      ageMonths += 12;
    }

    return `${ageYears}Y ${ageMonths}M 0D`;
  };

  // Create services array from actual bill data and lab/radiology orders
  // Helper function to get rate based on patient type
  const getMandatoryServiceRate = (service, patientCategory) => {
    if (!service) {
      console.log('getMandatoryServiceRate: No service provided');
      return 0;
    }

    console.log('getMandatoryServiceRate: service rates:', {
      service_name: service.service_name,
      private_rate: service.private_rate,
      tpa_rate: service.tpa_rate,
      cghs_rate: service.cghs_rate,
      non_cghs_rate: service.non_cghs_rate,
      patientCategory: patientCategory
    });

    let rate = 0;
    switch (patientCategory?.toLowerCase()) {
      case 'private':
        rate = parseFloat(service.private_rate) || 0;
        console.log('Using private_rate:', rate);
        break;
      case 'tpa':
      case 'corporate':
        rate = parseFloat(service.tpa_rate) || 0;
        console.log('Using tpa_rate:', rate);
        break;
      case 'cghs':
        rate = parseFloat(service.cghs_rate) || 0;
        console.log('Using cghs_rate:', rate);
        break;
      case 'non_cghs':
        rate = parseFloat(service.non_cghs_rate) || 0;
        console.log('Using non_cghs_rate:', rate);
        break;
      default:
        rate = parseFloat(service.private_rate) || 0; // Default to private rate
        console.log('Using default private_rate:', rate);
        break;
    }

    return rate;
  };

  const createServicesFromBillData = () => {
    const services = [];
    let srNo = 1;

    // If filter is set to lab or radiology, show only that data
    if (chargeFilter === 'lab') {
      console.log('Creating lab services (with rate recalculation), labOrdersData:', labOrdersData);

      if (labOrdersData && labOrdersData.length > 0) {
        // Get patient info to determine correct rate type
        const patientType = (visitData?.patient_type || visitData?.patients?.patient_type || '').toLowerCase().trim();
        const corporate = (visitData?.patients?.corporate || '').toLowerCase().trim();

        const hasCorporate = corporate.length > 0 && corporate !== 'private';
        const isPrivatePatient = !hasCorporate && (patientType === 'private' || corporate === 'private');
        const usesNonNABHRate = hasCorporate && (corporate.includes('cghs') || corporate.includes('echs') || corporate.includes('esic'));
        const usesBhopaliNABHRate = hasCorporate && (corporate.includes('mp police') || corporate.includes('ordnance factory'));
        const usesNABHRate = hasCorporate && !usesNonNABHRate && !usesBhopaliNABHRate;

        labOrdersData.forEach((visitLab) => {
          const labDetail = visitLab.lab;
          const quantity = visitLab.quantity || 1;

          // Use saved rate from visit_labs instead of recalculating
          const correctUnitRate = visitLab.cost || visitLab.unit_rate || 0;

          const finalCost = correctUnitRate * quantity;

          services.push({
            srNo: srNo++,
            item: labDetail?.name || 'Lab Test',
            rate: correctUnitRate,
            qty: quantity,
            amount: finalCost,
            type: 'lab'
          });
        });
      } else {
        console.log('No visit labs data found');
      }
      console.log('Lab services created:', services);
      return services;
    }

    if (chargeFilter === 'radiology') {
      console.log('=== CREATING RADIOLOGY SERVICES ===');
      console.log('radiologyOrdersData:', radiologyOrdersData);
      console.log('radiologyOrdersData length:', radiologyOrdersData?.length);

      // Show visit radiology tests data
      if (radiologyOrdersData && radiologyOrdersData.length > 0) {
        radiologyOrdersData.forEach((visitRadiology) => {
          console.log('Processing visit radiology test:', visitRadiology);
          // Use actual cost from visit_radiology table (stored cost for this visit)
          const rate = visitRadiology.cost ? parseFloat(visitRadiology.cost.toString()) : (visitRadiology.unit_rate ? parseFloat(visitRadiology.unit_rate.toString()) : 1000);

          console.log('Radiology test details:', {
            name: visitRadiology.radiology?.name,
            storedCost: visitRadiology.cost,
            unitRate: visitRadiology.unit_rate,
            rate: rate,
            id: visitRadiology.radiology?.id
          });
          services.push({
            srNo: srNo++,
            item: visitRadiology.radiology?.name || 'Radiology Procedure',
            rate: rate,
            qty: 1,
            amount: rate,
            type: 'radiology'
          });
        });
      } else {
        console.log('No visit radiology tests data found - empty or null array');
      }
      console.log('Radiology services created:', services);
      return services;
    }

    if (chargeFilter === 'surgery') {
      console.log('=== CREATING SURGERY SERVICES ===');
      console.log('surgeryOrdersData:', surgeryOrdersData);
      console.log('surgeryOrdersData length:', surgeryOrdersData?.length);

      if (surgeryOrdersData && surgeryOrdersData.length > 0) {
        surgeryOrdersData.forEach((visitSurgery: any) => {
          console.log('Processing visit surgery:', visitSurgery);
          const rateStr = visitSurgery.cghs_surgery?.NABH_NABL_Rate || '0';
          const surgeryRate = parseFloat(String(rateStr).replace(/[^\d.]/g, '')) || 0;

          console.log('Surgery details:', {
            name: visitSurgery.cghs_surgery?.name,
            code: visitSurgery.cghs_surgery?.code,
            rateStr: rateStr,
            rate: surgeryRate
          });

          services.push({
            srNo: srNo++,
            item: visitSurgery.cghs_surgery?.name || 'Surgery',
            rate: surgeryRate,
            qty: 1,
            amount: surgeryRate,
            type: 'surgery'
          });
        });
      } else {
        console.log('No surgery orders data found');
      }
      console.log('Surgery services created:', services);
      return services;
    }

    if (chargeFilter === 'implants') {
      console.log('=== CREATING IMPLANT SERVICES ===');
      console.log('implantOrdersData:', implantOrdersData);

      if (implantOrdersData && implantOrdersData.length > 0) {
        implantOrdersData.forEach((visitImplant: any) => {
          const rate = parseFloat(visitImplant.rate) || 0;
          const qty = visitImplant.quantity || 1;
          const amount = parseFloat(visitImplant.amount) || (rate * qty);

          services.push({
            srNo: srNo++,
            item: visitImplant.implant_name || 'Implant',
            rate: rate,
            qty: qty,
            amount: amount,
            type: 'implant'
          });
        });
      } else {
        console.log('No implant orders data found');
      }
      console.log('Implant services created:', services);
      return services;
    }

    if (chargeFilter === 'accommodation') {
      console.log('=== CREATING ACCOMMODATION SERVICES ===');
      console.log('accommodationData:', accommodationData);

      if (accommodationData && accommodationData.length > 0) {
        accommodationData.forEach((visitAccom: any) => {
          const rate = parseFloat(visitAccom.amount) || parseFloat(visitAccom.rate_used) || 0;
          const days = visitAccom.days || 1;

          services.push({
            srNo: srNo++,
            item: visitAccom.accommodation?.room_type || 'Accommodation',
            rate: rate,
            qty: days,
            amount: rate,
            type: 'accommodation'
          });
        });
      }
      console.log('Accommodation services created:', services);
      return services;
    }

    // Default: show all charges (bill data + lab + radiology + mandatory services + clinical services)
    // Helper functions to categorize services
    const isRegistrationCharges = (name: string) => name?.toLowerCase().includes('registration');
    const isDoctorCharges = (name: string) => name?.toLowerCase().includes('doctor charges');
    const isSurgeonEntry = (name: string) => /^(dr\.|dr\s)/i.test(name?.trim() || '');

    // Don't add static General Ward - let mandatory services be the primary charges
    if (!billData?.bill_sections) {
      // Start with empty services array - mandatory services will be added later
      console.log('No bill sections found, starting with empty services array');
    } else {
      // Add bill sections if they exist
      billData.bill_sections.forEach((section) => {
      if (section.bill_line_items && section.bill_line_items.length > 0) {
        section.bill_line_items.forEach((item) => {
          services.push({
            srNo: srNo++,
            item: item.description || section.section_name,
            rate: item.rate || 0,
            qty: item.quantity || 1,
            amount: item.amount || 0,
            type: 'other'
          });
        });
      } else {
        // If no line items, use section data
        services.push({
          srNo: srNo++,
          item: section.section_name,
          rate: section.total_amount || 0,
          qty: 1,
          amount: section.total_amount || 0,
          type: 'other'
        });
      }
      });
    }

    // NOW INCLUDING lab and radiology charges in "All Charges" view as SUMMARY LINES
    // Calculate lab charges by recalculating rates dynamically (same logic as Final Bill)
    console.log('=== CALCULATING LABORATORY CHARGES (DYNAMIC RATE CALCULATION) ===');
    console.log('labOrdersData:', labOrdersData);
    console.log('visitData patient info:', visitData?.patients);

    let totalLabCharges = 0;

    if (labOrdersData && labOrdersData.length > 0) {
      // Get patient info to determine correct rate type
      const patientType = (visitData?.patient_type || visitData?.patients?.patient_type || '').toLowerCase().trim();
      const corporate = (visitData?.patients?.corporate || '').toLowerCase().trim();

      // Corporate field takes priority - check if patient has a corporate panel first
      const hasCorporate = corporate.length > 0 && corporate !== 'private';

      // Patient is private ONLY if they don't have a corporate panel
      const isPrivatePatient = !hasCorporate && (patientType === 'private' || corporate === 'private');

      // Check if corporate qualifies for Non-NABH rates (CGHS/ECHS/ESIC)
      const usesNonNABHRate = hasCorporate &&
        (corporate.includes('cghs') ||
        corporate.includes('echs') ||
        corporate.includes('esic'));

      // Check if corporate qualifies for Bhopal NABH rates
      const usesBhopaliNABHRate = hasCorporate &&
        (corporate.includes('mp police') ||
        corporate.includes('ordnance factory') ||
        corporate.includes('ordnance factory itarsi'));

      // Check if patient has other corporate
      const usesNABHRate = hasCorporate && !usesNonNABHRate && !usesBhopaliNABHRate;

      console.log('🔍 Patient Type Determination:', {
        patientType,
        corporate,
        isPrivatePatient,
        hasCorporate,
        usesNonNABHRate,
        usesBhopaliNABHRate,
        usesNABHRate
      });

      // USE STORED COST from visit_labs table (same as Final Bill)
      labOrdersData.forEach((visitLab, index) => {
        const labDetail = visitLab.lab;

        // Use the stored cost from visit_labs table instead of recalculating
        const storedCost = visitLab.cost || 0;

        console.log(`Lab ${index + 1}: ${labDetail?.name}`, {
          storedCost: storedCost,
          usingSavedCost: true
        });

        totalLabCharges += storedCost;
      });

      console.log('✅ Total lab charges (using stored costs):', totalLabCharges);
    }

    // Add single summary line for all lab charges if total > 0
    if (totalLabCharges > 0) {
      console.log(`📊 Adding Laboratory Charges summary line: ₹${totalLabCharges}`);
      services.push({
        srNo: srNo++,
        item: 'Laboratory Charges',
        rate: totalLabCharges,
        qty: 1,
        amount: totalLabCharges,
        type: 'lab'
      });
    } else {
      console.warn('⚠️ Total lab charges is 0! No lab tests found or all rates are 0.');
    }

    // Calculate total radiology charges and add as single line
    console.log('Calculating total radiology charges for All Charges view');
    let totalRadiologyCharges = 0;
    if (radiologyOrdersData && radiologyOrdersData.length > 0) {
      radiologyOrdersData.forEach((visitRadiology) => {
        // Use stored cost from visit_radiology table
        const rate = visitRadiology.cost ? parseFloat(visitRadiology.cost.toString()) : (visitRadiology.unit_rate ? parseFloat(visitRadiology.unit_rate.toString()) : 1000);
        totalRadiologyCharges += rate;
        console.log('Adding radiology to total:', {
          name: visitRadiology.radiology?.name,
          storedCost: visitRadiology.cost,
          unitRate: visitRadiology.unit_rate,
          rate: rate
        });
      });

      // Add single summary line for all radiology charges
      if (totalRadiologyCharges > 0) {
        console.log('Adding Radiology Charges summary line:', totalRadiologyCharges);
        services.push({
          srNo: srNo++,
          item: 'Radiology Charges',
          rate: totalRadiologyCharges,
          qty: 1,
          amount: totalRadiologyCharges,
          type: 'radiology'
        });
      }
    }

    // Add mandatory services from junction table (actual saved services with correct rates)
    console.log('=== MANDATORY SERVICES INTEGRATION (JUNCTION TABLE) ===');
    console.log('mandatoryServicesData:', mandatoryServicesData);
    console.log('mandatoryServicesData length:', mandatoryServicesData?.length);

    // ===== 1. REGISTRATION CHARGES (from mandatory services - if exists) =====
    console.log('=== 1. REGISTRATION CHARGES ===');
    if (mandatoryServicesData && mandatoryServicesData.length > 0) {
      const registrationServices = mandatoryServicesData.filter((s) => isRegistrationCharges(s.service_name));
      console.log('Registration charges services found:', registrationServices.length);

      registrationServices.forEach((mandatoryService) => {
        const startDate = mandatoryService.start_date ? format(new Date(mandatoryService.start_date), 'dd-MM-yyyy') : '';
        const endDate = mandatoryService.end_date ? format(new Date(mandatoryService.end_date), 'dd-MM-yyyy') : '';

        let days = mandatoryService.quantity || 1;
        if (mandatoryService.start_date && mandatoryService.end_date) {
          const start = new Date(mandatoryService.start_date);
          const end = new Date(mandatoryService.end_date);
          days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        }

        const rate = mandatoryService.rate_used || mandatoryService.amount || 0;
        const amount = (mandatoryService.start_date && mandatoryService.end_date)
          ? (rate * days)
          : (mandatoryService.amount || (rate * days));

        const dateRange = startDate && endDate ? ` (${startDate} to ${endDate})` : '';
        const itemDescription = `${mandatoryService.service_name}${dateRange}`;

        if (rate > 0) {
          services.push({
            srNo: srNo++,
            item: itemDescription,
            rate: rate,
            qty: days,
            amount: amount,
            type: 'registration'
          });
        }
      });
    }

    // ===== 2. CONSULTANT DOCTOR CHARGES (from mandatory services) =====
    console.log('=== 2. CONSULTANT DOCTOR CHARGES ===');
    if (mandatoryServicesData && mandatoryServicesData.length > 0) {
      const doctorChargesServices = mandatoryServicesData.filter((s) => isDoctorCharges(s.service_name));
      console.log('Doctor charges services found:', doctorChargesServices.length);

      doctorChargesServices.forEach((mandatoryService) => {
        const startDate = mandatoryService.start_date ? format(new Date(mandatoryService.start_date), 'dd-MM-yyyy') : '';
        const endDate = mandatoryService.end_date ? format(new Date(mandatoryService.end_date), 'dd-MM-yyyy') : '';

        let days = mandatoryService.quantity || 1;
        if (mandatoryService.start_date && mandatoryService.end_date) {
          const start = new Date(mandatoryService.start_date);
          const end = new Date(mandatoryService.end_date);
          days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        }

        const rate = mandatoryService.rate_used || mandatoryService.amount || 0;
        const amount = (mandatoryService.start_date && mandatoryService.end_date)
          ? (rate * days)
          : (mandatoryService.amount || (rate * days));

        const dateRange = startDate && endDate ? ` (${startDate} to ${endDate})` : '';
        const itemDescription = `${mandatoryService.service_name}${dateRange}`;

        if (rate > 0) {
          services.push({
            srNo: srNo++,
            item: itemDescription,
            rate: rate,
            qty: days,
            amount: amount,
            type: 'doctor'
          });
        }
      });
    }

    // ===== 3. ACCOMMODATION CHARGES =====
    console.log('=== 3. ACCOMMODATION CHARGES ===');
    console.log('accommodationData:', accommodationData);
    console.log('accommodationData length:', accommodationData?.length);

    if (accommodationData && accommodationData.length > 0) {
      accommodationData.forEach((visitAccom: any) => {
        const roomType = visitAccom.accommodation?.room_type || 'Accommodation';
        const startDate = visitAccom.start_date ? format(new Date(visitAccom.start_date), 'dd-MM-yyyy') : '';
        const endDate = visitAccom.end_date ? format(new Date(visitAccom.end_date), 'dd-MM-yyyy') : '';

        let days = 1;
        if (visitAccom.start_date && visitAccom.end_date) {
          const start = new Date(visitAccom.start_date);
          const end = new Date(visitAccom.end_date);
          days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        }

        const ratePerDay = parseFloat(visitAccom.rate_used) || 0;
        const totalAmount = parseFloat(visitAccom.amount) || (ratePerDay * days);

        const dateRange = startDate && endDate ? ` (${startDate} to ${endDate})` : '';
        const itemDescription = `${roomType}${dateRange}`;

        console.log('Adding accommodation line:', {
          room_type: roomType,
          startDate,
          endDate,
          days,
          ratePerDay,
          totalAmount
        });

        services.push({
          srNo: srNo++,
          item: itemDescription,
          rate: ratePerDay,
          qty: days,
          amount: totalAmount,
          type: 'accommodation'
        });
      });
    } else {
      console.log('No accommodation data found for this visit');
    }

    // ===== 4. SURGERY CHARGES =====
    console.log('=== 4. SURGERY CHARGES ===');
    console.log('surgeryOrdersData:', surgeryOrdersData);
    console.log('surgeryOrdersData length:', surgeryOrdersData?.length);

    let totalSurgeryCharges = 0;
    if (surgeryOrdersData && surgeryOrdersData.length > 0) {
      surgeryOrdersData.forEach((visitSurgery: any) => {
        const surgeryRate = visitSurgery.rate && visitSurgery.rate > 0
          ? Number(visitSurgery.rate)
          : parseFloat(String(visitSurgery.cghs_surgery?.NABH_NABL_Rate || '0').replace(/[^\d.]/g, '')) || 0;
        totalSurgeryCharges += surgeryRate;
        console.log('Adding surgery to total:', {
          name: visitSurgery.cghs_surgery?.name,
          storedRate: visitSurgery.rate,
          surgeryRate: surgeryRate
        });
      });

      if (totalSurgeryCharges > 0) {
        console.log('Adding Surgery Charges summary line:', totalSurgeryCharges);
        services.push({
          srNo: srNo++,
          item: 'Surgery Charges',
          rate: totalSurgeryCharges,
          qty: 1,
          amount: totalSurgeryCharges,
          type: 'surgery'
        });
      }
    } else {
      console.log('No surgery orders found for this visit');
    }

    // ===== 5. IMPLANT CHARGES (from surgery data) =====
    console.log('=== 4. IMPLANT CHARGES ===');
    let totalImplantCharges = 0;
    if (surgeryOrdersData && surgeryOrdersData.length > 0) {
      surgeryOrdersData.forEach((visitSurgery: any) => {
        const implantCost = parseFloat(visitSurgery.implant_cost) || 0;
        if (implantCost > 0) {
          totalImplantCharges += implantCost;
          console.log('Adding implant cost:', {
            surgery: visitSurgery.cghs_surgery?.name,
            implantCost: implantCost
          });
        }
      });

      if (totalImplantCharges > 0) {
        console.log('Adding Implant Charges summary line:', totalImplantCharges);
        services.push({
          srNo: srNo++,
          item: 'Implant Charges',
          rate: totalImplantCharges,
          qty: 1,
          amount: totalImplantCharges,
          type: 'implant'
        });
      }
    }

    // ===== 6. ANESTHETIST CHARGES =====
    console.log('=== 5. ANESTHETIST CHARGES ===');
    console.log('anesthetistData:', anesthetistData);
    console.log('anesthetistData length:', anesthetistData?.length);

    let totalAnesthetistCharges = 0;
    if (anesthetistData && anesthetistData.length > 0) {
      anesthetistData.forEach((anesthetist: any) => {
        const anesthetistRate = parseFloat(anesthetist.rate) || 0;
        totalAnesthetistCharges += anesthetistRate;
        console.log('Adding anesthetist to total:', {
          name: anesthetist.anesthetist_name,
          type: anesthetist.anesthetist_type,
          rate: anesthetistRate
        });
      });

      if (totalAnesthetistCharges > 0) {
        const anesthetistNames = anesthetistData.map((a: any) => a.anesthetist_name).filter(Boolean).join(', ');
        console.log('Adding Anesthetist Charges summary line:', totalAnesthetistCharges, 'Names:', anesthetistNames);
        services.push({
          srNo: srNo++,
          item: anesthetistNames ? `Anesthetist Charges - ${anesthetistNames}` : 'Anesthetist Charges',
          rate: totalAnesthetistCharges,
          qty: 1,
          amount: totalAnesthetistCharges,
          type: 'anesthetist'
        });
      }
    } else {
      console.log('No anesthetist data found for this visit');
    }

    // ===== 7. SURGEON DOCTOR RATE (individual doctor name entries) =====
    console.log('=== 6. SURGEON DOCTOR ENTRIES ===');
    // From mandatory services - entries starting with Dr. or DR.
    if (mandatoryServicesData && mandatoryServicesData.length > 0) {
      const surgeonServices = mandatoryServicesData.filter((s) =>
        isSurgeonEntry(s.service_name) && !isDoctorCharges(s.service_name)
      );
      console.log('Surgeon services found in mandatory:', surgeonServices.length);

      surgeonServices.forEach((mandatoryService) => {
        const startDate = mandatoryService.start_date ? format(new Date(mandatoryService.start_date), 'dd-MM-yyyy') : '';
        const endDate = mandatoryService.end_date ? format(new Date(mandatoryService.end_date), 'dd-MM-yyyy') : '';

        let days = mandatoryService.quantity || 1;
        if (mandatoryService.start_date && mandatoryService.end_date) {
          const start = new Date(mandatoryService.start_date);
          const end = new Date(mandatoryService.end_date);
          days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        }

        const rate = mandatoryService.rate_used || mandatoryService.amount || 0;
        const amount = (mandatoryService.start_date && mandatoryService.end_date)
          ? (rate * days)
          : (mandatoryService.amount || (rate * days));

        const dateRange = startDate && endDate ? ` (${startDate} to ${endDate})` : '';
        const itemDescription = `${mandatoryService.service_name}${dateRange}`;

        if (rate > 0) {
          services.push({
            srNo: srNo++,
            item: itemDescription,
            rate: rate,
            qty: days,
            amount: amount,
            type: 'surgeon'
          });
        }
      });
    }

    // From clinical services - entries starting with Dr. or DR.
    if (clinicalServicesData && clinicalServicesData.length > 0) {
      const surgeonClinicalServices = clinicalServicesData.filter((s) => isSurgeonEntry(s.service_name));
      console.log('Surgeon services found in clinical:', surgeonClinicalServices.length);

      surgeonClinicalServices.forEach((clinicalService) => {
        const startDate = clinicalService.start_date ? format(new Date(clinicalService.start_date), 'dd-MM-yyyy') : '';
        const endDate = clinicalService.end_date ? format(new Date(clinicalService.end_date), 'dd-MM-yyyy') : '';

        let days = clinicalService.quantity || 1;
        if (clinicalService.start_date && clinicalService.end_date) {
          const start = new Date(clinicalService.start_date);
          const end = new Date(clinicalService.end_date);
          days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        }

        const rate = clinicalService.rate_used || clinicalService.amount || 0;
        const amount = (clinicalService.start_date && clinicalService.end_date)
          ? (rate * days)
          : (clinicalService.amount || (rate * days));

        const dateRange = startDate && endDate ? ` (${startDate} to ${endDate})` : '';
        const itemDescription = `${clinicalService.service_name}${dateRange}`;

        if (rate > 0) {
          services.push({
            srNo: srNo++,
            item: itemDescription,
            rate: rate,
            qty: days,
            amount: amount,
            type: 'surgeon'
          });
        }
      });
    }

    // ===== 8. CLINICAL SERVICES (excluding surgeon entries) =====
    console.log('=== 7. CLINICAL SERVICES ===');
    console.log('clinicalServicesData:', clinicalServicesData);
    console.log('clinicalServicesData length:', clinicalServicesData?.length);

    if (clinicalServicesData && clinicalServicesData.length > 0) {
      const regularClinicalServices = clinicalServicesData.filter((s) => !isSurgeonEntry(s.service_name));
      console.log('Regular clinical services (non-surgeon):', regularClinicalServices.length);

      regularClinicalServices.forEach((clinicalService) => {
        const startDate = clinicalService.start_date ? format(new Date(clinicalService.start_date), 'dd-MM-yyyy') : '';
        const endDate = clinicalService.end_date ? format(new Date(clinicalService.end_date), 'dd-MM-yyyy') : '';

        let days = clinicalService.quantity || 1;
        if (clinicalService.start_date && clinicalService.end_date) {
          const start = new Date(clinicalService.start_date);
          const end = new Date(clinicalService.end_date);
          days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        }

        const rate = clinicalService.rate_used || clinicalService.amount || 0;
        const amount = (clinicalService.start_date && clinicalService.end_date)
          ? (rate * days)
          : (clinicalService.amount || (rate * days));

        const dateRange = startDate && endDate ? ` (${startDate} to ${endDate})` : '';
        const itemDescription = `${clinicalService.service_name}${dateRange}`;

        if (rate > 0) {
          console.log('Adding clinical service to invoice:', itemDescription, 'Rate:', rate);
          services.push({
            srNo: srNo++,
            item: itemDescription,
            rate: rate,
            qty: days,
            amount: amount,
            type: 'clinical'
          });
        }
      });
    } else {
      console.log('No clinical services found in junction table for this visit');
    }

    // ===== 9. MANDATORY SERVICES (excluding registration, doctor charges and surgeon entries) =====
    console.log('=== 9. MANDATORY SERVICES ===');
    console.log('mandatoryServicesData:', mandatoryServicesData);
    console.log('mandatoryServicesData length:', mandatoryServicesData?.length);

    if (mandatoryServicesData && mandatoryServicesData.length > 0) {
      const regularMandatoryServices = mandatoryServicesData.filter((s) =>
        !isRegistrationCharges(s.service_name) && !isDoctorCharges(s.service_name) && !isSurgeonEntry(s.service_name)
      );
      console.log('Regular mandatory services (non-registration, non-doctor):', regularMandatoryServices.length);

      regularMandatoryServices.forEach((mandatoryService) => {
        const startDate = mandatoryService.start_date ? format(new Date(mandatoryService.start_date), 'dd-MM-yyyy') : '';
        const endDate = mandatoryService.end_date ? format(new Date(mandatoryService.end_date), 'dd-MM-yyyy') : '';

        let days = mandatoryService.quantity || 1;
        if (mandatoryService.start_date && mandatoryService.end_date) {
          const start = new Date(mandatoryService.start_date);
          const end = new Date(mandatoryService.end_date);
          days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        }

        const rate = mandatoryService.rate_used || mandatoryService.amount || 0;
        const amount = (mandatoryService.start_date && mandatoryService.end_date)
          ? (rate * days)
          : (mandatoryService.amount || (rate * days));

        const dateRange = startDate && endDate ? ` (${startDate} to ${endDate})` : '';
        const itemDescription = `${mandatoryService.service_name}${dateRange}`;

        if (rate > 0) {
          console.log('Adding mandatory service to invoice:', itemDescription, 'Rate:', rate);
          services.push({
            srNo: srNo++,
            item: itemDescription,
            rate: rate,
            qty: days,
            amount: amount,
            type: 'mandatory'
          });
        }
      });
    } else {
      console.log('No mandatory services found in junction table for this visit');
    }

    return services;
  };

  // Calculate actual financial amounts from database
  const calculateActualAmounts = () => {
    console.log('=== CALCULATING FINANCIAL AMOUNTS ===');

    const totalBillAmount = billData?.total_amount || 0;
    console.log('Total Bill Amount:', totalBillAmount);

    // Calculate total payments from advance_payment table (primary source)
    let advancePaymentTotal = 0;
    let advancePaymentRefunded = 0;

    if (advancePaymentData && advancePaymentData.length > 0) {
      advancePaymentData.forEach(payment => {
        const amount = parseFloat(payment.advance_amount) || 0;
        const returnedAmount = parseFloat(payment.returned_amount) || 0;

        if (payment.is_refund) {
          advancePaymentRefunded += returnedAmount;
        } else {
          advancePaymentTotal += amount;
        }
      });
    }

    const netAdvancePayment = advancePaymentTotal - advancePaymentRefunded;

    console.log('💵 Advance Payment Data:', advancePaymentData);
    console.log('💵 Advance Payment Total:', advancePaymentTotal);
    console.log('💵 Advance Payment Refunded:', advancePaymentRefunded);
    console.log('💵 Net Advance Payment:', netAdvancePayment);

    // Fallback: Calculate total payments from accounting_transactions (if no advance_payment data)
    console.log('Payment Data (accounting_transactions):', paymentData);
    console.log('Advance Data (accounting_transactions):', advanceData);

    const totalPayments = (paymentData || []).reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const totalAdvances = (advanceData || []).reduce((sum, advance) => sum + (advance.amount || 0), 0);
    const accountingTransactionsTotal = totalPayments + totalAdvances;

    console.log('💵 Total Payments (accounting_transactions):', totalPayments);
    console.log('💵 Total Advances (accounting_transactions):', totalAdvances);
    console.log('💵 Total from accounting_transactions:', accountingTransactionsTotal);

    // Use advance_payment data if available, otherwise fall back to accounting_transactions
    const advanceAmount = netAdvancePayment > 0 ? netAdvancePayment : accountingTransactionsTotal;

    // Add final payment amount
    const finalPaymentAmount = finalPaymentData?.amount || 0;
    console.log('💵 Final Payment Amount:', finalPaymentAmount);

    // Total Amount Paid = Advance Payment + Final Payment
    const totalAmountPaid = advanceAmount + finalPaymentAmount;

    console.log('💵 FINAL Total Amount Paid (Advance + Final):', totalAmountPaid);

    // Get discount from visit_discounts table (same as Final Bill)
    const discountAmount = discountData || 0;
    console.log('💰 Using discount from visit_discounts table:', discountAmount);

    // Calculate balance
    const balance = totalBillAmount - totalAmountPaid - discountAmount;
    console.log('💳 Balance:', balance);

    return {
      total: totalBillAmount,
      amountPaid: totalAmountPaid,
      discount: discountAmount,
      balance: balance
    };
  };

  const actualAmounts = calculateActualAmounts();

  // Create invoice data from fetched data
  const invoiceData = {
    patientName: patient?.name || 'N/A',
    age: patient?.date_of_birth ? calculateAge(patient.date_of_birth) : (patient?.age ? `${patient.age}Y 0M 0D` : 'N/A'),
    sex: patient?.gender || 'N/A',
    address: patient?.address || 'N/A',
    registrationDate: visitData.admission_date
      ? format(new Date(visitData.admission_date), 'dd/MM/yyyy HH:mm:ss')
      : visitData.visit_date
        ? format(new Date(visitData.visit_date), 'dd/MM/yyyy HH:mm:ss')
        : visitData.created_at
          ? format(new Date(visitData.created_at), 'dd/MM/yyyy HH:mm:ss')
          : 'N/A',
    dischargeDate: visitData.discharge_date ? format(new Date(visitData.discharge_date), 'dd/MM/yyyy HH:mm:ss') : '',
    invoiceNo: billData?.bill_no || visitData.visit_id || 'N/A',
    registrationNo: patient?.patients_id || visitData.visit_id || 'N/A',
    category: visitData?.patients?.corporate || billData?.category || 'Private',
    primaryConsultant: visitData.referring_doctor
      || visitData.appointment_with
      || visitData.consultant
      || 'N/A',
    hospitalServiceTaxNo: 'ABUPK3997PSD001',
    hospitalPan: 'AAECD9144P',
    services: createServicesFromBillData(),
    total: actualAmounts.total,
    amountPaid: actualAmounts.amountPaid,
    discount: actualAmounts.discount,
    balance: actualAmounts.balance,
    amountInWords: convertAmountToWords(actualAmounts.total)
  };

  // Filter services based on hideLabRadiology state
  const getVisibleServices = () => {
    if (hideLabRadiology && chargeFilter === 'all') {
      // Filter out lab and radiology services
      return invoiceData.services.filter(service =>
        service.type !== 'lab' && service.type !== 'radiology'
      );
    }
    return invoiceData.services;
  };

  const visibleServices = getVisibleServices();

  // Calculate dynamic total based on filter selection and visible services
  const calculateVisibleTotal = () => {
    return visibleServices.reduce((total, service) => {
      // Ensure amount is converted to number to avoid string concatenation
      const amount = typeof service.amount === 'string' ? parseFloat(service.amount) || 0 : service.amount || 0;
      return total + amount;
    }, 0);
  };

  const visibleTotal = calculateVisibleTotal();

  // Calculate current discount and balance using actual data
  const currentDiscount = discountRemoved ? 0 : actualAmounts.discount;
  const currentBalance = visibleTotal - actualAmounts.amountPaid - currentDiscount;

  // Print functionality - matches exact screenshot format
  const handlePrint = () => {
    // Create print window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Failed to open print window. Please check popup blockers.');
      return;
    }

    // Create the exact print document matching the screenshot
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${new Date().toLocaleDateString('en-IN')}</title>
          <meta charset="UTF-8">
          <style>
            body {
              margin: 0;
              padding: 20px;
              font-family: Arial, sans-serif;
              background: white;
              font-size: 12px;
            }

            .print-header {
              text-align: center;
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 30px;
            }

            .invoice-container {
              border: 2px solid #000;
              padding: 15px;
            }

            .patient-info {
              margin-bottom: 20px;
              border: 1px solid #000;
              padding: 10px;
            }

            .patient-info table {
              width: 100%;
              border-collapse: collapse;
            }

            .patient-info td {
              border: none;
              padding: 3px 0;
              font-size: 12px;
              vertical-align: top;
            }

            .patient-info .label {
              width: 20%;
              font-weight: bold;
            }

            .patient-info .colon {
              width: 2%;
            }

            .patient-info .value {
              width: 78%;
            }

            .services-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }

            .services-table th, .services-table td {
              border: 1px solid #000;
              padding: 6px;
              text-align: center;
              font-size: 11px;
            }

            .services-table th {
              background-color: #f0f0f0;
              font-weight: bold;
            }

            .services-table .item-column {
              text-align: left;
            }

            .amount-section {
              display: flex;
              margin-top: 20px;
            }

            .amount-words {
              flex: 1;
              padding-right: 20px;
              font-size: 11px;
            }

            .amount-table {
              width: 300px;
            }

            .amount-table table {
              width: 100%;
              border-collapse: collapse;
            }

            .amount-table td {
              border: 1px solid #000;
              padding: 6px;
              font-size: 11px;
            }

            .amount-table .label-cell {
              background-color: #f0f0f0;
              font-weight: bold;
              width: 50%;
            }

            .footer-info {
              margin-top: 20px;
              font-size: 11px;
            }

            .hospital-footer {
              text-align: center;
              margin-top: 30px;
            }

            .hospital-name {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 20px;
            }

            .signatures {
              display: flex;
              justify-content: space-around;
              margin-top: 20px;
            }

            .signature-item {
              text-align: center;
              font-size: 10px;
            }

            .note {
              margin-top: 20px;
              font-size: 10px;
            }

            @page {
              size: A4;
              margin: 0.5in;
            }
          </style>
        </head>
        <body>
          <div class="print-header">${hospitalName}</div>

          <div class="invoice-container">
            <!-- Patient Information -->
            <div class="patient-info">
              <table>
                <tr>
                  <td class="label">Name Of Patient</td>
                  <td class="colon">:</td>
                  <td class="value">${invoiceData.patientName}</td>
                </tr>
                <tr>
                  <td class="label">Age/Sex</td>
                  <td class="colon">:</td>
                  <td class="value">${invoiceData.age}/${invoiceData.sex}</td>
                </tr>
                <tr>
                  <td class="label">Address</td>
                  <td class="colon">:</td>
                  <td class="value">${invoiceData.address}</td>
                </tr>
                <tr>
                  <td class="label">Date Of Registration</td>
                  <td class="colon">:</td>
                  <td class="value">${invoiceData.registrationDate}</td>
                </tr>
                <tr>
                  <td class="label">Date Of Discharge</td>
                  <td class="colon">:</td>
                  <td class="value">${invoiceData.dischargeDate}</td>
                </tr>
                <tr>
                  <td class="label">Invoice No.</td>
                  <td class="colon">:</td>
                  <td class="value">${invoiceData.invoiceNo}</td>
                </tr>
                <tr>
                  <td class="label">Registration No.</td>
                  <td class="colon">:</td>
                  <td class="value">${invoiceData.registrationNo}</td>
                </tr>
                <tr>
                  <td class="label">Category</td>
                  <td class="colon">:</td>
                  <td class="value">${invoiceData.category}</td>
                </tr>
                <tr>
                  <td class="label">Primary Consultant</td>
                  <td class="colon">:</td>
                  <td class="value">${invoiceData.primaryConsultant}</td>
                </tr>
              </table>
            </div>

            <!-- Services Table -->
            <table class="services-table">
              <thead>
                <tr>
                  <th>Sr. No.</th>
                  <th>Item</th>
                  <th>Rate</th>
                  <th>Qty.</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${visibleServices.map((service, index) => {
                  return `
                    <tr>
                      <td>${index + 1}</td>
                      <td class="item-column">${service.item}</td>
                      <td>${service.rate}</td>
                      <td>${service.qty}</td>
                      <td>${service.amount}</td>
                    </tr>
                  `;
                }).join('')}
                <tr>
                  <td colspan="4" style="font-weight: bold;">Total</td>
                  <td style="font-weight: bold;">Rs ${visibleTotal.toLocaleString()}.00</td>
                </tr>
              </tbody>
            </table>

            <!-- Amount Section -->
            <div class="amount-section">
              <div class="amount-words">
                <strong>Amount Chargeable (in words)</strong><br>
                ${convertAmountToWords(visibleTotal)}
              </div>

              <div class="amount-table">
                <table>
                  <tr>
                    <td class="label-cell">Amount Paid</td>
                    <td style="text-align: right;">Rs ${invoiceData.amountPaid.toLocaleString()}.00</td>
                  </tr>
                  <tr>
                    <td class="label-cell">Discount</td>
                    <td style="text-align: right;">Rs ${currentDiscount.toLocaleString()}.00</td>
                  </tr>
                  <tr>
                    <td class="label-cell">Balance</td>
                    <td style="text-align: right;">Rs ${currentBalance >= 0 ? currentBalance.toLocaleString() : `(${Math.abs(currentBalance).toLocaleString()})`}.00</td>
                  </tr>
                </table>
              </div>
            </div>

            <!-- Footer Information -->
            <div class="footer-info">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span>Hospital Service Tax No. : ${invoiceData.hospitalServiceTaxNo}</span>
                <span>Hospitals PAN : ${invoiceData.hospitalPan}</span>
              </div>
              <div style="margin-bottom: 20px;">
                <strong>Signature of Patient :</strong>
              </div>
            </div>

            <!-- Hospital Footer -->
            <div class="hospital-footer">
              <div class="hospital-name">${hospitalName}</div>
              <div class="signatures">
                <div class="signature-item">Bill Manager</div>
                <div class="signature-item">Cashier</div>
                <div class="signature-item">Med.Supdt.</div>
                <div class="signature-item">Authorised<br>Signatory</div>
              </div>
            </div>

            <!-- Note -->
            <div class="note">
              <strong>NOTE:</strong> ** Indicates that calculated price may vary .Please ask for "Detailled Bill" to see the details.)
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();

    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Print and Close Buttons */}
        <div className="flex justify-between mb-4">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Print
            </button>
          </div>

          {/* Invoice Form */}
          <div className="border border-gray-300 p-4 invoice-content">
          {/* Patient Information Table */}
          <table className="w-full mb-4 text-sm">
            <tbody>
              <tr>
                <td className="py-1 pr-4 font-medium">Name Of Patient</td>
                <td className="py-1">: {invoiceData.patientName}</td>
              </tr>
              <tr>
                <td className="py-1 pr-4 font-medium">Age/Sex</td>
                <td className="py-1">: {invoiceData.age}/{invoiceData.sex}</td>
              </tr>
              <tr>
                <td className="py-1 pr-4 font-medium">Address</td>
                <td className="py-1">: {invoiceData.address}</td>
              </tr>
              <tr>
                <td className="py-1 pr-4 font-medium">Date Of Registration</td>
                <td className="py-1">: {invoiceData.registrationDate}</td>
              </tr>
              <tr>
                <td className="py-1 pr-4 font-medium">Date Of Discharge</td>
                <td className="py-1">: {invoiceData.dischargeDate}</td>
              </tr>
              <tr>
                <td className="py-1 pr-4 font-medium">Invoice No.</td>
                <td className="py-1">: {invoiceData.invoiceNo}</td>
              </tr>
              <tr>
                <td className="py-1 pr-4 font-medium">Registration No.</td>
                <td className="py-1">: {invoiceData.registrationNo}</td>
              </tr>
              <tr>
                <td className="py-1 pr-4 font-medium">Category</td>
                <td className="py-1">: {invoiceData.category}</td>
              </tr>
              <tr>
                <td className="py-1 pr-4 font-medium">Primary Consultant</td>
                <td className="py-1">: {invoiceData.primaryConsultant}</td>
              </tr>
            </tbody>
          </table>

          {/* Control Buttons and Dropdown */}
          <div className="flex justify-center gap-2 mb-4 flex-wrap items-center">
            <button
              onClick={() => setShowPharmacyCharges(!showPharmacyCharges)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
            >
              Show Pharmacy Charge
            </button>
            <button
              onClick={() => setHideLabRadiology(!hideLabRadiology)}
              className={`px-4 py-2 text-white rounded transition-colors text-sm ${
                hideLabRadiology
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-orange-500 hover:bg-orange-600'
              }`}
            >
              {hideLabRadiology ? 'Show Lab/Radiology' : 'Hide Lab/Radiology'}
            </button>
            <select
              value={chargeFilter}
              onChange={(e) => setChargeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Charges</option>
              <option value="lab">Lab Charges Only</option>
              <option value="radiology">Radiology Charges Only</option>
            </select>
          </div>

          {/* Services Table */}
          <table className="w-full border border-gray-400 text-sm mb-4">
            <thead>
              <tr>
                <th className="border border-gray-400 p-2 text-center">Sr. No.</th>
                <th className="border border-gray-400 p-2 text-center">Item</th>
                <th className="border border-gray-400 p-2 text-center">Rate</th>
                <th className="border border-gray-400 p-2 text-center">Qty.</th>
                <th className="border border-gray-400 p-2 text-center">Amount</th>
              </tr>
            </thead>
            <tbody>
              {visibleServices.map((service, index) => {
                return (
                  <tr key={service.srNo}>
                    <td className="border border-gray-400 p-2 text-center">{index + 1}</td>
                    <td className="border border-gray-400 p-2">{service.item}</td>
                    <td className="border border-gray-400 p-2 text-center">{service.rate}</td>
                    <td className="border border-gray-400 p-2 text-center">{service.qty}</td>
                    <td className="border border-gray-400 p-2 text-center">{service.amount}</td>
                  </tr>
                );
              })}
              <tr>
                <td className="border border-gray-400 p-2 text-center font-bold" colSpan={4}>Total</td>
                <td className="border border-gray-400 p-2 text-center font-bold">Rs {visibleTotal.toLocaleString()}.00</td>
              </tr>
            </tbody>
          </table>

          {/* Amount Details */}
          <div className="flex">
            <div className="w-1/2 pr-4">
              <div className="text-sm">
                <strong>Amount Chargeable (in words)</strong><br />
                {convertAmountToWords(visibleTotal)}
              </div>
            </div>
            {chargeFilter === 'all' && (
              <div className="w-1/2">
                <table className="w-full text-sm">
                  <tbody>
                    <tr>
                      <td className="border border-gray-400 p-2 bg-gray-100 font-medium">Amount Paid</td>
                      <td className="border border-gray-400 p-2 text-right">Rs {invoiceData.amountPaid.toLocaleString()}.00</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 p-2 bg-gray-100 font-medium">Discount</td>
                      <td className="border border-gray-400 p-2 text-right">Rs {currentDiscount.toLocaleString()}.00</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 p-2 bg-gray-100 font-medium">Balance</td>
                      <td className="border border-gray-400 p-2 text-right">Rs {currentBalance >= 0 ? currentBalance.toLocaleString() : `(${Math.abs(currentBalance).toLocaleString()})`}.00</td>
                    </tr>
                  </tbody>
                </table>

                {/* Remove Discount Button */}
                <div className="mt-2">
                  <button
                    onClick={() => setDiscountRemoved(!discountRemoved)}
                    className={`px-3 py-1 text-white rounded text-xs transition-colors ${
                      discountRemoved
                        ? 'bg-green-500 hover:bg-green-600'
                        : 'bg-red-500 hover:bg-red-600'
                    }`}
                  >
                    {discountRemoved ? 'Add Discount' : 'Remove Discount'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Information */}
          <div className="mt-6 text-sm">
            <div className="flex justify-between mb-2">
              <span>Hospital Service Tax No. : {invoiceData.hospitalServiceTaxNo}</span>
              <span>Hospitals PAN : {invoiceData.hospitalPan}</span>
            </div>
            <div className="mb-4">
              <strong>Signature of Patient :</strong>
            </div>

            {/* Hospital Name and Signatures */}
            <div className="text-center border-t border-gray-300 pt-4">
              <h2 className="text-lg font-bold mb-4">{hospitalName}</h2>
              <div className="flex justify-between text-center">
                <div>
                  <div className="mb-2">Bill Manager</div>
                </div>
                <div>
                  <div className="mb-2">Cashier</div>
                </div>
                <div>
                  <div className="mb-2">Med.Supdt.</div>
                </div>
                <div>
                  <div className="mb-2">Authorised<br />Signatory</div>
                </div>
              </div>
            </div>

            {/* Note */}
            <div className="mt-4 text-xs">
              <strong>NOTE:</strong> ** Indicates that calculated price may vary .Please ask for "Detailled Bill" to see the details.)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invoice;
