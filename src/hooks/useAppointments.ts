import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { addWeeks, parseISO, format } from "date-fns";

export interface Appointment {
  id: string;
  patient_id?: string;
  patient_name: string;
  date: string;
  time: string;
  duration: number;
  therapist: string;
  room?: string;
  status: string;
  is_first_session: boolean;
  repeat_weekly: boolean;
  repeat_until?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export const useAppointments = (startDate?: Date, endDate?: Date, therapistFilter?: string) => {
  return useQuery({
    queryKey: ["appointments", startDate, endDate, therapistFilter],
    queryFn: async () => {
      let query = supabase
        .from("appointments")
        .select("*")
        .order("date", { ascending: true })
        .order("time", { ascending: true });

      if (startDate) {
        query = query.gte("date", format(startDate, "yyyy-MM-dd"));
      }

      if (endDate) {
        query = query.lte("date", format(endDate, "yyyy-MM-dd"));
      }

      if (therapistFilter && therapistFilter !== "all") {
        query = query.eq("therapist", therapistFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Appointment[];
    },
  });
};

// Função auxiliar para verificar conflito de horários (exportada para uso em outros componentes)
export const hasTimeConflict = (
  newStart: string, 
  newDuration: number, 
  existingStart: string, 
  existingDuration: number
): boolean => {
  const toMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };
  
  const newStartMin = toMinutes(newStart);
  const newEndMin = newStartMin + newDuration;
  const existingStartMin = toMinutes(existingStart);
  const existingEndMin = existingStartMin + existingDuration;
  
  return newStartMin < existingEndMin && newEndMin > existingStartMin;
};

// Função para validar conflitos antes de criar repetição semanal
export const validateWeeklyRepetition = async (
  appointment: { 
    date: string; 
    repeat_until: string; 
    therapist: string; 
    time: string; 
    duration: number;
    patient_name: string;
  }
): Promise<{ valid: boolean; conflicts: string[]; totalWeeks: number }> => {
  const toCheck: string[] = [];
  let currentDate = parseISO(appointment.date);
  const endDate = parseISO(appointment.repeat_until);

  // Coletar todas as datas a serem verificadas
  while (currentDate <= endDate) {
    toCheck.push(format(currentDate, "yyyy-MM-dd"));
    currentDate = addWeeks(currentDate, 1);
  }

  // Buscar agendamentos existentes no período
  const { data: existingAppointments } = await supabase
    .from("appointments")
    .select("*")
    .eq("therapist", appointment.therapist)
    .gte("date", appointment.date)
    .lte("date", appointment.repeat_until)
    .neq("status", "cancelled");

  const conflicts: string[] = [];

  for (const dateStr of toCheck) {
    const conflictsForDate = (existingAppointments || []).filter(
      (existing) =>
        existing.date === dateStr &&
        hasTimeConflict(appointment.time, appointment.duration, existing.time, existing.duration || 60)
    );

    // Pilates dupla: permitir até 2 pacientes
    if (conflictsForDate.length >= 2) {
      conflicts.push(format(parseISO(dateStr), "dd/MM/yyyy"));
    }
  }

  return {
    valid: conflicts.length === 0,
    conflicts,
    totalWeeks: toCheck.length
  };
};

export const useCreateAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointment: Omit<Appointment, "id" | "created_at" | "updated_at">) => {
      console.log("[useCreateAppointment] Iniciando criação:", appointment);
      
      // Validação obrigatória: se repeat_weekly é true, repeat_until deve existir
      if (appointment.repeat_weekly && !appointment.repeat_until) {
        throw new Error("Data final da repetição é obrigatória quando repetição semanal está ativa");
      }

      // Se repeat_weekly é true, criar múltiplos agendamentos
      if (appointment.repeat_weekly && appointment.repeat_until) {
        console.log("[useCreateAppointment] Modo repetição semanal ativado");
        
        const appointmentsToCreate: any[] = [];
        let currentDate = parseISO(appointment.date);
        const endDate = parseISO(appointment.repeat_until);

        console.log("[useCreateAppointment] Data inicial:", appointment.date);
        console.log("[useCreateAppointment] Data final:", appointment.repeat_until);

        // Coletar todas as datas a serem criadas
        while (currentDate <= endDate) {
          const dateStr = format(currentDate, "yyyy-MM-dd");
          console.log("[useCreateAppointment] Adicionando data:", dateStr);
          
          appointmentsToCreate.push({
            patient_id: appointment.patient_id,
            patient_name: appointment.patient_name,
            date: dateStr,
            time: appointment.time,
            duration: appointment.duration,
            therapist: appointment.therapist,
            room: appointment.room,
            status: appointment.status || "pending",
            is_first_session: appointment.is_first_session,
            repeat_weekly: false, // Cada registro individual não repete
            notes: appointment.notes,
          });
          
          currentDate = addWeeks(currentDate, 1);
        }

        console.log("[useCreateAppointment] Total de agendamentos a criar:", appointmentsToCreate.length);

        if (appointmentsToCreate.length === 0) {
          throw new Error("Nenhum agendamento para criar");
        }

        // Buscar agendamentos existentes para evitar duplicatas/conflitos
        const { data: existingAppointments, error: fetchError } = await supabase
          .from("appointments")
          .select("*")
          .eq("therapist", appointment.therapist)
          .gte("date", appointment.date)
          .lte("date", appointment.repeat_until)
          .neq("status", "cancelled");

        if (fetchError) {
          console.error("[useCreateAppointment] Erro ao buscar existentes:", fetchError);
        }

        console.log("[useCreateAppointment] Agendamentos existentes:", existingAppointments?.length || 0);

        // Filtrar agendamentos válidos (sem conflito >= 2 pacientes)
        const validAppointments: any[] = [];
        const skippedDates: string[] = [];

        for (const apt of appointmentsToCreate) {
          const conflictsForDate = (existingAppointments || []).filter(
            (existing) =>
              existing.date === apt.date &&
              hasTimeConflict(apt.time, apt.duration, existing.time, existing.duration || 60)
          );

          if (conflictsForDate.length >= 2) {
            skippedDates.push(format(parseISO(apt.date), "dd/MM"));
            console.log("[useCreateAppointment] Pulando data (lotada):", apt.date);
          } else {
            validAppointments.push(apt);
          }
        }

        console.log("[useCreateAppointment] Agendamentos válidos:", validAppointments.length);
        console.log("[useCreateAppointment] Datas puladas:", skippedDates);

        if (validAppointments.length === 0) {
          throw new Error(`Não foi possível criar nenhum agendamento. Todas as datas têm conflito: ${skippedDates.join(", ")}`);
        }

        // Inserir os agendamentos válidos
        const { data, error } = await supabase
          .from("appointments")
          .insert(validAppointments)
          .select();

        if (error) {
          console.error("[useCreateAppointment] Erro ao inserir:", error);
          throw error;
        }

        console.log("[useCreateAppointment] Inseridos com sucesso:", data?.length || 0);

        // Retornar resultado com informações de skip
        return { 
          data, 
          skippedCount: skippedDates.length, 
          skippedDates,
          totalRequested: appointmentsToCreate.length 
        };
      } else {
        // Criação simples (sem repetição)
        console.log("[useCreateAppointment] Modo criação simples");
        
        const { data, error } = await supabase
          .from("appointments")
          .insert([{
            patient_id: appointment.patient_id,
            patient_name: appointment.patient_name,
            date: appointment.date,
            time: appointment.time,
            duration: appointment.duration,
            therapist: appointment.therapist,
            room: appointment.room,
            status: appointment.status || "pending",
            is_first_session: appointment.is_first_session,
            repeat_weekly: false,
            notes: appointment.notes,
          }])
          .select()
          .single();

        if (error) {
          console.error("[useCreateAppointment] Erro ao inserir:", error);
          throw error;
        }

        console.log("[useCreateAppointment] Criado com sucesso:", data);
        return data;
      }
    },
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      
      // Invalidar caches do paciente para sincronização
      const patientId = Array.isArray(result?.data) 
        ? result.data[0]?.patient_id 
        : result?.patient_id;
      
