import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://laiqoysoyxmmhjrryzac.supabase.co';
const supabaseKey = 'sb_publishable_TF7_UAzyHU3JR80mYy1LIw_BIccR3iy';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Testing connection to Supabase...');
  try {
    const { data, error } = await supabase.from('parties').select('*').limit(5);
    if (error) {
      console.log('Response with error/status:', error.message, error.code);
    } else {
      console.log('Connection successful! Parties found:', data.length);
      console.log(data);
    }
  } catch (err) {
    console.error('Catch error:', err.message);
  }
}

testConnection();
