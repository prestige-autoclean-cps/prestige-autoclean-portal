// Checklist templates (owner-managed, per package) and per-job checklist
// items copied from them. RLS: see supabase/004_tech_job_screen.sql.

async function listChecklistTemplate(packageId) {
  const { data, error } = await supabaseClient
    .from("checklist_templates")
    .select("id, step_order, step_text")
    .eq("package_id", packageId)
    .order("step_order");
  if (error) throw error;
  return data;
}

async function addChecklistStep(packageId, stepText) {
  const existing = await listChecklistTemplate(packageId);
  const nextOrder = existing.length ? Math.max(...existing.map((s) => s.step_order)) + 1 : 1;
  const { data, error } = await supabaseClient
    .from("checklist_templates")
    .insert({ package_id: packageId, step_order: nextOrder, step_text: stepText })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteChecklistStep(id) {
  const { error } = await supabaseClient.from("checklist_templates").delete().eq("id", id);
  if (error) throw error;
}

async function listJobChecklistItems(jobId) {
  const { data, error } = await supabaseClient
    .from("job_checklist_items")
    .select("id, step_order, step_text, done")
    .eq("job_id", jobId)
    .order("step_order");
  if (error) throw error;
  return data;
}

async function setJobChecklistItemDone(id, done) {
  const { error } = await supabaseClient.from("job_checklist_items").update({ done }).eq("id", id);
  if (error) throw error;
}
