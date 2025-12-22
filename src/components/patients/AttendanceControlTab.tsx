import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    method: "pix",
    invoiceNumber: "",
  });

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
      const { error } = await supabase
        .from("appointments")
        .update({
          attendance_status: status,
          status: status === "present" ? "completed" : "cancelled",
        })
        .eq("id", appointmentId);

      if (error) throw error;

      // Se marcou presente e tem pacote ativo, descontar sessão
      if (status === "present" && activePackage) {
        const newUsedSessions = (activePackage.used_sessions || 0) + 1;
        const newStatus = newUsedSessions >= activePackage.total_sessions ? "completed" : "active";
        
        await supabase
          .from("patient_packages")
          .update({
            used_sessions: newUsedSessions,
            status: newStatus,
          })
          .eq("id", activePackage.id);
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

  // Calcular estatísticas
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
  const totalPaid = incomes
    .filter((i) => i.payment_status === "received")
    .reduce((sum, i) => sum + Number(i.value || 0), 0);

  // Sessões presentes sem pagamento (aproximado)
  const unpaidPresentSessions = presentCount - incomes.filter(i => i.payment_status === "received").length;
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

      {/* Alerta de sessões sem pagamento */}
      {sessionsNeedingPayment > 0 && (
        <Alert className="border-warning bg-warning/10">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertDescription className="text-warning font-medium">
            ⚠️ {sessionsNeedingPayment} sessão(ões) presente(s) sem pagamento
            registrado!
          </AlertDescription>
        </Alert>
      )}

      {/* Lista de Sessões Agrupadas por Pacote */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Histórico de Sessões
          </CardTitle>
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
                    const pkgSessions = sessions.slice(sessionIndex, sessionIndex + pkgTotalSessions);
                    
                    if (pkgSessions.length > 0) {
                      groupedSessions[i].sessions = pkgSessions;
                      sessionIndex += pkgSessions.length;
                    }
                  }

                  // Sessões sem pacote (antes de qualquer pacote)
                  if (sessionIndex < sessions.length) {
                    groupedSessions.push({
                      packageInfo: null,
                      sessions: sessions.slice(sessionIndex),
                      packageIndex: -1,
                    });
                  }
                } else {
                  // Sem pacotes, mostrar todas as sessões
                  groupedSessions.push({
                    packageInfo: null,
                    sessions: sessions,
                    packageIndex: -1,
                  });
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
                            const sessionNumber = session.session_number || (group.sessions.length - sessionIndex);
                            const totalPackageSessions = pkg?.total_sessions || group.sessions.length;

                            return (
                              <div
                                key={session.id}
                                className={`border rounded-lg p-4 transition-all ${
                                  sessionStatus === "present"
                                    ? "border-green-200 bg-green-50/50"
                                    : sessionStatus === "missed"
                                    ? "border-red-200 bg-red-50/50"
                                    : "border-border bg-background"
                                }`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-4">
                                    {/* Número da Sessão */}
                                    <div className="text-center min-w-[60px]">
                                      <div className="text-2xl font-bold text-primary">
                                        #{sessionNumber}
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
                                    {/* Status de Presença */}
                                    <Badge className={statusInfo.color}>
                                      {statusInfo.icon}
                                      <span className="ml-1">{statusInfo.label}</span>
                                    </Badge>

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

                                    {/* Botão Registrar Pagamento */}
                                    {isPresent && payingSessionId !== session.id && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-success border-success hover:bg-success/10"
                                        onClick={() => setPayingSessionId(session.id)}
                                      >
                                        <DollarSign className="h-4 w-4 mr-1" />
                                        Registrar Pagamento
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
