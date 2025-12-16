// components/patients/PatientCreditsCard.tsx
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Package, AlertTriangle, CheckCircle } from 'lucide-react';

interface PatientCreditsCardProps {
  patientId: string;
}

export function PatientCreditsCard({ patientId }: PatientCreditsCardProps) {
  const { data: credits } = useQuery({
    queryKey: ['patient-credits', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patient_packages')
        .select('total_sessions, used_sessions, status')
        .eq('patient_id', patientId)
        .eq('status', 'active');
      
      if (error) throw error;
      
      const totalPackages = data?.length || 0;
      const totalRemaining = data?.reduce((sum, pkg) => sum + (pkg.total_sessions - pkg.used_sessions), 0) || 0;
      const totalUsed = data?.reduce((sum, pkg) => sum + pkg.used_sessions, 0) || 0;
      
      return {
        totalPackages,
        totalRemaining,
        totalUsed,
      };
    },
    enabled: !!patientId,
  });

  const totalRemaining = credits?.totalRemaining || 0;
  const isLow = totalRemaining > 0 && totalRemaining <= 5;
  const isEmpty = totalRemaining === 0;

  return (
    <Card className={`p-6 ${
      isEmpty ? 'border-red-200 bg-red-50' : 
      isLow ? 'border-orange-200 bg-orange-50' : 
      'border-green-200 bg-green-50'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-full ${
            isEmpty ? 'bg-red-100' : 
            isLow ? 'bg-orange-100' : 
            'bg-green-100'
          }`}>
            <Package className={`h-8 w-8 ${
              isEmpty ? 'text-red-600' : 
              isLow ? 'text-orange-600' : 
              'text-green-600'
            }`} />
          </div>

          <div>
            <p className="text-sm text-muted-foreground font-medium">
              Créditos Disponíveis
            </p>
            <p className={`text-4xl font-bold ${
              isEmpty ? 'text-red-600' : 
              isLow ? 'text-orange-600' : 
              'text-green-600'
            }`}>
              {totalRemaining}
            </p>
            <p className="text-xs text-muted-foreground">
              {totalRemaining === 1 ? 'sessão restante' : 'sessões restantes'}
            </p>
          </div>
        </div>

        <div className="text-right">
          {isEmpty ? (
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <div>
                <p className="font-semibold">Sem créditos</p>
                <p className="text-xs">Adquira novo pacote</p>
              </div>
            </div>
          ) : isLow ? (
            <div className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              <div>
                <p className="font-semibold">Créditos baixos</p>
                <p className="text-xs">Considere renovar</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <div>
                <p className="font-semibold">Créditos OK</p>
                <p className="text-xs">{credits?.totalPackages || 0} pacote(s) ativo(s)</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {credits && (
        <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold">{credits.totalPackages || 0}</p>
            <p className="text-xs text-muted-foreground">Pacotes Ativos</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{credits.totalUsed || 0}</p>
            <p className="text-xs text-muted-foreground">Sessões Usadas</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{totalRemaining}</p>
            <p className="text-xs text-muted-foreground">Disponíveis</p>
          </div>
        </div>
      )}
    </Card>
  );
}
