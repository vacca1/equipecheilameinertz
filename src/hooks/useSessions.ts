import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface Session {
  id: string;
  patient_id: string | null;
  patient_name: string;
  date: string;
  session_number: number;
  therapist: string;
  initial_pain_level: number | null;
  final_pain_level: number | null;
  observations: string | null;
  session_value: number | null;
  payment_method: string | null;
  payment_status: string | null;
  commission_percentage: number | null;
  commission_value: number | null;
  invoice_delivered: boolean | null;
  was_reimbursed: boolean | null;
  attended: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export function useSessions(
  patientId?: string,
  startDate?: string,
  endDate?: string
) {
  return useQuery({
    queryKey: ["sessions", patientId, startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from("sessions")
        .select("*")
        .order("date", { ascending: false });

      if (patientId) {
        query = query.eq("patient_id", patientId);
      }

      if (startDate) {
        query = query.gte("date", startDate);
      }

      if (endDate) {
        query = query.lte("date", endDate);
      }

      const { data, error } = await query;

      if (error) {
        toast({
          title: "Erro ao carregar sessões",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      return data as Session[];
    },
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (session: Omit<Session, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("sessions")
        .insert(session)
        .select()
        .single();

      if (error) throw error;

      // Se a sessão foi paga, criar entrada automática na tabela incomes
      if (session.payment_status === "paid" && session.session_value) {
        await supabase.from("incomes").insert({
          session_id: data.id,
          date: session.date,
          patient_name: session.patient_name,
          therapist: session.therapist,
          value: session.session_value,
          payment_method: session.payment_method,
          payment_status: "received",
          commission_percentage: session.commission_percentage,
          commission_value: session.commission_value,
          invoice_delivered: session.invoice_delivered || false,
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["incomes"] });
      toast({
        title: "Sessão registrada com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao registrar sessão",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...session }: Partial<Session> & { id: string }) => {
      const { data, error } = await supabase
        .from("sessions")
        .update(session)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast({
        title: "Sessão atualizada com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar sessão",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sessions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast({
        title: "Sessão excluída com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir sessão",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
