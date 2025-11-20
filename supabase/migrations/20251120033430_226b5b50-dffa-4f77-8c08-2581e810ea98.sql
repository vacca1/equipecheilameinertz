-- Adicionar coluna discount na tabela patients
ALTER TABLE public.patients 
ADD COLUMN discount text;

COMMENT ON COLUMN public.patients.discount IS 'Tipo de desconto aplicado: Angelus, Unimed ou Vida Card';