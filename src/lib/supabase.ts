import { createClient } from '@supabase/supabase-js';

const meta = import.meta as any;
const SUPABASE_URL = meta.env?.VITE_SUPABASE_URL || 'https://uejlkwjsrtyppopjkbim.supabase.co';
const SUPABASE_ANON_KEY =
  meta.env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlamxrd2pzcnR5cHBvcGprYmltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5OTIzMDEsImV4cCI6MjA5MDU2ODMwMX0.-pwdef7XSwaNMaaANEg06w1HVweJVt0x36i7XYw_RCk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
