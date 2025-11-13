import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, TrendingUp, Users, DollarSign, Calendar, Clock, AlertCircle, ArrowUp, ArrowDown } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { useState } from "react";

const Reports = () => {
  const [period, setPeriod] = useState<"week" | "month" | "custom">("month");

  // Mock data for charts
  const revenueDistribution = [
    { name: "Ana Paula Falcão", value: 4250, percentage: 22 },
    { name: "Cheila Meinertz", value: 4100, percentage: 21 },
    { name: "Daniela Wentts", value: 2800, percentage: 14 },
    { name: "Elenice Brun", value: 2600, percentage: 13 },
    { name: "Gabi Ritter", value: 2200, percentage: 11 },
    { name: "Grazi Nichelle", value: 1900, percentage: 10 },
    { name: "Kamilly Souza", value: 1000, percentage: 5 },
    { name: "Tassiane Suterio", value: 674, percentage: 4 },
  ];

  const monthlyTrend = [
    { name: "Jan", entradas: 6800, saidas: 4200 },
    { name: "Fev", entradas: 7200, saidas: 4500 },
    { name: "Mar", entradas: 7524, saidas: 4300 },
  ];

  const paymentMethods = [
    { name: "PIX", value: 4200 },
    { name: "Cartão Débito", value: 2100 },
    { name: "Cartão Crédito", value: 850 },
    { name: "Dinheiro", value: 374 },
  ];

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
              onClick={() => setPeriod("custom")}
              className="flex-1 sm:flex-none"
            >
              Personalizado
            </Button>
          </div>
          <Button className="shadow-soft w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        {/* Card 1: Total Revenue */}
        <Card className="p-6 shadow-soft relative overflow-hidden">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
            <div className="flex items-center gap-1 text-success text-sm font-medium">
              <ArrowUp className="w-4 h-4" />
              +12%
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Faturamento Total</div>
            <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              R$ 7.524
            </div>
            <div className="text-xs text-muted-foreground">vs mês anterior</div>
          </div>
          {/* Mini sparkline effect */}
          <div className="absolute bottom-0 right-0 w-32 h-16 opacity-20">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend}>
                <Line type="monotone" dataKey="entradas" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Card 2: Total Sessions */}
        <Card className="p-6 shadow-soft relative overflow-hidden">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-success/20 to-success/5 rounded-xl">
              <Calendar className="w-6 h-6 text-success" />
            </div>
            <div className="flex items-center gap-1 text-success text-sm font-medium">
              <ArrowUp className="w-4 h-4" />
              +8%
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Total de Sessões</div>
            <div className="text-3xl font-bold text-success">127</div>
            <div className="text-xs text-muted-foreground">este mês</div>
          </div>
          {/* Mini bar chart effect */}
          <div className="absolute bottom-2 right-2 flex items-end gap-1 opacity-20">
            {[60, 75, 85, 70, 90].map((height, i) => (
              <div key={i} className="w-3 bg-success rounded-t" style={{ height: `${height}%` }} />
            ))}
          </div>
        </Card>

        {/* Card 3: Occupancy Rate */}
        <Card className="p-6 shadow-soft relative overflow-hidden">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-warning/20 to-warning/5 rounded-xl">
              <Clock className="w-6 h-6 text-warning" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Taxa de Ocupação</div>
            <div className="text-3xl font-bold text-warning">78%</div>
            <div className="text-xs text-muted-foreground">da agenda ocupada</div>
          </div>
          {/* Mini donut chart */}
          <div className="absolute bottom-0 right-0 w-20 h-20 opacity-30">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[{ value: 78 }, { value: 22 }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={20}
                  outerRadius={35}
                  dataKey="value"
                >
                  <Cell fill="hsl(var(--warning))" />
                  <Cell fill="hsl(var(--muted))" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Card 4: Pending Payments */}
        <Card className="p-6 shadow-soft relative overflow-hidden border-destructive/20">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-destructive/20 to-destructive/5 rounded-xl">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <div className="flex items-center gap-1 text-destructive text-sm font-medium">
              8 pacientes
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Pagamentos Pendentes</div>
            <div className="text-3xl font-bold text-destructive">R$ 1.240</div>
            <div className="text-xs text-muted-foreground">requer atenção</div>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Distribution Pie Chart */}
        <Card className="p-6 shadow-soft">
          <h2 className="text-xl font-bold mb-6">Distribuição de Receita por Fisioterapeuta</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={revenueDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                outerRadius={100}
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
          <div className="mt-4 space-y-2">
            {revenueDistribution.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
                <span className="text-sm font-bold">R$ {item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Payment Methods Distribution */}
        <Card className="p-6 shadow-soft">
          <h2 className="text-xl font-bold mb-6">Formas de Pagamento</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={paymentMethods}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `R$ ${value}`} />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card className="p-6 shadow-soft">
        <h2 className="text-xl font-bold mb-6">Tendência: Entradas vs Saídas</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyTrend}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => `R$ ${value}`} />
            <Legend />
            <Line type="monotone" dataKey="entradas" stroke="hsl(var(--success))" strokeWidth={3} name="Entradas" />
            <Line type="monotone" dataKey="saidas" stroke="hsl(var(--destructive))" strokeWidth={3} name="Saídas" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Pendencies */}
      <Card className="p-6 shadow-soft">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-destructive" />
          Lista de Pendências
        </h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2 text-destructive flex items-center gap-2">
              <ArrowDown className="w-4 h-4" />
              Pagamentos Pendentes
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-destructive/5 rounded-lg border border-destructive/10">
                <div>
                  <div className="font-medium">João Santos</div>
                  <div className="text-sm text-muted-foreground">3 dias de atraso</div>
                </div>
                <div className="font-bold text-destructive">R$ 120,00</div>
              </div>
              <div className="flex items-center justify-between p-3 bg-destructive/5 rounded-lg border border-destructive/10">
                <div>
                  <div className="font-medium">Ana Costa</div>
                  <div className="text-sm text-muted-foreground">1 dia de atraso</div>
                </div>
                <div className="font-bold text-destructive">R$ 100,00</div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2 text-warning flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Repasses Não Realizados
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-warning/5 rounded-lg border border-warning/10">
                <div>
                  <div className="font-medium">Cheila</div>
                  <div className="text-sm text-muted-foreground">Saldo devedor</div>
                </div>
                <div className="font-bold text-warning">R$ 240,00</div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2 text-primary flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Notas Fiscais Não Emitidas
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/10">
                <div>
                  <div className="font-medium">Maria Silva - 05/01/2024</div>
                  <div className="text-sm text-muted-foreground">Sessão nº 12</div>
                </div>
                <Button size="sm" variant="outline">Registrar NF</Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Report Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-6 shadow-soft hover:shadow-hover transition-all cursor-pointer">
          <FileText className="w-8 h-8 text-primary mb-3" />
          <h3 className="font-semibold mb-2">Relatório Semanal</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Resumo completo da última semana com entradas, saídas e fechamentos.
          </p>
          <Button variant="outline" className="w-full">Gerar PDF</Button>
        </Card>

        <Card className="p-6 shadow-soft hover:shadow-hover transition-all cursor-pointer">
          <FileText className="w-8 h-8 text-success mb-3" />
          <h3 className="font-semibold mb-2">Relatório Mensal</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Análise completa do mês com gráficos e comparativos.
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
