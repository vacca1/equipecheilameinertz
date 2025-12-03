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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import { toast } from "sonner";
import { therapists } from "@/data/therapists";
import { useCreateSession } from "@/hooks/useSessions";

const sessionSchema = z.object({
  date: z.string(),
  therapist: z.string().min(1, "Fisioterapeuta é obrigatória"),
  sessionNumber: z.number(),
  observations: z.string().max(100, "Observação deve ter no máximo 100 caracteres").optional(),
  value: z.string().min(1, "Valor da sessão é obrigatório"),
  paymentMethod: z.string().min(1, "Forma de pagamento é obrigatória"),
  invoiceDelivered: z.boolean(),
  paymentStatus: z.string().min(1, "Status de pagamento é obrigatório"),
});

type SessionFormData = z.infer<typeof sessionSchema>;

interface SessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  patientName: string;
  defaultTherapist?: string;
  lastSessionNumber: number;
  patientSessionValue?: number;
  patientDiscount?: string;
  patientDiscountPercentage?: number;
  patientCommissionPercentage?: number;
}

export function SessionModal({
  open,
  onOpenChange,
  patientId,
  patientName,
  defaultTherapist = "",
  lastSessionNumber,
  patientSessionValue,
  patientDiscount,
  patientDiscountPercentage,
  patientCommissionPercentage = 60,
}: SessionModalProps) {
  const now = new Date();
  const currentDateTime = now.toISOString().slice(0, 16);

  // Calcular valor sugerido com desconto
  const calculateDiscountedValue = () => {
    if (!patientSessionValue) return "";
    if (!patientDiscountPercentage || patientDiscountPercentage === 0) {
      return patientSessionValue.toFixed(2);
    }
    const discountedValue = patientSessionValue * (1 - patientDiscountPercentage / 100);
    return discountedValue.toFixed(2);
  };

  const form = useForm<SessionFormData>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      date: currentDateTime,
      therapist: defaultTherapist,
      sessionNumber: lastSessionNumber + 1,
      observations: "",
      value: calculateDiscountedValue(),
      paymentMethod: "",
      invoiceDelivered: false,
      paymentStatus: "paid",
    },
  });

  const observations = form.watch("observations");
  const createSession = useCreateSession();

  const onSubmit = (data: SessionFormData) => {
    const sessionValue = parseFloat(data.value);
    const commissionPercentage = patientCommissionPercentage;
    const commissionValue = (sessionValue * commissionPercentage) / 100;

    createSession.mutate({
      patient_id: patientId,
      patient_name: patientName,
      date: data.date.split("T")[0], // Only date part
      session_number: data.sessionNumber,
      therapist: data.therapist, // Permite mudança de fisioterapeuta
      initial_pain_level: null,
      final_pain_level: null,
      observations: data.observations || null,
      session_value: sessionValue,
      payment_method: data.paymentMethod,
      payment_status: data.paymentStatus === "paid" ? "paid" : "pending",
      commission_percentage: commissionPercentage,
      commission_value: commissionValue,
      invoice_delivered: data.invoiceDelivered,
      was_reimbursed: false,
      attended: true,
    });
    
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl">Registrar Nova Sessão</DialogTitle>
          <p className="text-xs sm:text-sm text-muted-foreground">Paciente: {patientName}</p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data e Hora</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="therapist"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fisioterapeuta que Atendeu *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[300px] overflow-y-auto">
                        {therapists.map((therapist) => (
                          <SelectItem key={therapist} value={therapist}>
                            {therapist}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs">
                      Se outra fisioterapeuta atendeu no lugar, selecione-a aqui para que a comissão seja creditada corretamente.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="sessionNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número da Sessão</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      disabled
                      {...field}
                      value={field.value}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <p className="text-sm text-muted-foreground">
                    Auto-incrementado baseado no histórico
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observação curta (até 100 caracteres)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: Paciente relatou melhora na mobilidade"
                      maxLength={100}
                      className="resize-none min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <div className="text-xs text-muted-foreground text-right">
                    {observations?.length || 0}/100
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="border-t pt-4 space-y-4">
              <h3 className="font-semibold">Informações Financeiras</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor da Sessão (R$) *</FormLabel>
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

                {patientDiscount && patientDiscountPercentage && (
                  <div className="col-span-full text-sm bg-blue-50 dark:bg-blue-950 p-3 rounded-md border border-blue-200 dark:border-blue-800">
                    <strong className="text-blue-900 dark:text-blue-100">Desconto aplicado:</strong> {patientDiscount} ({patientDiscountPercentage}%)
                    <br />
                    <span className="text-xs text-blue-700 dark:text-blue-300">
                      Valor original: R$ {patientSessionValue?.toFixed(2)} → 
                      Valor com desconto: R$ {calculateDiscountedValue()}
                    </span>
                  </div>
                )}

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
                          <SelectItem value="cash">Dinheiro</SelectItem>
                          <SelectItem value="pix">PIX</SelectItem>
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="invoiceDelivered"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Nota Fiscal Entregue?</FormLabel>
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
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
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
                Salvar Sessão
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
