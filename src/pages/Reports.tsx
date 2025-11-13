import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, TrendingUp, Users, DollarSign, Calendar } from "lucide-react";

const Reports = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
        <Button className="shadow-soft">
          <Download className="w-4 h-4 mr-2" />
          Exportar Relatório Completo
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-6 shadow-soft">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div className="text-sm text-muted-foreground">Atendimentos (Mês)</div>
          </div>
          <div className="text-3xl font-bold">124</div>
        </Card>

        <Card className="p-6 shadow-soft">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-success/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <div className="text-sm text-muted-foreground">Faturamento (Mês)</div>
          </div>
          <div className="text-3xl font-bold text-success">R$ 12.400</div>
        </Card>

        <Card className="p-6 shadow-soft">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-warning/10 rounded-lg">
              <Users className="w-5 h-5 text-warning" />
            </div>
            <div className="text-sm text-muted-foreground">Pacientes Ativos</div>
          </div>
          <div className="text-3xl font-bold">48</div>
        </Card>

        <Card className="p-6 shadow-soft">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <DollarSign className="w-5 h-5 text-destructive" />
            </div>
            <div className="text-sm text-muted-foreground">Pendências</div>
          </div>
          <div className="text-3xl font-bold text-destructive">R$ 840</div>
        </Card>
      </div>

      {/* Pendencies */}
      <Card className="p-6 shadow-soft">
        <h2 className="text-xl font-bold mb-4">Lista de Pendências</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2 text-destructive">Pagamentos Pendentes</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-destructive/5 rounded-lg">
                <div>
                  <div className="font-medium">João Santos</div>
                  <div className="text-sm text-muted-foreground">3 dias de atraso</div>
                </div>
                <div className="font-bold text-destructive">R$ 120,00</div>
              </div>
              <div className="flex items-center justify-between p-3 bg-destructive/5 rounded-lg">
                <div>
                  <div className="font-medium">Ana Costa</div>
                  <div className="text-sm text-muted-foreground">1 dia de atraso</div>
                </div>
                <div className="font-bold text-destructive">R$ 100,00</div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2 text-warning">Repasses Não Realizados</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-warning/5 rounded-lg">
                <div>
                  <div className="font-medium">Cheila</div>
                  <div className="text-sm text-muted-foreground">Saldo devedor</div>
                </div>
                <div className="font-bold text-warning">R$ 240,00</div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2 text-primary">Notas Fiscais Não Emitidas</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
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
