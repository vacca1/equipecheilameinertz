import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Calendar, CreditCard, Receipt, Clock } from "lucide-react";
import { usePatientIncomes } from "@/hooks/usePatientAppointments";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PatientFinancialTabProps {
  patientName: string;
}

const paymentMethodLabels: Record<string, string> = {
  cash: "Dinheiro",
  pix: "PIX",
  debit: "Débito",
  credit: "Crédito",
  insurance: "Convênio",
  boleto: "Boleto",
  dinheiro: "Dinheiro",
};

export function PatientFinancialTab({ patientName }: PatientFinancialTabProps) {
  const { data: incomes = [], isLoading } = usePatientIncomes(patientName);

  if (isLoading) {
    return <div className="p-4 text-center text-muted-foreground">Carregando...</div>;
  }

  // Calcular totais
  const totalReceived = incomes
    .filter(i => i.payment_status === "received")
    .reduce((sum, i) => sum + Number(i.value || 0), 0);

  const totalPending = incomes
    .filter(i => i.payment_status === "pending")
    .reduce((sum, i) => sum + Number(i.value || 0), 0);

  const totalSessions = incomes.reduce((sum, i) => sum + (i.sessions_covered || 1), 0);

  const TransactionCard = ({ income }: { income: typeof incomes[0] }) => {
    const isReceived = income.payment_status === "received";

    return (
      <div className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
        <div className={`p-3 rounded-full ${isReceived ? "bg-success/10" : "bg-warning/10"}`}>
          <DollarSign className={`h-5 w-5 ${isReceived ? "text-success" : "text-warning"}`} />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold">
              Pagamento de {income.sessions_covered || 1} sessão(ões)
            </span>
            <Badge variant="outline" className="text-xs">
              {paymentMethodLabels[income.payment_method || ""] || income.payment_method || "N/A"}
            </Badge>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{format(parseISO(income.date), "dd/MM/yyyy", { locale: ptBR })}</span>
            </div>
            <div className="flex items-center gap-1">
              <Receipt className="h-3 w-3" />
              <span>{income.invoice_delivered ? "NF Entregue" : "Sem NF"}</span>
            </div>
          </div>

          {income.observations && (
            <p className="text-sm text-muted-foreground mt-1">{income.observations}</p>
          )}
        </div>

        <div className="text-right">
          <p className={`text-xl font-bold ${isReceived ? "text-success" : "text-warning"}`}>
            R$ {Number(income.value || 0).toFixed(2)}
          </p>
          <Badge className={isReceived ? "bg-success" : "bg-warning"}>
            {isReceived ? "Recebido" : "Pendente"}
          </Badge>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-success/10 rounded-full">
                <DollarSign className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Recebido</p>
                <p className="text-2xl font-bold text-success">
                  R$ {totalReceived.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-warning/10 rounded-full">
                <Clock className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendente</p>
                <p className="text-2xl font-bold text-warning">
                  R$ {totalPending.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-full">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sessões Pagas</p>
                <p className="text-2xl font-bold text-primary">{totalSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Transações */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Histórico de Pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          {incomes.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-medium text-lg">Sem pagamentos</h3>
              <p className="text-sm text-muted-foreground">
                Nenhum pagamento registrado para este paciente
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {incomes.map(income => (
                <TransactionCard key={income.id} income={income} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
