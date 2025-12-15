# Integração API de Agendamentos com N8N

Este documento descreve como integrar o sistema de agendamentos do CRM Cheila Meinertz com N8N via Evolution API.

## 📋 Sumário

1. [Configuração Inicial](#configuração-inicial)
2. [Endpoints Disponíveis](#endpoints-disponíveis)
3. [Exemplos de Uso no N8N](#exemplos-de-uso-no-n8n)
4. [Fluxos Comuns](#fluxos-comuns)
5. [Tratamento de Erros](#tratamento-de-erros)

---

## 🔧 Configuração Inicial

### 1. Deploy das Edge Functions no Supabase

```bash
# Instalar Supabase CLI se ainda não tiver
npm install -g supabase

# Login no Supabase
supabase login

# Link com o projeto
supabase link --project-ref xtavanhzrbejykvikwua

# Deploy das funções
supabase functions deploy check-availability
supabase functions deploy create-appointment
supabase functions deploy list-appointments
supabase functions deploy manage-appointment
```

### 2. Obter as Credenciais

Você precisará de:
- **SUPABASE_URL**: `https://xtavanhzrbejykvikwua.supabase.co`
- **SUPABASE_ANON_KEY**: Chave pública do Supabase (já configurada no .env)
- **SUPABASE_SERVICE_ROLE_KEY**: Chave privada (disponível no painel do Supabase)

⚠️ **IMPORTANTE**: Use a SERVICE_ROLE_KEY apenas no backend/N8N, nunca exponha no frontend!

---

## 🌐 Endpoints Disponíveis

Base URL: `https://xtavanhzrbejykvikwua.supabase.co/functions/v1`

### 1. Consultar Disponibilidade

**Endpoint**: `POST /check-availability`

**Descrição**: Verifica quais horários estão disponíveis em uma data específica.

**Request Body**:
```json
{
  "date": "2025-12-20",
  "therapist": "Cheila Meinertz",
  "duration": 60
}
```

**Parâmetros**:
- `date` (obrigatório): Data no formato YYYY-MM-DD
- `therapist` (opcional): Nome do terapeuta. Se omitido, verifica todos
- `duration` (opcional): Duração em minutos. Padrão: 60

**Response**:
```json
{
  "date": "2025-12-20",
  "therapist": "Cheila Meinertz",
  "duration": 60,
  "availableSlots": [
    "06:30",
    "07:00",
    "07:30",
    "08:00",
    "14:00",
    "14:30"
  ],
  "totalAvailable": 6,
  "occupiedSlots": 15
}
```

---

### 2. Criar Agendamento

**Endpoint**: `POST /create-appointment`

**Descrição**: Cria um novo agendamento no sistema.

**Request Body**:
```json
{
  "patient_name": "João Silva",
  "date": "2025-12-20",
  "time": "14:00",
  "therapist": "Cheila Meinertz",
  "duration": 60,
  "patient_id": null,
  "room": "Sala 1",
  "status": "confirmed",
  "notes": "Paciente relatou dores nas costas",
  "is_first_session": false,
  "repeat_weekly": false,
  "repeat_until": null
}
```

**Parâmetros Obrigatórios**:
- `patient_name`: Nome do paciente
- `date`: Data no formato YYYY-MM-DD
- `time`: Hora no formato HH:MM (ex: "14:00")
- `therapist`: Nome do terapeuta

**Parâmetros Opcionais**:
- `duration`: Duração em minutos (padrão: 60)
- `patient_id`: UUID do paciente (se existir no sistema)
- `room`: Sala do atendimento
- `status`: Status do agendamento (confirmed, pending, blocked, cancelled)
- `notes`: Observações
- `is_first_session`: Se é primeira sessão (boolean)
- `repeat_weekly`: Se repete semanalmente (boolean)
- `repeat_until`: Data final da repetição (YYYY-MM-DD)

**Response Success**:
```json
{
  "success": true,
  "appointment": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "patient_name": "João Silva",
    "date": "2025-12-20",
    "time": "14:00",
    "therapist": "Cheila Meinertz",
    "status": "confirmed"
  },
  "message": "Agendamento criado com sucesso"
}
```

**Response Error (Conflito)**:
```json
{
  "error": "Horário indisponível",
  "details": "Já existe um agendamento neste horário",
  "conflicts": [
    {
      "id": "...",
      "patient_name": "Maria Santos",
      "time": "14:00",
      "duration": 60
    }
  ]
}
```

---

### 3. Listar Agendamentos

**Endpoint**: `GET /list-appointments`

**Descrição**: Lista agendamentos com filtros opcionais.

**Query Parameters**:
```
?date=2025-12-20
&therapist=Cheila Meinertz
&status=confirmed
&patient_name=João
&start_date=2025-12-01
&end_date=2025-12-31
&limit=100
```

**Parâmetros** (todos opcionais):
- `date`: Data específica
- `start_date`: Data inicial do período
- `end_date`: Data final do período
- `therapist`: Filtrar por terapeuta
- `patient_name`: Buscar por nome do paciente (parcial)
- `status`: Filtrar por status
- `limit`: Limite de resultados (padrão: 100)

**Response**:
```json
{
  "success": true,
  "appointments": [
    {
      "id": "...",
      "patient_name": "João Silva",
      "date": "2025-12-20",
      "time": "14:00",
      "duration": 60,
      "therapist": "Cheila Meinertz",
      "status": "confirmed",
      "notes": "...",
      "created_at": "2025-12-15T10:00:00Z"
    }
  ],
  "total": 1,
  "filters": {
    "date": "2025-12-20",
    "therapist": "Cheila Meinertz"
  }
}
```

---

### 4. Gerenciar Agendamento (Buscar/Atualizar/Cancelar)

**Endpoint**: `/manage-appointment?id={appointment_id}`

#### 4.1 Buscar um agendamento específico

**Method**: `GET`

**URL**: `/manage-appointment?id=123e4567-e89b-12d3-a456-426614174000`

**Response**:
```json
{
  "success": true,
  "appointment": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "patient_name": "João Silva",
    "date": "2025-12-20",
    "time": "14:00",
    "therapist": "Cheila Meinertz",
    "status": "confirmed"
  }
}
```

#### 4.2 Atualizar agendamento

**Method**: `PUT` ou `PATCH`

**URL**: `/manage-appointment?id=123e4567-e89b-12d3-a456-426614174000`

**Request Body** (envie apenas os campos que deseja atualizar):
```json
{
  "date": "2025-12-21",
  "time": "15:00",
  "status": "pending",
  "notes": "Paciente pediu para remarcar"
}
```

**Response**:
```json
{
  "success": true,
  "appointment": {
    "id": "...",
    "patient_name": "João Silva",
    "date": "2025-12-21",
    "time": "15:00",
    "status": "pending"
  },
  "message": "Agendamento atualizado com sucesso"
}
```

#### 4.3 Cancelar agendamento (soft delete)

**Method**: `DELETE`

**URL**: `/manage-appointment?id=123e4567-e89b-12d3-a456-426614174000&soft=true`

**Response**:
```json
{
  "success": true,
  "appointment": {
    "id": "...",
    "status": "cancelled"
  },
  "message": "Agendamento cancelado com sucesso"
}
```

#### 4.4 Deletar agendamento permanentemente

**Method**: `DELETE`

**URL**: `/manage-appointment?id=123e4567-e89b-12d3-a456-426614174000`

**Response**:
```json
{
  "success": true,
  "message": "Agendamento deletado com sucesso"
}
```

---

## 🤖 Exemplos de Uso no N8N

### Setup 1: Configurar HTTP Request no N8N

1. Adicione um nó **HTTP Request**
2. Configure:
   - **Method**: POST/GET/PUT/DELETE (conforme endpoint)
   - **URL**: `https://xtavanhzrbejykvikwua.supabase.co/functions/v1/{function-name}`
   - **Authentication**: None (ou Bearer Token se configurar)
   - **Headers**:
     ```
     Content-Type: application/json
     apikey: {SUPABASE_ANON_KEY}
     Authorization: Bearer {SUPABASE_ANON_KEY}
     ```

### Fluxo 1: Cliente pergunta disponibilidade via WhatsApp

```
[Webhook Evolution API]
    ↓
[Extrair data e terapeuta da mensagem]
    ↓
[HTTP Request: POST /check-availability]
    Body: {
      "date": "{{$json.date}}",
      "therapist": "{{$json.therapist}}",
      "duration": 60
    }
    ↓
[Formatar resposta]
    ↓
[Enviar mensagem WhatsApp com horários disponíveis]
```

**Exemplo de resposta formatada**:
```
Horários disponíveis para 20/12/2025:
• 06:30
• 07:00
• 07:30
• 14:00
• 14:30

Qual horário você prefere?
```

### Fluxo 2: Cliente escolhe horário e confirma agendamento

```
[Webhook Evolution API com resposta do cliente]
    ↓
[Extrair horário escolhido]
    ↓
[HTTP Request: POST /create-appointment]
    Body: {
      "patient_name": "{{$json.clientName}}",
      "date": "{{$json.date}}",
      "time": "{{$json.selectedTime}}",
      "therapist": "Cheila Meinertz",
      "status": "pending",
      "notes": "Agendado via WhatsApp"
    }
    ↓
[Switch: Sucesso ou Erro?]
    ├─ Sucesso → [Enviar confirmação via WhatsApp]
    └─ Erro → [Enviar mensagem de erro e oferecer outros horários]
```

### Fluxo 3: Lembrete automático de consulta

```
[Schedule Trigger: Rodar diariamente às 18h]
    ↓
[Calcular data de amanhã]
    ↓
[HTTP Request: GET /list-appointments?date={{tomorrow}}&status=confirmed]
    ↓
[Loop pelos agendamentos]
    ↓
[Para cada agendamento: Enviar lembrete via WhatsApp]
```

**Exemplo de mensagem**:
```
Olá {{patient_name}}!

Lembrando que você tem consulta marcada para amanhã:
📅 Data: {{date}}
🕐 Horário: {{time}}
👨‍⚕️ Terapeuta: {{therapist}}
📍 Local: {{room}}

Confirme sua presença respondendo SIM.
```

### Fluxo 4: Cliente cancela via WhatsApp

```
[Webhook Evolution API]
    ↓
[Detectar intenção de cancelamento]
    ↓
[Buscar agendamentos do cliente: GET /list-appointments?patient_name={{name}}]
    ↓
[Mostrar agendamentos ativos]
    ↓
[Cliente escolhe qual cancelar]
    ↓
[HTTP Request: DELETE /manage-appointment?id={{appointmentId}}&soft=true]
    ↓
[Enviar confirmação de cancelamento]
```

---

## 🔁 Fluxos Comuns Completos

### 1. Agendamento Completo via WhatsApp

```javascript
// Node 1: Webhook Evolution API
// Recebe mensagem do cliente

// Node 2: Function - Detectar Intenção
const message = $input.first().json.message.toLowerCase();

if (message.includes('agendar') || message.includes('marcar consulta')) {
  return { intent: 'schedule', clientName: $input.first().json.contact.name };
}

// Node 3: HTTP Request - Verificar Disponibilidade
// POST /check-availability
{
  "date": "2025-12-20",
  "therapist": "Cheila Meinertz",
  "duration": 60
}

// Node 4: Function - Formatar Lista de Horários
const slots = $input.first().json.availableSlots;
const formatted = slots.map((slot, i) => `${i + 1}. ${slot}`).join('\n');
return {
  message: `Horários disponíveis:\n${formatted}\n\nDigite o número do horário desejado.`
};

// Node 5: Enviar via Evolution API
// Aguarda resposta do cliente com o número

// Node 6: Function - Processar Escolha
const choice = parseInt($input.first().json.message);
const selectedTime = $node["HTTP Request"].json.availableSlots[choice - 1];
return { selectedTime, clientName: '...' };

// Node 7: HTTP Request - Criar Agendamento
// POST /create-appointment
{
  "patient_name": "{{clientName}}",
  "date": "2025-12-20",
  "time": "{{selectedTime}}",
  "therapist": "Cheila Meinertz",
  "status": "pending"
}

// Node 8: Function - Mensagem de Confirmação
if ($input.first().json.success) {
  return {
    message: `✅ Agendamento confirmado!\n\n📅 Data: 20/12/2025\n🕐 Horário: ${$input.first().json.appointment.time}\n👨‍⚕️ Terapeuta: Cheila Meinertz\n\nAté lá!`
  };
} else {
  return {
    message: `❌ Ops! Esse horário acabou de ser reservado. Vamos verificar novamente...`
  };
}

// Node 9: Enviar via Evolution API
```

---

## ⚠️ Tratamento de Erros

### Códigos de Status HTTP

- **200**: Sucesso
- **201**: Criado com sucesso
- **400**: Erro de validação (dados inválidos)
- **404**: Não encontrado
- **409**: Conflito (horário indisponível)
- **500**: Erro interno do servidor

### Exemplo de Tratamento no N8N

```javascript
// Node: Function - Tratamento de Erro
const statusCode = $input.first().json.$statusCode;
const error = $input.first().json.error;

switch(statusCode) {
  case 409:
    return {
      message: "Desculpe, esse horário acabou de ser reservado. Vou verificar outros horários disponíveis...",
      action: "retry"
    };
  case 400:
    return {
      message: "Houve um problema com os dados informados. Pode me informar novamente?",
      action: "ask_again"
    };
  case 500:
    return {
      message: "Estamos com instabilidade no sistema. Tente novamente em alguns minutos.",
      action: "wait"
    };
  default:
    return {
      message: "Algo deu errado. Nossa equipe foi notificada!",
      action: "alert_admin"
    };
}
```

---

## 🔐 Segurança

### Autenticação

As Edge Functions usam a `SUPABASE_SERVICE_ROLE_KEY` internamente. Para chamadas externas:

1. **Via N8N (Recomendado)**: Use a `SUPABASE_ANON_KEY` nos headers
2. **Via Webhook Público**: Configure Row Level Security (RLS) no Supabase

### Headers Necessários

```
Content-Type: application/json
apikey: {SUPABASE_ANON_KEY}
Authorization: Bearer {SUPABASE_ANON_KEY}
```

### Variáveis de Ambiente no N8N

Configure as seguintes variáveis:
- `SUPABASE_URL`: https://xtavanhzrbejykvikwua.supabase.co
- `SUPABASE_ANON_KEY`: (sua chave pública)
- `SUPABASE_FUNCTIONS_URL`: https://xtavanhzrbejykvikwua.supabase.co/functions/v1

---

## 📝 Notas Adicionais

### Terapeutas Disponíveis

Os terapeutas cadastrados no sistema são:
- Cheila Meinertz
- Guilherme Pacheco
- Rodrigo Martins

### Horário de Funcionamento

- **Início**: 06:30
- **Fim**: 21:00
- **Intervalo**: 30 minutos

### Status de Agendamento

- `confirmed`: Confirmado
- `pending`: Pendente de confirmação
- `blocked`: Bloqueado (horário reservado mas sem paciente)
- `cancelled`: Cancelado
- `free`: Livre

---

## 🆘 Suporte

Se tiver problemas:
1. Verifique os logs das Edge Functions no Supabase
2. Teste os endpoints usando Postman/Insomnia
3. Valide as credenciais e URLs
4. Confirme que as funções foram deployadas corretamente

---

**Última atualização**: 15/12/2025
