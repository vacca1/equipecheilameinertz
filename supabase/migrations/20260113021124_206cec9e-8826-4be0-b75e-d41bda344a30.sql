-- Tabela para observações/notas do dia
CREATE TABLE public.agenda_day_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  therapist TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(date, therapist)
);

-- Enable RLS
ALTER TABLE public.agenda_day_notes ENABLE ROW LEVEL SECURITY;

-- RLS policy
CREATE POLICY "Authenticated users can manage agenda_day_notes"
ON public.agenda_day_notes
FOR ALL
USING (true)
WITH CHECK (true);

-- Trigger para updated_at
CREATE TRIGGER update_agenda_day_notes_updated_at
BEFORE UPDATE ON public.agenda_day_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela para lista de espera
CREATE TABLE public.waiting_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  patient_name TEXT NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  therapist TEXT,
  preferred_time TEXT,
  notes TEXT,
  priority INTEGER DEFAULT 0,
  status TEXT DEFAULT 'waiting',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.waiting_list ENABLE ROW LEVEL SECURITY;

-- RLS policy
CREATE POLICY "Authenticated users can manage waiting_list"
ON public.waiting_list
FOR ALL
USING (true)
WITH CHECK (true);

-- Trigger para updated_at
CREATE TRIGGER update_waiting_list_updated_at
BEFORE UPDATE ON public.waiting_list
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();