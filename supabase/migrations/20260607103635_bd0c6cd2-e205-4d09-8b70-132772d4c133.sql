
-- ============= CLIENTS =============
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  national_id TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read clients" ON public.clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert clients" ON public.clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update clients" ON public.clients FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Reception delete clients" ON public.clients FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'reception'));

-- ============= CARS =============
CREATE TABLE public.cars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  model_id UUID REFERENCES public.models(id) ON DELETE SET NULL,
  engine_id UUID REFERENCES public.engines(id) ON DELETE SET NULL,
  body_type_id UUID REFERENCES public.body_types(id) ON DELETE SET NULL,
  year INT,
  color TEXT,
  vin TEXT,
  plate_number TEXT,
  mileage INT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX cars_client_idx ON public.cars(client_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cars TO authenticated;
GRANT ALL ON public.cars TO service_role;
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read cars" ON public.cars FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert cars" ON public.cars FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update cars" ON public.cars FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Reception delete cars" ON public.cars FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'reception'));

-- ============= INVENTORY =============
CREATE TYPE public.inventory_status AS ENUM ('available','reserved','sold');

CREATE TABLE public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
  brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  model_id UUID REFERENCES public.models(id) ON DELETE SET NULL,
  engine_id UUID REFERENCES public.engines(id) ON DELETE SET NULL,
  color TEXT,
  year INT,
  vin TEXT,
  price NUMERIC(12,2),
  status public.inventory_status NOT NULL DEFAULT 'available',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory TO authenticated;
GRANT ALL ON public.inventory TO service_role;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read inventory" ON public.inventory FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert inventory" ON public.inventory FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update inventory" ON public.inventory FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Reception delete inventory" ON public.inventory FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'reception'));

-- ============= MAINTENANCE BOOKINGS =============
CREATE TYPE public.booking_status AS ENUM ('pending','confirmed','in_progress','completed','cancelled');

CREATE TABLE public.maintenance_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  car_id UUID REFERENCES public.cars(id) ON DELETE SET NULL,
  workshop_id UUID REFERENCES public.workshops(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  service_type TEXT,
  status public.booking_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX bookings_client_idx ON public.maintenance_bookings(client_id);
CREATE INDEX bookings_scheduled_idx ON public.maintenance_bookings(scheduled_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.maintenance_bookings TO authenticated;
GRANT ALL ON public.maintenance_bookings TO service_role;
ALTER TABLE public.maintenance_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read bookings" ON public.maintenance_bookings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert bookings" ON public.maintenance_bookings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update bookings" ON public.maintenance_bookings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Reception delete bookings" ON public.maintenance_bookings FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'reception'));

-- ============= COMPLAINTS =============
CREATE TYPE public.complaint_status AS ENUM ('open','in_review','resolved','closed');
CREATE TYPE public.complaint_priority AS ENUM ('low','medium','high','urgent');

CREATE TABLE public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  car_id UUID REFERENCES public.cars(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  description TEXT,
  status public.complaint_status NOT NULL DEFAULT 'open',
  priority public.complaint_priority NOT NULL DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX complaints_client_idx ON public.complaints(client_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.complaints TO authenticated;
GRANT ALL ON public.complaints TO service_role;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read complaints" ON public.complaints FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert complaints" ON public.complaints FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update complaints" ON public.complaints FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Reception delete complaints" ON public.complaints FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'reception'));

-- ============= CLIENT FOLLOWUPS =============
CREATE TABLE public.client_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  followup_type TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX followups_client_idx ON public.client_followups(client_id);
CREATE INDEX followups_scheduled_idx ON public.client_followups(scheduled_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_followups TO authenticated;
GRANT ALL ON public.client_followups TO service_role;
ALTER TABLE public.client_followups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read followups" ON public.client_followups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert followups" ON public.client_followups FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update followups" ON public.client_followups FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Reception delete followups" ON public.client_followups FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'reception'));

-- ============= updated_at triggers =============
CREATE TRIGGER trg_clients_updated BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_cars_updated BEFORE UPDATE ON public.cars FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_inventory_updated BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_bookings_updated BEFORE UPDATE ON public.maintenance_bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_complaints_updated BEFORE UPDATE ON public.complaints FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_followups_updated BEFORE UPDATE ON public.client_followups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
