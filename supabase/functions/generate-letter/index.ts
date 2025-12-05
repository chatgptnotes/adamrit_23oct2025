import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt } = await req.json()

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get OpenAI API key from environment variables
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse patient data from the prompt to extract specific fields
    const patientDataMatch = prompt.match(/Patient Data: ([\s\S]*?)(?:\n\nUse this exact format:|$)/)
    const patientData = patientDataMatch ? patientDataMatch[1] : ''
    
    console.log('Full prompt received:', prompt)
    console.log('Extracted patient data:', patientData)
    
    // Extract individual fields with more robust parsing
    const nameMatch = patientData.match(/PATIENT name:\s*(.+)/i)
    const ageMatch = patientData.match(/age:\s*(.+)/i)
    const genderMatch = patientData.match(/gender:\s*(.+)/i)
    const claimIdMatch = patientData.match(/claim id no:\s*(.+)/i)
    const diagnosisMatch = patientData.match(/DIAGNOSIS:\s*(.+)/i)
    
    const patientName = nameMatch ? nameMatch[1].trim() : 'Not Provided'
    const patientAge = ageMatch ? ageMatch[1].trim() : 'Not Provided'
    let patientGender = genderMatch ? genderMatch[1].trim() : 'Not Specified'
    
    // Clean up gender parsing - remove any text after newline or other fields
    if (patientGender && patientGender !== 'Not Specified') {
      patientGender = patientGender.split('\n')[0].split('claim')[0].trim()
    }
    
    const claimId = claimIdMatch ? claimIdMatch[1].trim() : 'Not Provided'
    const diagnosis = diagnosisMatch ? diagnosisMatch[1].trim() : 'Not Provided'

    console.log('Parsed fields:', {
      patientName,
      patientAge,
      patientGender,
      claimId,
      diagnosis,
      genderMatchDetails: genderMatch ? `Found: "${genderMatch[1]}"` : 'No match found',
      rawGenderSection: patientData.substring(patientData.indexOf('gender:'), patientData.indexOf('gender:') + 50)
    })

    // Create the letter content directly without AI processing to ensure accuracy
    const letterTemplate = `TO
 CMO,
 E.S.I.C SOMWARIPETH HOSPITAL,
 NAGPUR.

SUB: REGARDING ENHANCEMENT FOR HOSPITALISATION

RESPECTED SIR/MADAM,

SUBJECT: EXTENSION OF STAY APPROVAL

PATIENT NAME: ${patientName.toUpperCase()} WITH AGE/SEX: ${patientAge} YEARS / ${patientGender.charAt(0).toUpperCase() + patientGender.slice(1).toLowerCase()}
WITH CLAIM ID NO. ${claimId}. DIAGNOSIS: ${diagnosis.toUpperCase()}.

The patient was admitted with complaints of medical condition requiring ongoing treatment and monitoring. Initial management has been provided according to standard medical protocols.

In view of ongoing medical needs and required monitoring, a further extension of stay is recommended as per the approval details provided.

Kindly approve the extension.

REGARDS,
DR. MURALI B K
MS ORTHO`

    return new Response(
      JSON.stringify({ letter: letterTemplate }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
