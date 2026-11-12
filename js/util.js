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

// Builds the dark top nav bar shown on every staff page. Owner-only links
// are left out entirely for a tech (RLS also blocks the underlying data,
// this just keeps the tech's nav uncluttered).
function renderNav(profile, activePage) {
  const links = [{ href: "dashboard.html", key: "dashboard", label: "Dashboard" }];
  if (profile.role === "owner") {
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
