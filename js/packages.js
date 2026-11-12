// Data access for the package menu. RLS on the server enforces who can
// actually read/write these — see supabase/002_customers_vehicles_packages.sql.

async function listPackages() {
  const { data, error } = await supabaseClient
    .from("packages")
    .select("id, name, description, price_car, price_suv, price_truck_van, estimated_minutes, active, created_at")
    .order("created_at");
  if (error) throw error;
  return data;
}

async function getPackage(id) {
  const { data, error } = await supabaseClient
    .from("packages")
    .select("id, name, description, price_car, price_suv, price_truck_van, estimated_minutes, active, created_at")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

async function createPackage(fields) {
  const { data, error } = await supabaseClient.from("packages").insert(fields).select().single();
  if (error) throw error;
  return data;
}

async function updatePackage(id, fields) {
  const { error } = await supabaseClient.from("packages").update(fields).eq("id", id);
  if (error) throw error;
}

async function deletePackage(id) {
  const { error } = await supabaseClient.from("packages").delete().eq("id", id);
  if (error) throw error;
}
