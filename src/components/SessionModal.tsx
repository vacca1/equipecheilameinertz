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
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { therapists } from "@/data/therapists";
import { useCreateSession } from "@/hooks/useSessions";

const sessionSchema = z.object({
  date: z.string(),
  therapist: z.string().min(1, "Fisioterapeuta é obrigatória"),
  sessionNumber: z.number(),
  techniquesApplied: z.string().optional(),
  painBefore: z.number().min(0).max(10),
  painAfter: z.number().min(0).max(10),
  observations: z.string().optional(),
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
      techniquesApplied: "",
      painBefore: 5,
      painAfter: 5,
      observations: "",
      value: calculateDiscountedValue(),
      paymentMethod: "",
      invoiceDelivered: false,
      paymentStatus: "paid",
    },
  });

  const painBefore = form.watch("painBefore");
  const painAfter = form.watch("painAfter");
  const createSession = useCreateSession();

  const onSubmit = (data: SessionFormData) => {
    const sessionValue = parseFloat(data.value);
    const commissionPercentage = 60; // Default 60%
    const commissionValue = (sessionValue * commissionPercentage) / 100;

    createSession.mutate({
      patient_id: patientId,
      patient_name: patientName,
      date: data.date.split("T")[0], // Only date part
      session_number: data.sessionNumber,
      therapist: data.therapist,
      initial_pain_level: data.painBefore,
      final_pain_level: data.painAfter,
      observations: data.observations || null,
      session_value: sessionValue,
      payment_method: data.paymentMethod,
      payment_status: data.paymentStatus === "paid" ? "paid" : "pending",
      commission_percentage: commissionPercentage,
      commission_value: commissionValue,
      invoice_delivered: data.invoiceDelivered,
      was_reimbursed: false,
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
                            {therapist}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
              name="techniquesApplied"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Técnicas Aplicadas</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva as técnicas e exercícios aplicados"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="painBefore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dor Antes da Sessão: {painBefore}</FormLabel>
                    <FormControl>
                      <div className="pt-2">
                        <Slider
                          min={0}
                          max={10}
                          step={1}
                          value={[field.value]}
                          onValueChange={(vals) => field.onChange(vals[0])}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>0 (Sem dor)</span>
                          <span>10 (Dor máxima)</span>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="painAfter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dor Depois da Sessão: {painAfter}</FormLabel>
                    <FormControl>
                      <div className="pt-2">
                        <Slider
                          min={0}
                          max={10}
                          step={1}
                          value={[field.value]}
                          onValueChange={(vals) => field.onChange(vals[0])}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>0 (Sem dor)</span>
                          <span>10 (Dor máxima)</span>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações da Sessão</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Informações adicionais sobre a sessão"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
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
