DROP TABLE IF EXISTS public.inventory CASCADE;

CREATE TABLE public.spare_parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id uuid REFERENCES public.workshops(id) ON DELETE SET NULL,
  name text NOT NULL,
  part_code text,
  unit text NOT NULL DEFAULT 'قطعة',
  quantity numeric NOT NULL DEFAULT 0,
  min_quantity numeric NOT NULL DEFAULT 0,
  purchase_price numeric,
  selling_price numeric,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.spare_parts TO authenticated;
GRANT ALL ON public.spare_parts TO service_role;

ALTER TABLE public.spare_parts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read spare_parts" ON public.spare_parts FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert spare_parts" ON public.spare_parts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update spare_parts" ON public.spare_parts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin/workshop delete spare_parts" ON public.spare_parts FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'workshop_manager'));

CREATE TRIGGER update_spare_parts_updated_at
  BEFORE UPDATE ON public.spare_parts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();