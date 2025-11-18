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
      // Se repeat_weekly é true, criar múltiplos agendamentos
      if (appointment.repeat_weekly && appointment.repeat_until) {
        const appointments = [];
        let currentDate = parseISO(appointment.date);
        const endDate = parseISO(appointment.repeat_until);

        while (currentDate <= endDate) {
          appointments.push({
            ...appointment,
            date: format(currentDate, "yyyy-MM-dd"),
          });
          currentDate = addWeeks(currentDate, 1);
        }

        const { data, error } = await supabase
          .from("appointments")
          .insert(appointments)
          .select();

        if (error) throw error;
        return data;
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Agendamento criado com sucesso!");
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
