import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { finalLetterText, templateText, variables } = await req.json()

    if (!finalLetterText || !templateText) {
      return new Response(
        JSON.stringify({ error: 'Final letter text and template text are required' }),
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

    // Replace variables in the template
    const promptWithData = templateText.replace(
      /\{\{\s*FinalLetterText\s*\}\}/g, 
      finalLetterText
    ).replace(
      /\{\{\s*HospitalName\s*\}\}/g,
      variables?.HospitalName || 'Hope Hospital'
    ).replace(
      /\{\{\s*TodayDate\s*\}\}/g,
      variables?.TodayDate || new Date().toLocaleDateString('en-GB')
    );

    console.log('Refinement prompt:', promptWithData)

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert medical correspondence writer specializing in ESIC documentation. Your task is to refine and enhance medical letters while preserving all factual information exactly as provided. Focus on improving grammar, structure, medical terminology, and professional tone.'
          },
          {
            role: 'user',
            content: promptWithData
          }
        ],
        max_tokens: 2000,
        temperature: 0.3, // Lower temperature for more consistent, professional output
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('OpenAI API error:', errorData)
      return new Response(
        JSON.stringify({ error: 'Failed to refine letter with AI' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const data = await response.json()
    const refinedText = data.choices[0]?.message?.content

    if (!refinedText) {
      return new Response(
        JSON.stringify({ error: 'No refined content returned from AI' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        refinedText,
        tokensUsed: data.usage?.total_tokens || 0,
        model: 'gpt-4'
      }),
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