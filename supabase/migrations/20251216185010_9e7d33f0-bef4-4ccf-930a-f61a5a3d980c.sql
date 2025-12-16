-- FIX 1: Definir duração padrão como 30 minutos
ALTER TABLE appointments 
ALTER COLUMN duration SET DEFAULT 30;

UPDATE appointments 
SET duration = 30 
WHERE duration IS NULL;

-- FIX 2: Adicionar coluna attendance_status para controle de presença
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS attendance_status VARCHAR(20) DEFAULT 'scheduled';

-- Atualizar agendamentos existentes baseado no status
UPDATE appointments 
SET attendance_status = 'present' 
WHERE status = 'completed' AND attendance_status IS NULL;

UPDATE appointments 
SET attendance_status = 'cancelled' 
WHERE status = 'cancelled' AND attendance_status IS NULL;

UPDATE appointments 
SET attendance_status = 'scheduled' 
WHERE attendance_status IS NULL;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_appointments_attendance 
ON appointments(patient_id, attendance_status);

-- FIX 5: Criar tabela de pacotes disponíveis
CREATE TABLE IF NOT EXISTS packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  total_sessions INTEGER NOT NULL,
  price DECIMAL(10, 2),
  validity_days INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active packages"
  ON packages FOR SELECT
  USING (true);

CREATE POLICY "Users can manage packages"
  ON packages FOR ALL
  USING (true)
  WITH CHECK (true);

-- Inserir pacotes padrão
INSERT INTO packages (name, description, total_sessions, price, validity_days) VALUES
  ('Pacote 5 Sessões', 'Pacote básico de 5 sessões', 5, 450.00, 30),
  ('Pacote 10 Sessões', 'Pacote de 10 sessões com desconto', 10, 850.00, 60),
  ('Pacote 20 Sessões', 'Pacote promocional de 20 sessões', 20, 1600.00, 90)
ON CONFLICT DO NOTHING;

-- Criar tabela de pacotes do paciente
CREATE TABLE IF NOT EXISTS patient_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  package_id UUID REFERENCES packages(id) NOT NULL,
  total_sessions INTEGER NOT NULL,
  used_sessions INTEGER DEFAULT 0,
  purchase_date DATE DEFAULT CURRENT_DATE,
  expiration_date DATE,
  status VARCHAR(20) DEFAULT 'active',
  purchase_price DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE patient_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view patient packages"
  ON patient_packages FOR SELECT
  USING (true);

CREATE POLICY "Users can manage patient packages"
  ON patient_packages FOR ALL
  USING (true)
  WITH CHECK (true);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_patient_packages_patient ON patient_packages(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_packages_status ON patient_packages(status);

-- Adicionar coluna package_id em appointments para vincular sessão ao pacote
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS package_id UUID REFERENCES patient_packages(id);