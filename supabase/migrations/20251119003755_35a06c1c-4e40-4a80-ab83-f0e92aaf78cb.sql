-- Remover políticas públicas existentes
DROP POLICY IF EXISTS "Allow public access to patients" ON public.patients;
DROP POLICY IF EXISTS "Allow public access to appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow public access to sessions" ON public.sessions;
DROP POLICY IF EXISTS "Allow public access to incomes" ON public.incomes;
DROP POLICY IF EXISTS "Allow public access to expenses" ON public.expenses;

-- Criar políticas que exigem autenticação para todas as tabelas
CREATE POLICY "Authenticated users can manage patients"
ON public.patients FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can manage appointments"
ON public.appointments FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can manage sessions"
ON public.sessions FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can manage incomes"
ON public.incomes FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can manage expenses"
ON public.expenses FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);