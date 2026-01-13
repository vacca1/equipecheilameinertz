// components/patients/PatientPackagesCard.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Package, Calendar, AlertCircle, Plus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface PatientPackagesCardProps {
  patientId: string;
}

export function PatientPackagesCard({ patientId }: PatientPackagesCardProps) {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);

  const { data: packages, isLoading } = useQuery({
    queryKey: ['patient-packages', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patient_packages')
        .select(`
          *,
          package:packages(name, description)
        `)
        .eq('patient_id', patientId)
        .in('status', ['active', 'expired', 'completed'])
        .order('purchase_date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!patientId,
  });

  const { data: availablePackages } = useQuery({
    queryKey: ['packages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('is_active', true)
        .order('total_sessions');
      
      if (error) throw error;
      return data;
    },
  });

  const activePackages = packages?.filter(p => p.status === 'active') || [];
  const totalRemaining = activePackages.reduce((sum, p) => sum + (p.total_sessions - p.used_sessions), 0);

  if (isLoading) {
    return <Card className="p-6 animate-pulse"><div className="h-20 bg-muted rounded" /></Card>;
  }

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-lg">Pacotes de Sessões</h3>
          </div>
          
          <div className="flex items-center gap-2">
            {totalRemaining > 0 && (
              <Badge variant="secondary" className="text-lg font-bold bg-green-100 text-green-800">
                {totalRemaining} sessões
              </Badge>
            )}
            <Button size="sm" variant="outline" onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          </div>
        </div>

        {(!packages || packages.length === 0) ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>Nenhum pacote ativo</p>
          </div>
        ) : (
          <div className="space-y-4">
            {packages.map(pkg => (
              <PackageItem key={pkg.id} pkg={pkg} />
            ))}
          </div>
        )}
      </Card>

      <AddPackageModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        patientId={patientId}
        availablePackages={availablePackages || []}
      />
    </>
  );
}

function PackageItem({ pkg }: { pkg: any }) {
  const remaining = pkg.total_sessions - pkg.used_sessions;
  const progress = (pkg.used_sessions / pkg.total_sessions) * 100;
  const isExpiringSoon = pkg.expiration_date && 
    new Date(pkg.expiration_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const statusConfig: Record<string, { label: string; color: string }> = {
    active: { label: 'Ativo', color: 'bg-green-100 text-green-800' },
    expired: { label: 'Expirado', color: 'bg-red-100 text-red-800' },
    completed: { label: 'Concluído', color: 'bg-gray-100 text-gray-800' },
  };

  const status = statusConfig[pkg.status] || statusConfig.active;

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-medium">{pkg.package?.name || 'Pacote'}</h4>
          {pkg.package?.description && (
            <p className="text-sm text-muted-foreground">{pkg.package.description}</p>
          )}
        </div>
        <Badge className={status.color}>{status.label}</Badge>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {pkg.used_sessions} de {pkg.total_sessions} sessões usadas
          </span>
          <span className="font-medium">
            {remaining} restantes
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {pkg.expiration_date && (
        <div className={`flex items-center gap-2 text-sm ${
          isExpiringSoon ? 'text-orange-600' : 'text-muted-foreground'
        }`}>
          <Calendar className="h-4 w-4" />
          <span>
            Válido até {new Date(pkg.expiration_date).toLocaleDateString('pt-BR')}
          </span>
          {isExpiringSoon && <AlertCircle className="h-4 w-4" />}
        </div>
      )}

      {remaining > 0 && remaining <= 3 && pkg.status === 'active' && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-600">
            Atenção! Restam apenas {remaining} sessões.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

interface AddPackageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  availablePackages: any[];
}

function AddPackageModal({ open, onOpenChange, patientId, availablePackages }: AddPackageModalProps) {
  const queryClient = useQueryClient();
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [customPrice, setCustomPrice] = useState<string>('');
  const [usedSessions, setUsedSessions] = useState<string>('0');

  const createPackage = useMutation({
    mutationFn: async () => {
      const pkg = availablePackages.find(p => p.id === selectedPackage);
      if (!pkg) throw new Error('Pacote não encontrado');

      const expirationDate = pkg.validity_days 
        ? new Date(Date.now() + pkg.validity_days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : null;

      const usedSessionsNum = parseInt(usedSessions) || 0;
      const isCompleted = usedSessionsNum >= pkg.total_sessions;

      const { error } = await supabase
        .from('patient_packages')
        .insert({
          patient_id: patientId,
          package_id: pkg.id,
          total_sessions: pkg.total_sessions,
          used_sessions: usedSessionsNum,
          purchase_price: customPrice ? parseFloat(customPrice) : pkg.price,
          expiration_date: expirationDate,
          status: isCompleted ? 'completed' : 'active',
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-packages', patientId] });
      queryClient.invalidateQueries({ queryKey: ['patient-credits', patientId] });
      queryClient.invalidateQueries({ queryKey: ['active-package', patientId] });
      queryClient.invalidateQueries({ queryKey: ['all-patient-packages', patientId] });
      toast.success('Pacote adicionado com sucesso!');
      onOpenChange(false);
      setSelectedPackage('');
      setCustomPrice('');
      setUsedSessions('0');
    },
    onError: (error) => {
      toast.error('Erro ao adicionar pacote');
      console.error(error);
    },
  });

  const selectedPkg = availablePackages.find(p => p.id === selectedPackage);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Pacote</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Pacote *</Label>
            <Select value={selectedPackage} onValueChange={setSelectedPackage}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um pacote" />
              </SelectTrigger>
              <SelectContent>
                {availablePackages.map(pkg => (
                  <SelectItem key={pkg.id} value={pkg.id}>
                    <div className="flex flex-col">
                      <span>{pkg.name} - {pkg.total_sessions} sessões</span>
                      <span className="text-xs text-muted-foreground">
                        R$ {pkg.price?.toFixed(2)} | Validade: {pkg.validity_days || '∞'} dias
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPkg && (
            <>
              <div className="space-y-2">
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder={selectedPkg.price?.toFixed(2)}
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Deixe em branco para usar valor padrão: R$ {selectedPkg.price?.toFixed(2)}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Sessões já utilizadas</Label>
                <Input
                  type="number"
                  min="0"
                  max={selectedPkg.total_sessions}
                  placeholder="0"
                  value={usedSessions}
                  onChange={(e) => setUsedSessions(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Informe quantas sessões já foram realizadas (para pacotes retroativos)
                </p>
                {parseInt(usedSessions) > 0 && (
                  <p className="text-xs font-medium text-primary">
                    Restantes: {selectedPkg.total_sessions - (parseInt(usedSessions) || 0)} sessões
                  </p>
                )}
              </div>
            </>
          )}

          <Button 
            className="w-full" 
            onClick={() => createPackage.mutate()}
            disabled={!selectedPackage || createPackage.isPending}
          >
            {createPackage.isPending ? 'Adicionando...' : 'Adicionar Pacote'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
