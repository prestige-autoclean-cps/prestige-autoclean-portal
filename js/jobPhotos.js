// Before/after photo uploads. Files go to the "job-photos" Storage bucket;
// job_photos just tracks what was uploaded, for which job. RLS: see
// supabase/004_tech_job_screen.sql.

async function listJobPhotos(jobId) {
  const { data, error } = await supabaseClient
    .from("job_photos")
    .select("id, kind, storage_path, created_at")
    .eq("job_id", jobId)
    .order("created_at");
  if (error) throw error;
  return data;
}

function jobPhotoUrl(storagePath) {
  const { data } = supabaseClient.storage.from("job-photos").getPublicUrl(storagePath);
  return data.publicUrl;
}

async function uploadJobPhoto(jobId, kind, file) {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${jobId}/${kind}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadError } = await supabaseClient.storage
    .from("job-photos")
    .upload(path, file, { contentType: file.type || "image/jpeg" });
  if (uploadError) throw uploadError;

  const { data: { session } } = await supabaseClient.auth.getSession();
  const { data, error } = await supabaseClient
    .from("job_photos")
    .insert({ job_id: jobId, kind, storage_path: path, uploaded_by: session.user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteJobPhoto(photo) {
  const { error: removeError } = await supabaseClient.storage.from("job-photos").remove([photo.storage_path]);
  if (removeError) throw removeError;

  const { error } = await supabaseClient.from("job_photos").delete().eq("id", photo.id);
  if (error) throw error;
}
