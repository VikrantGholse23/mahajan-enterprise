import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://laiqoysoyxmmhjrryzac.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_TF7_UAzyHU3JR80mYy1LIw_BIccR3iy';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper to check if tables exist and are reachable
export async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('procurement_statements').select('id').limit(1);
    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
        return { connected: true, tablesReady: false, message: 'Connected to Supabase, but schema.sql not yet executed.' };
      }
      return { connected: false, tablesReady: false, message: error.message };
    }
    return { connected: true, tablesReady: true, message: 'Connected to Supabase Cloud Database' };
  } catch (err) {
    return { connected: false, tablesReady: false, message: err.message };
  }
}
