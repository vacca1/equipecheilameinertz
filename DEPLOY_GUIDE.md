# Guia de Deploy - API de Agendamentos

Este guia explica como fazer o deploy das Edge Functions do Supabase e configurar a integração com N8N.

## 📋 Pré-requisitos

- Conta no Supabase (já configurada)
- Supabase CLI instalado
- N8N instalado (local ou cloud)
- Evolution API configurada
- Node.js 16+ instalado

## 🚀 Passo 1: Instalar Supabase CLI

### Linux/MacOS
```bash
npm install -g supabase
```

### Windows
```bash
npm install -g supabase
# ou use o instalador: https://github.com/supabase/cli/releases
```

Verificar instalação:
```bash
supabase --version
```

## 🔐 Passo 2: Autenticar no Supabase

```bash
# Login
supabase login

# Isso abrirá seu navegador para autenticação
# Após autenticar, volte ao terminal
```

## 🔗 Passo 3: Linkar com o Projeto

```bash
# Navegar até o diretório do projeto
cd /caminho/para/equipecheilameinertz

# Linkar com o projeto Supabase
supabase link --project-ref xtavanhzrbejykvikwua
```

Quando solicitado, confirme:
- Project ID: `xtavanhzrbejykvikwua`
- Database password: (usar a senha do banco de dados)

## 📦 Passo 4: Deploy das Edge Functions

### Deploy individual de cada função

```bash
# 1. Consultar disponibilidade
supabase functions deploy check-availability

# 2. Criar agendamento
supabase functions deploy create-appointment

# 3. Listar agendamentos
supabase functions deploy list-appointments

# 4. Gerenciar agendamento
supabase functions deploy manage-appointment
```

### Ou deploy de todas de uma vez

```bash
# Deploy de todas as funções
supabase functions deploy
```

## ✅ Passo 5: Verificar Deploy

Após o deploy, você verá URLs como:
```
✓ check-availability deployed successfully
  URL: https://xtavanhzrbejykvikwua.supabase.co/functions/v1/check-availability

✓ create-appointment deployed successfully
  URL: https://xtavanhzrbejykvikwua.supabase.co/functions/v1/create-appointment

✓ list-appointments deployed successfully
  URL: https://xtavanhzrbejykvikwua.supabase.co/functions/v1/list-appointments

✓ manage-appointment deployed successfully
  URL: https://xtavanhzrbejykvikwua.supabase.co/functions/v1/manage-appointment
```

## 🧪 Passo 6: Testar as APIs

### Opção 1: Usar o script de teste

```bash
# Dar permissão de execução
chmod +x test-api.sh

# Executar testes
./test-api.sh
```

### Opção 2: Teste manual com curl

```bash
# Testar disponibilidade
curl -X POST "https://xtavanhzrbejykvikwua.supabase.co/functions/v1/check-availability" \
  -H "Content-Type: application/json" \
  -H "apikey: SUA_ANON_KEY" \
  -H "Authorization: Bearer SUA_ANON_KEY" \
  -d '{
    "date": "2025-12-20",
    "therapist": "Cheila Meinertz",
    "duration": 60
  }'
```

### Opção 3: Usar Postman/Insomnia

Importe a collection disponível em `postman-collection.json` (criar se necessário).

## ⚙️ Passo 7: Configurar N8N

### 7.1 Variáveis de Ambiente no N8N

Configure as seguintes variáveis em Settings > Variables:

```
SUPABASE_URL=https://xtavanhzrbejykvikwua.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_FUNCTIONS_URL=https://xtavanhzrbejykvikwua.supabase.co/functions/v1
EVOLUTION_API_URL=https://sua-evolution-api.com
EVOLUTION_API_KEY=sua-api-key
EVOLUTION_INSTANCE=sua-instancia
```

### 7.2 Importar Workflow de Exemplo

1. Abra o N8N
2. Clique em "Import from File"
3. Selecione `n8n-workflow-example.json`
4. Ajuste os nós conforme necessário
5. Ative o workflow

### 7.3 Configurar Webhook na Evolution API

Configure um webhook apontando para seu N8N:
```
URL: https://seu-n8n.com/webhook/whatsapp-webhook
Eventos: message.received
```

## 🔍 Passo 8: Monitoramento e Logs

### Ver logs das Edge Functions

```bash
# Logs em tempo real
supabase functions logs check-availability --tail

# Logs específicos
supabase functions logs create-appointment --limit 50
```

### Acessar logs no Dashboard

1. Acesse: https://supabase.com/dashboard/project/xtavanhzrbejykvikwua
2. Vá em: Edge Functions > Nome da função > Logs

## 🐛 Troubleshooting

### Problema: "Function not found"

**Solução**:
```bash
# Verificar se está linkado ao projeto correto
supabase projects list

# Re-linkar se necessário
supabase link --project-ref xtavanhzrbejykvikwua
```

### Problema: "CORS error"

**Solução**: Já está configurado nos headers das funções. Verifique se está enviando os headers corretos:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type
```

### Problema: "Authentication error"

**Solução**: Verifique se está usando a ANON_KEY correta nos headers:
```
apikey: SUA_ANON_KEY
Authorization: Bearer SUA_ANON_KEY
```

### Problema: "Timeout"

**Solução**: Edge Functions têm timeout padrão de 50 segundos. Para operações longas, considere:
- Otimizar queries
- Usar processamento assíncrono
- Dividir em múltiplas chamadas

### Problema: Deploy falha com erro de permissão

**Solução**:
```bash
# Fazer logout e login novamente
supabase logout
supabase login

# Re-linkar projeto
supabase link --project-ref xtavanhzrbejykvikwua
```

## 📊 Estrutura dos Arquivos

```
equipecheilameinertz/
├── supabase/
│   ├── functions/
│   │   ├── check-availability/
│   │   │   └── index.ts
│   │   ├── create-appointment/
│   │   │   └── index.ts
│   │   ├── list-appointments/
│   │   │   └── index.ts
│   │   └── manage-appointment/
│   │       └── index.ts
│   ├── migrations/
│   └── config.toml
├── API_INTEGRATION.md
├── DEPLOY_GUIDE.md (este arquivo)
├── test-api.sh
└── n8n-workflow-example.json
```

## 🔄 Atualizações Futuras

Para atualizar uma Edge Function:

```bash
# 1. Editar o arquivo da função
vim supabase/functions/nome-funcao/index.ts

# 2. Re-deploy
supabase functions deploy nome-funcao

# 3. Testar
./test-api.sh
```

## 📝 Próximos Passos

1. ✅ Deploy das Edge Functions (você está aqui)
2. ⬜ Configurar N8N
3. ⬜ Testar fluxo completo via WhatsApp
4. ⬜ Configurar lembretes automáticos
5. ⬜ Configurar notificações para a equipe

## 🆘 Suporte

- **Documentação Supabase**: https://supabase.com/docs/guides/functions
- **Documentação N8N**: https://docs.n8n.io/
- **Evolution API**: https://doc.evolution-api.com/

## 📄 Checklist de Deploy

- [ ] Supabase CLI instalado
- [ ] Autenticado no Supabase
- [ ] Projeto linkado
- [ ] Edge Functions deployadas
- [ ] Testes de API passando
- [ ] Variáveis configuradas no N8N
- [ ] Workflow importado no N8N
- [ ] Webhook configurado na Evolution API
- [ ] Teste end-to-end funcionando

---

**Data**: 15/12/2025
**Versão**: 1.0
**Autor**: Claude
