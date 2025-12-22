-- 1. Adicionar colunas para controle de presença/pagamento integrado em appointments
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS session_number INTEGER,
ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(50);

-- 2. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_appointments_session 
  ON appointments(patient_id, session_number);

-- 3. Função para numerar sessões automaticamente
CREATE OR REPLACE FUNCTION public.assign_session_number()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se já tem número, não mexe
  IF NEW.session_number IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  -- Buscar próximo número apenas se tiver patient_id
  IF NEW.patient_id IS NOT NULL THEN
    SELECT COALESCE(MAX(session_number), 0) + 1
    INTO NEW.session_number
    FROM appointments
    WHERE patient_id = NEW.patient_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 4. Trigger para numerar automaticamente
DROP TRIGGER IF EXISTS trigger_assign_session_number ON appointments;
CREATE TRIGGER trigger_assign_session_number
BEFORE INSERT ON appointments
FOR EACH ROW
EXECUTE FUNCTION public.assign_session_number();

-- 5. Atualizar appointments existentes com número sequencial por paciente
WITH numbered AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY patient_id ORDER BY date, time) as num
  FROM appointments
  WHERE session_number IS NULL AND patient_id IS NOT NULL
)
UPDATE appointments a
SET session_number = n.num
FROM numbered n
WHERE a.id = n.id;