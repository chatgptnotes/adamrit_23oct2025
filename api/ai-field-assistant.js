export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { message, photos, corporates } = req.body;
  
  const systemPrompt = `You are an AI field assistant for hospital marketing. Extract structured JSON from visit descriptions:
{"contactName":null,"designation":null,"organization":null,"area":null,"location":null,"conversation":"","actionItems":null,"followUpDate":null,"followUpNeeded":false,"meetingDate":"${new Date().toISOString().split('T')[0]}","photoDescriptions":[]}
Known corporates: ESIC, WCL, CGHS, ECHS, Central Railway, SECR, MPKAY, PM-JAY, MP Police. Return ONLY valid JSON.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: photos?.length ? `[${photos.length} photos attached] ${message}` : message }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }
    
    const extracted = JSON.parse(data.choices[0].message.content);
    return res.json(extracted);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to process request' });
  }
}
