import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Package,
  AlertTriangle,
  FileText,
  UserCheck,
  UserX,
  Calendar,
  User,
  Receipt,
  X,
  Filter,
  Edit3,
  Save,
  Link,
} from "lucide-react";
import { format, parseISO, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface AttendanceControlTabProps {
  patientId: string;
  patientName: string;
}

interface AttendanceSession {
  id: string;
  session_number: number | null;
  date: string;
  time: string;
  duration: number | null;
  therapist: string;
  attendance_status: string | null;
  status: string | null;
  invoice_number: string | null;
  package_id: string | null;
  notes: string | null;
}

export function AttendanceControlTab({ patientId, patientName }: AttendanceControlTabProps) {
  const queryClient = useQueryClient();
  const [payingSessionId, setPayingSessionId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [batchPaymentOpen, setBatchPaymentOpen] = useState(false);
  const [batchPaymentForm, setBatchPaymentForm] = useState({
    amount: "",
    method: "pix",
    invoiceNumber: "",
  });
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    method: "pix",
    invoiceNumber: "",
  });
  
  // Estado para evolução diária
  const [editingEvolutionId, setEditingEvolutionId] = useState<string | null>(null);
  const [evolutionText, setEvolutionText] = useState("");

  // Buscar sessões/agendamentos do paciente
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["attendance-control", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("patient_id", patientId)
        .order("date", { ascending: false })
        .order("time", { ascending: false });

      if (error) throw error;
      return data as AttendanceSession[];
    },
  });

  // Buscar pacote ativo
  const { data: activePackage } = useQuery({
    queryKey: ["active-package", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patient_packages")
        .select("*, package:packages(*)")
        .eq("patient_id", patientId)
        .eq("status", "active")
        .order("purchase_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  // Buscar todos os pacotes do paciente (para agrupar sessões)
  const { data: allPackages = [] } = useQuery({
    queryKey: ["all-patient-packages", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patient_packages")
        .select("*, package:packages(*)")
        .eq("patient_id", patientId)
        .order("purchase_date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Buscar incomes para verificar se sessão foi paga
  const { data: incomes = [] } = useQuery({
    queryKey: ["patient-incomes", patientName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("incomes")
        .select("*")
        .eq("patient_name", patientName)
        .order("date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Marcar presença/falta
  const markAttendance = useMutation({
    mutationFn: async ({
      appointmentId,
      status,
    }: {
      appointmentId: string;
      status: "present" | "absent";
    }) => {
      // Se marcou presente e tem pacote ativo, vincular sessão ao pacote e descontar
      if (status === "present" && activePackage) {
        const newUsedSessions = (activePackage.used_sessions || 0) + 1;
        const newStatus = newUsedSessions >= activePackage.total_sessions ? "completed" : "active";
        
        // Atualiza appointment com o package_id vinculado
        const { error: appointmentError } = await supabase
          .from("appointments")
          .update({
            attendance_status: status,
            status: "completed",
            package_id: activePackage.id,
          })
          .eq("id", appointmentId);

        if (appointmentError) throw appointmentError;

        // Desconta sessão do pacote
        const { error: packageError } = await supabase
          .from("patient_packages")
          .update({
            used_sessions: newUsedSessions,
            status: newStatus,
          })
          .eq("id", activePackage.id);

        if (packageError) throw packageError;
      } else {
        // Apenas atualiza o status da presença
        const { error } = await supabase
          .from("appointments")
          .update({
            attendance_status: status,
            status: status === "present" ? "completed" : "cancelled",
          })
          .eq("id", appointmentId);

        if (error) throw error;
      }

      return true;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["attendance-control", patientId],
      });
      queryClient.invalidateQueries({
        queryKey: ["active-package", patientId],
      });
      queryClient.invalidateQueries({
        queryKey: ["patient-packages", patientId],
      });
      queryClient.invalidateQueries({
        queryKey: ["patient-credits", patientId],
      });
      queryClient.invalidateQueries({
        queryKey: ["patient-session-stats", patientId],
      });
      queryClient.invalidateQueries({
        queryKey: ["appointments"],
      });
      
      toast.success(
        variables.status === "present"
          ? "✅ Presença registrada!"
          : "❌ Falta registrada!"
      );
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao registrar presença");
    },
  });

  // Desfazer marcação de presença/falta
  const undoAttendance = useMutation({
    mutationFn: async ({
      appointmentId,
      packageId,
    }: {
      appointmentId: string;
      packageId: string | null;
    }) => {
      // Se tinha pacote vinculado, devolver a sessão
      if (packageId) {
        const { data: currentPackage, error: fetchError } = await supabase
          .from("patient_packages")
          .select("*")
          .eq("id", packageId)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (currentPackage) {
          const newUsedSessions = Math.max(0, (currentPackage.used_sessions || 0) - 1);
          
          const { error: packageError } = await supabase
            .from("patient_packages")
            .update({
              used_sessions: newUsedSessions,
              status: "active", // Reativar pacote se estava completo
            })
            .eq("id", packageId);

          if (packageError) throw packageError;
        }
      }

      // Resetar o appointment
      const { error } = await supabase
        .from("appointments")
        .update({
          attendance_status: null,
          status: "scheduled",
          package_id: null,
        })
        .eq("id", appointmentId);

      if (error) throw error;

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["attendance-control", patientId],
      });
      queryClient.invalidateQueries({
        queryKey: ["active-package", patientId],
      });
      queryClient.invalidateQueries({
        queryKey: ["all-patient-packages", patientId],
      });
      queryClient.invalidateQueries({
        queryKey: ["patient-packages", patientId],
      });
      queryClient.invalidateQueries({
        queryKey: ["patient-credits", patientId],
      });
      queryClient.invalidateQueries({
        queryKey: ["patient-session-stats", patientId],
      });
      queryClient.invalidateQueries({
        queryKey: ["appointments"],
      });
      
      toast.success("⏪ Marcação desfeita! Sessão devolvida ao pacote.");
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao desfazer marcação");
    },
  });

  // Registrar pagamento
  const registerPayment = useMutation({
    mutationFn: async ({
      appointmentId,
      amount,
      paymentMethod,
      invoiceNumber,
    }: {
      appointmentId: string;
      amount: number;
      paymentMethod: string;
      invoiceNumber: string;
    }) => {
      // 1. Criar income
      const { error: incomeError } = await supabase.from("incomes").insert({
        patient_name: patientName,
        therapist: sessions.find((s) => s.id === appointmentId)?.therapist || "",
        value: amount,
        date: new Date().toISOString().split("T")[0],
        payment_method: paymentMethod,
        payment_status: "received",
        invoice_delivered: !!invoiceNumber,
        sessions_covered: 1,
        observations: `Pagamento sessão #${
          sessions.find((s) => s.id === appointmentId)?.session_number || ""
        }`,
      });

      if (incomeError) throw incomeError;

      // 2. Atualizar appointment com invoice_number
      const { error: aptError } = await supabase
        .from("appointments")
        .update({
          invoice_number: invoiceNumber || null,
        })
        .eq("id", appointmentId);

      if (aptError) throw aptError;

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["attendance-control", patientId],
      });
      queryClient.invalidateQueries({
        queryKey: ["patient-incomes", patientName],
      });
      queryClient.invalidateQueries({
        queryKey: ["patient-credits", patientId],
      });
      toast.success("Pagamento registrado com sucesso!");
      setPayingSessionId(null);
      setPaymentForm({ amount: "", method: "pix", invoiceNumber: "" });
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao registrar pagamento");
    },
  });

  // Pagamento em lote
  const batchPayment = useMutation({
    mutationFn: async ({
      sessionIds,
      amountPerSession,
      paymentMethod,
      invoiceNumber,
    }: {
      sessionIds: string[];
      amountPerSession: number;
      paymentMethod: string;
      invoiceNumber: string;
    }) => {
      for (const sessionId of sessionIds) {
        const session = sessions.find((s) => s.id === sessionId);
        if (!session) continue;

        // Criar income para cada sessão
        const { error: incomeError } = await supabase.from("incomes").insert({
          patient_name: patientName,
          therapist: session.therapist || "",
          value: amountPerSession,
          date: new Date().toISOString().split("T")[0],
          payment_method: paymentMethod,
          payment_status: "received",
          invoice_delivered: !!invoiceNumber,
          sessions_covered: 1,
          observations: `Pagamento sessão #${session.session_number || ""} (lote)`,
        });

        if (incomeError) throw incomeError;

        // Atualizar appointment com invoice_number
        if (invoiceNumber) {
          const { error: aptError } = await supabase
            .from("appointments")
            .update({ invoice_number: invoiceNumber })
            .eq("id", sessionId);

          if (aptError) throw aptError;
        }
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance-control", patientId] });
      queryClient.invalidateQueries({ queryKey: ["patient-incomes", patientName] });
      queryClient.invalidateQueries({ queryKey: ["patient-credits", patientId] });
      toast.success(`💰 ${selectedSessions.length} sessões pagas com sucesso!`);
      setSelectedSessions([]);
      setBatchPaymentOpen(false);
      setBatchPaymentForm({ amount: "", method: "pix", invoiceNumber: "" });
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao processar pagamento em lote");
    },
  });

  // Mutation para salvar evolução diária
  const updateEvolution = useMutation({
    mutationFn: async ({ appointmentId, notes }: { appointmentId: string; notes: string }) => {
      const { error } = await supabase
        .from("appointments")
        .update({ notes })
        .eq("id", appointmentId);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance-control", patientId] });
      toast.success("📝 Evolução salva!");
      setEditingEvolutionId(null);
      setEvolutionText("");
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao salvar evolução");
    },
  });

  // Handlers para evolução
  const startEditingEvolution = (session: AttendanceSession) => {
    setEditingEvolutionId(session.id);
    setEvolutionText(session.notes || "");
  };

  const cancelEditingEvolution = () => {
    setEditingEvolutionId(null);
    setEvolutionText("");
  };

  const saveEvolution = (appointmentId: string) => {
    updateEvolution.mutate({ appointmentId, notes: evolutionText });
  };

  // Vincular sessão avulsa ao pacote ativo
  const linkToPackage = useMutation({
    mutationFn: async (appointmentId: string) => {
      if (!activePackage) throw new Error("Nenhum pacote ativo");
      
      const newUsedSessions = (activePackage.used_sessions || 0) + 1;
      const newStatus = newUsedSessions >= activePackage.total_sessions ? "completed" : "active";
      
      // Vincular appointment ao pacote
      const { error: appointmentError } = await supabase
        .from("appointments")
        .update({ package_id: activePackage.id })
        .eq("id", appointmentId);
      
      if (appointmentError) throw appointmentError;
      
      // Atualizar contador do pacote
      const { error: packageError } = await supabase
        .from("patient_packages")
        .update({
          used_sessions: newUsedSessions,
          status: newStatus,
        })
        .eq("id", activePackage.id);
      
      if (packageError) throw packageError;
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance-control", patientId] });
      queryClient.invalidateQueries({ queryKey: ["active-package", patientId] });
      queryClient.invalidateQueries({ queryKey: ["all-patient-packages", patientId] });
      queryClient.invalidateQueries({ queryKey: ["patient-packages", patientId] });
      queryClient.invalidateQueries({ queryKey: ["patient-credits", patientId] });
      toast.success("✅ Sessão vinculada ao pacote!");
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao vincular sessão ao pacote");
    },
  });


  const pastSessions = sessions.filter((s) => {
    try {
      return isPast(parseISO(s.date));
    } catch {
      return false;
    }
  });

  const presentCount = sessions.filter(
    (s) => s.attendance_status === "present"
  ).length;
  const absentCount = sessions.filter(
    (s) => s.attendance_status === "absent"
  ).length;

  // Total de pagamentos vinculados
  const paidSessionsCount = incomes.filter((i) => i.payment_status === "received").length;
  const totalPaid = incomes
    .filter((i) => i.payment_status === "received")
    .reduce((sum, i) => sum + Number(i.value || 0), 0);

  // Sessões presentes sem pagamento (aproximado)
  const unpaidPresentSessions = presentCount - paidSessionsCount;
  const sessionsNeedingPayment = Math.max(0, unpaidPresentSessions);

  // Progresso do pacote
  const packageProgress = activePackage
    ? ((activePackage.used_sessions || 0) / activePackage.total_sessions) * 100
    : 0;

  const handleSubmitPayment = (appointmentId: string) => {
    const amount = parseFloat(paymentForm.amount);
    if (!amount || amount <= 0) {
      toast.error("Informe um valor válido");
      return;
    }

    registerPayment.mutate({
      appointmentId,
      amount,
      paymentMethod: paymentForm.method,
      invoiceNumber: paymentForm.invoiceNumber,
    });
  };

  const getSessionStatus = (session: AttendanceSession) => {
    const isPresent = session.attendance_status === "present";
    const isAbsent = session.attendance_status === "absent";
    const isPastDate = isPast(parseISO(session.date));

    if (isAbsent) return "missed";
    if (isPresent) return "present";
    if (isPastDate && !isPresent && !isAbsent) return "pending";
    return "scheduled";
  };

  // Verificar se uma sessão foi paga (busca no incomes ou via pacote)
  const getSessionPayment = (session: AttendanceSession) => {
    // Se tem package_id, está paga via pacote
    if (session.package_id) {
      const linkedPackage = allPackages.find(p => p.id === session.package_id);
      return {
        value: linkedPackage?.purchase_price ? (linkedPackage.purchase_price / linkedPackage.total_sessions) : 0,
        payment_method: "pacote",
        payment_status: "received",
        viaPackage: true,
        packageName: linkedPackage?.package?.name || "Pacote"
      };
    }
    
    // Busca income que menciona o número da sessão ou que foi criado na mesma data
    const sessionPayment = incomes.find((income) => {
      const matchesSessionNumber = income.observations?.includes(`#${session.session_number}`);
      const matchesDate = income.date === session.date;
      return (matchesSessionNumber || matchesDate) && income.payment_status === "received";
    });
    
    return sessionPayment ? { ...sessionPayment, viaPackage: false } : null;
  };

  // Calcular contagem de sessões filtradas
  const filteredSessionsCount = useMemo(() => {
    if (statusFilter === "all") return sessions.length;
    
    return sessions.filter((session) => {
      const status = getSessionStatus(session);
      const payment = getSessionPayment(session);
      const isPaid = !!payment;
      const isPresent = session.attendance_status === "present";
      
      switch (statusFilter) {
        case "present": return status === "present";
        case "missed": return status === "missed";
        case "scheduled": return status === "scheduled";
        case "paid": return isPaid;
        case "unpaid": return isPresent && !isPaid;
        default: return true;
      }
    }).length;
  }, [sessions, statusFilter, incomes]);

  const statusConfig: Record<
    string,
    { label: string; color: string; icon: React.ReactNode }
  > = {
    present: {
      label: "Presente",
      color: "bg-green-100 text-green-800",
      icon: <UserCheck className="h-4 w-4" />,
    },
    missed: {
      label: "Faltou",
      color: "bg-red-100 text-red-800",
      icon: <UserX className="h-4 w-4" />,
    },
    pending: {
      label: "Aguardando",
      color: "bg-yellow-100 text-yellow-800",
      icon: <Clock className="h-4 w-4" />,
    },
    scheduled: {
      label: "Agendado",
      color: "bg-blue-100 text-blue-800",
      icon: <Calendar className="h-4 w-4" />,
    },
  };

  const paymentMethodLabels: Record<string, string> = {
    pix: "PIX",
    dinheiro: "Dinheiro",
    debito: "Débito",
    credito: "Crédito",
    transferencia: "Transferência",
    pacote: "Pacote",
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center text-muted-foreground">Carregando...</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pacote Ativo */}
      {activePackage && (
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    {activePackage.package?.name || "Pacote de Sessões"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Comprado em{" "}
                    {activePackage.purchase_date
                      ? format(
                          parseISO(activePackage.purchase_date),
                          "dd/MM/yyyy"
                        )
                      : "N/A"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">
                  {activePackage.total_sessions -
                    (activePackage.used_sessions || 0)}
                </p>
                <p className="text-sm text-muted-foreground">restantes</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>
                  {activePackage.used_sessions || 0} de{" "}
                  {activePackage.total_sessions} usadas
                </span>
                <span className="font-medium">
                  {Math.round(packageProgress)}%
                </span>
              </div>
              <Progress value={packageProgress} className="h-3" />
            </div>

            {activePackage.total_sessions -
              (activePackage.used_sessions || 0) <=
              3 && (
              <Alert className="mt-4 border-warning bg-warning/10">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <AlertDescription className="text-warning">
                  Pacote acabando! Restam apenas{" "}
                  {activePackage.total_sessions -
                    (activePackage.used_sessions || 0)}{" "}
                  sessões.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{sessions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Presentes</p>
                <p className="text-2xl font-bold text-green-600">
                  {presentCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <UserX className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Faltas</p>
                <p className="text-2xl font-bold text-red-600">{absentCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-full">
                <Receipt className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sessões Pagas</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {paidSessionsCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-full">
                <DollarSign className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Pago</p>
                <p className="text-2xl font-bold text-success">
                  R$ {totalPaid.toFixed(0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerta DESTACADO de sessões sem pagamento */}
      {sessionsNeedingPayment > 0 && (
        <Alert className="border-2 border-orange-400 bg-gradient-to-r from-orange-100 to-amber-50 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500 rounded-full">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <AlertDescription className="text-orange-800 font-bold text-base">
                ⚠️ ATENÇÃO: {sessionsNeedingPayment} sessão(ões) presente(s) sem pagamento!
              </AlertDescription>
              <p className="text-sm text-orange-600 mt-1">
                Selecione sessões abaixo para pagamento em lote
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-orange-600">{sessionsNeedingPayment}</p>
              <p className="text-xs text-orange-500">pendente{sessionsNeedingPayment > 1 ? 's' : ''}</p>
            </div>
          </div>
        </Alert>
      )}

      {/* Barra de Ações para Pagamento em Lote */}
      {selectedSessions.length > 0 && (
        <Card className="border-2 border-primary bg-primary/5">
          <CardContent className="py-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Badge className="bg-primary text-white text-base px-3 py-1">
                  {selectedSessions.length} sessão(ões) selecionada(s)
                </Badge>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedSessions([])}
                >
                  <X className="h-4 w-4 mr-1" />
                  Limpar seleção
                </Button>
              </div>
              <Button 
                onClick={() => setBatchPaymentOpen(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Pagar {selectedSessions.length} sessões
              </Button>
            </div>
            
            {/* Formulário de Pagamento em Lote */}
            {batchPaymentOpen && (
              <div className="mt-4 p-4 bg-background rounded-lg border space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Pagamento em Lote - {selectedSessions.length} sessões
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm text-muted-foreground">Valor por sessão (R$)</label>
                    <Input
                      type="number"
                      placeholder="90,00"
                      value={batchPaymentForm.amount}
                      onChange={(e) => setBatchPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                    />
                    {batchPaymentForm.amount && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Total: R$ {(parseFloat(batchPaymentForm.amount) * selectedSessions.length).toFixed(2)}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Método</label>
                    <Select 
                      value={batchPaymentForm.method} 
                      onValueChange={(v) => setBatchPaymentForm(prev => ({ ...prev, method: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="debito">Cartão Débito</SelectItem>
                        <SelectItem value="credito">Cartão Crédito</SelectItem>
                        <SelectItem value="transferencia">Transferência</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Nota Fiscal (opcional)</label>
                    <Input
                      placeholder="Nº da NF"
                      value={batchPaymentForm.invoiceNumber}
                      onChange={(e) => setBatchPaymentForm(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setBatchPaymentOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={() => {
                      const amount = parseFloat(batchPaymentForm.amount);
                      if (!amount || amount <= 0) {
                        toast.error("Informe um valor válido por sessão");
                        return;
                      }
                      batchPayment.mutate({
                        sessionIds: selectedSessions,
                        amountPerSession: amount,
                        paymentMethod: batchPaymentForm.method,
                        invoiceNumber: batchPaymentForm.invoiceNumber,
                      });
                    }}
                    disabled={batchPayment.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {batchPayment.isPending ? "Processando..." : `Confirmar R$ ${(parseFloat(batchPaymentForm.amount || "0") * selectedSessions.length).toFixed(2)}`}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Lista de Sessões Agrupadas por Pacote */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Histórico de Sessões
            </CardTitle>
            
            {/* Filtro de Status com Badge */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px] h-9">
                  <SelectValue placeholder="Filtrar por..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="present">✅ Presente</SelectItem>
                  <SelectItem value="missed">❌ Faltou</SelectItem>
                  <SelectItem value="scheduled">📅 Agendado</SelectItem>
                  <SelectItem value="paid">💰 Pago</SelectItem>
                  <SelectItem value="unpaid">⚠️ Pendente</SelectItem>
                </SelectContent>
              </Select>
              <Badge 
                variant={statusFilter === "all" ? "secondary" : "default"}
                className={`${
                  statusFilter === "unpaid" 
                    ? "bg-orange-500 hover:bg-orange-600" 
                    : statusFilter === "paid"
                    ? "bg-green-500 hover:bg-green-600"
                    : statusFilter === "missed"
                    ? "bg-red-500 hover:bg-red-600"
                    : statusFilter === "present"
                    ? "bg-emerald-500 hover:bg-emerald-600"
                    : ""
                }`}
              >
                {filteredSessionsCount}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-medium text-lg">Sem sessões</h3>
              <p className="text-sm text-muted-foreground">
                Nenhuma sessão registrada para este paciente
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {(() => {
                // Função auxiliar para verificar se sessão passa no filtro
                const passesFilter = (session: AttendanceSession) => {
                  if (statusFilter === "all") return true;
                  
                  const status = getSessionStatus(session);
                  const payment = getSessionPayment(session);
                  const isPaid = !!payment;
                  const isPresent = session.attendance_status === "present";
                  
                  switch (statusFilter) {
                    case "present": return status === "present";
                    case "missed": return status === "missed";
                    case "scheduled": return status === "scheduled";
                    case "paid": return isPaid;
                    case "unpaid": return isPresent && !isPaid;
                    default: return true;
                  }
                };
                
                // Aplicar filtro às sessões
                const filteredSessions = sessions.filter(passesFilter);
                
                // Agrupar sessões por pacote
                const groupedSessions: {
                  packageInfo: typeof allPackages[0] | null;
                  sessions: typeof sessions;
                  packageIndex: number;
                }[] = [];

                // Criar grupos baseados em pacotes
                if (allPackages.length > 0) {
                  allPackages.forEach((pkg, pkgIndex) => {
                    const pkgDate = pkg.purchase_date ? parseISO(pkg.purchase_date) : new Date(0);
                    const nextPkgDate = allPackages[pkgIndex + 1]?.purchase_date 
                      ? parseISO(allPackages[pkgIndex + 1].purchase_date)
                      : new Date(0);

                    const pkgSessions = sessions.filter(s => {
                      try {
                        const sessionDate = parseISO(s.date);
                        // Sessão pertence a este pacote se data >= data compra deste pacote
                        // e < data compra do próximo pacote (se houver)
                        if (pkgIndex === allPackages.length - 1) {
                          // Último pacote: todas as sessões anteriores
                          return sessionDate < pkgDate || sessionDate >= pkgDate;
                        }
                        return sessionDate >= nextPkgDate && sessionDate < pkgDate;
                      } catch {
                        return false;
                      }
                    });

                    // Simplificar: dividir sessões baseado no total de sessões de cada pacote
                    groupedSessions.push({
                      packageInfo: pkg,
                      sessions: [],
                      packageIndex: pkgIndex,
                    });
                  });

                  // Distribuir sessões entre pacotes baseado na ordem e total de sessões
                  let sessionIndex = 0;
                  for (let i = 0; i < allPackages.length; i++) {
                    const pkg = allPackages[i];
                    const pkgTotalSessions = pkg.total_sessions || 10;
                    const pkgSessions = filteredSessions.slice(sessionIndex, sessionIndex + pkgTotalSessions);
                    
                    if (pkgSessions.length > 0) {
                      groupedSessions[i].sessions = pkgSessions;
                      sessionIndex += pkgSessions.length;
                    }
                  }

                  // Sessões sem pacote (antes de qualquer pacote)
                  if (sessionIndex < filteredSessions.length) {
                    groupedSessions.push({
                      packageInfo: null,
                      sessions: filteredSessions.slice(sessionIndex),
                      packageIndex: -1,
                    });
                  }
                } else {
                  // Sem pacotes, mostrar todas as sessões filtradas
                  groupedSessions.push({
                    packageInfo: null,
                    sessions: filteredSessions,
                    packageIndex: -1,
                  });
                }
                
                // Mostrar mensagem se filtro não retornou resultados
                if (filteredSessions.length === 0 && sessions.length > 0) {
                  return (
                    <div className="text-center py-8">
                      <Filter className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <h3 className="font-medium text-lg">Nenhuma sessão encontrada</h3>
                      <p className="text-sm text-muted-foreground">
                        Não há sessões com o filtro "{statusFilter}" selecionado
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-3"
                        onClick={() => setStatusFilter("all")}
                      >
                        Limpar filtro
                      </Button>
                    </div>
                  );
                }

                // Filtrar grupos vazios e renderizar
                return groupedSessions
                  .filter(group => group.sessions.length > 0)
                  .map((group, groupIndex) => {
                    const pkg = group.packageInfo;
                    const usedInPackage = group.sessions.filter(
                      s => s.attendance_status === "present"
                    ).length;
                    const totalInPackage = pkg?.total_sessions || group.sessions.length;

                    return (
                      <div key={pkg?.id || "no-package"} className="space-y-3">
                        {/* Separador de Pacote */}
                        <div className={`flex items-center gap-3 py-3 px-4 rounded-lg ${
                          pkg 
                            ? pkg.status === "active"
                              ? "bg-primary/10 border border-primary/20"
                              : pkg.status === "completed"
                              ? "bg-green-100 border border-green-200"
                              : "bg-muted border border-border"
                            : "bg-muted/50 border border-dashed border-border"
                        }`}>
                          <div className={`p-2 rounded-full ${
                            pkg?.status === "active" 
                              ? "bg-primary/20" 
                              : pkg?.status === "completed"
                              ? "bg-green-200"
                              : "bg-muted-foreground/20"
                          }`}>
                            <Package className={`h-5 w-5 ${
                              pkg?.status === "active" 
                                ? "text-primary" 
                                : pkg?.status === "completed"
                                ? "text-green-700"
                                : "text-muted-foreground"
                            }`} />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">
                                {pkg?.package?.name || "Sessões Avulsas"}
                              </h4>
                              {pkg && (
                                <Badge className={
                                  pkg.status === "active"
                                    ? "bg-primary/20 text-primary"
                                    : pkg.status === "completed"
                                    ? "bg-green-200 text-green-800"
                                    : "bg-muted text-muted-foreground"
                                }>
                                  {pkg.status === "active" 
                                    ? "Ativo" 
                                    : pkg.status === "completed" 
                                    ? "Concluído" 
                                    : pkg.status === "expired"
                                    ? "Expirado"
                                    : pkg.status}
                                </Badge>
                              )}
                            </div>
                            {pkg && (
                              <p className="text-sm text-muted-foreground">
                                Comprado em {format(parseISO(pkg.purchase_date), "dd/MM/yyyy")} • 
                                {" "}{usedInPackage}/{totalInPackage} sessões usadas
                              </p>
                            )}
                          </div>

                          {pkg && (
                            <div className="text-right">
                              <p className="text-xl font-bold">
                                {totalInPackage - usedInPackage}
                              </p>
                              <p className="text-xs text-muted-foreground">restantes</p>
                            </div>
                          )}
                        </div>

                        {/* Sessões do Pacote */}
                        <div className="space-y-2 ml-4 border-l-2 border-muted pl-4">
                        {group.sessions.map((session, sessionIndex) => {
                            const sessionStatus = getSessionStatus(session);
                            const statusInfo = statusConfig[sessionStatus];
                            const isPresent = sessionStatus === "present";
                            
                            // Calcular número da sessão DENTRO do pacote (não absoluto)
                            // Sessões são ordenadas por data DESC, então invertemos a contagem
                            const sessionsInPackage = group.sessions.length;
                            const positionInPackage = sessionsInPackage - sessionIndex;
                            const totalPackageSessions = pkg?.total_sessions || sessionsInPackage;
                            
                            // Verificar pagamento
                            const payment = getSessionPayment(session);
                            const isPaid = !!payment;
                            const isUnpaidPresent = isPresent && !isPaid;

                            return (
                              <div
                                key={session.id}
                                className={`border rounded-lg p-4 transition-all ${
                                  isUnpaidPresent
                                    ? "border-orange-300 bg-orange-50/50"
                                    : sessionStatus === "present" && isPaid
                                    ? "border-green-200 bg-green-50/50"
                                    : sessionStatus === "missed"
                                    ? "border-red-200 bg-red-50/50"
                                    : "border-border bg-background"
                                }`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-4">
                                    {/* Checkbox para seleção (apenas sessões presentes não pagas) */}
                                    {isUnpaidPresent && (
                                      <div className="flex items-center pt-2">
                                        <Checkbox
                                          id={`select-${session.id}`}
                                          checked={selectedSessions.includes(session.id)}
                                          onCheckedChange={(checked) => {
                                            if (checked) {
                                              setSelectedSessions(prev => [...prev, session.id]);
                                            } else {
                                              setSelectedSessions(prev => prev.filter(id => id !== session.id));
                                            }
                                          }}
                                        />
                                      </div>
                                    )}
                                    
                                    {/* Número da Sessão dentro do Pacote */}
                                    <div className="text-center min-w-[60px]">
                                      <div className="text-2xl font-bold text-primary">
                                        {positionInPackage}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        de {totalPackageSessions}
                                      </div>
                                    </div>

                                    <div className="space-y-1">
                                      {/* Data e Hora */}
                                      <div className="flex items-center gap-2 text-sm font-medium">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        {format(parseISO(session.date), "dd/MM/yyyy", {
                                          locale: ptBR,
                                        })}{" "}
                                        às {session.time}
                                      </div>

                                      {/* Profissional */}
                                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <User className="h-4 w-4" />
                                        {session.therapist}
                                      </div>

                                      {/* Pagamento Info (quando pago) */}
                                      {isPaid && payment && (
                                        <div className="flex items-center gap-2 text-sm text-green-700 font-medium">
                                          <DollarSign className="h-4 w-4" />
                                          {(payment as any)?.viaPackage ? (
                                            <span>Via {(payment as any).packageName}</span>
                                          ) : (
                                            <>
                                              R$ {Number(payment.value).toFixed(2).replace(".", ",")} 
                                              <span className="text-green-600/70">
                                                ({paymentMethodLabels[payment.payment_method || ""] || payment.payment_method || "N/A"})
                                              </span>
                                            </>
                                          )}
                                        </div>
                                      )}

                                      {/* Nota Fiscal */}
                                      {session.invoice_number && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                          <Receipt className="h-4 w-4" />
                                          NF: {session.invoice_number}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex flex-col items-end gap-2">
                                    {/* Status de Presença e Pagamento */}
                                    <div className="flex flex-wrap items-center gap-2 justify-end">
                                      <Badge className={statusInfo.color}>
                                        {statusInfo.icon}
                                        <span className="ml-1">{statusInfo.label}</span>
                                      </Badge>
                                      
                                      {/* Badge de Pagamento */}
                                      {isPresent && (
                                        isPaid ? (
                                          <Badge className="bg-green-100 text-green-800">
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            {(payment as any)?.viaPackage ? "Pago (Pacote)" : "Pago"}
                                          </Badge>
                                        ) : (
                                          <Badge className="bg-orange-100 text-orange-800">
                                            <AlertTriangle className="h-3 w-3 mr-1" />
                                            Pendente
                                          </Badge>
                                        )
                                      )}
                                      
                                      {/* Nome do Pacote Vinculado */}
                                      {session.package_id && (() => {
                                        const linkedPackage = allPackages.find(p => p.id === session.package_id);
                                        return linkedPackage ? (
                                          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                                            <Package className="h-3 w-3 mr-1" />
                                            {linkedPackage.package?.name || "Pacote"}
                                          </Badge>
                                        ) : null;
                                      })()}
                                    </div>

                                    {/* Botões de Marcar Presença */}
                                    {(sessionStatus === "pending" || sessionStatus === "scheduled") && (
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="text-green-600 border-green-600 hover:bg-green-50"
                                          onClick={() => markAttendance.mutate({ 
                                            appointmentId: session.id, 
                                            status: "present" 
                                          })}
                                          disabled={markAttendance.isPending}
                                        >
                                          <UserCheck className="h-4 w-4 mr-1" />
                                          Presente
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="text-red-600 border-red-600 hover:bg-red-50"
                                          onClick={() => markAttendance.mutate({ 
                                            appointmentId: session.id, 
                                            status: "absent" 
                                          })}
                                          disabled={markAttendance.isPending}
                                        >
                                          <UserX className="h-4 w-4 mr-1" />
                                          Faltou
                                        </Button>
                                      </div>
                                    )}

                                    {/* Botão Vincular ao Pacote (sessão presente sem pacote vinculado, e há pacote ativo) */}
                                    {isPresent && !session.package_id && activePackage && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-primary border-primary hover:bg-primary/10"
                                        onClick={() => linkToPackage.mutate(session.id)}
                                        disabled={linkToPackage.isPending}
                                      >
                                        <Link className="h-4 w-4 mr-1" />
                                        {linkToPackage.isPending ? "Vinculando..." : "Vincular ao Pacote"}
                                      </Button>
                                    )}

                                    {/* Botão Registrar Pagamento (só mostra se não pago e não tem pacote) */}
                                    {isUnpaidPresent && !session.package_id && payingSessionId !== session.id && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-orange-600 border-orange-600 hover:bg-orange-50"
                                        onClick={() => setPayingSessionId(session.id)}
                                      >
                                        <DollarSign className="h-4 w-4 mr-1" />
                                        Pagamento Avulso
                                      </Button>
                                    )}

                                    {/* Botão Desfazer Marcação (presente ou ausente, sem pagamento) */}
                                    {(sessionStatus === "present" || sessionStatus === "missed") && !isPaid && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-muted-foreground hover:text-foreground"
                                        onClick={() => undoAttendance.mutate({
                                          appointmentId: session.id,
                                          packageId: session.package_id,
                                        })}
                                        disabled={undoAttendance.isPending}
                                      >
                                        <X className="h-4 w-4 mr-1" />
                                        Desfazer
                                      </Button>
                                    )}
                                  </div>
                                </div>

                                {/* Formulário de Pagamento Inline */}
                                {payingSessionId === session.id && (
                                  <div className="mt-4 pt-4 border-t space-y-3">
                                    <div className="flex items-center justify-between">
                                      <h4 className="font-medium text-sm">
                                        Registrar Pagamento
                                      </h4>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => setPayingSessionId(null)}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                      <div>
                                        <label className="text-xs text-muted-foreground mb-1 block">
                                          Valor (R$)
                                        </label>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          placeholder="0,00"
                                          value={paymentForm.amount}
                                          onChange={(e) =>
                                            setPaymentForm({
                                              ...paymentForm,
                                              amount: e.target.value,
                                            })
                                          }
                                        />
                                      </div>

                                      <div>
                                        <label className="text-xs text-muted-foreground mb-1 block">
                                          Método
                                        </label>
                                        <Select
                                          value={paymentForm.method}
                                          onValueChange={(v) =>
                                            setPaymentForm({ ...paymentForm, method: v })
                                          }
                                        >
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="pix">PIX</SelectItem>
                                            <SelectItem value="dinheiro">
                                              Dinheiro
                                            </SelectItem>
                                            <SelectItem value="cartao_debito">
                                              Débito
                                            </SelectItem>
                                            <SelectItem value="cartao_credito">
                                              Crédito
                                            </SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      <div>
                                        <label className="text-xs text-muted-foreground mb-1 block">
                                          Nº Nota Fiscal
                                        </label>
                                        <Input
                                          placeholder="Opcional"
                                          value={paymentForm.invoiceNumber}
                                          onChange={(e) =>
                                            setPaymentForm({
                                              ...paymentForm,
                                              invoiceNumber: e.target.value,
                                            })
                                          }
                                        />
                                      </div>

                                      <div className="flex items-end">
                                        <Button
                                          className="w-full bg-success hover:bg-success/90"
                                          onClick={() => handleSubmitPayment(session.id)}
                                          disabled={registerPayment.isPending}
                                        >
                                          {registerPayment.isPending ? (
                                            "Salvando..."
                                          ) : (
                                            <>
                                              <CheckCircle className="h-4 w-4 mr-1" />
                                              Confirmar
                                            </>
                                          )}
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Seção de Evolução Diária */}
                                {sessionStatus === "present" && (
                                  <div className="mt-3 pt-3 border-t">
                                    <div className="flex items-center gap-2 mb-2">
                                      <FileText className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-sm font-medium">Evolução do Atendimento</span>
                                      {session.notes && editingEvolutionId !== session.id && (
                                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                          ✓ Registrada
                                        </Badge>
                                      )}
                                    </div>
                                    
                                    {editingEvolutionId === session.id ? (
                                      <div className="space-y-2">
                                        <Textarea
                                          value={evolutionText}
                                          onChange={(e) => setEvolutionText(e.target.value)}
                                          placeholder="Descreva a evolução do paciente neste atendimento..."
                                          rows={3}
                                          className="text-sm"
                                        />
                                        <div className="flex gap-2">
                                          <Button 
                                            size="sm" 
                                            onClick={() => saveEvolution(session.id)}
                                            disabled={updateEvolution.isPending}
                                            className="bg-success hover:bg-success/90"
                                          >
                                            <Save className="h-4 w-4 mr-1" />
                                            {updateEvolution.isPending ? "Salvando..." : "Salvar"}
                                          </Button>
                                          <Button 
                                            size="sm" 
                                            variant="outline" 
                                            onClick={cancelEditingEvolution}
                                          >
                                            Cancelar
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div 
                                        className="p-2 bg-muted/50 rounded cursor-pointer hover:bg-muted transition-colors group"
                                        onClick={() => startEditingEvolution(session)}
                                      >
                                        {session.notes ? (
                                          <div className="flex items-start justify-between gap-2">
                                            <p className="text-sm text-foreground whitespace-pre-wrap">{session.notes}</p>
                                            <Edit3 className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                          </div>
                                        ) : (
                                          <p className="text-sm text-muted-foreground italic flex items-center gap-2">
                                            <Edit3 className="h-4 w-4" />
                                            Clique para adicionar evolução...
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Linha separadora entre pacotes */}
                        {groupIndex < groupedSessions.filter(g => g.sessions.length > 0).length - 1 && (
                          <div className="flex items-center gap-3 py-2">
                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                            <span className="text-xs text-muted-foreground font-medium">
                              Pacote Anterior
                            </span>
                            <div className="flex-1 h-px bg-gradient-to-r from-border via-border to-transparent" />
                          </div>
                        )}
                      </div>
                    );
                  });
              })()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
