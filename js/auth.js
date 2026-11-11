// Staff login helpers shared by login.html and dashboard.html.
// Relies on supabaseClient.js having already created `supabaseClient`.

async function loginStaff(email, password) {
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

async function logoutStaff() {
  await supabaseClient.auth.signOut();
  window.location.href = "login.html";
}

// Returns the logged-in user's profile row (name, role, phone, van), or null
// if nobody is logged in. Every staff page should call this before showing
// anything, since RLS — not this check — is what actually keeps data safe.
async function getStaffProfile() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) return null;

  const { data, error } = await supabaseClient
    .from("profiles")
    .select("id, name, role, phone, van")
    .eq("id", session.user.id)
    .single();

  if (error) {
    console.error("Could not load profile:", error.message);
    return null;
  }
  return data;
}

// Call at the top of any staff-only page. Sends the visitor to the login
// page if they're not signed in or have no profile row yet.
async function requireStaffSession() {
  const profile = await getStaffProfile();
  if (!profile) {
    window.location.href = "login.html";
    return null;
  }
  return profile;
}
