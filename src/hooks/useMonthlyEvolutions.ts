import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface MonthlyEvolution {
  id: string;
  patient_id: string;
  year_month: string;
  evolution_text: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export function useMonthlyEvolutions(patientId?: string) {
  return useQuery({
    queryKey: ["monthly-evolutions", patientId],
    queryFn: async () => {
      let query = supabase
        .from("monthly_evolutions")
        .select("*")
        .order("year_month", { ascending: false });

      if (patientId) {
        query = query.eq("patient_id", patientId);
      }

      const { data, error } = await query;

      if (error) {
        toast.error("Erro ao carregar evoluções mensais", {
          description: error.message,
        });
        throw error;
      }

      return data as MonthlyEvolution[];
    },
    enabled: !!patientId,
  });
}

export function useCreateMonthlyEvolution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (evolution: Omit<MonthlyEvolution, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("monthly_evolutions")
        .insert(evolution)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monthly-evolutions"] });
      toast.success("Evolução mensal registrada com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao registrar evolução mensal", {
        description: error.message,
      });
    },
  });
}

export function useUpdateMonthlyEvolution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...evolution }: Partial<MonthlyEvolution> & { id: string }) => {
      const { data, error } = await supabase
        .from("monthly_evolutions")
        .update(evolution)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monthly-evolutions"] });
      toast.success("Evolução mensal atualizada com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar evolução mensal", {
        description: error.message,
      });
    },
  });
}

export function useDeleteMonthlyEvolution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("monthly_evolutions")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monthly-evolutions"] });
      toast.success("Evolução mensal excluída com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir evolução mensal", {
        description: error.message,
      });
    },
  });
}
