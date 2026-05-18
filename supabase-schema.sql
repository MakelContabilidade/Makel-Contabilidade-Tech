-- Enable the unaccent extension for easier text searches if needed
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Set up the profiles table to mirror the authenticated users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  company_name TEXT,
  cnpj TEXT,
  role TEXT DEFAULT 'CLIENTE' CHECK (role IN ('MASTER', 'ADMIN', 'COLABORADOR', 'CLIENTE')),
  status TEXT DEFAULT 'pendente_aprovacao',
  must_change_password BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to get the current user's role without triggering RLS infinite recursion
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Turn on RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 1. Everyone can read their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING ( auth.uid() = id );

-- 2. Internal users (MASTER, ADMIN, COLABORADOR) can view all profiles
CREATE POLICY "Internal users can view all profiles"
ON public.profiles FOR SELECT 
USING ( public.get_user_role() IN ('MASTER', 'ADMIN', 'COLABORADOR') );

-- 3. Users can update their own profile (for changing password requirement or name)
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING ( auth.uid() = id )
WITH CHECK ( auth.uid() = id );

-- 4. MASTER and ADMIN can update any profile (e.g., status, role)
CREATE POLICY "MASTER and ADMIN can update profiles"
ON public.profiles FOR UPDATE
USING ( public.get_user_role() IN ('MASTER', 'ADMIN') );

-- TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  date TEXT NOT NULL,
  category TEXT NOT NULL,
  type TEXT CHECK (type IN ('in', 'out')),
  description TEXT,
  status TEXT DEFAULT 'completed',
  deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
ON public.transactions FOR SELECT
USING ( auth.uid() = user_id );

CREATE POLICY "Internal users can view all transactions"
ON public.transactions FOR SELECT
USING ( public.get_user_role() IN ('MASTER', 'ADMIN', 'COLABORADOR') );

CREATE POLICY "Users can create own transactions"
ON public.transactions FOR INSERT
WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can update own transactions"
ON public.transactions FOR UPDATE
USING ( auth.uid() = user_id )
WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Internal users can modify all transactions"
ON public.transactions FOR ALL
USING ( public.get_user_role() IN ('MASTER', 'ADMIN', 'COLABORADOR') );

-- AUDITS
CREATE TABLE IF NOT EXISTS public.audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details TEXT,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audits"
ON public.audits FOR SELECT
USING ( auth.uid() = user_id );

CREATE POLICY "Internal users can view all audits"
ON public.audits FOR SELECT
USING ( public.get_user_role() IN ('MASTER', 'ADMIN', 'COLABORADOR') );

CREATE POLICY "System can insert audits"
ON public.audits FOR INSERT
WITH CHECK ( auth.uid() IS NOT NULL );

-- BILLINGS
CREATE TABLE IF NOT EXISTS public.billings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  due_date TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.billings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own billings"
ON public.billings FOR SELECT
USING ( auth.uid() = user_id );

CREATE POLICY "Internal users can view all billings"
ON public.billings FOR SELECT
USING ( public.get_user_role() IN ('MASTER', 'ADMIN', 'COLABORADOR') );

CREATE POLICY "Internal users can modify all billings"
ON public.billings FOR ALL
USING ( public.get_user_role() IN ('MASTER', 'ADMIN', 'COLABORADOR') );

-- CHAMADOS (Tickets)
CREATE TABLE IF NOT EXISTS public.chamados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'aberto',
  messages JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.chamados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chamados"
ON public.chamados FOR SELECT
USING ( auth.uid() = user_id );

CREATE POLICY "Internal users can view all chamados"
ON public.chamados FOR SELECT
USING ( public.get_user_role() IN ('MASTER', 'ADMIN', 'COLABORADOR') );

CREATE POLICY "Users can create own chamados"
ON public.chamados FOR INSERT
WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can update own chamados"
ON public.chamados FOR UPDATE
USING ( auth.uid() = user_id )
WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Internal users can modify all chamados"
ON public.chamados FOR ALL
USING ( public.get_user_role() IN ('MASTER', 'ADMIN', 'COLABORADOR') );

-- JURIDICOS
CREATE TABLE IF NOT EXISTS public.juridicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.juridicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own juridicos"
ON public.juridicos FOR SELECT
USING ( auth.uid() = user_id );

CREATE POLICY "Internal users can view all juridicos"
ON public.juridicos FOR SELECT
USING ( public.get_user_role() IN ('MASTER', 'ADMIN', 'COLABORADOR') );

CREATE POLICY "Internal users can modify all juridicos"
ON public.juridicos FOR ALL
USING ( public.get_user_role() IN ('MASTER', 'ADMIN', 'COLABORADOR') );

-- CONTABILIDADE
CREATE TABLE IF NOT EXISTS public.contabilidade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT,
  date TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.contabilidade ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contabilidade"
ON public.contabilidade FOR SELECT
USING ( auth.uid() = user_id );

CREATE POLICY "Internal users can view all contabilidade"
ON public.contabilidade FOR SELECT
USING ( public.get_user_role() IN ('MASTER', 'ADMIN', 'COLABORADOR') );

CREATE POLICY "Internal users can modify all contabilidade"
ON public.contabilidade FOR ALL
USING ( public.get_user_role() IN ('MASTER', 'ADMIN', 'COLABORADOR') );

-- IMPOSTOS
CREATE TABLE IF NOT EXISTS public.impostos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending',
  due_date TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.impostos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own impostos"
ON public.impostos FOR SELECT
USING ( auth.uid() = user_id );

CREATE POLICY "Internal users can view all impostos"
ON public.impostos FOR SELECT
USING ( public.get_user_role() IN ('MASTER', 'ADMIN', 'COLABORADOR') );

CREATE POLICY "Internal users can modify all impostos"
ON public.impostos FOR ALL
USING ( public.get_user_role() IN ('MASTER', 'ADMIN', 'COLABORADOR') );

-- PROLABORES
CREATE TABLE IF NOT EXISTS public.prolabores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending',
  date TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.prolabores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own prolabores"
ON public.prolabores FOR SELECT
USING ( auth.uid() = user_id );

CREATE POLICY "Internal users can view all prolabores"
ON public.prolabores FOR SELECT
USING ( public.get_user_role() IN ('MASTER', 'ADMIN', 'COLABORADOR') );

CREATE POLICY "Internal users can modify all prolabores"
ON public.prolabores FOR ALL
USING ( public.get_user_role() IN ('MASTER', 'ADMIN', 'COLABORADOR') );

-- Trigger to automatically create a profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, company_name, role)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'company_name',
    'CLIENTE'
  );
  RETURN new;
END;
$$;

-- Trigger to call the function when a new user signs up in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
