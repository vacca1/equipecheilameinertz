import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Income {
  id: string;
  date: string;
  patient_name: string;
  therapist: string;
  value: number;
  commission_percentage: number;
  commission_value?: number;
  payment_method?: string;
  payment_status: string;
  invoice_delivered: boolean;
  observations?: string;
  session_id?: string;
  created_at?: string;
  updated_at?: string;
}

export const useIncomes = (startDate?: string, endDate?: string, therapistFilter?: string) => {
  return useQuery({
    queryKey: ["incomes", startDate, endDate, therapistFilter],
    queryFn: async () => {
      let query = supabase
        .from("incomes")
        .select("*")
        .order("date", { ascending: false });

      if (startDate) {
        query = query.gte("date", startDate);
      }

      if (endDate) {
        query = query.lte("date", endDate);
      }

      if (therapistFilter && therapistFilter !== "all") {
        query = query.eq("therapist", therapistFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Income[];
    },
  });
};

export const useCreateIncome = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (income: Omit<Income, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("incomes")
        .insert([income])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incomes"] });
      toast.success("Entrada registrada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao registrar entrada");
    },
  });
};

export const useUpdateIncome = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...income }: Partial<Income> & { id: string }) => {
      const { data, error } = await supabase
        .from("incomes")
        .update(income)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incomes"] });
      toast.success("Entrada atualizada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar entrada");
    },
  });
};

export const useDeleteIncome = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("incomes")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incomes"] });
      toast.success("Entrada excluída com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao excluir entrada");
    },
  });
};
