// Shared helpers used across the staff pages.

// Minimal HTML escaping for free-text fields (names, notes, etc.) before
// they're inserted into the page, per the brief's "escape free-text fields"
// rule.
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
}

function formatMoney(amount) {
  const n = Number(amount);
  return "$" + (Number.isFinite(n) ? n.toFixed(2) : "0.00");
}

function vehicleSizeLabel(size) {
  return { car: "Car", suv: "SUV", truck_van: "Truck / Van" }[size] || size;
}

// ---- Jobs / schedule helpers (phase 3+) ----

const JOB_STATUSES = ["scheduled", "on_the_way", "in_progress", "done", "cancelled"];

function jobStatusLabel(status) {
  return (
    {
      scheduled: "Scheduled",
      on_the_way: "On the way",
      in_progress: "In progress",
      done: "Done",
      cancelled: "Cancelled",
    }[status] || status
  );
}

function startOfLocalDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Returns the [start, end) ISO range for "today" in the browser's local time.
function todayRangeIso() {
  const start = startOfLocalDay(new Date());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

// Returns the [start, end) ISO range from the start of today through
// `days` days ahead.
function upcomingRangeIso(days) {
  const start = startOfLocalDay(new Date());
  const end = new Date(start);
  end.setDate(end.getDate() + days);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

// Turns two <input type=date> values (inclusive, local time) into the
// [start, end) ISO range Supabase queries expect.
function dateRangeIso(fromDateStr, toDateStr) {
  const start = startOfLocalDay(new Date(`${fromDateStr}T00:00`));
  const end = startOfLocalDay(new Date(`${toDateStr}T00:00`));
  end.setDate(end.getDate() + 1);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function formatDateHeading(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

// Combines separate <input type=date> and <input type=time> values (in the
// browser's local time) into one UTC ISO timestamp for Supabase.
function localInputsToIso(dateStr, timeStr) {
  return new Date(`${dateStr}T${timeStr}`).toISOString();
}

function isoToDateInput(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function isoToTimeInput(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function vehicleLabel(v) {
  return [v.year, v.make, v.model].filter(Boolean).join(" ") || "Vehicle";
}

// Builds the dark top nav bar shown on every staff page. Owner-only links
// are left out entirely for a tech (RLS also blocks the underlying data,
// this just keeps the tech's nav uncluttered).
function renderNav(profile, activePage) {
  const links = [{ href: "dashboard.html", key: "dashboard", label: "Dashboard" }];
  if (profile.role === "owner") {
    links.push({ href: "schedule.html", key: "schedule", label: "Schedule" });
    links.push({ href: "customers.html", key: "customers", label: "Customers" });
    links.push({ href: "packages.html", key: "packages", label: "Packages" });
  }

  const linkHtml = links
    .map(
      (link) =>
        `<a class="nav-link${link.key === activePage ? " active" : ""}" href="${link.href}">${escapeHtml(link.label)}</a>`
    )
    .join("");

  return `
    <nav class="top-nav">
      <div class="top-nav-brand"><img src="assets/logo.png" alt="Prestige Auto Clean" /></div>
      <div class="top-nav-links">${linkHtml}</div>
      <div class="top-nav-user">
        <span class="role-badge">${escapeHtml(profile.role)}</span>
        <button class="btn btn-secondary" id="nav-logout-btn">Sign out</button>
      </div>
    </nav>
  `;
}

function wireNavLogout() {
  const btn = document.getElementById("nav-logout-btn");
  if (btn) btn.addEventListener("click", logoutStaff);
}
