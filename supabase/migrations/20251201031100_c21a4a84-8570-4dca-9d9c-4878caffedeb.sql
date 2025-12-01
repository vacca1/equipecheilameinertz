-- Adicionar campo de presença explícito na tabela sessions
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS attended boolean DEFAULT true;

-- Adicionar comentário para documentação
COMMENT ON COLUMN sessions.attended IS 'Indica se o paciente compareceu à sessão';