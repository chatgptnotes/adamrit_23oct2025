import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Interface for combined voucher and payment details
 */
export interface PaymentDetails {
  // Voucher Information
  voucher_id: string;
  voucher_number: string;
  voucher_date: string;
  voucher_narration: string;
  voucher_status: string;
  voucher_amount: number;

  // Payment Information
  payment_id: string;
  payment_mode: string;
  reference_number: string | null;
  remarks: string | null;
  billing_executive: string | null;
  patient_name: string;
  patient_id: string;
  registration_no: string | null;
  visit_id: string | null;
  payment_date: string;
  advance_amount: number;
  is_refund: boolean;
  refund_reason: string | null;
}

/**
 * Hook to fetch complete payment details by voucher number
 * Queries vouchers table first, then links to advance_payment table
 */
export const usePaymentDetailsByVoucher = (voucherNumber: string | null) => {
  return useQuery({
    queryKey: ['payment-details-by-voucher', voucherNumber],
    queryFn: async (): Promise<PaymentDetails | null> => {
      if (!voucherNumber) {
        return null;
      }

      // ====================================================================
      // STEP 1: Fetch voucher details by voucher number
      // ====================================================================
      const { data: voucherData, error: voucherError } = await supabase
        .from('vouchers')
        .select(`
          id,
          voucher_number,
          voucher_date,
          narration,
          total_amount,
          patient_id,
          status,
          patient:patients (
            id,
            name,
            patients_id
          )
        `)
        .eq('voucher_number', voucherNumber)
        .maybeSingle();

      if (voucherError) {
        console.error('Error fetching voucher:', voucherError);
        throw new Error(`Failed to fetch voucher: ${voucherError.message}`);
      }

      if (!voucherData) {
        throw new Error(`Voucher not found: ${voucherNumber}`);
      }

      // ====================================================================
      // STEP 2: Fetch linked advance payment record
      // ====================================================================
      // Query by patient_id, payment_date, and amount for accurate matching
      const { data: paymentData, error: paymentError } = await supabase
        .from('advance_payment')
        .select('*')
        .eq('patient_id', voucherData.patient_id)
        .eq('payment_date', voucherData.voucher_date)
        .eq('advance_amount', voucherData.total_amount)
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (paymentError) {
        console.error('Error fetching payment:', paymentError);
        // Don't throw - voucher might exist without linked payment
        console.warn('Payment record not found for voucher:', voucherNumber);
      }

      // ====================================================================
      // STEP 3: Combine voucher and payment data
      // ====================================================================
      const paymentDetails: PaymentDetails = {
        // Voucher fields
        voucher_id: voucherData.id,
        voucher_number: voucherData.voucher_number,
        voucher_date: voucherData.voucher_date,
        voucher_narration: voucherData.narration || '',
        voucher_status: voucherData.status,
        voucher_amount: voucherData.total_amount || 0,

        // Payment fields (with fallbacks if payment not found)
        payment_id: paymentData?.id || '',
        payment_mode: paymentData?.payment_mode || 'CASH',
        reference_number: paymentData?.reference_number || null,
        remarks: paymentData?.remarks || null,
        billing_executive: paymentData?.billing_executive || null,
        patient_name: voucherData.patient?.name || paymentData?.patient_name || 'Unknown',
        patient_id: voucherData.patient_id,
        registration_no: voucherData.patient?.patients_id || null,
        visit_id: paymentData?.visit_id || null,
        payment_date: paymentData?.payment_date || voucherData.voucher_date,
        advance_amount: paymentData?.advance_amount || voucherData.total_amount,
        is_refund: paymentData?.is_refund || false,
        refund_reason: paymentData?.refund_reason || null,
      };

      return paymentDetails;
    },
    enabled: !!voucherNumber, // Only run query if voucherNumber is provided
    staleTime: 60000, // 1 minute
    retry: 1, // Retry once on failure
  });
};
