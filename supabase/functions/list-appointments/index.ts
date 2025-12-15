import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const url = new URL(req.url)
    const date = url.searchParams.get('date')
    const start_date = url.searchParams.get('start_date')
    const end_date = url.searchParams.get('end_date')
    const therapist = url.searchParams.get('therapist')
    const patient_name = url.searchParams.get('patient_name')
    const status = url.searchParams.get('status')
    const limit = parseInt(url.searchParams.get('limit') || '100')

    let query = supabaseClient
      .from('appointments')
      .select('*')
      .order('date', { ascending: true })
      .order('time', { ascending: true })
      .limit(limit)

    // Filtros
    if (date) {
      query = query.eq('date', date)
    }

    if (start_date) {
      query = query.gte('date', start_date)
    }

    if (end_date) {
      query = query.lte('date', end_date)
    }

    if (therapist) {
      query = query.eq('therapist', therapist)
    }

    if (patient_name) {
      query = query.ilike('patient_name', `%${patient_name}%`)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: appointments, error, count } = await query

    if (error) throw error

    return new Response(
      JSON.stringify({
        success: true,
        appointments,
        total: appointments?.length || 0,
        filters: {
          date,
          start_date,
          end_date,
          therapist,
          patient_name,
          status
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
