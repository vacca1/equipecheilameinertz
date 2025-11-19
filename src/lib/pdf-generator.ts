import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Income {
  date: string;
  patient_name: string;
  therapist: string;
  value: number;
  payment_method?: string;
  payment_status?: string;
}

interface Expense {
  date: string;
  description: string;
  category: string;
  value: number;
  responsible?: string;
}

export const generateCashFlowPDF = (
  incomes: Income[],
  expenses: Expense[],
  period: string,
  filters?: {
    therapist?: string;
    paymentMethod?: string;
    paymentStatus?: string;
    expenseCategory?: string;
  }
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(20);
  doc.text("Relatório de Fluxo de Caixa", pageWidth / 2, 15, { align: "center" });
  
  doc.setFontSize(10);
  doc.text(`Período: ${period}`, pageWidth / 2, 22, { align: "center" });
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, pageWidth / 2, 27, { align: "center" });

  // Summary
  const totalIncome = incomes.reduce((sum, i) => sum + Number(i.value), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.value), 0);
  const balance = totalIncome - totalExpenses;

  let yPos = 35;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Resumo Financeiro:", 14, yPos);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  yPos += 7;
  doc.text(`Total de Entradas: R$ ${totalIncome.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 14, yPos);
  yPos += 5;
  doc.text(`Total de Saídas: R$ ${totalExpenses.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 14, yPos);
  yPos += 5;
  doc.setFont("helvetica", "bold");
  doc.text(`Saldo: R$ ${balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 14, yPos);
  
  yPos += 10;

  // Income Table
  if (incomes.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Entradas", 14, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [["Data", "Paciente", "Fisioterapeuta", "Valor", "Método", "Status"]],
      body: incomes.map((income) => [
        format(new Date(income.date), "dd/MM/yyyy"),
        income.patient_name,
        income.therapist,
        `R$ ${Number(income.value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        income.payment_method || "-",
        income.payment_status || "-",
      ]),
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [34, 197, 94] },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Expense Table
  if (expenses.length > 0) {
    if (yPos > 250) {
      doc.addPage();
      yPos = 15;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Saídas", 14, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [["Data", "Descrição", "Categoria", "Valor", "Responsável"]],
      body: expenses.map((expense) => [
        format(new Date(expense.date), "dd/MM/yyyy"),
        expense.description,
        expense.category,
        `R$ ${Number(expense.value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        expense.responsible || "-",
      ]),
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [239, 68, 68] },
    });
  }

  doc.save(`fluxo-caixa-${format(new Date(), "yyyy-MM-dd")}.pdf`);
};

export const generateReportPDF = (
  data: any,
  type: "semanal" | "mensal" | "fisioterapeuta",
  therapistName?: string
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(20);
  const title = type === "semanal" 
    ? "Relatório Semanal" 
    : type === "mensal" 
    ? "Relatório Mensal" 
    : `Relatório - ${therapistName}`;
  
  doc.text(title, pageWidth / 2, 15, { align: "center" });
  
  doc.setFontSize(10);
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, pageWidth / 2, 22, { align: "center" });

  let yPos = 35;

  // Summary metrics
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Métricas Principais:", 14, yPos);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  yPos += 7;
  doc.text(`Faturamento Total: R$ ${data.totalRevenue?.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) || "0,00"}`, 14, yPos);
  yPos += 5;
  doc.text(`Total de Sessões: ${data.totalSessions || 0}`, 14, yPos);
  yPos += 5;
  doc.text(`Taxa de Ocupação: ${data.occupancyRate || 0}%`, 14, yPos);
  yPos += 5;
  doc.text(`Pagamentos Pendentes: R$ ${data.pendingPayments?.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) || "0,00"}`, 14, yPos);

  yPos += 15;

  // Revenue distribution by therapist
  if (data.revenueDistribution && data.revenueDistribution.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Distribuição por Fisioterapeuta", 14, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [["Fisioterapeuta", "Valor", "Percentual"]],
      body: data.revenueDistribution.map((item: any) => [
        item.name,
        `R$ ${item.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        `${item.percentage}%`,
      ]),
      theme: "grid",
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] },
    });
  }

  doc.save(`relatorio-${type}-${format(new Date(), "yyyy-MM-dd")}.pdf`);
};
