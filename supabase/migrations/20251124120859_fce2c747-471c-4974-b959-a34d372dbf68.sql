-- Alterar coluna wheelchair de boolean para mobility_level (text com 3 opções)
ALTER TABLE public.patients 
DROP COLUMN IF EXISTS wheelchair;

ALTER TABLE public.patients 
ADD COLUMN mobility_level text DEFAULT 'none';

-- Adicionar constraint para validar valores
ALTER TABLE public.patients 
ADD CONSTRAINT mobility_level_check 
CHECK (mobility_level IN ('severe', 'partial', 'none'));

COMMENT ON COLUMN public.patients.mobility_level IS 'Nível de dificuldade de locomoção: severe (severa), partial (parcial), none (nenhuma)';