import { supabase } from '@/integrations/supabase/client';

interface AlertPayload {
  alert_type: 'receipt' | 'invoice' | 'discount';
  amount: number;
  patient_name: string;
  patient_id?: string;
  visit_id?: string;
  hospital_name?: string;
  additional_info?: string;
}

const THRESHOLDS = {
  receipt: 10000,
  invoice: 100000,
  discount: 33000,
} as const;

/**
 * Send a WhatsApp payment alert if the amount exceeds the threshold.
 * Fire-and-forget — never throws; logs errors to console.
 */
export async function sendPaymentAlert(payload: AlertPayload): Promise<void> {
  try {
    const threshold = THRESHOLDS[payload.alert_type];
    if (payload.amount < threshold) return;

    const { error } = await supabase.functions.invoke('send-payment-alerts', {
      body: payload,
    });

    if (error) {
      console.error('Payment alert failed:', error);
    }
  } catch (err) {
    // Fire-and-forget — never block the main flow
    console.error('Payment alert error:', err);
  }
}
