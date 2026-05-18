-- Ensure the services table exists and has the correct columns
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  color_code TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Try to add columns if table already existed but was missing them
DO $$ 
BEGIN 
  BEGIN
    ALTER TABLE public.services ADD COLUMN image_url TEXT;
  EXCEPTION WHEN duplicate_column THEN END;
  
  BEGIN
    ALTER TABLE public.services ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT false;
  EXCEPTION WHEN duplicate_column THEN END;

  BEGIN
    ALTER TABLE public.services ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
  EXCEPTION WHEN duplicate_column THEN END;

  BEGIN
    ALTER TABLE public.services ADD COLUMN description TEXT;
  EXCEPTION WHEN duplicate_column THEN END;

  BEGIN
    ALTER TABLE public.services ADD COLUMN color_code TEXT;
  EXCEPTION WHEN duplicate_column THEN END;

  BEGIN
    ALTER TABLE public.services ADD COLUMN duration_minutes INTEGER NOT NULL DEFAULT 60;
  EXCEPTION WHEN duplicate_column THEN END;

  BEGIN
    ALTER TABLE public.services ADD COLUMN price NUMERIC NOT NULL DEFAULT 0;
  EXCEPTION WHEN duplicate_column THEN END;

  BEGIN
    ALTER TABLE public.services ADD COLUMN slug TEXT UNIQUE;
  EXCEPTION WHEN duplicate_column THEN END;
END $$;

-- RLS Policies
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Services are viewable by everyone" ON public.services;
DROP POLICY IF EXISTS "Only admins can insert services" ON public.services;
DROP POLICY IF EXISTS "Only admins can update services" ON public.services;
DROP POLICY IF EXISTS "Only admins can delete services" ON public.services;

CREATE POLICY "Services are viewable by everyone"
  ON public.services FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert services"
  ON public.services FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Only admins can update services"
  ON public.services FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Only admins can delete services"
  ON public.services FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'editor')
    )
  );
