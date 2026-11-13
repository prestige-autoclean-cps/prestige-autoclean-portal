// Weekly business hours (used to compute bookable time slots on the public
// booking page) and the busy-interval lookup for a given day. RLS: see
// supabase/006_availability_and_slots.sql.

async function listBusinessHours() {
  const { data, error } = await supabaseClient
    .from("business_hours")
    .select("weekday, is_open, open_time, close_time")
    .order("weekday");
  if (error) throw error;
  return data;
}

async function updateBusinessHours(weekday, fields) {
  const { error } = await supabaseClient.from("business_hours").update(fields).eq("weekday", weekday);
  if (error) throw error;
}

async function getBusyIntervals(dayStr) {
  const { data, error } = await supabaseClient.rpc("get_busy_intervals", { for_day: dayStr });
  if (error) throw error;
  return data;
}

// Returns an array of Date objects: the valid appointment start times for
// `dayStr` (a "YYYY-MM-DD" string), given the package's duration and the
// day's business hours, leaving at least `bufferMinutes` of gap before and
// after every existing job.
function computeAvailableSlots(dayStr, hoursRow, busyIntervals, durationMinutes, bufferMinutes, stepMinutes) {
  if (!hoursRow || !hoursRow.is_open) return [];

  const [openH, openM] = hoursRow.open_time.split(":").map(Number);
  const [closeH, closeM] = hoursRow.close_time.split(":").map(Number);
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
