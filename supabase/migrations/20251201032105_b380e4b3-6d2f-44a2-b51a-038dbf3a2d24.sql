-- Adicionar campo de sessões cobertas na tabela incomes
ALTER TABLE incomes ADD COLUMN IF NOT EXISTS sessions_covered integer DEFAULT 1;

-- Adicionar comentário
COMMENT ON COLUMN incomes.sessions_covered IS 'Quantidade de sessões que este pagamento cobre';

-- Criar tabela de relação N:N para fisioterapeutas e pagamentos
CREATE TABLE public.income_therapists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  income_id uuid NOT NULL REFERENCES incomes(id) ON DELETE CASCADE,
  therapist text NOT NULL,
  sessions_count integer DEFAULT 1 CHECK (sessions_count > 0),
  commission_percentage integer DEFAULT 60 CHECK (commission_percentage >= 0 AND commission_percentage <= 100),
  commission_value numeric,
  created_at timestamptz DEFAULT now()
);

-- Adicionar comentários
COMMENT ON TABLE public.income_therapists IS 'Relacionamento entre pagamentos e fisioterapeutas (suporta múltiplas fisioterapeutas por pagamento)';
COMMENT ON COLUMN public.income_therapists.sessions_count IS 'Número de sessões atribuídas a esta fisioterapeuta neste pagamento';
COMMENT ON COLUMN public.income_therapists.commission_percentage IS 'Percentual de comissão desta fisioterapeuta';
COMMENT ON COLUMN public.income_therapists.commission_value IS 'Valor da comissão calculado para esta fisioterapeuta';

-- Habilitar RLS
ALTER TABLE income_therapists ENABLE ROW LEVEL SECURITY;

-- Criar política de acesso
CREATE POLICY "Authenticated users can manage income_therapists"
  ON income_therapists FOR ALL
  USING (true) WITH CHECK (true);

-- Criar índice para melhor performance
CREATE INDEX idx_income_therapists_income_id ON income_therapists(income_id);
CREATE INDEX idx_income_therapists_therapist ON income_therapists(therapist);