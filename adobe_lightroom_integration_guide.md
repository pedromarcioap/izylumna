# Guia de Integração Nativa Adobe Lightroom Cloud — Izy Lumna

Este documento apresenta a arquitetura completa, modelo de dados, serviços TypeScript, componentes UI e instruções de configuração para a integração nativa entre o **Izy Lumna** e a **API do Adobe Lightroom Cloud**.

---

## 1. Arquitetura OAuth 2.0 & Troca de Tokens

### Recomendação de Arquitetura: Supabase Edge Function vs Frontend Vite
Para garantir a máxima segurança em ambientes de produção:
1. **Supabase Edge Function (`/functions/v1/adobe-token-exchange`)**: É a abordagem recomendada para armazenar e proteger o `ADOBE_CLIENT_SECRET`, evitando sua exposição nos pacotes JavaScript enviados ao navegador do cliente.
2. **Fallback Transparente no Frontend**: O módulo `adobeLightroom.ts` tenta primariamente invocar a Edge Function no Supabase. Caso a Edge Function não esteja implantada (ex: desenvolvimento local rápido), ele utiliza o `VITE_ADOBE_CLIENT_SECRET` diretamente.

### Fluxo OAuth 2.0
1. **Consentimento**: O fotógrafo clica em **"Conectar com Adobe Lightroom"**. É redirecionado para:
   `https://ims-na1.adobelogin.com/ims/authorize/v2?client_id=...&response_type=code&scope=openid,lr_partner_apis&redirect_uri=...`
2. **Callback**: A Adobe redireciona para `/adobe/callback?code=AUTH_CODE`.
3. **Troca do Código**: O componente `AdobeOAuthCallbackView.tsx` intercepta o parâmetro `code` e invoca `exchangeAdobeCodeForToken(code, userId)`, enviando uma requisição POST HTTP para `https://ims-na1.adobelogin.com/ims/token/v3`.
4. **Renovação Automática**: A função `getValidAdobeAccessToken(userId)` verifica a expiração do `access_token`. Se restarem menos de 5 minutos para expirar, o `refresh_token` é utilizado automaticamente para renovar o acesso de forma transparente.

---

## 2. Script de Modelagem no Banco de Dados (Supabase SQL)

Script completo com RLS (Row-Level Security) habilitado em `supabase-adobe-lightroom-migration.sql`:

```sql
-- ==============================================================================
-- IZY LUMNA - Adobe Lightroom Cloud Integration Migration Script
-- ==============================================================================

-- 1. Criar tabela para armazenar credenciais OAuth dos fotógrafos
CREATE TABLE IF NOT EXISTS public.photographer_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'adobe',
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  catalog_id TEXT,
  account_email TEXT,
  account_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_provider UNIQUE (user_id, provider)
);

-- Índice para busca rápida por fotógrafo
CREATE INDEX IF NOT EXISTS idx_photographer_integrations_user_id ON public.photographer_integrations(user_id);

-- 2. Habilitar Row Level Security (RLS)
ALTER TABLE public.photographer_integrations ENABLE ROW LEVEL SECURITY;

-- 3. Políticas RLS (Fotógrafos acessam apenas suas próprias credenciais)
CREATE POLICY "Photographers can view own integration tokens"
  ON public.photographer_integrations FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Photographers can insert own integration tokens"
  ON public.photographer_integrations FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Photographers can update own integration tokens"
  ON public.photographer_integrations FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Photographers can delete own integration tokens"
  ON public.photographer_integrations FOR DELETE USING (auth.uid() = user_id);

-- 4. Estender a tabela Photos com metadados do Adobe Asset
ALTER TABLE public.photos 
  ADD COLUMN IF NOT EXISTS adobe_asset_id TEXT,
  ADD COLUMN IF NOT EXISTS adobe_rendition_url TEXT;

CREATE INDEX IF NOT EXISTS idx_photos_adobe_asset_id ON public.photos(adobe_asset_id);

-- 5. Estender a tabela Galleries com vínculo de catálogo e álbum da Adobe
ALTER TABLE public.galleries 
  ADD COLUMN IF NOT EXISTS adobe_catalog_id TEXT,
  ADD COLUMN IF NOT EXISTS adobe_album_id TEXT;

-- 6. Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_photographer_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_photographer_integrations_updated_at ON public.photographer_integrations;
CREATE TRIGGER trg_photographer_integrations_updated_at
  BEFORE UPDATE ON public.photographer_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_photographer_integrations_updated_at();
```

---

## 3. Variáveis de Ambiente (`.env`)

Adicione no arquivo `.env` do projeto:

```env
# Adobe Developer Console Client Configuration
VITE_ADOBE_CLIENT_ID="sua_adobe_client_id_aqui"
VITE_ADOBE_CLIENT_SECRET="seu_adobe_client_secret_aqui"
VITE_ADOBE_REDIRECT_URI="http://localhost:5173/adobe/callback"
```

> [!IMPORTANT]
> No painel do **Adobe Developer Console**, adicione a URI exata em **OAuth Web Redirect URI**: `http://localhost:5173/adobe/callback` (ou a URL de produção do seu projeto).

---

## 4. Supabase Edge Function (`adobe-token-exchange`)

Arquivo: `supabase/functions/adobe-token-exchange/index.ts`

```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { code, redirect_uri } = await req.json();

    if (!code) {
      return new Response(JSON.stringify({ error: 'Missing authorization code' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const clientId = Deno.env.get('ADOBE_CLIENT_ID') || '';
    const clientSecret = Deno.env.get('ADOBE_CLIENT_SECRET') || '';

    const bodyParams = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      redirect_uri: redirect_uri || '',
    });

    const response = await fetch('https://ims-na1.adobelogin.com/ims/token/v3', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: bodyParams.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Adobe IMS Error', details: data }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

---

## 5. Resumo da Integração de UI no Painel do Fotógrafo

| Componente | Funcionalidade |
| :--- | :--- |
| `PhotographerIntegrationsTab.tsx` | Exibe status da conexão com a Adobe (Conectado/Desconectado), ID do catálogo e botão de OAuth/Desconexão. |
| `AdobeImportModal.tsx` | Lista álbuns da conta Adobe Lightroom Cloud e cria automaticamente uma nova galeria com renditions web (2048px). |
| `GalleryDetailView.tsx` | Botão **"Exportar p/ Lightroom Cloud"** que sincroniza em lote a votação dos clientes (Pick / 5 Estrelas) direto na API da Adobe. |
| `AdobeOAuthCallbackView.tsx` | Processa o retorno OAuth da Adobe com animações de carregamento e confirmações por Toast. |
