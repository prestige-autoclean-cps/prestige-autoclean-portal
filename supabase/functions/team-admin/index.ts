// Team management edge function. This is the one place in the whole
// project that's allowed to touch the Supabase "service role" (secret)
// key — it never leaves this server-side function, and every request is
// checked to confirm the caller is actually the owner before anything
// happens.
//
// Deploy this from the Supabase dashboard: Edge Functions > Deploy a new
// function > "Via Editor", name it "team-admin", paste this whole file in,
// and click Deploy. See the README for the full walkthrough.
//
// Actions (sent as JSON body { action, ... }):
//   create         — { email, password, name, phone?, van? }  → new tech login
//   delete         — { userId }                                → remove a tech
//   reset_password — { userId, password }                      → set a tech's password

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("You must be signed in.");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // A client that acts as whoever called this function, just to find out
    // who they are.
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await callerClient.auth.getUser();
    if (userError || !user) throw new Error("You must be signed in.");

    // The admin client, using the secret key — this is what can actually
    // create/delete logins. Every action below re-checks that the caller
    // is the owner before using it.
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: callerProfile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (!callerProfile || callerProfile.role !== "owner") {
      throw new Error("Only the owner can manage the team.");
    }

    const body = await req.json();

    if (body.action === "create") {
      const { email, password, name, phone, van } = body;
      if (!email || !password || !name) {
        throw new Error("Name, email, and password are all required.");
      }

      const { data: created, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name },
      });
      if (createError) throw createError;

      if (phone || van) {
        const { error: updateError } = await adminClient
          .from("profiles")
          .update({ phone: phone || null, van: van || null })
          .eq("id", created.user.id);
        if (updateError) throw updateError;
      }

      return jsonResponse({ ok: true, id: created.user.id });
    }

    if (body.action === "delete") {
      const { userId } = body;
      if (!userId) throw new Error("Missing userId.");
      if (userId === user.id) throw new Error("You can't remove your own account here.");

      const { data: targetProfile } = await adminClient
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();
      if (!targetProfile) throw new Error("That person wasn't found.");
      if (targetProfile.role === "owner") throw new Error("Can't remove an owner account this way.");

      const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
      if (deleteError) throw deleteError;

      return jsonResponse({ ok: true });
    }

    if (body.action === "reset_password") {
      const { userId, password } = body;
      if (!userId || !password) throw new Error("Missing userId or password.");

      const { data: targetProfile } = await adminClient
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();
      if (!targetProfile) throw new Error("That person wasn't found.");
      if (targetProfile.role === "owner") throw new Error("Reset the owner's password from Supabase directly.");

      const { error: resetError } = await adminClient.auth.admin.updateUserById(userId, { password });
      if (resetError) throw resetError;

      return jsonResponse({ ok: true });
    }

    throw new Error("Unknown action.");
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : String(err) }, 400);
  }
});
