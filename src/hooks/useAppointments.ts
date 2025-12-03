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

export const useCreateAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointment: Omit<Appointment, "id" | "created_at" | "updated_at">) => {
      // Se repeat_weekly é true, validar e criar múltiplos agendamentos
      if (appointment.repeat_weekly && appointment.repeat_until) {
        const toCheck = [];
        let currentDate = parseISO(appointment.date);
        const endDate = parseISO(appointment.repeat_until);

        // Coletar todas as datas a serem criadas
        while (currentDate <= endDate) {
          toCheck.push({
            ...appointment,
            date: format(currentDate, "yyyy-MM-dd"),
          });
          currentDate = addWeeks(currentDate, 1);
        }

        // Buscar agendamentos existentes no período para validação
        const { data: existingAppointments } = await supabase
          .from("appointments")
          .select("*")
          .eq("therapist", appointment.therapist)
          .gte("date", appointment.date)
          .lte("date", appointment.repeat_until)
          .neq("status", "cancelled");

        // Função auxiliar para verificar conflito de horários
        const hasTimeConflict = (
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

        // Validar cada data
        const validAppointments = [];
        const conflicts: string[] = [];

        for (const apt of toCheck) {
          const conflictsForDate = (existingAppointments || []).filter(
            (existing) =>
              existing.date === apt.date &&
              hasTimeConflict(apt.time, apt.duration, existing.time, existing.duration || 60)
          );

          // Pilates dupla: permitir até 2 pacientes
          if (conflictsForDate.length >= 2) {
            conflicts.push(format(parseISO(apt.date), "dd/MM/yyyy"));
          } else {
            validAppointments.push(apt);
          }
        }

        // Se houver conflitos, notificar o usuário
        if (conflicts.length > 0) {
          const summary = `${validAppointments.length} de ${toCheck.length} agendamentos criados. ${conflicts.length} conflitos (horário lotado): ${conflicts.join(", ")}`;
          
          if (validAppointments.length === 0) {
            throw new Error(`Não foi possível criar nenhum agendamento. Conflitos: ${conflicts.join(", ")}`);
          }
          
          toast.warning(summary, { duration: 8000 });
        }

        // Inserir apenas os agendamentos válidos
        if (validAppointments.length > 0) {
          const { data, error } = await supabase
            .from("appointments")
            .insert(validAppointments)
            .select();

          if (error) throw error;
          return data;
        }
        
        return [];
      } else {
        const { data, error } = await supabase
          .from("appointments")
          .insert([appointment])
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      if (Array.isArray(data) && data.length > 1) {
        toast.success(`${data.length} agendamentos criados com sucesso!`);
      } else {
        toast.success("Agendamento criado com sucesso!");
      }
    },
    onError: (error: any) => {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Agendamento atualizado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar agendamento");
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
      targetWeekStart 
    }: { 
      sourceWeekStart: Date; 
      targetWeekStart: Date;
    }) => {
      // Buscar todos os agendamentos da semana origem
      const sourceStart = format(sourceWeekStart, "yyyy-MM-dd");
      const sourceEnd = format(addWeeks(sourceWeekStart, 0), "yyyy-MM-dd");
      const sourceEndDate = format(new Date(sourceWeekStart.getTime() + 5 * 24 * 60 * 60 * 1000), "yyyy-MM-dd");

      const { data: sourceAppointments, error: fetchError } = await supabase
        .from("appointments")
        .select("*")
        .gte("date", sourceStart)
        .lte("date", sourceEndDate)
        .neq("status", "cancelled");

      if (fetchError) throw fetchError;

      if (!sourceAppointments || sourceAppointments.length === 0) {
        throw new Error("Nenhum agendamento encontrado na semana atual");
      }

      // Criar novos agendamentos na semana destino
      const newAppointments = sourceAppointments.map((apt) => {
        const sourceDate = parseISO(apt.date);
        const dayOfWeek = sourceDate.getDay();
        const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        
        const targetDate = new Date(targetWeekStart);
        targetDate.setDate(targetDate.getDate() + daysFromMonday);

        return {
          patient_id: apt.patient_id,
          patient_name: apt.patient_name,
          date: format(targetDate, "yyyy-MM-dd"),
          time: apt.time,
          duration: apt.duration,
          therapist: apt.therapist,
          room: apt.room,
          status: "pending", // Nova semana começa como pendente
          is_first_session: false,
          repeat_weekly: false,
          notes: apt.notes,
        };
      });

      const { data, error } = await supabase
        .from("appointments")
        .insert(newAppointments)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success(`${data?.length || 0} agendamentos copiados para a próxima semana!`);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao copiar agendamentos");
    },
  });
};
