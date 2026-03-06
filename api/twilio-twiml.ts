// Vercel Serverless Function: Twilio TwiML for Conference
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const room = (req.query.room as string) || 'HopeConference';

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Connecting you to the Hope Hospital conference call. Please wait.</Say>
  <Dial>
    <Conference
      startConferenceOnEnter="true"
      endConferenceOnExit="false"
      waitUrl="http://twimlets.com/holdmusic?Bucket=com.twilio.music.classical"
    >${room}</Conference>
  </Dial>
</Response>`;

  res.setHeader('Content-Type', 'text/xml');
  res.send(twiml);
}
