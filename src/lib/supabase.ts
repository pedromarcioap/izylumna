import { createClient } from '@supabase/supabase-js';

const meta = import.meta as any;
const supabaseUrl = meta.env?.VITE_SUPABASE_URL;
const supabaseAnonKey = meta.env?.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase Warning] As variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não foram encontradas nas variáveis de ambiente do Vite. A aplicação funcionará em modo autônomo (localStorage).'
  );
}

const safeUrl = supabaseUrl || 'https://kiotqcqbctdacjsxpixr.supabase.co';
const safeKey = supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtpb3RxY3FiY3RkYWNqc3hwaXhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5ODcxMTQsImV4cCI6MjEwNDU2MzExNH0.pxL0n0FozX0jpxRFpbKUj3e6JNEMSj3hzIkWay1R2B8';

export const supabase = createClient(safeUrl, safeKey);
