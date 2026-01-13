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
  Download,
  CalendarIcon,
} from "lucide-react";
import { IncomeModal } from "@/components/IncomeModal";
import { ExpenseModal } from "@/components/ExpenseModal";
import { useIncomes, useDeleteIncome } from "@/hooks/useIncomes";
import { useExpenses, useDeleteExpense } from "@/hooks/useExpenses";
import { format, subDays } from "date-fns";
import { generateCashFlowPDF } from "@/lib/pdf-generator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
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

// Mock data removed - using real data from database

export default function CashFlow() {
  const [period, setPeriod] = useState("week");
  const [incomeModalOpen, setIncomeModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<any>(null);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [filterTherapist, setFilterTherapist] = useState("all");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState("all");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState("all");
  const [filterExpenseCategory, setFilterExpenseCategory] = useState("all");
  const [customPeriod, setCustomPeriod] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();
  const [deleteIncomeId, setDeleteIncomeId] = useState<string | null>(null);
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null);

  // Calculate date range based on period
  const endDate = customEndDate 
    ? format(customEndDate, "yyyy-MM-dd")
    : format(new Date(), "yyyy-MM-dd");
  const startDate = customStartDate
    ? format(customStartDate, "yyyy-MM-dd")
    : format(
        period === "week" ? subDays(new Date(), 7) : subDays(new Date(), 30),
        "yyyy-MM-dd"
      );

  // Fetch data from database
  const { data: incomes = [], isLoading: loadingIncomes } = useIncomes(startDate, endDate, filterTherapist !== "all" ? filterTherapist : undefined);
  const { data: expenses = [], isLoading: loadingExpenses } = useExpenses(startDate, endDate, filterExpenseCategory !== "all" ? filterExpenseCategory : undefined);
  
  // Delete mutations
  const deleteIncomeMutation = useDeleteIncome();
  const deleteExpenseMutation = useDeleteExpense();

  // Filter incomes
  const filteredIncomes = incomes.filter((income) => {
    const matchesPaymentMethod = filterPaymentMethod === "all" || income.payment_method === filterPaymentMethod;
    const matchesStatus = filterPaymentStatus === "all" || income.payment_status === filterPaymentStatus;
    return matchesPaymentMethod && matchesStatus;
  });

  // All expenses are already filtered by category in the hook
  const filteredExpenses = expenses;

  // Calculate totals
  const totalIncome = filteredIncomes.reduce((sum, income) => sum + Number(income.value), 0);
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + Number(expense.value), 0);
  const balance = totalIncome - totalExpenses;
  const pendingPayments = filteredIncomes
    .filter((i) => i.payment_status === "pending")
    .reduce((sum, income) => sum + Number(income.value), 0);

  // Calculate therapist closings
  const therapistNames = [...new Set(incomes.map(i => i.therapist))];
  const mockTherapists = therapistNames.map(name => {
    const therapistIncomes = incomes.filter(i => i.therapist === name);
    const totalGenerated = therapistIncomes.reduce((sum, i) => sum + Number(i.value), 0);
    const toReceive = therapistIncomes.reduce((sum, i) => sum + Number(i.commission_value || 0), 0);
    const alreadyPaid = expenses
      .filter(e => e.category === "Repasse de comissão" && e.therapist === name)
      .reduce((sum, e) => sum + Number(e.value), 0);
    
    return {
      name,
      totalSessions: therapistIncomes.length,
      totalGenerated,
      commissionPercentage: therapistIncomes[0]?.commission_percentage || 60,
      toReceive,
      alreadyPaid,
      balance: toReceive - alreadyPaid,
    };
  });

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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">Controle de Caixa</h1>
          <p className="page-subtitle">
            Entradas, saídas e fechamento por fisioterapeuta
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => {
            const periodLabel = customPeriod && customStartDate && customEndDate
              ? `${format(customStartDate, "dd/MM/yyyy")} - ${format(customEndDate, "dd/MM/yyyy")}`
              : period === "week" ? "Última Semana" : "Último Mês";
            
            generateCashFlowPDF(filteredIncomes, filteredExpenses, periodLabel);
          }}
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar Relatório
        </Button>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2 flex-wrap">
        <div className="inline-flex h-10 items-center gap-1 rounded-xl bg-muted/50 p-1">
          <Button
            variant={!customPeriod && period === "week" ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              setPeriod("week");
              setCustomPeriod(false);
            }}
            className="rounded-lg"
          >
            Esta Semana
          </Button>
          <Button
            variant={!customPeriod && period === "month" ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              setPeriod("month");
              setCustomPeriod(false);
            }}
            className="rounded-lg"
          >
            Este Mês
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant={customPeriod ? "default" : "ghost"} size="sm" className="rounded-lg">
                <CalendarIcon className="mr-2 h-4 w-4" />
                Personalizado
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-4 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Data Inicial</label>
                  <Calendar
                    mode="single"
                    selected={customStartDate}
                    onSelect={(date) => {
                      setCustomStartDate(date);
                      if (date) setCustomPeriod(true);
                    }}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Data Final</label>
                  <Calendar
                    mode="single"
                    selected={customEndDate}
                    onSelect={(date) => {
                      setCustomEndDate(date);
                      if (date && customStartDate) setCustomPeriod(true);
                    }}
                    className="pointer-events-auto"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-success/10 rounded-xl">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <span className="metric-label">Total de Entradas</span>
          </div>
          <div className="metric-value text-success">
            R$ {totalIncome.toFixed(2)}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-destructive/10 rounded-xl">
              <TrendingDown className="w-5 h-5 text-destructive" />
            </div>
            <span className="metric-label">Total de Saídas</span>
          </div>
          <div className="metric-value text-destructive">
            R$ {totalExpenses.toFixed(2)}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <span className="metric-label">Saldo do Período</span>
          </div>
          <div className={cn("metric-value", balance >= 0 ? "text-success" : "text-destructive")}>
            R$ {balance.toFixed(2)}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-warning/10 rounded-xl">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <span className="metric-label">Pagamentos Pendentes</span>
          </div>
          <div className="metric-value text-warning">
            R$ {pendingPayments.toFixed(2)}
          </div>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button onClick={() => setIncomeModalOpen(true)} className="shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Entrada
        </Button>
        <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setExpenseModalOpen(true)}>
          <Minus className="w-4 h-4 mr-2" />
          Adicionar Saída
        </Button>
      </div>

      {/* Tables */}
      <Tabs defaultValue="income" className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="income" className="flex-1 sm:flex-none">
            Entradas
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex-1 sm:flex-none">
            Saídas
          </TabsTrigger>
          <TabsTrigger value="therapists" className="flex-1 sm:flex-none">
            <span className="hidden sm:inline">Fechamento por Fisioterapeuta</span>
            <span className="sm:hidden">Fechamento</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="income" className="mt-6 space-y-6">
          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <Select value={filterTherapist} onValueChange={setFilterTherapist}>
              <SelectTrigger className="w-[180px] bg-card">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
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
              <SelectTrigger className="w-[180px] bg-card">
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
              <SelectTrigger className="w-[180px] bg-card">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Income Table */}
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Data</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Fisioterapeuta</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Comissão</TableHead>
                  <TableHead>NF</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIncomes.map((income) => (
                  <TableRow key={income.id}>
                    <TableCell>{format(new Date(income.date), "dd/MM/yyyy")}</TableCell>
                    <TableCell className="font-medium">{income.patient_name}</TableCell>
                    <TableCell>{income.therapist}</TableCell>
                    <TableCell className="font-semibold text-success">
                      R$ {Number(income.value).toFixed(2)}
                    </TableCell>
                    <TableCell>{income.payment_method}</TableCell>
                    <TableCell>R$ {Number(income.commission_value || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      {income.invoice_delivered ? (
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
                      {income.payment_status === "received" ? (
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
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedIncome(income);
                            setIncomeModalOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setDeleteIncomeId(income.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
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
                    <TableCell>{format(new Date(expense.date), "dd/MM/yyyy")}</TableCell>
                    <TableCell className="font-medium">{expense.description}</TableCell>
                    <TableCell>{expense.category}</TableCell>
                    <TableCell>{expense.responsible || "-"}</TableCell>
                    <TableCell>{expense.therapist || "-"}</TableCell>
                    <TableCell className="font-semibold text-destructive">
                      R$ {Number(expense.value).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedExpense(expense);
                            setExpenseModalOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setDeleteExpenseId(expense.id)}
                        >
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

      <IncomeModal 
        open={incomeModalOpen}
        onOpenChange={(open) => {
          setIncomeModalOpen(open);
          if (!open) setSelectedIncome(null);
        }}
        income={selectedIncome}
      />
      <ExpenseModal 
        open={expenseModalOpen}
        onOpenChange={(open) => {
          setExpenseModalOpen(open);
          if (!open) setSelectedExpense(null);
        }}
        expense={selectedExpense}
      />

      {/* AlertDialog para deletar entrada */}
      <AlertDialog open={!!deleteIncomeId} onOpenChange={(open) => !open && setDeleteIncomeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta entrada? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (deleteIncomeId) {
                  deleteIncomeMutation.mutate(deleteIncomeId);
                  setDeleteIncomeId(null);
                }
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog para deletar despesa */}
      <AlertDialog open={!!deleteExpenseId} onOpenChange={(open) => !open && setDeleteExpenseId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta despesa? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (deleteExpenseId) {
                  deleteExpenseMutation.mutate(deleteExpenseId);
                  setDeleteExpenseId(null);
                }
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
