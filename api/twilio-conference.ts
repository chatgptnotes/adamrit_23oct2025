// Vercel Serverless Function: Twilio Conference Call
import type { VercelRequest, VercelResponse } from '@vercel/node';
import twilio from 'twilio';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xvkxccqaopbnkvwgyfjv.supabase.co';
const TWIML_URL = 'https://adamrit-com.vercel.app/api/twilio-twiml';
const WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

function getSupabase() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured');
  return createClient(SUPABASE_URL, key);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const {
    visitId,
    patientName,
    referringDoctorName,
    referringDoctorPhone,
    ourDoctorName,
    ourDoctorPhone,
    delayMinutes = 0,
  } = req.body;

  if (!referringDoctorPhone || !ourDoctorPhone) {
    return res.status(400).json({ error: 'Both doctor phone numbers are required' });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !twilioPhone) {
    return res.status(500).json({ error: 'Twilio credentials not configured' });
  }

  const client = twilio(accountSid, authToken);
  const conferenceRoom = `HopeConf-${Date.now()}`;

  // Format phone numbers
  const fmt = (phone: string) => phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`;
  const refPhone = fmt(referringDoctorPhone);
  const ourPhone = fmt(ourDoctorPhone);

  const twimlUrl = `${TWIML_URL}?room=${encodeURIComponent(conferenceRoom)}`;

  // Send WhatsApp to our doctor first
  let whatsappSent = false;
  try {
    const msg = delayMinutes > 0
      ? `Hello ${ourDoctorName}, a conference call with Dr. ${referringDoctorName} regarding patient ${patientName || 'N/A'} is scheduled in ${delayMinutes} minute(s). Please be available. - Hope Hospital`
      : `Hello ${ourDoctorName}, a conference call with Dr. ${referringDoctorName} regarding patient ${patientName || 'N/A'} is being connected now. Please pick up. - Hope Hospital`;

    await client.messages.create({
      from: WHATSAPP_FROM,
      to: `whatsapp:${ourPhone}`,
      body: msg,
    });
    whatsappSent = true;
  } catch (e: any) {
    console.error('WhatsApp failed (non-fatal):', e.message);
  }

  // Initiate calls
  const call1 = await client.calls.create({ url: twimlUrl, to: refPhone, from: twilioPhone });
  const call2 = await client.calls.create({ url: twimlUrl, to: ourPhone, from: twilioPhone });

  // Log to Supabase
  try {
    const sb = getSupabase();
    await sb.from('call_logs').insert({
      visit_id: visitId || null,
      patient_name: patientName || null,
      referring_doctor_name: referringDoctorName,
      referring_doctor_phone: refPhone,
      our_doctor_name: ourDoctorName,
      our_doctor_phone: ourPhone,
      conference_room: conferenceRoom,
      delay_minutes: delayMinutes,
      status: 'initiated',
      whatsapp_notified: whatsappSent,
    });
  } catch (e) {
    console.error('Failed to log call:', e);
  }

  return res.json({
    success: true,
    conferenceRoom,
    callSids: [call1.sid, call2.sid],
    whatsappNotified: whatsappSent,
    message: `Conference call initiated between ${ourDoctorName} and Dr. ${referringDoctorName}`,
  });
}
