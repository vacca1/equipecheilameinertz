import { useState, useEffect } from "react";
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Minus, Plus } from "lucide-react";

const incomeSchema = z.object({
  date: z.string().min(1, "Data é obrigatória"),
  patient: z.string().min(1, "Paciente é obrigatório"),
  therapists: z.array(z.string()).min(1, "Selecione pelo menos uma fisioterapeuta"),
  sessionsCovered: z.number().min(1, "Quantidade de sessões deve ser no mínimo 1"),
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

interface TherapistDistribution {
  therapist: string;
  sessions: number;
  commission: number;
}

export function IncomeModal({ open, onOpenChange, income }: IncomeModalProps) {
  const createIncome = useCreateIncome();
  const updateIncome = useUpdateIncome();
  const deleteIncome = useDeleteIncome();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [therapistDistribution, setTherapistDistribution] = useState<Record<string, TherapistDistribution>>({});
  
  const isEditMode = !!income;
  const now = new Date();
  const currentDate = now.toISOString().slice(0, 10);

  const form = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      date: currentDate,
      patient: "",
      therapists: [],
      sessionsCovered: 1,
      value: "",
      paymentMethod: "",
      invoiceDelivered: false,
      paymentStatus: "received",
      observations: "",
    },
  });

  const selectedTherapists = form.watch("therapists");
  const sessionsCovered = form.watch("sessionsCovered");
  const value = form.watch("value");

  // Inicializar distribuição quando fisioterapeutas são selecionadas
  useEffect(() => {
    const newDistribution: Record<string, TherapistDistribution> = {};
    
    selectedTherapists.forEach(therapist => {
      if (therapistDistribution[therapist]) {
        newDistribution[therapist] = therapistDistribution[therapist];
      } else {
        newDistribution[therapist] = {
          therapist,
          sessions: 1,
          commission: therapistCommissions[therapist] || 60,
        };
      }
    });
    
    setTherapistDistribution(newDistribution);
  }, [selectedTherapists]);

  const getTotalSessions = () => {
    return Object.values(therapistDistribution).reduce((sum, t) => sum + t.sessions, 0);
  };

  const updateTherapistSessions = (therapist: string, change: number) => {
    setTherapistDistribution(prev => ({
      ...prev,
      [therapist]: {
        ...prev[therapist],
        sessions: Math.max(1, prev[therapist].sessions + change),
      },
    }));
  };

  const updateTherapistCommission = (therapist: string, commission: number) => {
    setTherapistDistribution(prev => ({
      ...prev,
      [therapist]: {
        ...prev[therapist],
        commission: Math.max(0, Math.min(100, commission)),
      },
    }));
  };

  const calculateTherapistCommission = (therapist: string) => {
    const dist = therapistDistribution[therapist];
    if (!dist) return 0;
    
    const totalValue = parseFloat(value || "0");
    const sessionsForTherapist = dist.sessions;
    const totalSessions = sessionsCovered;
    
    // Valor proporcional baseado nas sessões
    const proportionalValue = (totalValue * sessionsForTherapist) / totalSessions;
    
    // Aplicar percentual de comissão
    return (proportionalValue * dist.commission) / 100;
  };

  const getTotalCommission = () => {
    return selectedTherapists.reduce((sum, therapist) => {
      return sum + calculateTherapistCommission(therapist);
    }, 0);
  };

  const onSubmit = (data: IncomeFormData) => {
    // Validar que o total de sessões distribuídas corresponde ao total
    const totalDistributed = getTotalSessions();
    if (totalDistributed !== data.sessionsCovered) {
      toast.error(`Distribua exatamente ${data.sessionsCovered} sessões. Atual: ${totalDistributed}`);
      return;
    }

    const therapistData = data.therapists.map(therapist => ({
      therapist,
      sessions_count: therapistDistribution[therapist].sessions,
      commission_percentage: therapistDistribution[therapist].commission,
    }));

    const totalCommission = getTotalCommission();

    const incomeData = {
      date: data.date,
      patient_name: data.patient,
      therapist: data.therapists[0], // Manter primeira para compatibilidade
      value: parseFloat(data.value),
      sessions_covered: data.sessionsCovered,
      commission_percentage: therapistCommissions[data.therapists[0]] || 60,
      commission_value: totalCommission,
      payment_method: data.paymentMethod || undefined,
      payment_status: data.paymentStatus,
      invoice_delivered: data.invoiceDelivered,
      observations: data.observations || undefined,
      therapists: therapistData,
    };

    if (isEditMode && income) {
      updateIncome.mutate({ id: income.id, ...incomeData });
    } else {
      createIncome.mutate(incomeData as any);
    }
    
    onOpenChange(false);
    form.reset();
    setTherapistDistribution({});
  };

  const handleDelete = () => {
    if (income) {
      deleteIncome.mutate(income.id);
      onOpenChange(false);
      setShowDeleteDialog(false);
      form.reset();
      setTherapistDistribution({});
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl">
              {isEditMode ? "Editar Entrada" : "Adicionar Entrada - Multi-Fisioterapeutas"}
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
                    <FormControl>
                      <Input placeholder="Nome do paciente" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sessionsCovered"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade de Sessões *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormDescription>Número total de sessões que este pagamento cobre</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Total (R$) *</FormLabel>
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

            {/* Multi-seleção de Fisioterapeutas */}
            <FormField
              control={form.control}
              name="therapists"
              render={() => (
                <FormItem>
                  <FormLabel>Fisioterapeutas * (Selecione 1 ou mais)</FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 border rounded-lg p-3">
                    {therapists.map((therapist) => (
                      <FormField
                        key={therapist}
                        control={form.control}
                        name="therapists"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(therapist)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, therapist])
                                    : field.onChange(
                                        field.value?.filter((value) => value !== therapist)
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal cursor-pointer">
                              {therapist}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Distribuição de sessões e comissões por fisioterapeuta */}
            {selectedTherapists.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Distribuição de Sessões e Comissões</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedTherapists.map((therapist) => (
                    <div key={therapist} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 border rounded-lg">
                      <div>
                        <label className="text-sm font-medium">{therapist}</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateTherapistSessions(therapist, -1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="text-sm min-w-[60px] text-center">
                          {therapistDistribution[therapist]?.sessions || 1} sessões
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateTherapistSessions(therapist, 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={therapistDistribution[therapist]?.commission || 60}
                          onChange={(e) => updateTherapistCommission(therapist, parseInt(e.target.value) || 0)}
                          className="h-8"
                        />
                        <span className="text-sm">%</span>
                        <span className="text-sm font-medium text-primary min-w-[80px] text-right">
                          R$ {calculateTherapistCommission(therapist).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  <div className="pt-3 border-t">
                    <div className="flex justify-between items-center text-sm">
                      <span>Total de sessões distribuídas:</span>
                      <span className={getTotalSessions() === sessionsCovered ? "text-success font-bold" : "text-warning font-bold"}>
                        {getTotalSessions()} / {sessionsCovered}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-base font-bold mt-2">
                      <span>Comissão Total:</span>
                      <span className="text-primary">R$ {getTotalCommission().toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
                  setTherapistDistribution({});
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
