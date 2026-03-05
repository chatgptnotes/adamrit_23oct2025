import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const TWILIO_SID  = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_FROM = process.env.TWILIO_PHONE_NUMBER || '';
const SUPABASE_URL = 'https://xvkxccqaopbnkvwgyfjv.supabase.co';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { to, person_id, person_name, call_type = 'manual' } = req.body || {};
    if (!to) return res.status(400).json({ error: 'Phone number required' });

    let toNumber = String(to).replace(/\s+/g, '').replace(/^0/, '');
    if (!toNumber.startsWith('+')) toNumber = '+91' + toNumber.replace(/^91/, '');

    const twilio = (await import('twilio')).default;
    const client = twilio(TWILIO_SID, TWILIO_AUTH);
    const call = await client.calls.create({
      to: toNumber,
      from: TWILIO_FROM,
      twiml: `<Response><Say voice="alice" language="en-IN">Hello, this is a call from Hope Hospital Nagpur. Dr Murali team is calling for a referral follow-up. Thank you for your support. Please call us back on 0712 2220000.</Say></Response>`,
    });

    try {
      const sb = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || '');
      await sb.from('call_logs').insert({ person_id, person_name, phone_number: toNumber, call_sid: call.sid, call_status: call.status, call_type, initiated_at: new Date().toISOString() });
    } catch {}

    return res.status(200).json({ success: true, call_sid: call.sid, status: call.status, to: toNumber });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Call failed' });
  }
}
