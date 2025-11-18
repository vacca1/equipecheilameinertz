-- Tabela de Pacientes
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cpf TEXT UNIQUE,
  birth_date DATE,
  phone TEXT,
  emergency_contact TEXT,
  email TEXT,
  address TEXT,
  cep TEXT,
  city TEXT,
  state TEXT,
  main_therapist TEXT NOT NULL,
  substitute_therapist TEXT,
  health_plan TEXT,
  plan_number TEXT,
  medical_authorization TEXT,
  diagnosis TEXT,
  medical_report TEXT,
  observations TEXT,
  session_value DECIMAL(10, 2),
  commission_percentage INTEGER DEFAULT 60,
  payment_method TEXT,
  payment_day INTEGER,
  invoice_delivery TEXT,
  days_per_week INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Agendamentos
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  duration INTEGER DEFAULT 60,
  therapist TEXT NOT NULL,
  room TEXT,
  status TEXT DEFAULT 'scheduled',
  is_first_session BOOLEAN DEFAULT false,
  repeat_weekly BOOLEAN DEFAULT false,
  repeat_until DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Sessões Realizadas
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL,
  session_number INTEGER NOT NULL,
  date DATE NOT NULL,
  therapist TEXT NOT NULL,
  initial_pain_level INTEGER,
  final_pain_level INTEGER,
  session_value DECIMAL(10, 2),
  commission_percentage INTEGER DEFAULT 60,
  commission_value DECIMAL(10, 2),
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending',
  invoice_delivered BOOLEAN DEFAULT false,
  was_reimbursed BOOLEAN DEFAULT false,
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Entradas (Receitas)
CREATE TABLE public.incomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  patient_name TEXT NOT NULL,
  therapist TEXT NOT NULL,
  value DECIMAL(10, 2) NOT NULL,
  commission_percentage INTEGER DEFAULT 60,
  commission_value DECIMAL(10, 2),
  payment_method TEXT,
  payment_status TEXT DEFAULT 'received',
  invoice_delivered BOOLEAN DEFAULT false,
  observations TEXT,
  session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Saídas (Despesas)
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  value DECIMAL(10, 2) NOT NULL,
  responsible TEXT,
  therapist TEXT,
  file_url TEXT,
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público (sem autenticação por enquanto)
-- Pacientes
CREATE POLICY "Allow public access to patients" ON public.patients FOR ALL USING (true) WITH CHECK (true);

-- Agendamentos
CREATE POLICY "Allow public access to appointments" ON public.appointments FOR ALL USING (true) WITH CHECK (true);

-- Sessões
CREATE POLICY "Allow public access to sessions" ON public.sessions FOR ALL USING (true) WITH CHECK (true);

-- Entradas
CREATE POLICY "Allow public access to incomes" ON public.incomes FOR ALL USING (true) WITH CHECK (true);

-- Saídas
CREATE POLICY "Allow public access to expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_incomes_updated_at BEFORE UPDATE ON public.incomes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para melhor performance
CREATE INDEX idx_patients_name ON public.patients(name);
CREATE INDEX idx_patients_cpf ON public.patients(cpf);
CREATE INDEX idx_patients_main_therapist ON public.patients(main_therapist);
CREATE INDEX idx_appointments_date ON public.appointments(date);
CREATE INDEX idx_appointments_therapist ON public.appointments(therapist);
CREATE INDEX idx_sessions_date ON public.sessions(date);
CREATE INDEX idx_sessions_therapist ON public.sessions(therapist);
CREATE INDEX idx_incomes_date ON public.incomes(date);
CREATE INDEX idx_incomes_therapist ON public.incomes(therapist);
CREATE INDEX idx_expenses_date ON public.expenses(date);
CREATE INDEX idx_expenses_category ON public.expenses(category);