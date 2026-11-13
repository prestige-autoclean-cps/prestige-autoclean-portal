// Per-date availability (no recurring weekly pattern — the owner sets each
// specific date as open-with-hours or closed) and the busy-interval lookup
// for a given day. RLS: see supabase/007_date_availability.sql.

async function getDateAvailability(dayStr) {
  const { data, error } = await supabaseClient
    .from("date_availability")
    .select("date, is_open, open_time, close_time")
    .eq("date", dayStr)
    .maybeSingle();
  if (error) throw error;
  return data; // null when the owner hasn't set this date yet
}

async function listDateAvailabilityRange(startStr, endStr) {
  const { data, error } = await supabaseClient
    .from("date_availability")
    .select("date, is_open, open_time, close_time")
    .gte("date", startStr)
    .lt("date", endStr)
    .order("date");
  if (error) throw error;
  return data;
}

async function setDateAvailability(dayStr, fields) {
  const { error } = await supabaseClient
    .from("date_availability")
    .upsert({ date: dayStr, ...fields });
  if (error) throw error;
}

async function clearDateAvailability(dayStr) {
  const { error } = await supabaseClient.from("date_availability").delete().eq("date", dayStr);
  if (error) throw error;
}

async function getBusyIntervals(dayStr) {
  const { data, error } = await supabaseClient.rpc("get_busy_intervals", { for_day: dayStr });
  if (error) throw error;
  return data;
}

// Returns an array of Date objects: the valid appointment start times for
// `dayStr` (a "YYYY-MM-DD" string), given the package's duration and that
// day's availability row, leaving at least `bufferMinutes` of gap before
// and after every existing job. A missing or closed availability row means
// no slots at all.
function computeAvailableSlots(dayStr, availabilityRow, busyIntervals, durationMinutes, bufferMinutes, stepMinutes) {
  if (!availabilityRow || !availabilityRow.is_open) return [];

  const [openH, openM] = availabilityRow.open_time.split(":").map(Number);
  const [closeH, closeM] = availabilityRow.close_time.split(":").map(Number);
  const dayStart = new Date(`${dayStr}T00:00`);
  const rangeStart = new Date(dayStart);
  rangeStart.setHours(openH, openM, 0, 0);
  const rangeEnd = new Date(dayStart);
  rangeEnd.setHours(closeH, closeM, 0, 0);

  const bufferMs = bufferMinutes * 60 * 1000;
  const paddedBusy = busyIntervals.map((b) => ({
    start: new Date(b.starts_at).getTime() - bufferMs,
    end: new Date(b.ends_at).getTime() + bufferMs,
  }));

  const stepMs = stepMinutes * 60 * 1000;
  const durationMs = durationMinutes * 60 * 1000;
  const now = Date.now();
  const slots = [];

  for (let t = rangeStart.getTime(); t + durationMs <= rangeEnd.getTime(); t += stepMs) {
    if (t <= now) continue;
    const slotEnd = t + durationMs;
    const overlapsBusy = paddedBusy.some((b) => t < b.end && slotEnd > b.start);
    if (!overlapsBusy) slots.push(new Date(t));
  }

  return slots;
}
