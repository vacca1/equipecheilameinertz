-- Create patient clinical assessments table for tracking return visits and new evaluations
CREATE TABLE public.patient_clinical_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  requesting_doctor TEXT,
  diagnosis TEXT NOT NULL,
  main_complaint TEXT,
  clinical_history TEXT,
  physical_exam TEXT,
  treatment_plan TEXT,
  observations TEXT,
  is_initial_assessment BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.patient_clinical_assessments ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Authenticated users can manage assessments" 
  ON public.patient_clinical_assessments 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_patient_clinical_assessments_updated_at
  BEFORE UPDATE ON public.patient_clinical_assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();