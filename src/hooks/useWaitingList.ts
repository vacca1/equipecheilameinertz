import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface WaitingListItem {
  id: string;
  date: string;
  patient_name: string;
  patient_id: string | null;
  therapist: string | null;
  preferred_time: string | null;
  notes: string | null;
  priority: number | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export function useWaitingList(startDate: string, endDate: string, therapist?: string) {
  const queryClient = useQueryClient();

  const { data: waitingList = [], isLoading } = useQuery({
    queryKey: ["waiting-list", startDate, endDate, therapist],
    queryFn: async () => {
      let query = supabase
        .from("waiting_list")
        .select("*")
        .gte("date", startDate)
        .lte("date", endDate)
        .eq("status", "waiting")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: true });

      if (therapist && therapist !== "Todos") {
        query = query.eq("therapist", therapist);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as WaitingListItem[];
    },
  });

  const addToWaitingList = useMutation({
    mutationFn: async (item: Omit<WaitingListItem, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("waiting_list")
        .insert(item)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waiting-list"] });
      toast.success("Paciente adicionado à lista de espera!");
    },
    onError: () => {
      toast.error("Erro ao adicionar à lista de espera");
    },
  });

  const updateWaitingListItem = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<WaitingListItem> & { id: string }) => {
      const { data, error } = await supabase
        .from("waiting_list")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waiting-list"] });
    },
    onError: () => {
      toast.error("Erro ao atualizar lista de espera");
    },
  });

  const removeFromWaitingList = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("waiting_list")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waiting-list"] });
      toast.success("Paciente removido da lista de espera!");
    },
    onError: () => {
      toast.error("Erro ao remover da lista de espera");
    },
  });

  const markAsScheduled = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("waiting_list")
        .update({ status: "scheduled" })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waiting-list"] });
      toast.success("Paciente marcado como agendado!");
    },
    onError: () => {
      toast.error("Erro ao atualizar status");
    },
  });

  const getWaitingListForDate = (date: string) => {
    return waitingList.filter((item) => item.date === date);
  };

  const getCountForDate = (date: string) => {
    return waitingList.filter((item) => item.date === date).length;
  };

  return {
    waitingList,
    isLoading,
    addToWaitingList,
    updateWaitingListItem,
    removeFromWaitingList,
    markAsScheduled,
    getWaitingListForDate,
    getCountForDate,
  };
}
