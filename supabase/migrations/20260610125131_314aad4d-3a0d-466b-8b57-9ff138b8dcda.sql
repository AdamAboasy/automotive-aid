
-- Work orders status enum
DO $$ BEGIN
  CREATE TYPE public.work_order_status AS ENUM ('open','in_progress','on_hold','completed','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- work_orders
CREATE TABLE IF NOT EXISTS public.work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.maintenance_bookings(id) ON DELETE SET NULL,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  car_id UUID REFERENCES public.cars(id) ON DELETE SET NULL,
  workshop_id UUID REFERENCES public.workshops(id) ON DELETE SET NULL,
  technician_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  description TEXT,
  diagnosis TEXT,
  status public.work_order_status NOT NULL DEFAULT 'open',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  total_cost NUMERIC(12,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.work_orders TO authenticated;
GRANT ALL ON public.work_orders TO service_role;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authed read work_orders" ON public.work_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Reception/workshop create work_orders" ON public.work_orders FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'reception') OR public.has_role(auth.uid(),'workshop_manager') OR public.has_role(auth.uid(),'technician'));
CREATE POLICY "Workshop update work_orders" ON public.work_orders FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'workshop_manager') OR public.has_role(auth.uid(),'technician') OR public.has_role(auth.uid(),'reception'));
CREATE POLICY "Admin/manager delete work_orders" ON public.work_orders FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'workshop_manager'));
CREATE TRIGGER trg_work_orders_updated BEFORE UPDATE ON public.work_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create work order when booking is confirmed
CREATE OR REPLACE FUNCTION public.create_work_order_from_booking()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'confirmed' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'confirmed') THEN
    IF NOT EXISTS (SELECT 1 FROM public.work_orders WHERE booking_id = NEW.id) THEN
      INSERT INTO public.work_orders (booking_id, client_id, car_id, workshop_id, description, status)
      VALUES (NEW.id, NEW.client_id, NEW.car_id, NEW.workshop_id, NEW.service_type, 'open');
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_booking_to_work_order
AFTER INSERT OR UPDATE OF status ON public.maintenance_bookings
FOR EACH ROW EXECUTE FUNCTION public.create_work_order_from_booking();

-- Attendance (HR)
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  work_date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'present',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (employee_id, work_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance TO authenticated;
GRANT ALL ON public.attendance TO service_role;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin/HR view attendance" ON public.attendance FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr'));
CREATE POLICY "Admin/HR insert attendance" ON public.attendance FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr'));
CREATE POLICY "Admin/HR update attendance" ON public.attendance FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr'));
CREATE POLICY "Admin/HR delete attendance" ON public.attendance FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr'));
CREATE TRIGGER trg_attendance_updated BEFORE UPDATE ON public.attendance FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