      if (patientId) {
        queryClient.invalidateQueries({ queryKey: ["patient-appointments", patientId] });
        queryClient.invalidateQueries({ queryKey: ["patient-session-stats", patientId] });
      }
      
      // Verificar se é resultado de repetição semanal
      if (result && result.data && Array.isArray(result.data)) {
        const created = result.data.length;
        const skipped = result.skippedCount || 0;
        
        if (skipped > 0) {
          toast.warning(
            `${created} agendamentos criados! ${skipped} datas puladas (horário lotado): ${result.skippedDates?.join(", ")}`,
            { duration: 8000 }
          );
        } else {
          toast.success(`${created} agendamentos criados com sucesso!`);
        }
      } else {
        toast.success("Agendamento criado com sucesso!");
      }
    },
    onError: (error: any) => {
      console.error("[useCreateAppointment] onError:", error);
      toast.error(error.message || "Erro ao criar agendamento");
    },
  });
};

export const useUpdateAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...appointment }: Partial<Appointment> & { id: string }) => {
      const { data, error } = await supabase
        .from("appointments")
        .update(appointment)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      
      // Invalidar caches do paciente para sincronização
      if (data?.patient_id) {
        queryClient.invalidateQueries({ queryKey: ["patient-appointments", data.patient_id] });
        queryClient.invalidateQueries({ queryKey: ["patient-session-stats", data.patient_id] });
      }
      
      toast.success("Agendamento atualizado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar agendamento");
    },
  });
};

