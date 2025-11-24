import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Patient } from "@/hooks/usePatients";
import { 
  User, Phone, Mail, MapPin, Heart, Stethoscope, 
  Pill, Activity, Users, Calendar, CreditCard, FileText 
} from "lucide-react";

interface PatientQuickViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient | null;
}

const InfoField = ({ label, value, icon: Icon }: { label: string; value: string | number | null | undefined; icon?: any }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {label}
    </label>
    <p className="text-sm text-foreground">{value || "Não informado"}</p>
  </div>
);

const mobilityLevelLabels = {
  'none': 'Nenhuma dificuldade',
  'partial': 'Dificuldade parcial',
  'severe': 'Dificuldade severa'
};

export const PatientQuickView = ({ open, onOpenChange, patient }: PatientQuickViewProps) => {
  if (!patient) return null;

  const formatDate = (date: string | null | undefined) => {
    if (!date) return null;
    try {
      return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return date;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="text-2xl flex items-center gap-2">
            <User className="w-6 h-6 text-primary" />
            {patient.name}
          </SheetTitle>
          <SheetDescription className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary">
              {patient.health_plan || "Sem convênio"}
            </Badge>
            <span className="text-sm">•</span>
            <span>{patient.main_therapist}</span>
            {patient.status === "active" && (
              <>
                <span className="text-sm">•</span>
                <Badge variant="default" className="bg-green-500">Ativo</Badge>
              </>
            )}
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="personal" className="mt-6">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="personal">Pessoais</TabsTrigger>
            <TabsTrigger value="clinical">Clínicos</TabsTrigger>
            <TabsTrigger value="operational">Operacional</TabsTrigger>
            <TabsTrigger value="financial">Financeiro</TabsTrigger>
          </TabsList>

          {/* Dados Pessoais */}
          <TabsContent value="personal" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField label="Nome Completo" value={patient.name} icon={User} />
              <InfoField label="CPF" value={patient.cpf} icon={FileText} />
              <InfoField label="RG" value={patient.rg} icon={FileText} />
              <InfoField label="Data de Nascimento" value={formatDate(patient.birth_date)} icon={Calendar} />
              <InfoField label="Telefone" value={patient.phone} icon={Phone} />
              <InfoField label="E-mail" value={patient.email} icon={Mail} />
            </div>

            <div className="pt-4 border-t">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Endereço
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoField label="CEP" value={patient.cep} />
                <InfoField label="Logradouro" value={patient.address} />
                <InfoField label="Número" value={patient.address_number} />
                <InfoField label="Complemento" value={patient.address_complement} />
                <InfoField label="Cidade" value={patient.city} />
                <InfoField label="Estado" value={patient.state} />
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoField 
                  label="Dificuldade de Locomoção" 
                  value={patient.mobility_level ? mobilityLevelLabels[patient.mobility_level as keyof typeof mobilityLevelLabels] : 'Nenhuma'} 
                  icon={Activity}
                />
                <InfoField label="Contato de Emergência" value={patient.emergency_contact} icon={Phone} />
              </div>
            </div>
          </TabsContent>

          {/* Informações Clínicas */}
          <TabsContent value="clinical" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 gap-4">
              <InfoField label="Médico Solicitante" value={patient.requesting_doctor} icon={Stethoscope} />
              <InfoField label="Diagnóstico" value={patient.diagnosis} icon={Heart} />
            </div>

            <div className="pt-4 border-t space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Histórico Médico
                </h4>
                <div className="space-y-4">
                  <InfoField 
                    label="Patologias Prévias" 
                    value={patient.previous_pathologies || "Nenhuma informação registrada"} 
                  />
                  <InfoField 
                    label="Relatório Médico/Exame Físico" 
                    value={patient.medical_report || "Nenhum relatório registrado"} 
                  />
                  <InfoField 
                    label="Cirurgias Realizadas" 
                    value={patient.surgeries || "Nenhuma cirurgia registrada"} 
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t space-y-4">
              <InfoField 
                label="Medicações em Uso" 
                value={patient.medications || "Nenhuma medicação registrada"} 
                icon={Pill}
              />
              <InfoField 
                label="Plano de Tratamento" 
                value={patient.treatment_plan || "Nenhum plano definido"} 
                icon={Activity}
              />
            </div>
          </TabsContent>

          {/* Dados Operacionais */}
          <TabsContent value="operational" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField label="Fisioterapeuta Principal" value={patient.main_therapist} icon={Users} />
              <InfoField label="Fisioterapeuta Substituta" value={patient.substitute_therapist} icon={Users} />
              <InfoField label="Sala Específica" value={patient.specific_room} icon={MapPin} />
              <InfoField label="Dias por Semana" value={patient.days_per_week} icon={Calendar} />
            </div>

            <div className="pt-4 border-t space-y-4">
              <InfoField 
                label="Autorização Médica" 
                value={patient.medical_authorization || "Não informado"} 
                icon={FileText}
              />
              <InfoField 
                label="Notas de Flexibilidade de Horário" 
                value={patient.flexibility_notes || "Sem restrições específicas"} 
              />
              <InfoField 
                label="Observações Gerais" 
                value={patient.observations || "Nenhuma observação"} 
                icon={FileText}
              />
            </div>
          </TabsContent>

          {/* Dados Financeiros */}
          <TabsContent value="financial" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField label="Convênio/Plano de Saúde" value={patient.health_plan} icon={CreditCard} />
              <InfoField label="Número da Carteirinha" value={patient.plan_number} />
              <InfoField 
                label="Valor da Sessão" 
                value={patient.session_value ? `R$ ${patient.session_value.toFixed(2)}` : null} 
                icon={CreditCard}
              />
              <InfoField 
                label="Desconto" 
                value={patient.discount || (patient.discount_percentage ? `${patient.discount_percentage}%` : null)} 
              />
            </div>

            <div className="pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField 
                label="Percentual de Repasse" 
                value={patient.commission_percentage ? `${patient.commission_percentage}%` : null} 
                icon={Activity}
              />
              <InfoField label="Método de Pagamento" value={patient.payment_method} icon={CreditCard} />
              <InfoField label="Dia de Pagamento" value={patient.payment_day} icon={Calendar} />
              <InfoField label="Entrega de Nota Fiscal" value={patient.invoice_delivery} icon={FileText} />
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};
