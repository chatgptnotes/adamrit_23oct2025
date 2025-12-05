import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 Starting admission reminder job...')

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get Double Tick configuration
    const DOUBLETICK_API_KEY = Deno.env.get('DOUBLETICK_API_KEY')
    const DOUBLETICK_PHONES = ['9373111709', '9822202396'] // Send to both numbers
    const TEMPLATE_NAME = 'admission_reminder_5days'

    if (!DOUBLETICK_API_KEY) {
      throw new Error('DOUBLETICK_API_KEY not configured in environment variables')
    }

    console.log('✅ Configuration loaded:', {
      templateName: TEMPLATE_NAME,
      phoneNumbers: DOUBLETICK_PHONES,
      apiKeyPresent: !!DOUBLETICK_API_KEY
    })

    // Calculate the date 5 days ago
    const fiveDaysAgo = new Date()
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5)
    const targetDate = fiveDaysAgo.toISOString().split('T')[0] // Format: YYYY-MM-DD

    console.log(`📅 Looking for admissions on: ${targetDate}`)

    // Query visits that were admitted exactly 5 days ago
    const { data: visits, error: visitsError } = await supabase
      .from('visits')
      .select(`
        id,
        visit_id,
        patient_id,
        admission_date,
        patients (
          id,
          name,
          corporate
        )
      `)
      .eq('admission_date', targetDate)
      .not('admission_date', 'is', null)

    if (visitsError) {
      console.error('❌ Error fetching visits:', visitsError)
      throw visitsError
    }

    console.log(`📊 Found ${visits?.length || 0} visits from ${targetDate}`)

    if (!visits || visits.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: `No admissions found for ${targetDate}`,
          count: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let successCount = 0
    let failCount = 0
    const results = []

    // Process each visit
    for (const visit of visits) {
      try {
        const patient = visit.patients as any

        if (!patient) {
          console.warn(`⚠️ No patient data for visit ${visit.visit_id}`)
          continue
        }

        console.log(`📱 Processing visit ${visit.visit_id} for patient ${patient.name}`)

        // Check if notifications already sent to both numbers
        const { data: existingNotifications, count } = await supabase
          .from('whatsapp_notifications')
          .select('phone_number', { count: 'exact' })
          .eq('visit_id', visit.visit_id)
          .eq('admission_date', visit.admission_date)

        if (count && count >= 2) {
          console.log(`⏭️ Notifications already sent to both numbers for visit ${visit.visit_id}`)
          continue
        }

        // Format the admission date as DD/MM/YYYY
        const admissionDate = new Date(visit.admission_date)
        const formattedDate = `${String(admissionDate.getDate()).padStart(2, '0')}/${String(admissionDate.getMonth() + 1).padStart(2, '0')}/${admissionDate.getFullYear()}`

        // Prepare WhatsApp message parameters
        const messageParams = {
          patientName: patient.name || 'N/A',
          registrationDate: formattedDate,
          corporate: patient.corporate || 'N/A'
        }

        console.log('📝 Message parameters:', messageParams)

        // Send WhatsApp message to BOTH numbers
        for (const phone of DOUBLETICK_PHONES) {
          const doubletickResponse = await sendDoubleTick(
            DOUBLETICK_API_KEY,
            phone,
            TEMPLATE_NAME,
            messageParams
          )

          // Log the notification in database
          const { error: insertError } = await supabase
            .from('whatsapp_notifications')
            .insert({
              visit_id: visit.visit_id,
              patient_id: patient.id,
              patient_name: patient.name,
              admission_date: visit.admission_date,
              corporate: patient.corporate,
              phone_number: phone,
              message_content: JSON.stringify(messageParams),
              template_name: TEMPLATE_NAME,
              status: doubletickResponse.success ? 'sent' : 'failed',
              sent_at: doubletickResponse.success ? new Date().toISOString() : null,
              error_message: doubletickResponse.error || null,
              doubletick_response: doubletickResponse.response
            })

          if (insertError) {
            console.error('❌ Error logging notification:', insertError)
          }

          if (doubletickResponse.success) {
            successCount++
            console.log(`✅ Successfully sent notification to ${phone} for ${patient.name}`)
          } else {
            failCount++
            console.error(`❌ Failed to send notification to ${phone} for ${patient.name}:`, doubletickResponse.error)
          }

          results.push({
            visitId: visit.visit_id,
            patientName: patient.name,
            phoneNumber: phone,
            success: doubletickResponse.success,
            error: doubletickResponse.error
          })
        }

      } catch (error) {
        console.error(`❌ Error processing visit ${visit.visit_id}:`, error)
        failCount++
        results.push({
          visitId: visit.visit_id,
          success: false,
          error: error.message
        })
      }
    }

    console.log(`\n📊 Summary:`)
    console.log(`   Total: ${visits.length}`)
    console.log(`   Success: ${successCount}`)
    console.log(`   Failed: ${failCount}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${visits.length} admissions`,
        summary: {
          total: visits.length,
          success: successCount,
          failed: failCount
        },
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Fatal error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Function to send WhatsApp message via Double Tick API
async function sendDoubleTick(
  apiKey: string,
  phoneNumber: string,
  templateName: string,
  params: { patientName: string; registrationDate: string; corporate: string }
) {
  try {
    // Double Tick API endpoint
    const apiUrl = 'https://public.doubletick.io/whatsapp/message/template'

    // Format phone number (ensure +91 prefix)
    const formattedPhone = phoneNumber.replace(/^\+?/, '+')
    const finalPhone = formattedPhone.startsWith('+91') ? formattedPhone : `+91${formattedPhone.replace(/^\+/, '')}`

    // Prepare the API request payload for Double Tick
    const payload = {
      messages: [
        {
          to: finalPhone,
          content: {
            templateName: templateName,
            language: 'en',
            templateData: {
              body: {
                placeholders: [
                  params.patientName,
                  params.registrationDate,
                  params.corporate
                ]
              }
            }
          }
        }
      ]
    }

    console.log('📤 Sending to Double Tick:', {
      url: apiUrl,
      to: finalPhone,
      template: templateName,
      params: params
    })

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey,
        'accept': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const responseData = await response.json()

    console.log('📥 Double Tick response:', {
      status: response.status,
      data: responseData
    })

    // Check if message was enqueued successfully
    const isSuccess = responseData.messages &&
                     responseData.messages[0] &&
                     responseData.messages[0].status === 'ENQUEUED'

    if (!isSuccess) {
      return {
        success: false,
        error: `API Error: ${response.status} - ${JSON.stringify(responseData)}`,
        response: responseData
      }
    }

    return {
      success: true,
      response: responseData
    }

  } catch (error) {
    console.error('❌ Double Tick API error:', error)
    return {
      success: false,
      error: error.message,
      response: null
    }
  }
}
