#!/bin/bash

# Script de testes para as APIs de agendamento
# Certifique-se de fazer o deploy das Edge Functions antes de executar

SUPABASE_URL="https://xtavanhzrbejykvikwua.supabase.co"
FUNCTIONS_URL="${SUPABASE_URL}/functions/v1"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0YXZhbmh6cmJlanlrdmlrd3VhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0Nzg5ODcsImV4cCI6MjA3OTA1NDk4N30.0_qNa-NGB1jdiiXXkKNXNXy9X-OlrzMFGZr_GxOzubQ"

echo "🧪 Testando APIs de Agendamento"
echo "================================"
echo ""

# Test 1: Check Availability
echo "1️⃣ Testando consulta de disponibilidade..."
curl -X POST "${FUNCTIONS_URL}/check-availability" \
  -H "Content-Type: application/json" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -d '{
    "date": "2025-12-20",
    "therapist": "Cheila Meinertz",
    "duration": 60
  }' | jq .

echo ""
echo "================================"
echo ""

# Test 2: Create Appointment
echo "2️⃣ Testando criação de agendamento..."
APPOINTMENT_RESPONSE=$(curl -X POST "${FUNCTIONS_URL}/create-appointment" \
  -H "Content-Type: application/json" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -d '{
    "patient_name": "Teste API N8N",
    "date": "2025-12-20",
    "time": "14:00",
    "therapist": "Cheila Meinertz",
    "duration": 60,
    "status": "pending",
    "notes": "Teste de integração com N8N"
  }')

echo $APPOINTMENT_RESPONSE | jq .

# Extrair ID do agendamento criado
APPOINTMENT_ID=$(echo $APPOINTMENT_RESPONSE | jq -r '.appointment.id')
echo "Agendamento criado com ID: $APPOINTMENT_ID"

echo ""
echo "================================"
echo ""

# Test 3: List Appointments
echo "3️⃣ Testando listagem de agendamentos..."
curl -X GET "${FUNCTIONS_URL}/list-appointments?date=2025-12-20&therapist=Cheila%20Meinertz" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" | jq .

echo ""
echo "================================"
echo ""

# Test 4: Get Specific Appointment
if [ ! -z "$APPOINTMENT_ID" ] && [ "$APPOINTMENT_ID" != "null" ]; then
  echo "4️⃣ Testando busca de agendamento específico..."
  curl -X GET "${FUNCTIONS_URL}/manage-appointment?id=${APPOINTMENT_ID}" \
    -H "apikey: ${ANON_KEY}" \
    -H "Authorization: Bearer ${ANON_KEY}" | jq .

  echo ""
  echo "================================"
  echo ""

  # Test 5: Update Appointment
  echo "5️⃣ Testando atualização de agendamento..."
  curl -X PUT "${FUNCTIONS_URL}/manage-appointment?id=${APPOINTMENT_ID}" \
    -H "Content-Type: application/json" \
    -H "apikey: ${ANON_KEY}" \
    -H "Authorization: Bearer ${ANON_KEY}" \
    -d '{
      "time": "15:00",
      "notes": "Horário atualizado via API"
    }' | jq .

  echo ""
  echo "================================"
  echo ""

  # Test 6: Cancel Appointment (Soft Delete)
  echo "6️⃣ Testando cancelamento de agendamento..."
  curl -X DELETE "${FUNCTIONS_URL}/manage-appointment?id=${APPOINTMENT_ID}&soft=true" \
    -H "apikey: ${ANON_KEY}" \
    -H "Authorization: Bearer ${ANON_KEY}" | jq .

  echo ""
  echo "================================"
  echo ""
fi

echo "✅ Testes concluídos!"
echo ""
echo "Para executar os testes:"
echo "chmod +x test-api.sh"
echo "./test-api.sh"
