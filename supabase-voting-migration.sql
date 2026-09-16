-- =====================================================================
-- IzyLumna - Migração SQL: Tabela de Error Logs & Votação Atômica (Supabase)
-- =====================================================================

-- 1. Tabela de Error Logs Isolada para Observabilidade e Diagnóstico
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  context TEXT NOT NULL,
  user_id TEXT,
  error_code TEXT NOT NULL,
  message TEXT NOT NULL,
  stack_trace TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  environment TEXT DEFAULT 'production',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS na Tabela de Logs
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Liberar Permissão de Inserção para Usuários Anônimos e Autenticados
DROP POLICY IF EXISTS "Permitir insercao de logs" ON public.error_logs;
CREATE POLICY "Permitir insercao de logs"
  ON public.error_logs
  FOR INSERT
  TO anon, authenticated, service_role
  WITH CHECK (true);

-- Política de Leitura Restrita Apenas para Administradores
DROP POLICY IF EXISTS "Leitura de logs apenas para admins" ON public.error_logs;
CREATE POLICY "Leitura de logs apenas para admins"
  ON public.error_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Índices de Desempenho para Consulta de Diagnóstico
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON public.error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_code ON public.error_logs(error_code);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON public.error_logs(user_id);


-- =====================================================================
-- 2. Stored Procedure RPC: Votação Atômica (Prevenção de Race Conditions)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.toggle_photo_vote_atomic(
  p_gallery_id UUID,
  p_photo_id TEXT,
  p_voter_id TEXT,
  p_voter_name TEXT
)
RETURNS TABLE (
  total_votes INT,
  has_voted BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_votes JSONB;
  v_photo_votes JSONB;
  v_voters JSONB;
  v_existing_index INT := -1;
  v_new_votes_array JSONB := '[]'::jsonb;
  v_has_voted BOOLEAN := false;
  v_elem JSONB;
  v_i INT;
  v_now TIMESTAMPTZ := now();
BEGIN
  -- Bloqueia a linha da galeria para escrita concorrente (Pessimistic Locking)
  SELECT votes, voters INTO v_votes, v_voters
  FROM public.client_selections
  WHERE gallery_id = p_gallery_id
  FOR UPDATE;

  IF NOT FOUND THEN
    -- Cria o registro de seleção se ainda não existir
    INSERT INTO public.client_selections (gallery_id, votes, voters, updated_at)
    VALUES (
      p_gallery_id,
      jsonb_build_object(p_photo_id, jsonb_build_array(
        jsonb_build_object('voterId', p_voter_id, 'voterName', p_voter_name, 'createdAt', v_now)
      )),
      jsonb_build_array(
        jsonb_build_object('id', p_voter_id, 'name', p_voter_name)
      ),
      v_now
    );

    RETURN QUERY SELECT 1, true;
    RETURN;
  END IF;

  v_votes := COALESCE(v_votes, '{}'::jsonb);
  v_voters := COALESCE(v_voters, '[]'::jsonb);
  v_photo_votes := COALESCE(v_votes->p_photo_id, '[]'::jsonb);

  -- Verifica se o eleitor já votou nesta foto
  FOR v_i IN 0..jsonb_array_length(v_photo_votes) - 1 LOOP
    v_elem := v_photo_votes->v_i;
    IF v_elem->>'voterId' = p_voter_id THEN
      v_existing_index := v_i;
      EXIT;
    END IF;
  END LOOP;

  -- Alterna o voto (Toggle)
  IF v_existing_index >= 0 THEN
    -- Remover voto
    v_new_votes_array := v_photo_votes - v_existing_index;
    v_has_voted := false;
  ELSE
    -- Adicionar voto
    v_new_votes_array := v_photo_votes || jsonb_build_object(
      'voterId', p_voter_id,
      'voterName', p_voter_name,
      'createdAt', v_now
    );
    v_has_voted := true;
  END IF;

  -- Atualizar objeto JSONB de votos
  v_votes := jsonb_set(v_votes, ARRAY[p_photo_id], v_new_votes_array);

  -- Garantir que o eleitor esteja registrado na lista de eleitores
  IF NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_voters) elem WHERE elem->>'id' = p_voter_id
  ) THEN
    v_voters := v_voters || jsonb_build_object('id', p_voter_id, 'name', p_voter_name);
  END IF;

  -- Salvar estado atômico no banco
  UPDATE public.client_selections
  SET votes = v_votes,
      voters = v_voters,
      updated_at = v_now
  WHERE gallery_id = p_gallery_id;

  RETURN QUERY SELECT jsonb_array_length(v_new_votes_array), v_has_voted;
END;
$$;
