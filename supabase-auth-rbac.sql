-- =====================================================================
-- IzyLumna - Script SQL de Autenticação Supabase Auth & RBAC (idempotente)
-- =====================================================================
-- Este script cria a estrutura para Controle de Acesso Baseado em Funções (RBAC),
-- provisioning automático de perfis via trigger em auth.users e RLS seguro.
-- =====================================================================

-- 1. Criar tabela pública 'profiles'
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'photographer', 'user')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS na tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Função Security Definer para verificar se o usuário é Administrador
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Função de Trigger para Provisioning Automático de Usuários
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  is_first_user BOOLEAN;
  assigned_role TEXT;
BEGIN
  -- Verificar se é o primeiro usuário cadastrado no sistema
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles) INTO is_first_user;

  IF is_first_user THEN
    assigned_role := 'admin';
  ELSE
    assigned_role := COALESCE(new.raw_user_meta_data->>'role', 'user');
    IF assigned_role NOT IN ('admin', 'photographer', 'user') THEN
      assigned_role := 'user';
    END IF;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, avatar_url, role, is_active)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'avatar_url', ''),
    assigned_role,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = now();

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Associar Trigger on_auth_user_created após insert em auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Impedir alterações não autorizadas nas colunas role e is_active por usuários comuns
CREATE OR REPLACE FUNCTION public.prevent_profile_role_tampering()
RETURNS TRIGGER AS $$
BEGIN
  -- Se quem está executando NÃO é admin e NÃO é chamada do sistema
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Apenas Administradores podem alterar a função (role) de um usuário.';
    END IF;
    IF NEW.is_active IS DISTINCT FROM OLD.OLD.is_active THEN
      RAISE EXCEPTION 'Apenas Administradores podem alterar o status de ativação (is_active).';
    END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS check_profile_update ON public.profiles;
CREATE TRIGGER check_profile_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_role_tampering();

-- 5. Configuração de Políticas de Segurança RLS para 'profiles'
DROP POLICY IF EXISTS "Leitura de perfis" ON public.profiles;
DROP POLICY IF EXISTS "Atualização de próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Administradores gerenciam todos os perfis" ON public.profiles;

-- Leituras: Usuários podem ler seu próprio perfil; Admins podem ler todos
CREATE POLICY "Leitura de perfis"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR public.is_admin()
  );

-- Atualizações: Usuário atualiza seus dados básicos (bloqueado de alterar role/is_active via trigger)
CREATE POLICY "Atualização de próprio perfil"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id OR public.is_admin()
  )
  WITH CHECK (
    auth.uid() = id OR public.is_admin()
  );

-- 6. Configurar Bucket para Avatares no Supabase Storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- RLS para Storage de Avatares
DROP POLICY IF EXISTS "Leitura publica de avatares" ON storage.objects;
DROP POLICY IF EXISTS "Upload de avatares autenticados" ON storage.objects;

CREATE POLICY "Leitura publica de avatares"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

CREATE POLICY "Upload de avatares autenticados"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Atualizacao de avatares autenticados"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars');

-- 7. Índices para Otimização
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);
