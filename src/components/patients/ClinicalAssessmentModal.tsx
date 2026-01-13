import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ClinicalAssessment, ClinicalAssessmentInsert } from "@/hooks/usePatientAssessments";

const assessmentSchema = z.object({
  assessment_date: z.date(),
  requesting_doctor: z.string().optional(),
  diagnosis: z.string().min(1, "Diagnóstico é obrigatório"),
  main_complaint: z.string().optional(),
  clinical_history: z.string().optional(),
  physical_exam: z.string().optional(),
  treatment_plan: z.string().optional(),
  observations: z.string().optional(),
  is_initial_assessment: z.boolean().default(false),
});

type AssessmentFormData = z.infer<typeof assessmentSchema>;

interface ClinicalAssessmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  assessment?: ClinicalAssessment;
  onSave: (data: ClinicalAssessmentInsert) => void;
  isLoading?: boolean;
}

export function ClinicalAssessmentModal({
  open,
  onOpenChange,
  patientId,
  assessment,
  onSave,
  isLoading,
}: ClinicalAssessmentModalProps) {
  const form = useForm<AssessmentFormData>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      assessment_date: assessment?.assessment_date 
        ? new Date(assessment.assessment_date) 
        : new Date(),
      requesting_doctor: assessment?.requesting_doctor || "",
      diagnosis: assessment?.diagnosis || "",
      main_complaint: assessment?.main_complaint || "",
      clinical_history: assessment?.clinical_history || "",
      physical_exam: assessment?.physical_exam || "",
      treatment_plan: assessment?.treatment_plan || "",
      observations: assessment?.observations || "",
      is_initial_assessment: assessment?.is_initial_assessment || false,
    },
  });

  const onSubmit = (data: AssessmentFormData) => {
    onSave({
      patient_id: patientId,
      assessment_date: format(data.assessment_date, "yyyy-MM-dd"),
      requesting_doctor: data.requesting_doctor || undefined,
      diagnosis: data.diagnosis,
      main_complaint: data.main_complaint || undefined,
      clinical_history: data.clinical_history || undefined,
      physical_exam: data.physical_exam || undefined,
      treatment_plan: data.treatment_plan || undefined,
      observations: data.observations || undefined,
      is_initial_assessment: data.is_initial_assessment,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {assessment ? "Editar Avaliação Clínica" : "Nova Avaliação Clínica"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="assessment_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data da Avaliação</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy", { locale: ptBR })
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date()}
                          initialFocus
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requesting_doctor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Médico Solicitante</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do médico" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="diagnosis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Diagnóstico *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Diagnóstico clínico" 
                      rows={2}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="main_complaint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Queixa Principal</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Principal queixa do paciente" 
                      rows={2}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clinical_history"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>História Clínica</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Histórico clínico relevante" 
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="physical_exam"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exame Físico</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Achados do exame físico" 
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="treatment_plan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plano de Tratamento</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Objetivos e plano de tratamento" 
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Outras observações" 
                      rows={2}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_initial_assessment"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Esta é a avaliação inicial do paciente
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
