import { useState } from "react";
import { Plus, Minus, FileText, TrendingUp, TrendingDown, DollarSign, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CashFlow = () => {
  const [period, setPeriod] = useState("week");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Controle de Caixa</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="shadow-soft">
            <FileText className="w-4 h-4 mr-2" />
            Exportar Relatório
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2">
        {["Hoje", "Esta Semana", "Este Mês", "Personalizado"].map((p) => (
          <Button
            key={p}
            variant={period === p.toLowerCase().replace(" ", "-") ? "default" : "outline"}
            onClick={() => setPeriod(p.toLowerCase().replace(" ", "-"))}
            className="shadow-soft"
          >
            {p}
          </Button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-6 shadow-soft bg-gradient-to-br from-success/10 to-success/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-success/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <div className="text-sm text-muted-foreground">Total de Entradas</div>
          </div>
          <div className="text-3xl font-bold text-success">R$ 5.240,00</div>
        </Card>

        <Card className="p-6 shadow-soft bg-gradient-to-br from-destructive/10 to-destructive/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <TrendingDown className="w-5 h-5 text-destructive" />
            </div>
            <div className="text-sm text-muted-foreground">Total de Saídas</div>
          </div>
          <div className="text-3xl font-bold text-destructive">R$ 2.820,00</div>
        </Card>

        <Card className="p-6 shadow-soft bg-gradient-to-br from-primary/10 to-primary/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <div className="text-sm text-muted-foreground">Saldo do Período</div>
          </div>
          <div className="text-3xl font-bold text-primary">R$ 2.420,00</div>
        </Card>

        <Card className="p-6 shadow-soft bg-gradient-to-br from-warning/10 to-warning/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-warning/10 rounded-lg">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div className="text-sm text-muted-foreground">Pagamentos Pendentes</div>
          </div>
          <div className="text-3xl font-bold text-warning">R$ 450,00</div>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button className="shadow-soft">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Entrada
        </Button>
        <Button variant="destructive" className="shadow-soft">
          <Minus className="w-4 h-4 mr-2" />
          Adicionar Saída
        </Button>
      </div>

      {/* Tables */}
      <Tabs defaultValue="income" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="income">Entradas</TabsTrigger>
          <TabsTrigger value="expenses">Saídas</TabsTrigger>
          <TabsTrigger value="therapists">Fechamento por Fisioterapeuta</TabsTrigger>
        </TabsList>

        <TabsContent value="income" className="mt-6">
          <Card className="overflow-hidden shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-3 text-left text-sm font-semibold">Data</th>
                    <th className="p-3 text-left text-sm font-semibold">Paciente</th>
                    <th className="p-3 text-left text-sm font-semibold">Fisioterapeuta</th>
                    <th className="p-3 text-left text-sm font-semibold">Valor</th>
                    <th className="p-3 text-left text-sm font-semibold">Pagamento</th>
                    <th className="p-3 text-left text-sm font-semibold">Comissão</th>
                    <th className="p-3 text-left text-sm font-semibold">NF</th>
                    <th className="p-3 text-left text-sm font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border hover:bg-muted/50">
                    <td className="p-3 text-sm">05/01/2024</td>
                    <td className="p-3 text-sm font-medium">Maria Silva</td>
                    <td className="p-3 text-sm">Cheila</td>
                    <td className="p-3 text-sm font-semibold text-success">R$ 100,00</td>
                    <td className="p-3 text-sm">PIX</td>
                    <td className="p-3 text-sm">R$ 60,00</td>
                    <td className="p-3">
                      <Badge variant="default">Sim</Badge>
                    </td>
                    <td className="p-3">
                      <Badge variant="default">Pago</Badge>
                    </td>
                  </tr>
                  <tr className="border-t border-border hover:bg-muted/50">
                    <td className="p-3 text-sm">05/01/2024</td>
                    <td className="p-3 text-sm font-medium">João Santos</td>
                    <td className="p-3 text-sm">Ana Falcão</td>
                    <td className="p-3 text-sm font-semibold text-success">R$ 120,00</td>
                    <td className="p-3 text-sm">Dinheiro</td>
                    <td className="p-3 text-sm">R$ 72,00</td>
                    <td className="p-3">
                      <Badge variant="outline">Não</Badge>
                    </td>
                    <td className="p-3">
                      <Badge variant="warning">Pendente</Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="mt-6">
          <Card className="overflow-hidden shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-3 text-left text-sm font-semibold">Data</th>
                    <th className="p-3 text-left text-sm font-semibold">Descrição</th>
                    <th className="p-3 text-left text-sm font-semibold">Categoria</th>
                    <th className="p-3 text-left text-sm font-semibold">Fisio Vinculada</th>
                    <th className="p-3 text-left text-sm font-semibold">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border hover:bg-muted/50">
                    <td className="p-3 text-sm">04/01/2024</td>
                    <td className="p-3 text-sm font-medium">Repasse de Comissão</td>
                    <td className="p-3 text-sm">Repasse de comissão</td>
                    <td className="p-3 text-sm">Cheila</td>
                    <td className="p-3 text-sm font-semibold text-destructive">R$ 1.200,00</td>
                  </tr>
                  <tr className="border-t border-border hover:bg-muted/50">
                    <td className="p-3 text-sm">03/01/2024</td>
                    <td className="p-3 text-sm font-medium">Conta de Luz</td>
                    <td className="p-3 text-sm">Despesas operacionais</td>
                    <td className="p-3 text-sm">-</td>
                    <td className="p-3 text-sm font-semibold text-destructive">R$ 350,00</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="therapists" className="mt-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {["Ana Falcão", "Cheila", "Grazii"].map((therapist) => (
              <Card key={therapist} className="p-6 shadow-soft">
                <h3 className="text-xl font-bold mb-4">{therapist}</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total de Sessões</span>
                    <span className="font-semibold">24</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Valor Total Gerado</span>
                    <span className="font-semibold text-success">R$ 2.400,00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">% de Repasse</span>
                    <span className="font-semibold">60%</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border">
                    <span className="text-sm font-medium">Valor a Receber</span>
                    <span className="font-bold text-primary">R$ 1.440,00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Já Pago</span>
                    <span className="font-semibold">R$ 1.200,00</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border">
                    <span className="text-sm font-medium">Saldo Devedor</span>
                    <span className="font-bold text-destructive">R$ 240,00</span>
                  </div>
                  <Button className="w-full mt-4 shadow-soft">Registrar Repasse</Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CashFlow;
