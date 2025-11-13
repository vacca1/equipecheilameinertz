import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, MessageSquare, TrendingUp, Clock, Star, Users, 
  Zap, Target, AlertCircle, Phone, Mail, Calendar,
  MapPin, Settings, Download, Filter, Search, Bell,
  Trophy, ArrowUp, ArrowDown, Play, Pause
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, AreaChart, Area } from "recharts";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AIAgent = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isAgentActive, setIsAgentActive] = useState(true);

  // Mock data for metrics
  const mainMetrics = {
    leadsAttended: 347,
    conversionRate: 68,
    avgTime: "2m 34s",
    scheduledAppointments: 236,
    satisfaction: 4.7,
    activeChats: 12
  };

  const funnelData = [
    { stage: "Leads Iniciados", value: 347, percentage: 100, lost: 0 },
    { stage: "Qualificados", value: 312, percentage: 90, lost: 35 },
    { stage: "Interessados", value: 278, percentage: 80, lost: 34 },
    { stage: "Agendados", value: 236, percentage: 68, lost: 42 },
    { stage: "Compareceram", value: 217, percentage: 63, lost: 19 }
  ];

  const weekTrend = [
    { day: "Seg", convertidos: 32, negociacao: 12, perdidos: 8, atendimento: 5 },
    { day: "Ter", convertidos: 38, negociacao: 15, perdidos: 6, atendimento: 7 },
    { day: "Qua", convertidos: 35, negociacao: 10, perdidos: 9, atendimento: 4 },
    { day: "Qui", convertidos: 42, negociacao: 18, perdidos: 7, atendimento: 6 },
    { day: "Sex", convertidos: 40, negociacao: 14, perdidos: 5, atendimento: 8 },
    { day: "Sáb", convertidos: 28, negociacao: 8, perdidos: 4, atendimento: 3 },
    { day: "Dom", convertidos: 21, negociacao: 5, perdidos: 3, atendimento: 2 }
  ];

  const conversionByOrigin = [
    { origin: "WhatsApp", rate: 78, count: 156 },
    { origin: "Site", rate: 65, count: 89 },
    { origin: "Instagram", rate: 52, count: 67 },
    { origin: "Facebook", rate: 38, count: 23 },
    { origin: "Google Ads", rate: 85, count: 12 }
  ];

  const lossReasons = [
    { name: "Fora da região", value: 35, color: "hsl(var(--destructive))" },
    { name: "Preço alto", value: 25, color: "hsl(var(--warning))" },
    { name: "Horários indisponíveis", value: 20, color: "hsl(var(--primary))" },
    { name: "Não respondeu", value: 15, color: "hsl(var(--muted))" },
    { name: "Outros", value: 5, color: "hsl(var(--secondary))" }
  ];

  const recentConversations = [
    { id: 1, status: "success", name: "João Silva", phone: "(45) 99999-9999", origin: "WhatsApp", duration: "2m 15s", result: "Agendado", time: "Há 5 min" },
    { id: 2, status: "ongoing", name: "Maria Costa", phone: "(45) 98888-8888", origin: "Site", duration: "4m 32s", result: "Em andamento", time: "Agora" },
    { id: 3, status: "lost", name: "Pedro Santos", phone: "(45) 97777-7777", origin: "Instagram", duration: "1m 08s", result: "Não qualificado", time: "Há 12 min" },
    { id: 4, status: "success", name: "Ana Oliveira", phone: "(45) 96666-6666", origin: "WhatsApp", duration: "3m 45s", result: "Agendado", time: "Há 23 min" },
    { id: 5, status: "ongoing", name: "Carlos Mendes", phone: "(45) 95555-5555", origin: "Google Ads", duration: "1m 52s", result: "Negociando", time: "Há 2 min" }
  ];

  const insights = [
    {
      icon: TrendingUp,
      color: "text-primary",
      title: "Leads do Instagram têm 27% menos conversão",
      description: "Sugestão: adicionar pergunta de qualificação sobre localização logo no início.",
      action: "Aplicar sugestão"
    },
    {
      icon: Clock,
      color: "text-warning",
      title: "Horários das 14h às 16h sempre lotados",
      description: "73% dos leads pedem esse horário. Considere ampliar disponibilidade.",
      action: "Ver agenda"
    },
    {
      icon: AlertCircle,
      color: "text-destructive",
      title: "Objeção 'é caro' apareceu 45 vezes",
      description: "Taxa de conversão após essa objeção: apenas 32%. Melhore o script de valor.",
      action: "Editar resposta"
    }
  ];

  const COLORS = ["hsl(var(--primary))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))", "hsl(var(--secondary))"];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success": return "bg-success";
      case "ongoing": return "bg-warning";
      case "lost": return "bg-destructive";
      default: return "bg-muted";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Agent Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl">
            <Bot className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              Agente de IA
              {isAgentActive && (
                <Badge className="bg-success text-white animate-pulse">
                  🟢 ATIVO
                </Badge>
              )}
            </h1>
            <p className="text-sm text-muted-foreground">
              Monitoramento e análise do atendimento automatizado
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={isAgentActive ? "destructive" : "default"}
            onClick={() => setIsAgentActive(!isAgentActive)}
            className="shadow-soft"
          >
            {isAgentActive ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {isAgentActive ? "Pausar Agente" : "Ativar Agente"}
          </Button>
          <Button variant="outline" className="shadow-soft">
            <Settings className="w-4 h-4 mr-2" />
            Configurar
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 lg:w-auto">
          <TabsTrigger value="dashboard">📊 Dashboard</TabsTrigger>
          <TabsTrigger value="conversations">💬 Conversas</TabsTrigger>
          <TabsTrigger value="metrics">📈 Métricas</TabsTrigger>
          <TabsTrigger value="leads">🎯 Leads</TabsTrigger>
          <TabsTrigger value="config">⚙️ Configurações</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Main Metrics Cards */}
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Card 1: Leads Atendidos */}
            <Card className="p-6 shadow-soft relative overflow-hidden">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl">
                  <Bot className="w-6 h-6 text-primary" />
                </div>
                <div className="flex items-center gap-1 text-success text-sm font-medium">
                  <ArrowUp className="w-4 h-4" />
                  +23%
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Leads Atendidos</div>
                <div className="text-2xl font-bold text-primary">{mainMetrics.leadsAttended}</div>
                <div className="text-xs text-muted-foreground">este mês</div>
              </div>
            </Card>

            {/* Card 2: Taxa de Conversão */}
            <Card className="p-6 shadow-soft relative overflow-hidden">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-success/20 to-success/5 rounded-xl">
                  <Target className="w-6 h-6 text-success" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Taxa de Conversão</div>
                <div className="text-2xl font-bold text-success">{mainMetrics.conversionRate}%</div>
                <div className="text-xs text-muted-foreground">leads → agendamentos</div>
              </div>
              <div className="absolute bottom-2 right-2 w-16 h-16 opacity-20">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[{ value: mainMetrics.conversionRate }, { value: 100 - mainMetrics.conversionRate }]}
                      cx="50%"
                      cy="50%"
                      innerRadius={15}
                      outerRadius={30}
                      dataKey="value"
                    >
                      <Cell fill="hsl(var(--success))" />
                      <Cell fill="hsl(var(--muted))" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Card 3: Tempo Médio */}
            <Card className="p-6 shadow-soft">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-warning/20 to-warning/5 rounded-xl">
                  <Clock className="w-6 h-6 text-warning" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Tempo Médio</div>
                <div className="text-2xl font-bold text-warning">{mainMetrics.avgTime}</div>
                <div className="text-xs text-success">34% mais rápido</div>
              </div>
            </Card>

            {/* Card 4: Agendamentos */}
            <Card className="p-6 shadow-soft">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Agendamentos</div>
                <div className="text-2xl font-bold">{mainMetrics.scheduledAppointments}</div>
                <div className="text-xs text-muted-foreground">confirmados</div>
              </div>
            </Card>

            {/* Card 5: Satisfação */}
            <Card className="p-6 shadow-soft">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-warning/20 to-warning/5 rounded-xl">
                  <Star className="w-6 h-6 text-warning fill-warning" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Satisfação</div>
                <div className="text-2xl font-bold text-warning">{mainMetrics.satisfaction}/5.0</div>
                <div className="text-xs text-muted-foreground">189 avaliações</div>
              </div>
            </Card>

            {/* Card 6: Atendimentos Ativos */}
            <Card className="p-6 shadow-soft border-primary/20">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl animate-pulse">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Em Andamento</div>
                <div className="text-2xl font-bold text-primary">{mainMetrics.activeChats}</div>
                <div className="text-xs text-success">tempo real 🟢</div>
              </div>
            </Card>
          </div>

          {/* Conversion Funnel */}
          <Card className="p-6 shadow-soft">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Funil de Conversão - Últimos 30 dias
            </h2>
            <div className="space-y-3">
              {funnelData.map((stage, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{stage.stage}</span>
                    <div className="flex items-center gap-4">
                      <span className="font-bold">{stage.value}</span>
                      <Badge variant="secondary">{stage.percentage}%</Badge>
                      {stage.lost > 0 && (
                        <span className="text-destructive text-xs">↓ {stage.lost} perdidos</span>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all"
                      style={{ width: `${stage.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Weekly Trend Chart */}
          <Card className="p-6 shadow-soft">
            <h2 className="text-xl font-bold mb-6">Atendimentos da Semana</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={weekTrend}>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="convertidos" stackId="1" stroke="hsl(var(--success))" fill="hsl(var(--success))" name="Convertidos" />
                <Area type="monotone" dataKey="negociacao" stackId="1" stroke="hsl(var(--warning))" fill="hsl(var(--warning))" name="Em Negociação" />
                <Area type="monotone" dataKey="perdidos" stackId="1" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" name="Perdidos" />
                <Area type="monotone" dataKey="atendimento" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" name="Em Atendimento" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Recent Conversations Table */}
          <Card className="p-6 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Atendimentos Recentes</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtrar
                </Button>
                <Button variant="outline" size="sm">
                  <Search className="w-4 h-4 mr-2" />
                  Buscar
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Lead</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Origem</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Duração</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Resultado</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Horário</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {recentConversations.map((conv) => (
                    <tr key={conv.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(conv.status)}`} />
                      </td>
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{conv.name}</div>
                          <div className="text-xs text-muted-foreground">{conv.phone}</div>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline">{conv.origin}</Badge>
                      </td>
                      <td className="p-3 text-sm">{conv.duration}</td>
                      <td className="p-3">
                        <Badge variant={conv.status === "success" ? "default" : conv.status === "ongoing" ? "secondary" : "destructive"}>
                          {conv.result}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">{conv.time}</td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost">👁️</Button>
                          <Button size="sm" variant="ghost">💬</Button>
                          <Button size="sm" variant="ghost">📞</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* AI Insights */}
          <Card className="p-6 shadow-soft bg-gradient-to-br from-primary/5 to-transparent">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-warning" />
              Insights Automáticos da IA
            </h2>
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <div key={index} className="p-4 bg-background rounded-lg border border-border/50">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-muted ${insight.color}`}>
                      <insight.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{insight.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>
                      <Button size="sm" variant="outline">
                        {insight.action}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Conversations Tab */}
        <TabsContent value="conversations" className="space-y-6">
          <Card className="p-6 shadow-soft">
            <h2 className="text-xl font-bold mb-4">Histórico de Conversas</h2>
            <p className="text-muted-foreground">
              Visualização detalhada das conversas será implementada aqui com histórico completo,
              análise de sentimento e transcrições.
            </p>
          </Card>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-6">
          {/* Conversion by Origin */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="p-6 shadow-soft">
              <h2 className="text-xl font-bold mb-6">Taxa de Conversão por Origem</h2>
              <div className="space-y-3">
                {conversionByOrigin.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.origin}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{item.count} leads</span>
                        <span className="font-bold">{item.rate}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${item.rate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 shadow-soft">
              <h2 className="text-xl font-bold mb-6">Motivos de Perda</h2>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={lossReasons}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {lossReasons.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Comparison AI vs Human */}
          <Card className="p-6 shadow-soft">
            <h2 className="text-xl font-bold mb-6">Comparativo: Agente IA vs Atendimento Humano</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Métrica</th>
                    <th className="text-center p-3 font-medium text-primary">Agente IA</th>
                    <th className="text-center p-3 font-medium">Humano</th>
                    <th className="text-center p-3 font-medium">Diferença</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-3">Tempo médio</td>
                    <td className="p-3 text-center font-semibold text-primary">2m 34s</td>
                    <td className="p-3 text-center">4m 12s</td>
                    <td className="p-3 text-center text-success">⚡ 38% mais rápido</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">Taxa de conversão</td>
                    <td className="p-3 text-center font-semibold text-primary">68%</td>
                    <td className="p-3 text-center">71%</td>
                    <td className="p-3 text-center">📊 Similar</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">Custo por lead</td>
                    <td className="p-3 text-center font-semibold text-primary">R$ 2,30</td>
                    <td className="p-3 text-center">R$ 8,50</td>
                    <td className="p-3 text-center text-success">💰 73% economia</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">Disponibilidade</td>
                    <td className="p-3 text-center font-semibold text-primary">24/7</td>
                    <td className="p-3 text-center">9h-18h</td>
                    <td className="p-3 text-center text-success">⏰ 100% uptime</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">Satisfação</td>
                    <td className="p-3 text-center font-semibold text-primary">4.7/5</td>
                    <td className="p-3 text-center">4.8/5</td>
                    <td className="p-3 text-center">😊 Equivalente</td>
                  </tr>
                  <tr>
                    <td className="p-3">Leads simultâneos</td>
                    <td className="p-3 text-center font-semibold text-primary">∞</td>
                    <td className="p-3 text-center">1-3</td>
                    <td className="p-3 text-center text-success">🚀 Escalável</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm text-center text-muted-foreground">
                <strong className="text-primary">Insight:</strong> O agente IA mantém qualidade similar ao atendimento humano 
                com custo 73% menor e disponibilidade 24/7
              </p>
            </div>
          </Card>
        </TabsContent>

        {/* Leads Tab */}
        <TabsContent value="leads" className="space-y-6">
          <Card className="p-6 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Gerenciamento de Leads</h2>
              <div className="flex gap-2">
                <Select>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filtrar status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="new">Novos</SelectItem>
                    <SelectItem value="qualified">Qualificados</SelectItem>
                    <SelectItem value="scheduled">Agendados</SelectItem>
                    <SelectItem value="lost">Perdidos</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Input placeholder="Buscar por nome, telefone ou email..." className="max-w-md" />
            </div>
            <p className="text-muted-foreground mt-4">
              Lista completa de leads, follow-up automático e réguas de relacionamento serão implementados aqui.
            </p>
          </Card>
        </TabsContent>

        {/* Config Tab */}
        <TabsContent value="config" className="space-y-6">
          <Card className="p-6 shadow-soft">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configurações do Agente de IA
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Nome do Agente</label>
                <Input placeholder="Ex: Ana, Dr. Carlos..." defaultValue="Ana IA" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Tom de Voz</label>
                <Select defaultValue="friendly">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="formal">Formal e profissional</SelectItem>
                    <SelectItem value="friendly">Amigável e casual</SelectItem>
                    <SelectItem value="technical">Técnico e informativo</SelectItem>
                    <SelectItem value="empathetic">Empático e acolhedor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Instruções do Sistema</label>
                <textarea 
                  className="w-full min-h-32 p-3 rounded-lg border border-input bg-background"
                  placeholder="Defina como o agente deve se comportar..."
                  defaultValue="Você é um assistente virtual especializado em atendimento de uma clínica de fisioterapia. Seja educado, empático e ajude os pacientes a agendar consultas."
                />
              </div>
              <div className="pt-4 border-t">
                <Button className="w-full">
                  Salvar Configurações
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-soft bg-warning/5 border-warning/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
              <div>
                <h3 className="font-semibold text-warning mb-2">Ativar Lovable AI</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Para utilizar o Agente de IA com modelos de linguagem avançados, 
                  ative o Lovable AI. Isso permitirá conversas naturais, qualificação 
                  automática de leads e agendamentos inteligentes.
                </p>
                <Button variant="outline" className="border-warning text-warning hover:bg-warning/10">
                  Ativar Lovable AI
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIAgent;
