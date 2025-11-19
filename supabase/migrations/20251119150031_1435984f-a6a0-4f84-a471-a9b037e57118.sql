-- Adicionar coluna wheelchair (cadeirante) na tabela patients
ALTER TABLE public.patients 
ADD COLUMN wheelchair boolean NOT NULL DEFAULT false;