-- Criar buckets de storage para arquivos
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('expense-files', 'expense-files', false),
  ('patient-files', 'patient-files', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas RLS para expense-files
CREATE POLICY "Authenticated users can upload expense files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'expense-files');

CREATE POLICY "Authenticated users can view expense files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'expense-files');

CREATE POLICY "Authenticated users can delete expense files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'expense-files');

-- Políticas RLS para patient-files
CREATE POLICY "Authenticated users can upload patient files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'patient-files');

CREATE POLICY "Authenticated users can view patient files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'patient-files');

CREATE POLICY "Authenticated users can delete patient files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'patient-files');

-- Tabela para gerenciar múltiplos arquivos de pacientes
CREATE TABLE IF NOT EXISTS public.patient_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS para patient_files
ALTER TABLE public.patient_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage patient files"
ON public.patient_files
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);