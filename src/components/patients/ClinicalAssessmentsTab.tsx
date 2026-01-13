import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Edit2, Trash2, FileText, Star, ChevronDown, ChevronUp, GitCompare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { usePatientAssessments, ClinicalAssessment, ClinicalAssessmentInsert } from "@/hooks/usePatientAssessments";
import { ClinicalAssessmentModal } from "./ClinicalAssessmentModal";
import { ClinicalAssessmentComparison } from "./ClinicalAssessmentComparison";

interface ClinicalAssessmentsTabProps {
  patientId: string;
}

export function ClinicalAssessmentsTab({ patientId }: ClinicalAssessmentsTabProps) {
  const { assessments, isLoading, createAssessment, updateAssessment, deleteAssessment } = usePatientAssessments(patientId);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<ClinicalAssessment | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assessmentToDelete, setAssessmentToDelete] = useState<string | null>(null);
  const [expandedAssessments, setExpandedAssessments] = useState<Set<string>>(new Set());
  const [comparisonOpen, setComparisonOpen] = useState(false);

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedAssessments);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedAssessments(newExpanded);
  };

  const handleOpenModal = (assessment?: ClinicalAssessment) => {
    setEditingAssessment(assessment);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingAssessment(undefined);
  };

  const handleSave = async (data: ClinicalAssessmentInsert) => {
    if (editingAssessment) {
      await updateAssessment.mutateAsync({ id: editingAssessment.id, ...data });
    } else {
      await createAssessment.mutateAsync(data);
    }
    handleCloseModal();
  };

  const handleDeleteClick = (id: string) => {
    setAssessmentToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (assessmentToDelete) {
      await deleteAssessment.mutateAsync(assessmentToDelete);
      setDeleteDialogOpen(false);
      setAssessmentToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Histórico de Avaliações Clínicas</h3>
        <div className="flex gap-2">
          <Button 
            onClick={() => setComparisonOpen(true)} 
            size="sm" 
            variant="outline"
            disabled={assessments.length < 2}
            title={assessments.length < 2 ? "Necessário ao menos 2 avaliações para comparar" : "Comparar avaliações"}
          >
            <GitCompare className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Comparar</span>
          </Button>
          <Button onClick={() => handleOpenModal()} size="sm">
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Nova Avaliação</span>
          </Button>
        </div>
      </div>

      {assessments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h4 className="text-lg font-medium mb-2">Nenhuma avaliação registrada</h4>
            <p className="text-muted-foreground mb-4">
              Registre a primeira avaliação clínica do paciente
            </p>
            <Button onClick={() => handleOpenModal()}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Avaliação
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {assessments.map((assessment) => {
            const isExpanded = expandedAssessments.has(assessment.id);
            
            return (
              <Card key={assessment.id} className="overflow-hidden">
                <CardHeader 
                  className="cursor-pointer hover:bg-muted/50 transition-colors py-3"
                  onClick={() => toggleExpanded(assessment.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">
                            {format(new Date(assessment.assessment_date), "dd/MM/yyyy", { locale: ptBR })}
                          </CardTitle>
                          {assessment.is_initial_assessment && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              Inicial
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {assessment.diagnosis}
                        </p>
                        {assessment.requesting_doctor && (
                          <p className="text-xs text-muted-foreground">
                            Dr(a). {assessment.requesting_doctor}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenModal(assessment);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(assessment.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                {isExpanded && (
                  <CardContent className="pt-0 pb-4 border-t">
                    <div className="grid gap-4 mt-4">
                      {assessment.main_complaint && (
                        <div>
                          <h5 className="text-sm font-medium text-muted-foreground mb-1">Queixa Principal</h5>
                          <p className="text-sm whitespace-pre-wrap">{assessment.main_complaint}</p>
                        </div>
                      )}
                      
                      {assessment.clinical_history && (
                        <div>
                          <h5 className="text-sm font-medium text-muted-foreground mb-1">História Clínica</h5>
                          <p className="text-sm whitespace-pre-wrap">{assessment.clinical_history}</p>
                        </div>
                      )}
                      
                      {assessment.physical_exam && (
                        <div>
                          <h5 className="text-sm font-medium text-muted-foreground mb-1">Exame Físico</h5>
                          <p className="text-sm whitespace-pre-wrap">{assessment.physical_exam}</p>
                        </div>
                      )}
                      
                      {assessment.treatment_plan && (
                        <div>
                          <h5 className="text-sm font-medium text-muted-foreground mb-1">Plano de Tratamento</h5>
                          <p className="text-sm whitespace-pre-wrap">{assessment.treatment_plan}</p>
                        </div>
                      )}
                      
                      {assessment.observations && (
                        <div>
                          <h5 className="text-sm font-medium text-muted-foreground mb-1">Observações</h5>
                          <p className="text-sm whitespace-pre-wrap">{assessment.observations}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <ClinicalAssessmentModal
        open={modalOpen}
        onOpenChange={handleCloseModal}
        patientId={patientId}
        assessment={editingAssessment}
        onSave={handleSave}
        isLoading={createAssessment.isPending || updateAssessment.isPending}
      />

      <ClinicalAssessmentComparison
        open={comparisonOpen}
        onOpenChange={setComparisonOpen}
        assessments={assessments}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta avaliação clínica? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