// Hook para criar repetições futuras ao editar um agendamento existente
export const useCreateFutureRepetitions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      baseAppointment: {
        patient_id?: string;
        patient_name: string;
        date: string;
        time: string;
        duration: number;
        therapist: string;
        room?: string;
        status: string;
        is_first_session: boolean;
        notes?: string;
        repeat_until: string;
      };
    }) => {
      const { baseAppointment } = params;
      
      console.log("[useCreateFutureRepetitions] Iniciando criação de repetições futuras");
      console.log("[useCreateFutureRepetitions] Data base:", baseAppointment.date);
      console.log("[useCreateFutureRepetitions] Até:", baseAppointment.repeat_until);

      const appointmentsToCreate: any[] = [];
      // Começar da PRÓXIMA semana (a atual já existe)
      let currentDate = addWeeks(parseISO(baseAppointment.date), 1);
      const endDate = parseISO(baseAppointment.repeat_until);

      while (currentDate <= endDate) {
        const dateStr = format(currentDate, "yyyy-MM-dd");
        console.log("[useCreateFutureRepetitions] Adicionando data:", dateStr);
        
        appointmentsToCreate.push({
          patient_id: baseAppointment.patient_id,
          patient_name: baseAppointment.patient_name,
          date: dateStr,
          time: baseAppointment.time,
          duration: baseAppointment.duration,
          therapist: baseAppointment.therapist,
          room: baseAppointment.room,
          status: baseAppointment.status || "pending",
          is_first_session: false, // Só a primeira é primeira sessão
          repeat_weekly: false,
          notes: baseAppointment.notes,
        });
        
        currentDate = addWeeks(currentDate, 1);
      }

      console.log("[useCreateFutureRepetitions] Total a criar:", appointmentsToCreate.length);

      if (appointmentsToCreate.length === 0) {
        return { data: [], skippedCount: 0, skippedDates: [], totalRequested: 0 };
      }

      // Buscar agendamentos existentes para evitar duplicatas/conflitos
      const { data: existingAppointments, error: fetchError } = await supabase
        .from("appointments")
        .select("*")
        .eq("therapist", baseAppointment.therapist)
        .gte("date", baseAppointment.date)
        .lte("date", baseAppointment.repeat_until)
        .neq("status", "cancelled");

      if (fetchError) {
        console.error("[useCreateFutureRepetitions] Erro ao buscar existentes:", fetchError);
      }

      // Filtrar agendamentos válidos (sem conflito >= 2 pacientes e sem duplicatas)
      const validAppointments: any[] = [];
      const skippedDates: string[] = [];

      for (const apt of appointmentsToCreate) {
        // Verificar duplicata exata (mesmo paciente, data, hora, terapeuta)
        const isDuplicate = (existingAppointments || []).some(
          (existing) =>
            existing.date === apt.date &&
            existing.time === apt.time &&
            existing.patient_name === apt.patient_name
        );

        if (isDuplicate) {
          skippedDates.push(format(parseISO(apt.date), "dd/MM"));
          console.log("[useCreateFutureRepetitions] Pulando (duplicata):", apt.date);
          continue;
        }

        // Verificar conflitos de horário
        const conflictsForDate = (existingAppointments || []).filter(
          (existing) =>
            existing.date === apt.date &&
            hasTimeConflict(apt.time, apt.duration, existing.time, existing.duration || 60)
        );

        if (conflictsForDate.length >= 2) {
          skippedDates.push(format(parseISO(apt.date), "dd/MM"));
          console.log("[useCreateFutureRepetitions] Pulando (lotado):", apt.date);
        } else {
          validAppointments.push(apt);
        }
      }

      console.log("[useCreateFutureRepetitions] Válidos:", validAppointments.length);
      console.log("[useCreateFutureRepetitions] Pulados:", skippedDates);

      if (validAppointments.length === 0) {
        return { 
          data: [], 
          skippedCount: skippedDates.length, 
          skippedDates, 
          totalRequested: appointmentsToCreate.length 
        };
      }

      // Inserir os agendamentos válidos
      const { data, error } = await supabase
        .from("appointments")
        .insert(validAppointments)
        .select();

      if (error) {
        console.error("[useCreateFutureRepetitions] Erro ao inserir:", error);
        throw error;
      }

      console.log("[useCreateFutureRepetitions] Inseridos:", data?.length || 0);

      return { 
        data, 
        skippedCount: skippedDates.length, 
        skippedDates,
        totalRequested: appointmentsToCreate.length 
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      
      const patientId = result?.data?.[0]?.patient_id;
      if (patientId) {
        queryClient.invalidateQueries({ queryKey: ["patient-appointments", patientId] });
        queryClient.invalidateQueries({ queryKey: ["patient-session-stats", patientId] });
      }
      
      const created = result.data?.length || 0;
      const skipped = result.skippedCount || 0;
      
      if (created === 0 && skipped > 0) {
        toast.warning(`Nenhuma repetição criada. ${skipped} datas já existem ou têm conflito.`);
      } else if (skipped > 0) {
        toast.warning(
          `${created} repetições criadas! ${skipped} puladas: ${result.skippedDates?.join(", ")}`,
          { duration: 8000 }
        );
      } else if (created > 0) {
        toast.success(`${created} repetições futuras criadas com sucesso!`);
      }
    },
    onError: (error: any) => {
      console.error("[useCreateFutureRepetitions] onError:", error);
      toast.error(error.message || "Erro ao criar repetições");
    },
  });
};

