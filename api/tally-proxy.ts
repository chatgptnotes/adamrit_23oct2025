// Vercel Serverless Function: Tally CORS Proxy
// Deploy alongside a Vercel deployment for when Supabase Edge Functions aren't available
// This is a simpler proxy that just forwards XML to Tally server

import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { serverUrl, xmlBody } = req.body

    if (!serverUrl || !xmlBody) {
      return res.status(400).json({ error: 'Missing serverUrl or xmlBody' })
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)

    try {
      const tallyResponse = await fetch(serverUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/xml' },
        body: xmlBody,
        signal: controller.signal,
      })

      clearTimeout(timeout)
      const responseText = await tallyResponse.text()
      return res.status(200).json({ response: responseText })
    } catch (fetchError: any) {
      clearTimeout(timeout)
      if (fetchError.name === 'AbortError') {
        return res.status(504).json({ error: 'Connection to Tally server timed out (30s)' })
      }
      return res.status(502).json({ error: `Cannot connect to Tally server at ${serverUrl}: ${fetchError.message}` })
    }
  } catch (error: any) {
    return res.status(400).json({ error: 'Invalid request: ' + error.message })
  }
}
