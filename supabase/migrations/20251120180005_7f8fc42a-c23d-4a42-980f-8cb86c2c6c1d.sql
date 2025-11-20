-- Criar índice único para prevenir conflitos de horário
-- Permite apenas um agendamento por fisioterapeuta em cada data/horário
-- Exclui agendamentos cancelados para permitir reagendamento
CREATE UNIQUE INDEX idx_unique_therapist_appointment 
ON public.appointments (therapist, date, time) 
WHERE status != 'cancelled';