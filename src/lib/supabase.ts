import { createClient } from '@supabase/supabase-js';

const meta = import.meta as any;
const supabaseUrl = meta.env?.VITE_SUPABASE_URL;
const supabaseAnonKey = meta.env?.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase Warning] As variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não foram encontradas nas variáveis de ambiente do Vite. A aplicação funcionará em modo autônomo (localStorage).'
  );
}

const safeUrl = supabaseUrl || 'https://placeholder.supabase.co';
const safeKey = supabaseAnonKey || 'placeholder-anon-key';

export const supabase = createClient(safeUrl, safeKey);
