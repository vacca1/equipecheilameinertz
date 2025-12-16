// hooks/useAppointmentMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useAppointmentMutations() {
  const queryClient = useQueryClient();

  // Helper para invalidar todos os caches relacionados
  const invalidateAppointmentCaches = (patientId?: string) => {
    // Cache da agenda geral
    queryClient.invalidateQueries({ queryKey: ['appointments'] });
    
    // Cache da ficha do paciente
    if (patientId) {
      queryClient.invalidateQueries({ 
        queryKey: ['patient-appointments', patientId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['patient-session-stats', patientId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['patient-packages', patientId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['patient-credits', patientId] 
      });
    }
    
    // Cache de profissionais
    queryClient.invalidateQueries({ queryKey: ['therapist-appointments'] });
  };

  // Marcar presença
  const markAttendance = useMutation({
    mutationFn: async ({ 
      id, 
      patientId,
      status 
    }: { 
      id: string; 
      patientId?: string;
      status: 'present' | 'absent' 
    }) => {
      const { data, error } = await supabase
        .from('appointments')
        .update({ 
          attendance_status: status,
          status: status === 'present' ? 'completed' : 'scheduled',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return { ...data, patientId };
    },
    onSuccess: (data) => {
      invalidateAppointmentCaches(data.patient_id || data.patientId);
      toast.success(data.attendance_status === 'present' ? 'Presença registrada!' : 'Falta registrada!');
    },
    onError: (error) => {
      toast.error('Erro ao registrar presença');
      console.error(error);
    },
  });

  // Usar sessão do pacote
  const usePackageSession = useMutation({
    mutationFn: async ({ 
      patientId, 
      appointmentId 
    }: { 
      patientId: string; 
      appointmentId: string;
    }) => {
      // Buscar pacote ativo com sessões disponíveis
      const { data: packages, error: pkgError } = await supabase
        .from('patient_packages')
        .select('*')
        .eq('patient_id', patientId)
        .eq('status', 'active')
        .order('expiration_date', { ascending: true, nullsFirst: false })
        .order('purchase_date', { ascending: true });
      
      if (pkgError) throw pkgError;
      
      // Encontrar pacote com sessões disponíveis
      const availablePackage = packages?.find(pkg => pkg.used_sessions < pkg.total_sessions);
      
      if (!availablePackage) {
        return { used: false, patientId };
      }

      // Incrementar sessões usadas
      const newUsedSessions = availablePackage.used_sessions + 1;
      const newStatus = newUsedSessions >= availablePackage.total_sessions ? 'completed' : 'active';
      
      const { error: updateError } = await supabase
        .from('patient_packages')
        .update({ 
          used_sessions: newUsedSessions,
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', availablePackage.id);
      
      if (updateError) throw updateError;

      // Vincular agendamento ao pacote
      await supabase
        .from('appointments')
        .update({ package_id: availablePackage.id })
        .eq('id', appointmentId);

      return { used: true, patientId, packageId: availablePackage.id };
    },
    onSuccess: (data) => {
      if (data.used) {
        toast.success('Sessão do pacote descontada!');
      }
      invalidateAppointmentCaches(data.patientId);
    },
    onError: (error) => {
      console.error('Erro ao processar sessão do pacote:', error);
    },
  });

  return {
    markAttendance,
    usePackageSession,
    invalidateAppointmentCaches,
  };
}
