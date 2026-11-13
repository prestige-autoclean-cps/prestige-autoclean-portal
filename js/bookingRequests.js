// Booking requests from the public page, plus the owner's accept/decline/
// suggest-a-different-time actions. RLS: see supabase/005_booking_requests.sql.

async function submitBookingRequest(fields) {
  const { data, error } = await supabaseClient.from("booking_requests").insert(fields).select().single();
  if (error) throw error;
  return data;
}

async function listPendingBookingRequests() {
  const { data, error } = await supabaseClient
    .from("booking_requests")
    .select(
      "id, customer_name, customer_phone, customer_email, vehicle_size, package_id, " +
        "requested_day, requested_time, address, area, has_water_and_power, notes, status, created_at"
    )
    .eq("status", "new")
    .order("created_at");
  if (error) throw error;
  return data;
}

async function updateBookingRequest(id, fields) {
  const { error } = await supabaseClient.from("booking_requests").update(fields).eq("id", id);
  if (error) throw error;
}

async function findCustomerByPhone(phone) {
  const { data, error } = await supabaseClient
    .from("customers")
    .select("id, name, phone, email, address, area, notes")
    .eq("phone", phone)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Accepting a request turns it into a real job: matches an existing
// customer by phone (or creates a new one), adds a vehicle for them (the
// booking page only collects size, so year/make/model are left blank for
// the owner to fill in later), then creates the job itself.
async function acceptBookingRequest(request, { scheduledStart, scheduledMinutes, assignedTech, price }) {
  let customer = await findCustomerByPhone(request.customer_phone);
  if (!customer) {
    customer = await createCustomer({
      name: request.customer_name,
      phone: request.customer_phone,
      email: request.customer_email || "",
      address: request.address,
      area: request.area || "",
      notes: "",
    });
  }

  const vehicle = await createVehicle({
    customer_id: customer.id,
    year: "",
    make: "",
    model: "",
    color: "",
    plate_last: "",
    size: request.vehicle_size,
    care_notes: "",
  });

  const job = await createJobWithChecklist({
    customer_id: customer.id,
    vehicle_id: vehicle.id,
    package_id: request.package_id,
    assigned_tech: assignedTech,
    scheduled_start: scheduledStart,
    scheduled_minutes: scheduledMinutes,
    price: price,
    address: request.address,
  });

  await updateBookingRequest(request.id, { status: "accepted", job_id: job.id });
  return job;
}
