// Data access for jobs. RLS enforces that an owner sees/manages every job
// and a tech only ever sees their own assigned jobs — see
// supabase/003_jobs.sql. No joins here on purpose: pages fetch customers,
// vehicles, packages and techs separately and look them up locally, which
// sidesteps relying on PostgREST's embedded-join relationship naming.

async function listJobsForRange(startIso, endIso) {
  const { data, error } = await supabaseClient
    .from("jobs")
    .select(
      "id, customer_id, vehicle_id, package_id, assigned_tech, scheduled_start, " +
        "scheduled_minutes, address, status, price, tip, payment_status, started_at, finished_at"
    )
    .gte("scheduled_start", startIso)
    .lt("scheduled_start", endIso)
    .order("scheduled_start");
  if (error) throw error;
  return data;
}

async function getJob(id) {
  const { data, error } = await supabaseClient
    .from("jobs")
    .select(
      "id, customer_id, vehicle_id, package_id, assigned_tech, scheduled_start, " +
        "scheduled_minutes, address, status, price, tip, payment_status, started_at, finished_at"
    )
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

async function createJob(fields) {
  const { data, error } = await supabaseClient.from("jobs").insert(fields).select().single();
  if (error) throw error;
  return data;
}

// Creates the job, then copies that package's checklist_templates steps
// into job_checklist_items for this specific job (see js/checklist.js).
async function createJobWithChecklist(fields) {
  const job = await createJob(fields);

  if (fields.package_id) {
    const steps = await listChecklistTemplate(fields.package_id);
    if (steps.length > 0) {
      const rows = steps.map((s) => ({ job_id: job.id, step_order: s.step_order, step_text: s.step_text }));
      const { error } = await supabaseClient.from("job_checklist_items").insert(rows);
      if (error) throw error;
    }
  }

  return job;
}

async function updateJob(id, fields) {
  const { error } = await supabaseClient.from("jobs").update(fields).eq("id", id);
  if (error) throw error;
}

async function deleteJob(id) {
  const { error } = await supabaseClient.from("jobs").delete().eq("id", id);
  if (error) throw error;
}

async function listTechs() {
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("id, name")
    .eq("role", "tech")
    .order("name");
  if (error) throw error;
  return data;
}

async function listAllVehicles() {
  const { data, error } = await supabaseClient
    .from("vehicles")
    .select("id, customer_id, year, make, model, size");
  if (error) throw error;
  return data;
}
