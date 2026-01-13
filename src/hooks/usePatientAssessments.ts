import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ClinicalAssessment {
  id: string;
  patient_id: string;
  assessment_date: string;
  requesting_doctor?: string;
  diagnosis: string;
  main_complaint?: string;
  clinical_history?: string;
  physical_exam?: string;
  treatment_plan?: string;
  observations?: string;
  is_initial_assessment?: boolean;
  created_at?: string;
  updated_at?: string;
}

export type ClinicalAssessmentInsert = Omit<ClinicalAssessment, 'id' | 'created_at' | 'updated_at'>;
export type ClinicalAssessmentUpdate = Partial<ClinicalAssessmentInsert>;

export function usePatientAssessments(patientId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: assessments = [], isLoading, error } = useQuery({
    queryKey: ['patient-assessments', patientId],
    queryFn: async () => {
      if (!patientId) return [];
      
      const { data, error } = await supabase
        .from('patient_clinical_assessments')
        .select('*')
        .eq('patient_id', patientId)
        .order('assessment_date', { ascending: false });
      
      if (error) throw error;
      return data as ClinicalAssessment[];
    },
    enabled: !!patientId,
  });

  const createAssessment = useMutation({
    mutationFn: async (assessment: ClinicalAssessmentInsert) => {
      const { data, error } = await supabase
        .from('patient_clinical_assessments')
        .insert(assessment)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-assessments', patientId] });
      toast.success('Avaliação clínica criada com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating assessment:', error);
      toast.error('Erro ao criar avaliação clínica');
    },
  });

  const updateAssessment = useMutation({
    mutationFn: async ({ id, ...updates }: ClinicalAssessmentUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('patient_clinical_assessments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-assessments', patientId] });
      toast.success('Avaliação clínica atualizada!');
    },
    onError: (error) => {
      console.error('Error updating assessment:', error);
      toast.error('Erro ao atualizar avaliação clínica');
    },
  });

  const deleteAssessment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('patient_clinical_assessments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-assessments', patientId] });
      toast.success('Avaliação clínica removida!');
    },
    onError: (error) => {
      console.error('Error deleting assessment:', error);
      toast.error('Erro ao remover avaliação clínica');
    },
  });

  return {
    assessments,
    isLoading,
    error,
    createAssessment,
    updateAssessment,
    deleteAssessment,
  };
}
