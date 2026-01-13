import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, TrendingUp, Users, DollarSign, Calendar, Clock, AlertCircle, ArrowUp, ArrowDown, CalendarIcon } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { useState } from "react";
import { useIncomes } from "@/hooks/useIncomes";
import { useExpenses } from "@/hooks/useExpenses";
import { useAppointments } from "@/hooks/useAppointments";
import { useSessions } from "@/hooks/useSessions";
import { format, subDays, subMonths } from "date-fns";
import { generateReportPDF } from "@/lib/pdf-generator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

const Reports = () => {
  const [period, setPeriod] = useState<"week" | "month" | "custom">("month");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();

  // Calculate date range
  const endDate = customEndDate 
    ? format(customEndDate, "yyyy-MM-dd")
    : format(new Date(), "yyyy-MM-dd");
  const startDate = customStartDate
    ? format(customStartDate, "yyyy-MM-dd")
    : format(
        period === "week" ? subDays(new Date(), 7) : subMonths(new Date(), 3),
        "yyyy-MM-dd"
      );

  // Fetch real data
  const { data: incomes = [] } = useIncomes(startDate, endDate);
  const { data: expenses = [] } = useExpenses(startDate, endDate);
  const { data: sessions = [] } = useSessions(undefined, startDate, endDate);
  const { data: appointments = [] } = useAppointments(new Date(startDate), new Date(endDate));

  // Calculate real metrics
  const totalRevenue = incomes.reduce((sum, i) => sum + Number(i.value), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.value), 0);
  const totalSessions = sessions.length;
  const pendingPayments = incomes.filter(i => i.payment_status === "pending").reduce((sum, i) => sum + Number(i.value), 0);
  const pendingPaymentsCount = incomes.filter(i => i.payment_status === "pending").length;

  // Calculate occupancy rate (appointments vs total available slots)
  const totalWorkDays = period === "week" ? 7 : 30;
  const totalAvailableSlots = totalWorkDays * 8; // 8 slots per day
  const occupancyRate = totalAvailableSlots > 0 ? Math.round((appointments.length / totalAvailableSlots) * 100) : 0;

  // Revenue by therapist
  const revenueDistribution = [...new Set(incomes.map(i => i.therapist))].map(therapist => {
    const value = incomes.filter(i => i.therapist === therapist).reduce((sum, i) => sum + Number(i.value), 0);
    return { name: therapist, value, percentage: totalRevenue > 0 ? Math.round((value / totalRevenue) * 100) : 0 };
  }).filter(item => item.value > 0);

  // Payment methods distribution
  const paymentMethods = [...new Set(incomes.map(i => i.payment_method))].map(method => ({
    name: method || "Não informado",
    value: incomes.filter(i => i.payment_method === method).reduce((sum, i) => sum + Number(i.value), 0)
  })).filter(item => item.value > 0);

  // Get pending income items for display
  const pendingIncomes = incomes.filter(i => i.payment_status === "pending").slice(0, 5);

  // Get sessions without invoices
  const sessionsWithoutInvoice = sessions.filter(s => !s.invoice_delivered).slice(0, 5);

  const COLORS = ["hsl(var(--primary))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))"];

  return (
    <div className="space-y-6">
      {/* Header with Icon */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-warning/20 to-warning/5 rounded-xl shadow-soft">
            <FileText className="w-8 h-8 text-warning" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Relatórios & Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Análises financeiras e operacionais da clínica
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
            <Button
              variant={period === "week" ? "default" : "ghost"}
              size="sm"
              onClick={() => setPeriod("week")}
              className="flex-1 sm:flex-none"
            >
              Semana
            </Button>
            <Button
              variant={period === "month" ? "default" : "ghost"}
              size="sm"
              onClick={() => setPeriod("month")}
              className="flex-1 sm:flex-none"
            >
              Mês
            </Button>
            <Button
              variant={period === "custom" ? "default" : "ghost"}
              size="sm"
              className="flex-1 sm:flex-none"
            >
              <Popover>
                <PopoverTrigger asChild>
                  <span className="flex items-center">
                    <CalendarIcon className="w-4 h-4 mr-1" />
                    Personalizado
                  </span>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Data Inicial</label>
                      <CalendarComponent
                        mode="single"
                        selected={customStartDate}
                        onSelect={(date) => {
                          setCustomStartDate(date);
                          if (date) setPeriod("custom");
                        }}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Data Final</label>
                      <CalendarComponent
                        mode="single"
                        selected={customEndDate}
                        onSelect={(date) => {
                          setCustomEndDate(date);
                          if (date && customStartDate) setPeriod("custom");
                        }}
                        className="pointer-events-auto"
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </Button>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="shadow-soft w-full sm:w-auto"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar PDF
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="end">
              <div className="space-y-3">
                <h4 className="font-medium text-sm mb-3">Selecione o tipo de relatório</h4>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    const data = {
                      totalRevenue,
                      totalSessions,
                      occupancyRate,
                      pendingPayments,
                      revenueDistribution
                    };
                    generateReportPDF(data, "semanal");
                  }}
                >
                  Relatório Semanal
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    const data = {
                      totalRevenue,
                      totalSessions,
                      occupancyRate,
                      pendingPayments,
                      revenueDistribution
                    };
                    generateReportPDF(data, "mensal");
                  }}
                >
                  Relatório Mensal
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    const data = {
                      totalRevenue,
                      totalSessions,
                      occupancyRate,
                      pendingPayments,
                      revenueDistribution
                    };
                    generateReportPDF(data, "semanal");
                  }}
                >
                  Relatório Geral
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Card 1: Total Revenue */}
        <Card className="p-4 sm:p-6 shadow-soft relative overflow-hidden">
          <div className="flex items-start justify-between mb-2 sm:mb-4">
            <div className="p-2 sm:p-3 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs sm:text-sm text-muted-foreground">Faturamento</div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <div className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">{period === "week" ? "esta semana" : "este período"}</div>
          </div>
        </Card>

        {/* Card 2: Total Sessions */}
        <Card className="p-4 sm:p-6 shadow-soft relative overflow-hidden">
          <div className="flex items-start justify-between mb-2 sm:mb-4">
            <div className="p-2 sm:p-3 bg-gradient-to-br from-success/20 to-success/5 rounded-xl">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-success" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs sm:text-sm text-muted-foreground">Sessões</div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-success">{totalSessions}</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">{period === "week" ? "esta semana" : "este período"}</div>
          </div>
        </Card>

        {/* Card 3: Occupancy Rate */}
        <Card className="p-4 sm:p-6 shadow-soft relative overflow-hidden col-span-2 lg:col-span-1">
          <div className="flex items-start justify-between mb-2 sm:mb-4">
            <div className="p-2 sm:p-3 bg-gradient-to-br from-warning/20 to-warning/5 rounded-xl">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-warning" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs sm:text-sm text-muted-foreground">Ocupação</div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-warning">{occupancyRate}%</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground">da agenda ocupada</div>
          </div>
          {/* Mini donut chart - hidden on small mobile */}
          <div className="absolute bottom-0 right-0 w-16 h-16 sm:w-20 sm:h-20 opacity-30 hidden sm:block">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[{ value: occupancyRate }, { value: 100 - occupancyRate }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={15}
                  outerRadius={28}
                  dataKey="value"
                >
                  <Cell fill="hsl(var(--warning))" />
                  <Cell fill="hsl(var(--muted))" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Revenue Distribution Pie Chart */}
        <Card className="p-4 sm:p-6 shadow-soft">
          <h2 className="text-base sm:text-xl font-bold mb-4 sm:mb-6">Receita por Fisioterapeuta</h2>
          <div className="h-[200px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={revenueDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${percentage}%`}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {revenueDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `R$ ${value}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2">
            {revenueDistribution.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index] }} />
                  <span className="text-xs sm:text-sm font-medium truncate">{item.name}</span>
                </div>
                <span className="text-xs sm:text-sm font-bold whitespace-nowrap">R$ {item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Payment Methods Distribution */}
        <Card className="p-4 sm:p-6 shadow-soft">
          <h2 className="text-base sm:text-xl font-bold mb-4 sm:mb-6">Formas de Pagamento</h2>
          <div className="h-[200px] sm:h-[300px] overflow-x-auto">
            <ResponsiveContainer width="100%" height="100%" minWidth={280}>
              <BarChart data={paymentMethods}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => `R$ ${value}`} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>


      {/* Pendencies */}
      {(pendingIncomes.length > 0 || sessionsWithoutInvoice.length > 0) && (
        <Card className="p-6 shadow-soft">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-destructive" />
            Lista de Pendências
          </h2>
          
          <div className="space-y-4">
            {pendingIncomes.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 text-destructive flex items-center gap-2">
                  <ArrowDown className="w-4 h-4" />
                  Pagamentos Pendentes
                </h3>
                <div className="space-y-2">
                  {pendingIncomes.map((income) => (
                    <div key={income.id} className="flex items-center justify-between p-3 bg-destructive/5 rounded-lg border border-destructive/10">
                      <div>
                        <div className="font-medium">{income.patient_name}</div>
                        <div className="text-sm text-muted-foreground">{format(new Date(income.date), "dd/MM/yyyy")}</div>
                      </div>
                      <div className="font-bold text-destructive">
                        R$ {Number(income.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sessionsWithoutInvoice.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 text-primary flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Notas Fiscais Não Emitidas
                </h3>
                <div className="space-y-2">
                  {sessionsWithoutInvoice.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/10">
                      <div>
                        <div className="font-medium">{session.patient_name} - {format(new Date(session.date), "dd/MM/yyyy")}</div>
                        <div className="text-sm text-muted-foreground">Sessão nº {session.session_number}</div>
                      </div>
                      <div className="font-bold text-primary">
                        R$ {Number(session.session_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Report Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card className="p-4 sm:p-6 shadow-soft hover:shadow-hover transition-all cursor-pointer">
          <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-primary mb-2 sm:mb-3" />
          <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Relatório Semanal</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 line-clamp-2">
            Resumo da semana com entradas e saídas.
          </p>
          <Button variant="outline" className="w-full text-sm" size="sm">Gerar PDF</Button>
        </Card>

        <Card className="p-4 sm:p-6 shadow-soft hover:shadow-hover transition-all cursor-pointer">
          <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-success mb-2 sm:mb-3" />
          <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Relatório Mensal</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 line-clamp-2">
            Análise completa do mês com gráficos.
          </p>
          <Button variant="outline" className="w-full">Gerar PDF</Button>
        </Card>

        <Card className="p-6 shadow-soft hover:shadow-hover transition-all cursor-pointer">
          <FileText className="w-8 h-8 text-warning mb-3" />
          <h3 className="font-semibold mb-2">Relatório por Fisioterapeuta</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Detalhamento individual de cada profissional.
          </p>
          <Button variant="outline" className="w-full">Gerar PDF</Button>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
