-- Automotive Aid Database Schema

-- Enable RLS
ALTER TABLE IF EXISTS auth.users ENABLE ROW LEVEL SECURITY;

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('admin', 'reception', 'workshop_manager', 'technician', 'hr')),
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers table
CREATE TABLE IF NOT EXISTS public.customers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT UNIQUE,
  email TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS public.vehicles (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT REFERENCES public.customers(id),
  plate_number TEXT UNIQUE NOT NULL,
  model TEXT,
  brand TEXT,
  year INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service requests / Jobs
CREATE TABLE IF NOT EXISTS public.service_requests (
  id BIGSERIAL PRIMARY KEY,
  vehicle_id BIGINT REFERENCES public.vehicles(id),
  customer_id BIGINT REFERENCES public.customers(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  description TEXT,
  estimated_cost DECIMAL(10,2),
  created_by UUID REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

-- Basic policies (to be expanded)
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);