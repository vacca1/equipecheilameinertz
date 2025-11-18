import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Patient {
  id: string;
  name: string;
  cpf?: string;
  birth_date?: string;
  phone?: string;
  emergency_contact?: string;
  email?: string;
  address?: string;
  cep?: string;
  city?: string;
  state?: string;
  main_therapist: string;
  substitute_therapist?: string;
  health_plan?: string;
  plan_number?: string;
  medical_authorization?: string;
  diagnosis?: string;
  medical_report?: string;
  observations?: string;
  session_value?: number;
  commission_percentage?: number;
  payment_method?: string;
  payment_day?: number;
  invoice_delivery?: string;
  days_per_week?: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export const usePatients = (searchTerm: string = "", therapistFilter: string = "all") => {
  return useQuery({
    queryKey: ["patients", searchTerm, therapistFilter],
    queryFn: async () => {
      let query = supabase
        .from("patients")
        .select("*")
        .order("name", { ascending: true });

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,cpf.ilike.%${searchTerm}%`);
      }

      if (therapistFilter && therapistFilter !== "all") {
        query = query.eq("main_therapist", therapistFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Patient[];
    },
  });
};

export const useCreatePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patient: Omit<Patient, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("patients")
        .insert([patient])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Paciente cadastrado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao cadastrar paciente");
    },
  });
};

export const useUpdatePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...patient }: Partial<Patient> & { id: string }) => {
      const { data, error } = await supabase
        .from("patients")
        .update(patient)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Paciente atualizado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar paciente");
    },
  });
};

export const useDeletePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("patients")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Paciente excluído com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao excluir paciente");
    },
  });
};
