-- =====================================================================
-- IzyLumna - Script SQL de Migração do Sistema de Pagamentos e PIX Dinâmico
-- =====================================================================
-- Execute este script no SQL Editor do Supabase para adicionar o modelo
-- de monetização híbrida, a tabela de ordens (orders) e as permissões RLS.
-- =====================================================================

-- 1. Novas Colunas de Monetização na Tabela 'galleries'
ALTER TABLE public.galleries 
  ADD COLUMN IF NOT EXISTS max_contracted_photos INT DEFAULT 20,
  ADD COLUMN IF NOT EXISTS extra_photo_price NUMERIC(10, 2) DEFAULT 25.00,
  ADD COLUMN IF NOT EXISTS gallery_closure_fee NUMERIC(10, 2) DEFAULT 6.90,
  ADD COLUMN IF NOT EXISTS platform_commission_rate NUMERIC(5, 4) DEFAULT 0.08,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'waived'));

-- Garantir retrocompatibilidade com quota_included
UPDATE public.galleries 
SET max_contracted_photos = COALESCE(max_contracted_photos, quota_included, 20)
WHERE max_contracted_photos IS NULL;

-- 2. Novas Colunas de Dados Bancários / PIX na Tabela 'photographer_profiles'
ALTER TABLE public.photographer_profiles
  ADD COLUMN IF NOT EXISTS pix_key TEXT,
  ADD COLUMN IF NOT EXISTS pix_key_type TEXT DEFAULT 'cpf' CHECK (pix_key_type IN ('cpf', 'cnpj', 'email', 'phone', 'random'));

-- 3. Tabela de Pedidos e Cobranças PIX ('orders')
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID REFERENCES public.galleries(id) ON DELETE CASCADE,
  payer_type TEXT NOT NULL CHECK (payer_type IN ('client', 'photographer')),
  total_amount NUMERIC(10, 2) NOT NULL,
  platform_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  photographer_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  external_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'expired', 'canceled')),
  pix_copy_paste TEXT,
  pix_qr_code_base64 TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Habilitar RLS e Configurar Permissões para 'orders'
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura de orders" ON public.orders;
DROP POLICY IF EXISTS "Permitir insercao/atualizacao de orders" ON public.orders;
DROP POLICY IF EXISTS "Permitir tudo em orders" ON public.orders;

-- Permissão permissiva para leitura e gravação via anon e authenticated (sessão de PIN/Galeria)
CREATE POLICY "Permitir tudo em orders" 
  ON public.orders 
  FOR ALL 
  TO anon, authenticated, service_role 
  USING (true) 
  WITH CHECK (true);

-- Conceder permissões para roles do Supabase
GRANT ALL ON TABLE public.orders TO anon, authenticated, service_role;

-- 5. Índices de Desempenho
CREATE INDEX IF NOT EXISTS idx_orders_gallery_id ON public.orders(gallery_id);
CREATE INDEX IF NOT EXISTS idx_orders_external_id ON public.orders(external_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_galleries_payment_status ON public.galleries(payment_status);

-- 6. Notificação via Supabase Realtime para a tabela 'orders' e 'galleries'
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.galleries;
