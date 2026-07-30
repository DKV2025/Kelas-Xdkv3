const SUPABASE_URL = 'https://ewcbfqvshmqlhzikcjva.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_eJN8XdsqI-A3pnNwbWjraA_gSMdv6MI';

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
