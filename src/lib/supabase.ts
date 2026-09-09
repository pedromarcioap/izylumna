import { createClient, SupabaseClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isValidUrl =
  typeof rawUrl === 'string' &&
  rawUrl.trim().length > 0 &&
  (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) &&
  !rawUrl.toLowerCase().includes('placeholder');

const isValidKey =
  typeof rawKey === 'string' &&
  rawKey.trim().length > 0 &&
  !rawKey.toLowerCase().includes('placeholder');

export const isSupabaseConfigured: boolean = Boolean(isValidUrl && isValidKey);

if (!isSupabaseConfigured) {
  console.warn(
    '[Supabase Warning] VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não estão configuradas ou contêm valores "placeholder". O cliente Supabase foi desativado e a aplicação funcionará 100% via armazenamento local (localStorage) sem disparar NENHUMA chamada de rede.'
  );
}

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(rawUrl!, rawKey!)
  : null;
