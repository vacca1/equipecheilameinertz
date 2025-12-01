import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface IncomeTherapist {
  id: string;
  income_id: string;
  therapist: string;
  sessions_count: number;
  commission_percentage: number;
  commission_value: number | null;
  created_at: string | null;
}

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
  sessions_covered?: number;
  created_at?: string;
  updated_at?: string;
  income_therapists?: IncomeTherapist[];
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
    mutationFn: async (income: Omit<Income, "id" | "created_at" | "updated_at"> & { therapists?: Array<{ therapist: string; sessions_count: number; commission_percentage: number }> }) => {
      const { therapists, ...incomeData } = income;
      
      // Criar o income principal
      const { data, error } = await supabase
        .from("incomes")
        .insert([incomeData])
        .select()
        .single();

      if (error) throw error;

      // Se houver múltiplas fisioterapeutas, criar registros na income_therapists
      if (therapists && therapists.length > 0) {
        const therapistRecords = therapists.map(t => ({
          income_id: data.id,
          therapist: t.therapist,
          sessions_count: t.sessions_count,
          commission_percentage: t.commission_percentage,
          commission_value: (income.value * t.sessions_count * t.commission_percentage) / 100 / (income.sessions_covered || 1),
        }));

        const { error: therapistError } = await supabase
          .from("income_therapists")
          .insert(therapistRecords);

        if (therapistError) throw therapistError;
      }

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
