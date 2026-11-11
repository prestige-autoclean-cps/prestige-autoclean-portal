// Creates one shared Supabase client for every page to use.
// Loaded after config.js and the Supabase CDN script — see login.html / dashboard.html.

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
