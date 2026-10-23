import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://laiqoysoyxmmhjrryzac.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_TF7_UAzyHU3JR80mYy1LIw_BIccR3iy';

export const createClient = () =>
  createBrowserClient(
    supabaseUrl,
    supabaseKey,
  );
