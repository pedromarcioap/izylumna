-- =====================================================================
-- IzyLumna - Script SQL de Inicialização do Banco de Dados (Supabase)
-- =====================================================================
-- Execute este script no SQL Editor do seu projeto Supabase para criar
-- a estrutura de tabelas e liberar as permissões RLS para acesso via PIN.
-- =====================================================================

-- 1. Tabela de Galerias
CREATE TABLE IF NOT EXISTS public.galleries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  event_date DATE,
  description TEXT,
  cover_photo_url TEXT,
  status TEXT DEFAULT 'awaiting_client',
  privacy TEXT DEFAULT 'private',
  pin_code TEXT UNIQUE NOT NULL,
  predefined_voters JSONB DEFAULT '[]'::jsonb,
  consensus_threshold INT DEFAULT 2,
  allow_free_voter_registration BOOLEAN DEFAULT true,
  voters JSONB DEFAULT '[]'::jsonb,
  quota_included INT DEFAULT 20,
  excess_policy TEXT DEFAULT 'charge',
  extra_photo_price NUMERIC(10, 2) DEFAULT 30.00,
  watermark_enabled BOOLEAN DEFAULT true,
  watermark_text TEXT DEFAULT 'PROVA • LUMINA STUDIO • PROVA',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela de Fotos
CREATE TABLE IF NOT EXISTS public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID REFERENCES public.galleries(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  is_starred BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabela de Seleções, Votos e Comentários Colaborativos
CREATE TABLE IF NOT EXISTS public.client_selections (
  gallery_id UUID PRIMARY KEY REFERENCES public.galleries(id) ON DELETE CASCADE,
  selected_photo_ids JSONB DEFAULT '[]'::jsonb,
  comments JSONB DEFAULT '{}'::jsonb,
  votes JSONB DEFAULT '{}'::jsonb,
  comments_map JSONB DEFAULT '{}'::jsonb,
  voters JSONB DEFAULT '[]'::jsonb,
  approved_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabela de Perfis do Fotógrafo
CREATE TABLE IF NOT EXISTS public.photographer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT DEFAULT 'Lumina Studio',
  studio_name TEXT DEFAULT 'Lumina Photography',
  email TEXT DEFAULT 'contato@luminastudio.com',
  phone TEXT DEFAULT '(11) 99999-8888',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================================
-- CONFIGURAÇÃO DE SEGURANÇA E RLS (ROW LEVEL SECURITY)
-- Libera acesso livre para anon e authenticated para o modelo PIN/Mock
-- =====================================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photographer_profiles ENABLE ROW LEVEL SECURITY;

-- Remover políticas anteriores se existirem
DROP POLICY IF EXISTS "Permitir tudo em galleries" ON public.galleries;
DROP POLICY IF EXISTS "Permitir tudo em photos" ON public.photos;
DROP POLICY IF EXISTS "Permitir tudo em client_selections" ON public.client_selections;
DROP POLICY IF EXISTS "Permitir tudo em photographer_profiles" ON public.photographer_profiles;

-- Criar Políticas Permissivas para evitar o Erro RLS 42501
CREATE POLICY "Permitir tudo em galleries" 
  ON public.galleries 
  FOR ALL 
  TO anon, authenticated 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Permitir tudo em photos" 
  ON public.photos 
  FOR ALL 
  TO anon, authenticated 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Permitir tudo em client_selections" 
  ON public.client_selections 
  FOR ALL 
  TO anon, authenticated 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Permitir tudo em photographer_profiles" 
  ON public.photographer_profiles 
  FOR ALL 
  TO anon, authenticated 
  USING (true) 
  WITH CHECK (true);

-- Índices de Desempenho
CREATE INDEX IF NOT EXISTS idx_galleries_pin_code ON public.galleries(pin_code);
CREATE INDEX IF NOT EXISTS idx_photos_gallery_id ON public.photos(gallery_id);
