const SUPABASE_URL = 'https://kszbefusczgcdknaakwx.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable__F3pll0BVKD3eYJ0rqEaKQ_6WmKNgpW ';

window.supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

const supabaseClient = window.supabaseClient;