import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { therapists, therapistCommissions } from "@/data/therapists";
import { useCreateIncome, useUpdateIncome, useDeleteIncome, Income } from "@/hooks/useIncomes";
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

const incomeSchema = z.object({
  date: z.string().min(1, "Data é obrigatória"),
  patient: z.string().min(1, "Paciente é obrigatório"),
  therapist: z.string().min(1, "Fisioterapeuta é obrigatória"),
  value: z.string().min(1, "Valor é obrigatório"),
  paymentMethod: z.string().min(1, "Forma de pagamento é obrigatória"),
  invoiceDelivered: z.boolean(),
  paymentStatus: z.string().min(1, "Status é obrigatório"),
  observations: z.string().optional(),
});

type IncomeFormData = z.infer<typeof incomeSchema>;

interface IncomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  income?: Income;
}

export function IncomeModal({ open, onOpenChange, income }: IncomeModalProps) {
  const createIncome = useCreateIncome();
  const updateIncome = useUpdateIncome();
  const deleteIncome = useDeleteIncome();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const isEditMode = !!income;
  const now = new Date();
  const currentDate = now.toISOString().slice(0, 10);

  const form = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: income ? {
      date: income.date,
      patient: income.patient_name,
      therapist: income.therapist,
      value: income.value.toString(),
      paymentMethod: income.payment_method || "",
      invoiceDelivered: income.invoice_delivered || false,
      paymentStatus: income.payment_status || "received",
      observations: income.observations || "",
    } : {
      date: currentDate,
      patient: "",
      therapist: "",
      value: "",
      paymentMethod: "",
      invoiceDelivered: false,
      paymentStatus: "received",
      observations: "",
    },
  });

  // Update form when income changes
  useState(() => {
    if (income && open) {
      form.reset({
        date: income.date,
        patient: income.patient_name,
        therapist: income.therapist,
        value: income.value.toString(),
        paymentMethod: income.payment_method || "",
        invoiceDelivered: income.invoice_delivered || false,
        paymentStatus: income.payment_status || "received",
        observations: income.observations || "",
      });
    } else if (!open) {
      form.reset();
    }
  });

  const selectedTherapist = form.watch("therapist");
  
  // Calcular comissão automaticamente baseado no terapeuta usando valores do arquivo centralizado
  const getCommissionPercentage = (therapist: string) => {
    return therapistCommissions[therapist] || 0;
  };

  const calculateCommission = () => {
    const value = parseFloat(form.watch("value") || "0");
    const percentage = getCommissionPercentage(selectedTherapist);
    return (value * percentage / 100).toFixed(2);
  };

  const onSubmit = (data: IncomeFormData) => {
    const commissionPercentage = getCommissionPercentage(data.therapist);
    const commissionValue = parseFloat(data.value) * commissionPercentage / 100;

    const incomeData = {
      date: data.date,
      patient_name: data.patient,
      therapist: data.therapist,
      value: parseFloat(data.value),
      commission_percentage: commissionPercentage,
      commission_value: commissionValue,
      payment_method: data.paymentMethod || undefined,
      payment_status: data.paymentStatus,
      invoice_delivered: data.invoiceDelivered,
      observations: data.observations || undefined,
    };

    if (isEditMode && income) {
      updateIncome.mutate({ id: income.id, ...incomeData });
    } else {
      createIncome.mutate(incomeData);
    }
    
    onOpenChange(false);
    form.reset();
  };

  const handleDelete = () => {
    if (income) {
      deleteIncome.mutate(income.id);
      onOpenChange(false);
      setShowDeleteDialog(false);
      form.reset();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl">
              {isEditMode ? "Editar Entrada" : "Adicionar Entrada"}
            </DialogTitle>
          </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="patient"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paciente *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o paciente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="maria">Maria da Silva Santos</SelectItem>
                        <SelectItem value="joao">João Pedro Oliveira</SelectItem>
                        <SelectItem value="ana">Ana Carolina Souza</SelectItem>
                        <SelectItem value="carlos">Carlos Eduardo Lima</SelectItem>
                        <SelectItem value="patricia">Patricia Mendes Costa</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="therapist"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fisioterapeuta *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[300px] overflow-y-auto">
                        {therapists.map((therapist) => (
                          <SelectItem key={therapist} value={therapist}>
                            {therapist} ({therapistCommissions[therapist]}%)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="100.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {selectedTherapist && form.watch("value") && (
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Comissão Calculada:</span>
                  <span className="text-lg font-bold text-primary">
                    R$ {calculateCommission()} ({getCommissionPercentage(selectedTherapist)}%)
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma de Pagamento *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="cash">Dinheiro</SelectItem>
                        <SelectItem value="debit">Débito</SelectItem>
                        <SelectItem value="credit">Crédito</SelectItem>
                        <SelectItem value="insurance">Convênio</SelectItem>
                        <SelectItem value="boleto">Boleto</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status do Pagamento *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="paid">Pago</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="invoiceDelivered"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Nota Fiscal Emitida?</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
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
                      placeholder="Informações adicionais sobre a entrada"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
              {isEditMode && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  className="w-full sm:w-auto"
                >
                  Excluir
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  form.reset();
                }}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button type="submit" className="w-full sm:w-auto">
                {isEditMode ? "Atualizar" : "Salvar Entrada"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>

    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir esta entrada? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