export const useDeleteAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Agendamento excluído com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao excluir agendamento");
    },
  });
};

export const useCopyWeekAppointments = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      sourceWeekStart, 
      targetWeekStart,
      therapistFilter
    }: { 
      sourceWeekStart: Date; 
      targetWeekStart: Date;
      therapistFilter?: string;
    }) => {
      // Buscar todos os agendamentos da semana origem
      const sourceStart = format(sourceWeekStart, "yyyy-MM-dd");
      const sourceEndDate = format(new Date(sourceWeekStart.getTime() + 5 * 24 * 60 * 60 * 1000), "yyyy-MM-dd");
      const targetStart = format(targetWeekStart, "yyyy-MM-dd");
      const targetEndDate = format(new Date(targetWeekStart.getTime() + 5 * 24 * 60 * 60 * 1000), "yyyy-MM-dd");

      let sourceQuery = supabase
        .from("appointments")
        .select("*")
        .gte("date", sourceStart)
        .lte("date", sourceEndDate)
        .neq("status", "cancelled");

      // Filtrar por terapeuta se especificado
      if (therapistFilter && therapistFilter !== "all") {
        sourceQuery = sourceQuery.eq("therapist", therapistFilter);
      }

      const { data: sourceAppointments, error: fetchError } = await sourceQuery;

      if (fetchError) throw fetchError;

      if (!sourceAppointments || sourceAppointments.length === 0) {
        throw new Error("Nenhum agendamento encontrado na semana atual para copiar");
      }

      // Buscar agendamentos JÁ EXISTENTES na semana destino
      const { data: existingAppointments } = await supabase
        .from("appointments")
        .select("patient_name, date, time, therapist")
        .gte("date", targetStart)
        .lte("date", targetEndDate);

      // Criar conjunto de chaves únicas para verificação rápida
      const existingKeys = new Set(
        (existingAppointments || []).map(
          apt => `${apt.patient_name}-${apt.date}-${apt.time}-${apt.therapist}`
        )
      );

      // Criar novos agendamentos, excluindo duplicatas
      const newAppointments = [];
      const skipped: string[] = [];

      for (const apt of sourceAppointments) {
        const sourceDate = parseISO(apt.date);
        const dayOfWeek = sourceDate.getDay();
        const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        
        const targetDate = new Date(targetWeekStart);
        targetDate.setDate(targetDate.getDate() + daysFromMonday);
        const targetDateStr = format(targetDate, "yyyy-MM-dd");

        const key = `${apt.patient_name}-${targetDateStr}-${apt.time}-${apt.therapist}`;

        if (existingKeys.has(key)) {
          skipped.push(apt.patient_name);
        } else {
          newAppointments.push({
            patient_id: apt.patient_id,
            patient_name: apt.patient_name,
            date: targetDateStr,
            time: apt.time,
            duration: apt.duration,
            therapist: apt.therapist,
            room: apt.room,
            status: "pending",
            is_first_session: false,
            repeat_weekly: false,
            notes: apt.notes,
          });
        }
      }

      if (newAppointments.length === 0) {
        throw new Error("Todos os agendamentos já existem na semana destino");
      }

      // Inserir os novos agendamentos
      const { data, error } = await supabase
        .from("appointments")
        .insert(newAppointments)
        .select();

      if (error) throw error;

      // Retornar resultado com detalhes
      return { 
        created: data, 
        skippedCount: skipped.length,
        totalSource: sourceAppointments.length 
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      
      if (result.skippedCount > 0) {
        toast.success(
          `${result.created?.length || 0} agendamentos copiados! (${result.skippedCount} já existiam)`,
          { duration: 5000 }
        );
      } else {
        toast.success(`${result.created?.length || 0} agendamentos copiados para a próxima semana!`);
      }
    },
    onError: (error: any) => {
      console.error("Erro ao copiar semana:", error);
      toast.error(error.message || "Erro ao copiar agendamentos");
    },
  });
};
