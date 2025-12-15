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

    const body = await req.json()
    const {
      patient_name,
      date,
      time,
      therapist,
      duration = 60,
      patient_id = null,
      room = null,
      status = 'confirmed',
      notes = null,
      is_first_session = false,
      repeat_weekly = false,
      repeat_until = null
    } = body

    // Validações
    if (!patient_name || !date || !time || !therapist) {
      return new Response(
        JSON.stringify({
          error: 'Campos obrigatórios: patient_name, date, time, therapist'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar se o horário está disponível
    const { data: conflicts, error: conflictError } = await supabaseClient
      .from('appointments')
      .select('id, patient_name, time, duration')
      .eq('date', date)
      .eq('therapist', therapist)
      .neq('status', 'cancelled')

    if (conflictError) throw conflictError

    // Verificar conflitos de horário
    const timeMinutes = parseTime(time)
    const endMinutes = timeMinutes + duration

    const hasConflict = conflicts?.some(apt => {
      const aptStartMinutes = parseTime(apt.time)
      const aptDuration = apt.duration || 60
      const aptEndMinutes = aptStartMinutes + aptDuration

      // Há conflito se os horários se sobrepõem
      return (timeMinutes < aptEndMinutes && endMinutes > aptStartMinutes)
    })

    if (hasConflict) {
      return new Response(
        JSON.stringify({
          error: 'Horário indisponível',
          details: 'Já existe um agendamento neste horário',
          conflicts: conflicts?.filter(apt => {
            const aptStartMinutes = parseTime(apt.time)
            const aptDuration = apt.duration || 60
            const aptEndMinutes = aptStartMinutes + aptDuration
            return (timeMinutes < aptEndMinutes && endMinutes > aptStartMinutes)
          })
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Buscar patient_id se fornecido o nome
    let finalPatientId = patient_id
    if (!finalPatientId && patient_name) {
      const { data: patients } = await supabaseClient
        .from('patients')
        .select('id')
        .ilike('name', patient_name)
        .limit(1)

      if (patients && patients.length > 0) {
        finalPatientId = patients[0].id
      }
    }

    // Criar o agendamento
    const { data: newAppointment, error: insertError } = await supabaseClient
      .from('appointments')
      .insert({
        patient_id: finalPatientId,
        patient_name,
        date,
        time,
        duration,
        therapist,
        room,
        status,
        notes,
        is_first_session,
        repeat_weekly,
        repeat_until
      })
      .select()
      .single()

    if (insertError) throw insertError

    // Se for repetição semanal, criar os próximos agendamentos
    if (repeat_weekly && repeat_until) {
      const appointments = []
      const startDate = new Date(date)
      const endDate = new Date(repeat_until)

      let currentDate = new Date(startDate)
      currentDate.setDate(currentDate.getDate() + 7) // Próxima semana

      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0]

        // Verificar disponibilidade para cada data
        const { data: weekConflicts } = await supabaseClient
          .from('appointments')
          .select('id')
          .eq('date', dateStr)
          .eq('therapist', therapist)
          .eq('time', time)
          .neq('status', 'cancelled')

        if (!weekConflicts || weekConflicts.length === 0) {
          appointments.push({
            patient_id: finalPatientId,
            patient_name,
            date: dateStr,
            time,
            duration,
            therapist,
            room,
            status,
            notes,
            is_first_session: false,
            repeat_weekly: true,
            repeat_until
          })
        }

        currentDate.setDate(currentDate.getDate() + 7)
      }

      if (appointments.length > 0) {
        const { error: batchError } = await supabaseClient
          .from('appointments')
          .insert(appointments)

        if (batchError) {
          console.error('Erro ao criar repetições:', batchError)
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        appointment: newAppointment,
        message: repeat_weekly
          ? `Agendamento criado com ${repeat_weekly ? 'repetição semanal' : ''}`
          : 'Agendamento criado com sucesso'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201
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

// Helper function to parse time string to minutes
function parseTime(time: string): number {
  const [hour, minute] = time.split(':').map(Number)
  return hour * 60 + minute
}
