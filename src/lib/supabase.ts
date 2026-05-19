import { createClient } from '@supabase/supabase-js';

const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').replace(/['"]/g, '');
const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').replace(/['"]/g, '');

const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const supabaseUrl = isValidUrl(envUrl) ? envUrl : 'https://nkvwyumzxobvxashtooo.supabase.co';
const supabaseAnonKey = envKey && envKey.trim().length > 0 ? envKey : 'sb_publishable_1B_0eojVv-yIUFTqMoPswg_2z0dglXi';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL and Anon Key are missing. Please provide them.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
