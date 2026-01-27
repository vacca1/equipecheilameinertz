

## Plano: Corrigir Sincronização das Estatísticas de Sessões Pagas

### Problema
Os cards de estatísticas no topo da aba "Presença e Financeiro" estão desconectados da realidade:
- **"Sessões Pagas: 1"** conta apenas registros de income, não considera sessões vinculadas a pacotes
- **"4 sessões pendentes"** é calculado como `presentCount - paidSessionsCount`, gerando valor incorreto
- Na verdade, as 5 sessões estão pagas via pacote (5/10 usadas)

### Causa Raiz
A variável `paidSessionsCount` (linha 795) conta registros de `incomes`, não sessões:
```typescript
const paidSessionsCount = incomes.filter((i) => i.payment_status === "received").length;
```

Mas quando o paciente compra um pacote de 10 sessões, gera **1 income** com `sessions_covered = 10`, não 10 incomes.

### Solução Proposta

#### 1. Corrigir cálculo de `paidSessionsCount`
A contagem de sessões pagas deve considerar **duas fontes**:
- **Sessões vinculadas a pacote** (`session.package_id` preenchido)
- **Sessões com pagamento individual** (via `incomes`)

```typescript
// Sessões pagas via pacote
const sessionsWithPackage = sessions.filter(s => 
  s.attendance_status === "present" && s.package_id
).length;

// Sessões pagas individualmente (soma sessions_covered dos incomes)
const sessionsFromIncomes = incomes
  .filter(i => i.payment_status === "received")
  .reduce((sum, i) => sum + (i.sessions_covered || 1), 0);

// Total de sessões "pagas" (evitando contar dobrado)
const paidSessionsCount = sessionsWithPackage + 
  Math.max(0, sessionsFromIncomes - sessionsWithPackage);
```

#### 2. Corrigir cálculo de `sessionsNeedingPayment`
O alerta de sessões pendentes deve considerar corretamente:
```typescript
// Sessões presentes sem pacote e sem pagamento individual
const unpaidPresentSessions = sessions.filter(s => {
  if (s.attendance_status !== "present") return false;
  if (s.package_id) return false; // Paga via pacote
  
  // Verificar se tem pagamento individual
  const hasPayment = incomes.some(income => 
    (income.observations?.includes(`#${s.session_number}`) || 
     income.date === s.date) && 
    income.payment_status === "received"
  );
  
  return !hasPayment;
}).length;

const sessionsNeedingPayment = unpaidPresentSessions;
```

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/patients/AttendanceControlTab.tsx` | Corrigir cálculos de `paidSessionsCount` e `sessionsNeedingPayment` |

### Resultado Esperado

Antes:
- Total: 5 | Presentes: 5 | Sessões Pagas: 1 | "4 pendentes"

Depois:
- Total: 5 | Presentes: 5 | **Sessões Pagas: 5** | **0 pendentes** (ou alerta não aparece)

### Critérios de Aceitação
- Sessões com `package_id` preenchido são contadas como "pagas"
- O alerta "X sessões sem pagamento" só aparece quando realmente há sessões presentes sem pacote e sem pagamento
- A contagem no card "Sessões Pagas" reflete a realidade
- O filtro "Pago" e "Pendente" continua funcionando corretamente

