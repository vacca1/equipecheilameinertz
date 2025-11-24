-- Camada 1: Constraint no banco para prevenir CPF duplicado
CREATE UNIQUE INDEX patients_cpf_unique 
ON public.patients (cpf) 
WHERE cpf IS NOT NULL AND cpf != '';

COMMENT ON INDEX patients_cpf_unique IS 
'Impede cadastro de pacientes com CPF duplicado';