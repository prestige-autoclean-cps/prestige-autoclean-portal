// Staff list + editing (plain profile updates, covered by existing RLS)
// and the owner-only account actions that need the team-admin edge
// function (create/remove a login, reset a password) — see
// supabase/functions/team-admin/index.ts.

async function listStaff() {
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("id, name, phone, role, van, created_at")
    .order("name");
  if (error) throw error;
  return data;
}

async function updateStaffProfile(id, fields) {
  const { error } = await supabaseClient.from("profiles").update(fields).eq("id", id);
  if (error) throw error;
}

async function invokeTeamAdmin(body) {
  const { data, error } = await supabaseClient.functions.invoke("team-admin", { body });

  if (error) {
    if (error.context && typeof error.context.json === "function") {
      try {
        const parsed = await error.context.json();
        if (parsed && parsed.error) throw new Error(parsed.error);
      } catch (parseErr) {
        if (parseErr instanceof Error && parseErr.message !== "Failed to fetch") throw parseErr;
      }
    }
    throw new Error(error.message || "Request failed.");
  }

  if (data && data.error) throw new Error(data.error);
  return data;
}

async function createTech({ email, password, name, phone, van }) {
  return invokeTeamAdmin({ action: "create", email, password, name, phone, van });
}

async function removeStaffLogin(userId) {
  return invokeTeamAdmin({ action: "delete", userId });
}

async function resetStaffPassword(userId, password) {
  return invokeTeamAdmin({ action: "reset_password", userId, password });
}
