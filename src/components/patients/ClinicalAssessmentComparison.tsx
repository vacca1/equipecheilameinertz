import { useState, useMemo } from "react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Calendar, User, FileText, Stethoscope, ClipboardList, MessageSquare } from "lucide-react";
import { ClinicalAssessment } from "@/hooks/usePatientAssessments";

interface ClinicalAssessmentComparisonProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessments: ClinicalAssessment[];
}

interface ComparisonFieldProps {
  label: string;
  icon: React.ReactNode;
  value1: string | undefined | null;
  value2: string | undefined | null;
  highlight?: boolean;
}

const ComparisonField = ({ label, icon, value1, value2, highlight }: ComparisonFieldProps) => {
  const isDifferent = value1 !== value2;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className={`p-3 rounded-lg border min-h-[60px] ${isDifferent && highlight ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800' : 'bg-muted/30'}`}>
          <p className="text-sm whitespace-pre-wrap">{value1 || <span className="text-muted-foreground italic">Não informado</span>}</p>
        </div>
        <div className={`p-3 rounded-lg border min-h-[60px] ${isDifferent && highlight ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800' : 'bg-muted/30'}`}>
          <p className="text-sm whitespace-pre-wrap">{value2 || <span className="text-muted-foreground italic">Não informado</span>}</p>
        </div>
      </div>
    </div>
  );
};

export function ClinicalAssessmentComparison({
  open,
  onOpenChange,
  assessments,
}: ClinicalAssessmentComparisonProps) {
  const [selectedId1, setSelectedId1] = useState<string>("");
  const [selectedId2, setSelectedId2] = useState<string>("");

  // Sort assessments by date (oldest first for comparison)
  const sortedAssessments = useMemo(() => {
    return [...assessments].sort(
      (a, b) => new Date(a.assessment_date).getTime() - new Date(b.assessment_date).getTime()
    );
  }, [assessments]);

  // Auto-select first and last assessments when opening
  useMemo(() => {
    if (open && sortedAssessments.length >= 2 && !selectedId1 && !selectedId2) {
      setSelectedId1(sortedAssessments[0].id);
      setSelectedId2(sortedAssessments[sortedAssessments.length - 1].id);
    }
  }, [open, sortedAssessments, selectedId1, selectedId2]);

  const assessment1 = assessments.find((a) => a.id === selectedId1);
  const assessment2 = assessments.find((a) => a.id === selectedId2);

  const daysDifference = useMemo(() => {
    if (assessment1 && assessment2) {
      return Math.abs(
        differenceInDays(
          new Date(assessment2.assessment_date),
          new Date(assessment1.assessment_date)
        )
      );
    }
    return 0;
  }, [assessment1, assessment2]);

  const formatAssessmentLabel = (assessment: ClinicalAssessment) => {
    const date = format(new Date(assessment.assessment_date), "dd/MM/yyyy", { locale: ptBR });
    const type = assessment.is_initial_assessment ? "(Inicial)" : "";
    const diagnosis = assessment.diagnosis.length > 30 
      ? assessment.diagnosis.substring(0, 30) + "..." 
      : assessment.diagnosis;
    return `${date} ${type} - ${diagnosis}`;
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedId1("");
      setSelectedId2("");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Comparar Avaliações Clínicas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Selectors */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Avaliação Anterior</label>
              <Select value={selectedId1} onValueChange={setSelectedId1}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma avaliação" />
                </SelectTrigger>
                <SelectContent>
                  {sortedAssessments.map((assessment) => (
                    <SelectItem 
                      key={assessment.id} 
                      value={assessment.id}
                      disabled={assessment.id === selectedId2}
                    >
                      {formatAssessmentLabel(assessment)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Avaliação Posterior</label>
              <Select value={selectedId2} onValueChange={setSelectedId2}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma avaliação" />
                </SelectTrigger>
                <SelectContent>
                  {sortedAssessments.map((assessment) => (
                    <SelectItem 
                      key={assessment.id} 
                      value={assessment.id}
                      disabled={assessment.id === selectedId1}
                    >
                      {formatAssessmentLabel(assessment)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Time difference badge */}
          {assessment1 && assessment2 && (
            <div className="flex justify-center">
              <Badge variant="secondary" className="text-sm">
                <Calendar className="h-3 w-3 mr-1" />
                {daysDifference === 0 
                  ? "Mesmo dia" 
                  : daysDifference === 1 
                    ? "1 dia de diferença" 
                    : `${daysDifference} dias de diferença`}
              </Badge>
            </div>
          )}

          <Separator />

          {/* Comparison content */}
          {assessment1 && assessment2 ? (
            <ScrollArea className="h-[50vh] pr-4">
              <div className="space-y-6">
                {/* Header with dates */}
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-2 bg-muted rounded-lg">
                    <p className="font-medium">
                      {format(new Date(assessment1.assessment_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                    {assessment1.is_initial_assessment && (
                      <Badge variant="outline" className="mt-1">Avaliação Inicial</Badge>
                    )}
                  </div>
                  <div className="p-2 bg-muted rounded-lg">
                    <p className="font-medium">
                      {format(new Date(assessment2.assessment_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                    {assessment2.is_initial_assessment && (
                      <Badge variant="outline" className="mt-1">Avaliação Inicial</Badge>
                    )}
                  </div>
                </div>

                {/* Requesting Doctor */}
                <ComparisonField
                  label="Médico Solicitante"
                  icon={<User className="h-4 w-4" />}
                  value1={assessment1.requesting_doctor}
                  value2={assessment2.requesting_doctor}
                  highlight
                />

                {/* Diagnosis */}
                <ComparisonField
                  label="Diagnóstico"
                  icon={<Stethoscope className="h-4 w-4" />}
                  value1={assessment1.diagnosis}
                  value2={assessment2.diagnosis}
                  highlight
                />

                {/* Main Complaint */}
                <ComparisonField
                  label="Queixa Principal"
                  icon={<MessageSquare className="h-4 w-4" />}
                  value1={assessment1.main_complaint}
                  value2={assessment2.main_complaint}
                  highlight
                />

                {/* Clinical History */}
                <ComparisonField
                  label="História Clínica"
                  icon={<FileText className="h-4 w-4" />}
                  value1={assessment1.clinical_history}
                  value2={assessment2.clinical_history}
                  highlight
                />

                {/* Physical Exam */}
                <ComparisonField
                  label="Exame Físico"
                  icon={<ClipboardList className="h-4 w-4" />}
                  value1={assessment1.physical_exam}
                  value2={assessment2.physical_exam}
                  highlight
                />

                {/* Treatment Plan */}
                <ComparisonField
                  label="Plano de Tratamento"
                  icon={<ClipboardList className="h-4 w-4" />}
                  value1={assessment1.treatment_plan}
                  value2={assessment2.treatment_plan}
                  highlight
                />

                {/* Observations */}
                <ComparisonField
                  label="Observações"
                  icon={<MessageSquare className="h-4 w-4" />}
                  value1={assessment1.observations}
                  value2={assessment2.observations}
                  highlight
                />
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Selecione duas avaliações para comparar
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
