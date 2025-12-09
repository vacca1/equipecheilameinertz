import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PatientAppointment {
  id: string;
  patient_id: string | null;
  patient_name: string;
  date: string;
  time: string;
  duration: number;
  therapist: string;
  room: string | null;
  status: string;
  notes: string | null;
  created_at: string | null;
}

export function usePatientAppointments(patientId?: string) {
  return useQuery({
    queryKey: ["patient-appointments", patientId],
    queryFn: async () => {
      if (!patientId) return [];

      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("patient_id", patientId)
        .order("date", { ascending: false })
        .order("time", { ascending: false });

      if (error) throw error;
      return data as PatientAppointment[];
    },
    enabled: !!patientId,
  });
}

export function usePatientIncomes(patientName?: string) {
  return useQuery({
    queryKey: ["patient-incomes", patientName],
    queryFn: async () => {
      if (!patientName) return [];

      const { data, error } = await supabase
        .from("incomes")
        .select("*")
        .eq("patient_name", patientName)
        .order("date", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!patientName,
  });
}
