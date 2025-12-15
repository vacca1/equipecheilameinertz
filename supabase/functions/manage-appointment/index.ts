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
    const appointmentId = url.searchParams.get('id')

    if (!appointmentId) {
      return new Response(
        JSON.stringify({ error: 'ID do agendamento é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET - Buscar um agendamento específico
    if (req.method === 'GET') {
      const { data: appointment, error } = await supabaseClient
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .single()

      if (error) throw error

      if (!appointment) {
        return new Response(
          JSON.stringify({ error: 'Agendamento não encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, appointment }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // PUT/PATCH - Atualizar agendamento
    if (req.method === 'PUT' || req.method === 'PATCH') {
      const body = await req.json()
      const updateData: any = {}

      // Campos permitidos para atualização
      const allowedFields = [
        'patient_name',
        'date',
        'time',
        'duration',
        'therapist',
        'room',
        'status',
        'notes',
        'is_first_session'
      ]

      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          updateData[field] = body[field]
        }
      }

      if (Object.keys(updateData).length === 0) {
        return new Response(
          JSON.stringify({ error: 'Nenhum campo para atualizar' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Se estiver mudando data/hora/terapeuta, verificar conflitos
      if (updateData.date || updateData.time || updateData.therapist) {
        // Buscar o agendamento atual
        const { data: currentApt } = await supabaseClient
          .from('appointments')
          .select('*')
          .eq('id', appointmentId)
          .single()

        if (!currentApt) {
          return new Response(
            JSON.stringify({ error: 'Agendamento não encontrado' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const checkDate = updateData.date || currentApt.date
        const checkTime = updateData.time || currentApt.time
        const checkTherapist = updateData.therapist || currentApt.therapist
        const checkDuration = updateData.duration || currentApt.duration || 60

        // Verificar conflitos
        const { data: conflicts } = await supabaseClient
          .from('appointments')
          .select('id, patient_name, time, duration')
          .eq('date', checkDate)
          .eq('therapist', checkTherapist)
          .neq('id', appointmentId)
          .neq('status', 'cancelled')

        const timeMinutes = parseTime(checkTime)
        const endMinutes = timeMinutes + checkDuration

        const hasConflict = conflicts?.some(apt => {
          const aptStartMinutes = parseTime(apt.time)
          const aptDuration = apt.duration || 60
          const aptEndMinutes = aptStartMinutes + aptDuration
          return (timeMinutes < aptEndMinutes && endMinutes > aptStartMinutes)
        })

        if (hasConflict) {
          return new Response(
            JSON.stringify({
              error: 'Horário indisponível',
              details: 'Já existe um agendamento neste horário'
            }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      const { data: updated, error } = await supabaseClient
        .from('appointments')
        .update(updateData)
        .eq('id', appointmentId)
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({
          success: true,
          appointment: updated,
          message: 'Agendamento atualizado com sucesso'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // DELETE - Cancelar/Deletar agendamento
    if (req.method === 'DELETE') {
      const url = new URL(req.url)
      const softDelete = url.searchParams.get('soft') === 'true'

      if (softDelete) {
        // Soft delete - apenas marca como cancelado
        const { data: updated, error } = await supabaseClient
          .from('appointments')
          .update({ status: 'cancelled' })
          .eq('id', appointmentId)
          .select()
          .single()

        if (error) throw error

        return new Response(
          JSON.stringify({
            success: true,
            appointment: updated,
            message: 'Agendamento cancelado com sucesso'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        )
      } else {
        // Hard delete - remove do banco
        const { error } = await supabaseClient
          .from('appointments')
          .delete()
          .eq('id', appointmentId)

        if (error) throw error

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Agendamento deletado com sucesso'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        )
      }
    }

    return new Response(
      JSON.stringify({ error: 'Método não permitido' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

// Helper function to parse time string to minutes
function parseTime(time: string): number {
  const [hour, minute] = time.split(':').map(Number)
  return hour * 60 + minute
}
