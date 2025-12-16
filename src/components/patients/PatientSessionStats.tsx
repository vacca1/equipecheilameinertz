// components/patients/PatientSessionStats.tsx
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { CheckCircle, XCircle, Calendar } from 'lucide-react';

interface PatientSessionStatsProps {
  patientId: string;
}

export function PatientSessionStats({ patientId }: PatientSessionStatsProps) {
  const { data: stats } = useQuery({
    queryKey: ['patient-session-stats', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('attendance_status, date')
        .eq('patient_id', patientId)
        .lte('date', new Date().toISOString().split('T')[0]);
      
      if (error) throw error;
      
      const totalSessions = data?.length || 0;
      const presentSessions = data?.filter(a => a.attendance_status === 'present').length || 0;
      const absentSessions = data?.filter(a => a.attendance_status === 'absent').length || 0;
      const attendanceRate = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0;
      
      return {
        totalSessions,
        presentSessions,
        absentSessions,
        attendanceRate,
      };
    },
    enabled: !!patientId,
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-full">
            <Calendar className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total de Sessões</p>
            <p className="text-2xl font-bold">{stats?.totalSessions || 0}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-100 rounded-full">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Compareceu</p>
            <p className="text-2xl font-bold text-green-600">
              {stats?.presentSessions || 0}
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-orange-100 rounded-full">
            <XCircle className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Faltas</p>
            <p className="text-2xl font-bold text-orange-600">
              {stats?.absentSessions || 0}
            </p>
            {stats?.attendanceRate !== undefined && stats.totalSessions > 0 && (
              <p className="text-xs text-muted-foreground">
                {stats.attendanceRate}% presença
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
