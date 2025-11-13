import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Minus,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Filter,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { IncomeModal } from "@/components/IncomeModal";
import { ExpenseModal } from "@/components/ExpenseModal";

interface Income {
  id: string;
  date: string;
  patient: string;
  therapist: string;
  value: number;
  paymentMethod: string;
  commission: number;
  invoiceDelivered: boolean;
  paymentStatus: "paid" | "pending";
  observations?: string;
}

interface Expense {
  id: string;
  date: string;
  description: string;
  category: string;
  therapist?: string;
  value: number;
  responsible?: string;
}

interface TherapistClosing {
  name: string;
  totalSessions: number;
  totalGenerated: number;
  commissionPercentage: number;
  toReceive: number;
  alreadyPaid: number;
  balance: number;
}

const mockIncomes: Income[] = [
  {
    id: "1",
    date: "15/01/2024",
    patient: "Maria da Silva Santos",
    therapist: "Cheila",
    value: 120,
    paymentMethod: "PIX",
    commission: 72,
    invoiceDelivered: true,
    paymentStatus: "paid",
    observations: "Sessão regular"
  },
  {
    id: "2",
    date: "15/01/2024",
    patient: "João Pedro Oliveira",
    therapist: "Ana Falcão",
    value: 150,
    paymentMethod: "Dinheiro",
    commission: 97.5,
    invoiceDelivered: false,
    paymentStatus: "pending",
  },
  {
    id: "3",
    date: "14/01/2024",
    patient: "Carlos Eduardo Lima",
    therapist: "Cheila",
    value: 120,
    paymentMethod: "Débito",
    commission: 72,
    invoiceDelivered: true,
    paymentStatus: "paid",
  },
  {
    id: "4",
    date: "14/01/2024",
    patient: "Ana Carolina Souza",
    therapist: "Grazii",
    value: 100,
    paymentMethod: "PIX",
    commission: 55,
    invoiceDelivered: true,
    paymentStatus: "paid",
  },
  {
    id: "5",
    date: "13/01/2024",
    patient: "Patricia Mendes Costa",
    therapist: "Ana Falcão",
    value: 150,
    paymentMethod: "Crédito",
    commission: 97.5,
    invoiceDelivered: true,
    paymentStatus: "paid",
  },
];

const mockExpenses: Expense[] = [
  {
    id: "1",
    date: "14/01/2024",
    description: "Repasse de comissão - Semana 1",
    category: "Repasse de comissão",
    therapist: "Cheila",
    value: 1200,
    responsible: "Administrador"
  },
  {
    id: "2",
    date: "12/01/2024",
    description: "Conta de Luz - Janeiro",
    category: "Despesas operacionais",
    value: 450,
    responsible: "Administrador"
  },
  {
    id: "3",
    date: "10/01/2024",
    description: "Material de fisioterapia",
    category: "Materiais e equipamentos",
    value: 380,
    responsible: "Grazii"
  },
  {
    id: "4",
    date: "09/01/2024",
    description: "Internet - Janeiro",
    category: "Despesas operacionais",
    value: 150,
    responsible: "Administrador"
  },
];

const mockTherapists: TherapistClosing[] = [
  {
    name: "Ana Falcão",
    totalSessions: 28,
    totalGenerated: 4200,
    commissionPercentage: 65,
    toReceive: 2730,
    alreadyPaid: 2400,
    balance: 330,
  },
  {
    name: "Cheila",
    totalSessions: 32,
    totalGenerated: 3840,
    commissionPercentage: 60,
    toReceive: 2304,
    alreadyPaid: 2100,
    balance: 204,
  },
  {
    name: "Grazii",
    totalSessions: 24,
    totalGenerated: 2400,
    commissionPercentage: 55,
    toReceive: 1320,
    alreadyPaid: 1200,
    balance: 120,
  },
];

