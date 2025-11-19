-- Adicionar coluna discount_percentage na tabela patients
ALTER TABLE public.patients 
ADD COLUMN discount_percentage integer;

COMMENT ON COLUMN public.patients.discount_percentage IS 'Porcentagem de desconto aplicada (1-100)';

-- Adicionar constraint para garantir que o valor está entre 1 e 100
ALTER TABLE public.patients
ADD CONSTRAINT discount_percentage_range 
CHECK (discount_percentage IS NULL OR (discount_percentage >= 1 AND discount_percentage <= 100));