-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own profile select" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Updated at function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Shifts
CREATE TABLE public.shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operator_name TEXT,
  shift_number INTEGER,
  shift_date DATE NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Tashkent')::date,
  tops JSONB NOT NULL DEFAULT '{}'::jsonb,
  bots JSONB NOT NULL DEFAULT '{}'::jsonb,
  pays JSONB NOT NULL DEFAULT '{}'::jsonb,
  total_revenue NUMERIC NOT NULL DEFAULT 0,
  total_paid NUMERIC NOT NULL DEFAULT 0,
  diff NUMERIC NOT NULL DEFAULT 0,
  deficit_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_shifts_user_created ON public.shifts(user_id, created_at DESC);

CREATE POLICY "own shifts select" ON public.shifts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own shifts insert" ON public.shifts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own shifts update" ON public.shifts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own shifts delete" ON public.shifts FOR DELETE USING (auth.uid() = user_id);

-- Auto shift_number per user
CREATE OR REPLACE FUNCTION public.set_shift_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.shift_number IS NULL THEN
    SELECT COALESCE(MAX(shift_number), 0) + 1
      INTO NEW.shift_number
      FROM public.shifts WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER shifts_set_number
BEFORE INSERT ON public.shifts
FOR EACH ROW EXECUTE FUNCTION public.set_shift_number();