export default function CashFlow() {
  const [period, setPeriod] = useState("week");
  const [incomeModalOpen, setIncomeModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [filterTherapist, setFilterTherapist] = useState("all");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState("all");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState("all");
  const [filterExpenseCategory, setFilterExpenseCategory] = useState("all");

  const filteredIncomes = mockIncomes.filter((income) => {
    const matchesTherapist = filterTherapist === "all" || income.therapist === filterTherapist;
    const matchesPaymentMethod = filterPaymentMethod === "all" || income.paymentMethod === filterPaymentMethod;
    const matchesStatus = filterPaymentStatus === "all" || income.paymentStatus === filterPaymentStatus;
    return matchesTherapist && matchesPaymentMethod && matchesStatus;
  });

  const filteredExpenses = mockExpenses.filter((expense) => {
    const matchesCategory = filterExpenseCategory === "all" || expense.category === filterExpenseCategory;
    return matchesCategory;
  });

  const totalIncome = filteredIncomes.reduce((sum, income) => sum + income.value, 0);
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.value, 0);
  const balance = totalIncome - totalExpenses;
  const pendingPayments = filteredIncomes
    .filter((i) => i.paymentStatus === "pending")
    .reduce((sum, income) => sum + income.value, 0);

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      pix: "PIX",
      cash: "Dinheiro",
      debit: "Débito",
      credit: "Crédito",
      insurance: "Convênio",
      boleto: "Boleto",
    };
    return labels[method.toLowerCase()] || method;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      commission: "Repasse de comissão",
      refund: "Reembolso de paciente",
      operational: "Despesas operacionais",
      materials: "Materiais e equipamentos",
      bank_fees: "Taxas bancárias",
      invoice_cost: "Nota fiscal (custo)",
      others: "Outros",
    };
    return labels[category.toLowerCase()] || category;
  };

  return (
    <div className="space-y-6">
      {/* Header with Icon */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl shadow-soft">
            <DollarSign className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Controle de Caixa
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Entradas, saídas e fechamento por fisioterapeuta
            </p>
          </div>
        </div>
        <Button variant="outline" className="shadow-soft">
          <FileText className="w-4 h-4 mr-2" />
          Exportar Relatório
        </Button>
      </div>

      {/* Seletor de Período */}
      <div className="flex gap-2 flex-wrap">
        {["Hoje", "Esta Semana", "Este Mês", "Personalizado"].map((p) => (
          <Button
            key={p}
            variant={period === p.toLowerCase().replace(" ", "-") ? "default" : "outline"}
            onClick={() => setPeriod(p.toLowerCase().replace(" ", "-"))}
          >
            {p}
          </Button>
        ))}
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-success/10 to-success/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Entradas
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">
              R$ {totalIncome.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <TrendingDown className="w-5 h-5 text-destructive" />
              </div>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Saídas
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">
              R$ {totalExpenses.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Saldo do Período
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              R$ {balance.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-warning/10 to-warning/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pagamentos Pendentes
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warning">
              R$ {pendingPayments.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botões de Ação */}
      <div className="flex gap-2">
        <Button onClick={() => setIncomeModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Entrada
        </Button>
        <Button variant="destructive" onClick={() => setExpenseModalOpen(true)}>
          <Minus className="w-4 h-4 mr-2" />
          Adicionar Saída
        </Button>
      </div>

      {/* Tabelas */}
      <Tabs defaultValue="income" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="income">Entradas</TabsTrigger>
          <TabsTrigger value="expenses">Saídas</TabsTrigger>
          <TabsTrigger value="therapists">Fechamento por Fisioterapeuta</TabsTrigger>
        </TabsList>

        <TabsContent value="income" className="mt-6 space-y-4">
          {/* Filtros */}
          <div className="flex gap-2 flex-wrap">
            <Select value={filterTherapist} onValueChange={setFilterTherapist}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Fisioterapeuta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="Ana Falcão">Ana Falcão</SelectItem>
                <SelectItem value="Cheila">Cheila</SelectItem>
                <SelectItem value="Grazii">Grazii</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPaymentMethod} onValueChange={setFilterPaymentMethod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Forma Pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="PIX">PIX</SelectItem>
                <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                <SelectItem value="Débito">Débito</SelectItem>
                <SelectItem value="Crédito">Crédito</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPaymentStatus} onValueChange={setFilterPaymentStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabela de Entradas */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Fisioterapeuta</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Comissão</TableHead>
                  <TableHead>NF</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIncomes.map((income) => (
                  <TableRow key={income.id}>
                    <TableCell>{income.date}</TableCell>
                    <TableCell className="font-medium">{income.patient}</TableCell>
                    <TableCell>{income.therapist}</TableCell>
                    <TableCell className="font-semibold text-success">
                      R$ {income.value.toFixed(2)}
                    </TableCell>
                    <TableCell>{getPaymentMethodLabel(income.paymentMethod)}</TableCell>
                    <TableCell>R$ {income.commission.toFixed(2)}</TableCell>
                    <TableCell>
                      {income.invoiceDelivered ? (
                        <Badge variant="default" className="bg-success">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Sim
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Não
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {income.paymentStatus === "paid" ? (
                        <Badge variant="default" className="bg-success">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Pago
                        </Badge>
                      ) : (
                        <Badge variant="warning">
                          <Clock className="h-3 w-3 mr-1" />
                          Pendente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="mt-6 space-y-4">
          {/* Filtros */}
          <div className="flex gap-2">
            <Select value={filterExpenseCategory} onValueChange={setFilterExpenseCategory}>
              <SelectTrigger className="w-[220px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="Repasse de comissão">Repasse de comissão</SelectItem>
                <SelectItem value="Despesas operacionais">Despesas operacionais</SelectItem>
                <SelectItem value="Materiais e equipamentos">Materiais e equipamentos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabela de Saídas */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Fisio Vinculada</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{expense.date}</TableCell>
                    <TableCell className="font-medium">{expense.description}</TableCell>
                    <TableCell>{expense.category}</TableCell>
                    <TableCell>{expense.responsible || "-"}</TableCell>
                    <TableCell>{expense.therapist || "-"}</TableCell>
                    <TableCell className="font-semibold text-destructive">
                      R$ {expense.value.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="therapists" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockTherapists.map((therapist) => (
              <Card key={therapist.name}>
                <CardHeader>
                  <CardTitle className="text-xl">{therapist.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total de Sessões</span>
                    <span className="font-semibold">{therapist.totalSessions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Valor Total Gerado</span>
                    <span className="font-semibold text-success">
                      R$ {therapist.totalGenerated.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">% de Repasse</span>
                    <span className="font-semibold">{therapist.commissionPercentage}%</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-sm font-medium">Valor a Receber</span>
                    <span className="font-bold text-primary">
                      R$ {therapist.toReceive.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Já Pago</span>
                    <span className="font-semibold">
                      R$ {therapist.alreadyPaid.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-sm font-medium">Saldo Devedor</span>
                    <span className={`font-bold ${therapist.balance > 0 ? 'text-warning' : 'text-success'}`}>
                      R$ {therapist.balance.toFixed(2)}
                    </span>
                  </div>
                  <Button className="w-full mt-4" onClick={() => setExpenseModalOpen(true)}>
                    Registrar Repasse
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <IncomeModal
        open={incomeModalOpen}
        onOpenChange={setIncomeModalOpen}
        onSave={(data) => console.log("Entrada salva:", data)}
      />

      <ExpenseModal
        open={expenseModalOpen}
        onOpenChange={setExpenseModalOpen}
        onSave={(data) => console.log("Saída salva:", data)}
      />
    </div>
  );
}
