import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DayNote {
  id: string;
  date: string;
  therapist: string;
  content: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export function useDayNotes(startDate: string, endDate: string, therapist?: string) {
  const queryClient = useQueryClient();

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["day-notes", startDate, endDate, therapist],
    queryFn: async () => {
      let query = supabase
        .from("agenda_day_notes")
        .select("*")
        .gte("date", startDate)
        .lte("date", endDate);

      if (therapist && therapist !== "Todos") {
        query = query.eq("therapist", therapist);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as DayNote[];
    },
  });

  const upsertNote = useMutation({
    mutationFn: async ({ date, therapist, content }: { date: string; therapist: string; content: string }) => {
      const { data, error } = await supabase
        .from("agenda_day_notes")
        .upsert(
          { date, therapist, content },
          { onConflict: "date,therapist" }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["day-notes"] });
      toast.success("Observação salva!");
    },
    onError: () => {
      toast.error("Erro ao salvar observação");
    },
  });

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("agenda_day_notes")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["day-notes"] });
      toast.success("Observação removida!");
    },
    onError: () => {
      toast.error("Erro ao remover observação");
    },
  });

  const getNoteForDate = (date: string, therapistName?: string) => {
    return notes.find(
      (note) =>
        note.date === date &&
        (therapistName ? note.therapist === therapistName : true)
    );
  };

  return {
    notes,
    isLoading,
    upsertNote,
    deleteNote,
    getNoteForDate,
  };
}
