/**
 * Payment Service
 * Handles recording patient payments for various services (OPD, Pharmacy, etc.)
 * This service interfaces with the patient_payment_transactions table
 */

import { supabase } from '@/integrations/supabase/client';

export interface RecordPaymentParams {
  visitId: string; // TEXT visit ID like "IH25I22001"
  paymentMode: 'CASH' | 'CARD' | 'UPI' | 'CHEQUE' | 'DD' | 'NEFT' | 'RTGS' | 'ONLINE' | 'PAYTM' | 'PHONEPE';
  amount: number;
  paymentDate?: string; // YYYY-MM-DD format, defaults to today
  narration?: string;
  createdBy?: string; // User UUID
}

export interface PaymentResponse {
  success: boolean;
  payment_id?: string;
  error?: string;
  message?: string;
}

/**
 * Record OPD service payment
 * Call this function after OPD services are added to a visit and patient pays
 */
export async function recordOpdServicePayment(
  params: RecordPaymentParams
): Promise<PaymentResponse> {
  try {
    // Validate inputs
    if (!params.visitId || params.amount <= 0) {
      return {
        success: false,
        error: 'Invalid visit ID or amount'
      };
    }

    // Call the database function
    const { data, error } = await supabase.rpc('record_opd_visit_payment', {
      p_visit_id: params.visitId,
      p_payment_mode: params.paymentMode,
      p_amount: params.amount,
      p_payment_date: params.paymentDate || new Date().toISOString().split('T')[0],
      p_narration: params.narration || null,
      p_created_by: params.createdBy || null
    });

    if (error) {
      console.error('Error recording OPD payment:', error);
      return {
        success: false,
        error: `Failed to record payment: ${error.message}`
      };
    }

    return {
      success: true,
      payment_id: data,
      message: 'OPD payment recorded successfully'
    };

  } catch (error: any) {
    console.error('Unexpected error recording OPD payment:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred'
    };
  }
}

/**
 * Record pharmacy payment
 * NOTE: Pharmacy payments are automatically recorded via trigger when pharmacy_sales is inserted
 * This function is for manual recording if needed
 */
export async function recordPharmacyPayment(
  params: {
    saleId: number;
    amount: number;
    paymentMode: string;
    paymentDate?: string;
    createdBy?: string;
  }
): Promise<PaymentResponse> {
  try {
    const { data, error } = await supabase.rpc('record_pharmacy_payment', {
      p_sale_id: params.saleId,
      p_amount: params.amount,
      p_payment_mode: params.paymentMode,
      p_payment_date: params.paymentDate || new Date().toISOString().split('T')[0],
      p_medicine_details: null,
      p_created_by: params.createdBy || null
    });

    if (error) {
      console.error('Error recording pharmacy payment:', error);
      return {
        success: false,
        error: `Failed to record payment: ${error.message}`
      };
    }

    return {
      success: true,
      payment_id: data,
      message: 'Pharmacy payment recorded successfully'
    };

  } catch (error: any) {
    console.error('Unexpected error recording pharmacy payment:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred'
    };
  }
}

/**
 * Get payment history for a visit
 */
export async function getVisitPaymentHistory(visitId: string) {
  try {
    const { data, error } = await supabase
      .from('patient_payment_transactions')
      .select('*')
      .eq('visit_id', visitId)
      .order('payment_date', { ascending: false });

    if (error) {
      console.error('Error fetching payment history:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error fetching payment history:', error);
    return [];
  }
}

/**
 * Get payment history for a patient
 */
export async function getPatientPaymentHistory(patientId: string) {
  try {
    const { data, error } = await supabase
      .from('patient_payment_transactions')
      .select('*')
      .eq('patient_id', patientId)
      .order('payment_date', { ascending: false });

    if (error) {
      console.error('Error fetching patient payment history:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error fetching patient payment history:', error);
    return [];
  }
}

/**
 * Get today's cash collections
 */
export async function getTodayCashCollections() {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('patient_payment_transactions')
      .select('*')
      .eq('payment_mode', 'CASH')
      .eq('payment_date', today)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching today cash collections:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error fetching cash collections:', error);
    return [];
  }
}

/**
 * Get payment summary by source (OPD, Pharmacy, etc.)
 */
export async function getPaymentSummaryBySource(fromDate: string, toDate: string) {
  try {
    const { data, error } = await supabase
      .from('patient_payment_transactions')
      .select('payment_source, payment_mode, amount')
      .gte('payment_date', fromDate)
      .lte('payment_date', toDate);

    if (error) {
      console.error('Error fetching payment summary:', error);
      return null;
    }

    // Aggregate by source and mode
    const summary: Record<string, Record<string, number>> = {};

    (data || []).forEach(payment => {
      if (!summary[payment.payment_source]) {
        summary[payment.payment_source] = {};
      }
      if (!summary[payment.payment_source][payment.payment_mode]) {
        summary[payment.payment_source][payment.payment_mode] = 0;
      }
      summary[payment.payment_source][payment.payment_mode] += payment.amount;
    });

    return summary;

  } catch (error) {
    console.error('Unexpected error fetching payment summary:', error);
    return null;
  }
}

/**
 * Example usage in component:
 *
 * // After adding OPD services to a visit and collecting payment:
 * import { recordOpdServicePayment } from '@/lib/payment-service';
 *
 * const result = await recordOpdServicePayment({
 *   visitId: 'visit-uuid-here',
 *   paymentMode: 'CASH',
 *   amount: 1500.00,
 *   narration: 'Consultation and X-ray charges'
 * });
 *
 * if (result.success) {
 *   console.log('Payment recorded!', result.payment_id);
 *   // This will automatically create a voucher and appear in Cash Book
 * } else {
 *   console.error('Payment failed:', result.error);
 * }
 */
