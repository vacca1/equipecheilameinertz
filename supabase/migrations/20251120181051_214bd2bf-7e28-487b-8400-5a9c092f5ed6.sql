-- Adicionar campos de endereço detalhados
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS rg text,
ADD COLUMN IF NOT EXISTS address_number text,
ADD COLUMN IF NOT EXISTS address_complement text;

-- Adicionar campos clínicos adicionais
ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS requesting_doctor text,
ADD COLUMN IF NOT EXISTS previous_pathologies text,
ADD COLUMN IF NOT EXISTS surgeries text,
ADD COLUMN IF NOT EXISTS medications text,
ADD COLUMN IF NOT EXISTS treatment_plan text;

-- Adicionar campos operacionais
ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS specific_room text,
ADD COLUMN IF NOT EXISTS flexibility_notes text;

-- Comentários para documentação
COMMENT ON COLUMN public.patients.rg IS 'RG do paciente';
COMMENT ON COLUMN public.patients.address_number IS 'Número da residência';
COMMENT ON COLUMN public.patients.address_complement IS 'Complemento do endereço';
COMMENT ON COLUMN public.patients.requesting_doctor IS 'Médico que solicitou o tratamento';
COMMENT ON COLUMN public.patients.previous_pathologies IS 'Patologias prévias do paciente';
COMMENT ON COLUMN public.patients.surgeries IS 'Histórico de cirurgias';
COMMENT ON COLUMN public.patients.medications IS 'Medicamentos em uso';
COMMENT ON COLUMN public.patients.treatment_plan IS 'Plano de tratamento';
COMMENT ON COLUMN public.patients.specific_room IS 'Sala específica preferencial';
COMMENT ON COLUMN public.patients.flexibility_notes IS 'Observações sobre flexibilidade de horários';