-- Criar tabela de evolução mensal
CREATE TABLE public.monthly_evolutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  year_month text NOT NULL CHECK (year_month ~ '^\d{4}-\d{2}$'),
  evolution_text text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(patient_id, year_month)
);

-- Adicionar comentários para documentação
COMMENT ON TABLE public.monthly_evolutions IS 'Registros mensais de evolução dos pacientes';
COMMENT ON COLUMN public.monthly_evolutions.year_month IS 'Mês/ano no formato YYYY-MM (ex: 2024-12)';
COMMENT ON COLUMN public.monthly_evolutions.evolution_text IS 'Texto descritivo da evolução mensal do paciente';

-- Habilitar RLS
ALTER TABLE monthly_evolutions ENABLE ROW LEVEL SECURITY;

-- Criar política de acesso
CREATE POLICY "Authenticated users can manage monthly_evolutions"
  ON monthly_evolutions FOR ALL
  USING (true) WITH CHECK (true);

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_monthly_evolutions_updated_at
  BEFORE UPDATE ON monthly_evolutions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();