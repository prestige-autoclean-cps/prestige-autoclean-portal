// Data access for customers and their vehicles. RLS on the server enforces
// who can actually read/write these — see supabase/002_customers_vehicles_packages.sql.

async function listCustomers() {
  const { data, error } = await supabaseClient
    .from("customers")
    .select("id, name, phone, email, address, area, notes, created_at")
    .order("name");
  if (error) throw error;
  return data;
}

async function getCustomer(id) {
  const { data, error } = await supabaseClient
    .from("customers")
    .select("id, name, phone, email, address, area, notes, created_at")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

async function createCustomer(fields) {
  const { data, error } = await supabaseClient.from("customers").insert(fields).select().single();
  if (error) throw error;
  return data;
}

async function updateCustomer(id, fields) {
  const { error } = await supabaseClient.from("customers").update(fields).eq("id", id);
  if (error) throw error;
}

async function deleteCustomer(id) {
  const { error } = await supabaseClient.from("customers").delete().eq("id", id);
  if (error) throw error;
}

async function listVehicles(customerId) {
  const { data, error } = await supabaseClient
    .from("vehicles")
    .select("id, customer_id, year, make, model, color, plate_last, size, care_notes, created_at")
    .eq("customer_id", customerId)
    .order("created_at");
  if (error) throw error;
  return data;
}

async function createVehicle(fields) {
  const { data, error } = await supabaseClient.from("vehicles").insert(fields).select().single();
  if (error) throw error;
  return data;
}

async function updateVehicle(id, fields) {
  const { error } = await supabaseClient.from("vehicles").update(fields).eq("id", id);
  if (error) throw error;
}

async function deleteVehicle(id) {
  const { error } = await supabaseClient.from("vehicles").delete().eq("id", id);
  if (error) throw error;
}
