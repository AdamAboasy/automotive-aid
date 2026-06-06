
-- Reference data tables for Phase 2

-- BANKS
CREATE TABLE public.banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.banks TO authenticated;
GRANT ALL ON public.banks TO service_role;
ALTER TABLE public.banks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All authed can view banks" ON public.banks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage banks" ON public.banks FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_banks_updated BEFORE UPDATE ON public.banks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- BODY TYPES
CREATE TABLE public.body_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.body_types TO authenticated;
GRANT ALL ON public.body_types TO service_role;
ALTER TABLE public.body_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All authed can view body_types" ON public.body_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage body_types" ON public.body_types FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_body_types_updated BEFORE UPDATE ON public.body_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- BRANDS
CREATE TABLE public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brands TO authenticated;
GRANT ALL ON public.brands TO service_role;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All authed can view brands" ON public.brands FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage brands" ON public.brands FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_brands_updated BEFORE UPDATE ON public.brands FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- MODELS
CREATE TABLE public.models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (brand_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.models TO authenticated;
GRANT ALL ON public.models TO service_role;
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All authed can view models" ON public.models FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage models" ON public.models FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_models_updated BEFORE UPDATE ON public.models FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ENGINES
CREATE TABLE public.engines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (model_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.engines TO authenticated;
GRANT ALL ON public.engines TO service_role;
ALTER TABLE public.engines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All authed can view engines" ON public.engines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage engines" ON public.engines FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_engines_updated BEFORE UPDATE ON public.engines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- WAREHOUSES
CREATE TABLE public.warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.warehouses TO authenticated;
GRANT ALL ON public.warehouses TO service_role;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All authed can view warehouses" ON public.warehouses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage warehouses" ON public.warehouses FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_warehouses_updated BEFORE UPDATE ON public.warehouses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- WORKSHOPS
CREATE TABLE public.workshops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workshops TO authenticated;
GRANT ALL ON public.workshops TO service_role;
ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All authed can view workshops" ON public.workshops FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage workshops" ON public.workshops FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_workshops_updated BEFORE UPDATE ON public.workshops FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- EMPLOYEES (reference list — separate from auth users)
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  job_title TEXT,
  phone TEXT,
  salary NUMERIC(12,2),
  hire_date DATE,
  workshop_id UUID REFERENCES public.workshops(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;
GRANT ALL ON public.employees TO service_role;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authed view employees" ON public.employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin or HR manage employees" ON public.employees FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'hr'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'hr'));
CREATE TRIGGER trg_employees_updated BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- SEED DATA
INSERT INTO public.banks (name) VALUES
  ('البنك الأهلي المصري'),('بنك مصر'),('CIB'),('QNB'),('بنك الإسكندرية'),('HSBC')
ON CONFLICT DO NOTHING;

INSERT INTO public.body_types (name) VALUES
  ('سيدان'),('SUV'),('هاتشباك'),('بيك أب'),('كوبيه'),('ميني فان')
ON CONFLICT DO NOTHING;

INSERT INTO public.brands (name) VALUES
  ('كيا'),('هيونداي'),('تويوتا'),('نيسان'),('شيفروليه'),('MG'),('شيري')
ON CONFLICT DO NOTHING;
