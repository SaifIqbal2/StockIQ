import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'placeholder-key';

export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && 
  (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) &&
  !import.meta.env.VITE_SUPABASE_URL.includes('placeholder')
);

if (!isSupabaseConfigured) {
  console.warn(
    '⚠️ [StockIQ Vercel Warning] Supabase credentials not found in environment variables. ' +
    'Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your Vercel Project Settings for live production database sync.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
