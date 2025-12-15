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

    const { date, therapist, duration = 60 } = await req.json()

    if (!date) {
      return new Response(
        JSON.stringify({ error: 'Data é obrigatória' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Buscar todos os agendamentos do dia para o terapeuta
    let query = supabaseClient
      .from('appointments')
      .select('time, duration, status')
      .eq('date', date)
      .neq('status', 'cancelled')

    if (therapist) {
      query = query.eq('therapist', therapist)
    }

    const { data: appointments, error } = await query

    if (error) throw error

    // Horários de funcionamento (6:30 às 21:00, intervalos de 30 min)
    const startHour = 6.5 * 60 // 6:30 em minutos
    const endHour = 21 * 60    // 21:00 em minutos
    const slotDuration = 30    // 30 minutos

    const totalSlots = Math.floor((endHour - startHour) / slotDuration)
    const availableSlots: string[] = []

    // Gerar todos os slots possíveis
    for (let i = 0; i < totalSlots; i++) {
      const slotMinutes = startHour + (i * slotDuration)
      const hour = Math.floor(slotMinutes / 60)
      const minute = slotMinutes % 60
      const timeSlot = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`

      // Verificar se o slot está disponível
      const isAvailable = !appointments?.some(apt => {
        const aptMinutes = parseTime(apt.time)
        const aptDuration = apt.duration || 60
        const aptEndMinutes = aptMinutes + aptDuration

        // O slot está ocupado se o novo agendamento começaria durante um existente
        return slotMinutes >= aptMinutes && slotMinutes < aptEndMinutes
      })

      // Verificar se há espaço suficiente para a duração solicitada
      if (isAvailable && duration) {
        let hasEnoughSpace = true
        const slotsNeeded = Math.ceil(duration / slotDuration)

        for (let j = 1; j < slotsNeeded; j++) {
          const nextSlotMinutes = slotMinutes + (j * slotDuration)
          const nextSlotOccupied = appointments?.some(apt => {
            const aptMinutes = parseTime(apt.time)
            const aptDuration = apt.duration || 60
            const aptEndMinutes = aptMinutes + aptDuration
            return nextSlotMinutes >= aptMinutes && nextSlotMinutes < aptEndMinutes
          })

          if (nextSlotOccupied) {
            hasEnoughSpace = false
            break
          }
        }

        if (hasEnoughSpace) {
          availableSlots.push(timeSlot)
        }
      } else if (isAvailable) {
        availableSlots.push(timeSlot)
      }
    }

    return new Response(
      JSON.stringify({
        date,
        therapist: therapist || 'all',
        duration,
        availableSlots,
        totalAvailable: availableSlots.length,
        occupiedSlots: appointments?.length || 0
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

// Helper function to parse time string to minutes
function parseTime(time: string): number {
  const [hour, minute] = time.split(':').map(Number)
  return hour * 60 + minute
}
