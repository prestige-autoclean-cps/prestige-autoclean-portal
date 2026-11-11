# Prestige Auto Clean Portal — Build Brief

Starting instructions for Claude Code. Read this whole file before writing any code.

## About the project

- **Client:** Prestige Auto Clean, a mobile auto detailing business (they drive to the customer's home or office).
- **Team size:** owner plus 1–3 detailing technicians ("techs").
- **Builder:** Matt Obergas, through City Park Solutions (DBA of City Park Holdings LLC). Matt builds and hosts the portal and charges Prestige a monthly support fee. Prestige may take a full handoff later, so keep the code clean, commented, and easy for another Claude Code session to pick up.
- **Matt has no coding experience.** Explain every step in plain language. When Matt needs to do something himself (create an account, paste a key, click a setting), give numbered steps that say exactly where to click. Never assume he knows a term; define it the first time.
- **Model to follow:** this is the same kind of build as Matt's earlier portals, Suds Hub (Bubble Down Car Wash) and the City Park parking portal: a custom web app, not no-code.

## Tech stack

- **GitHub:** stores the code. New repo, suggested name `prestige-portal`.
- **Supabase:** database, logins, photo storage, and edge functions (server code).
- **Vercel:** hosting. Use `prestige-portal.vercel.app` until a custom domain is bought.
- **Stripe:** payments (customer pays for jobs and monthly memberships). Start in test mode.
- **Twilio:** text messages (booking confirmations, "on the way" alerts). Can come later.
- **Resend:** email (receipts, before/after photo links). Can come later.

Create these accounts under a Prestige business email (or a separate email just for this client), not Matt's personal or City Park accounts. That keeps their data and billing separate and makes a handoff clean. Ask Matt which email to use before he signs up for anything.

Keep the code simple: plain HTML, CSS and JavaScript pages that talk to Supabase are fine. Split code into sensible files instead of one giant `index.html`.

## Who uses it (roles)

1. **Owner (admin):** sees and edits everything: all jobs, customers, revenue, supplies, team, settings.
2. **Tech:** sees only their own assigned jobs for today and upcoming days. Can update job status, check off checklists, upload photos, log supplies used, and mark a job finished. Cannot see revenue totals or other techs' pay.
3. **Customer:** uses the public booking page without logging in. Later, optionally, a simple account page to see past jobs, photos and their membership.

Enforce roles on the server with Supabase Row Level Security (RLS), not just by hiding buttons.

## Branding

- **Logo:** the Prestige Auto Clean logo (Matt will supply the image file; put it at `assets/logo.png`). White chrome letters with a royal blue outline, black badge underneath, blue flames.
- **Colors:**
  - Black (sidebar, headers, dark panels): `#0B0D14`
  - Royal blue (main buttons, active states, highlights): `#2438D4`
  - Darker blue for hover/link hover: `#16259A`
  - Light flame blue (badges, accents): `#6C8CFF`
  - Page background: `#EEF1F8`
  - Cards: `#FFFFFF`
  - Body text: `#12141C`; secondary text: `#4D5466`
  - Borders/dividers: `#E4E8F1` (light), `#C5CBDB` (button outlines)
  - Warning (low stock): `#C2410C`
- **Fonts (Google Fonts):**
  - Headlines and big numbers: **Saira**, italic, weight 800–900, uppercase. Matches the logo's racing look.
  - Everything else: **Inter**, weights 400–700.
- **Feel:** bold and clean. Rounded cards (14–16px corners), plenty of white space, no gradients or emoji. Buttons at least 44px tall so they work with gloves or wet hands.
- **Phone first for techs and customers.** The owner dashboard should also work on a phone (sidebar stacks on top).

## Screens (from the approved mockup)

### 1. Owner dashboard (desktop and phone)
- **Left sidebar (black):** logo, then Dashboard, Schedule, Customers, Booking requests, Revenue, Supplies, Team & settings. Active item is a blue pill.
- **Header:** today's date, big headline "TODAY ON THE ROAD", buttons "Log expense" and "+ New job".
- **Four stat cards:** Jobs today (with done / in progress counts), Revenue today, Tips today, Active members.
- **Today's jobs list:** time and length, customer and vehicle, package and address, assigned tech, and a status pill: Scheduled (gray), On the way (amber), In progress (blue), Done (green). Filter buttons for All / each tech.
- **Right column:**
  - New booking requests (dark card): customer, vehicle, package, requested day/time window, area. Buttons "Accept & assign" and "Suggest time".
  - Supplies running low: product, which van, a bar showing how full; turns orange-red under 25%.
  - This week: simple bar chart of revenue per day, tips included.

### 2. Customer & vehicle profile
- Back link to all customers.
- **Dark header:** initials circle, name, phone, email, area; "Monthly member" badge if they have a plan; buttons "Book a job" and "Text customer".
- **Stat cards:** Lifetime spend, Number of jobs, Customer since, Next visit.
- **Vehicles:** a card per vehicle with year/make/model, color, last part of plate, care notes (for example "ceramic coated, pH-neutral soap only"), last service date. "+ Add vehicle" button.
- **Service history table:** date, vehicle, service, tech, link to that job's photos, total (or "Member").
- **On-site notes:** where the water spigot and outlet are, gate or pet notes, customer preferences.
- **Membership card:** plan name, frequency, price, next charge date, "Manage plan" button.

### 3. Tech job screen (phone)
- **Dark header:** small logo, status pill with a running timer, job number for the day, package name as headline, customer and vehicle. Buttons: Navigate (opens Google/Apple Maps to the address), Call, Notes.
- **Photos:** Before and After sections. Tap "+ Take photo" to use the phone camera. Photos upload to Supabase Storage tied to the job.
- **Checklist:** per-package list of steps with large checkboxes and a "4 of 7" counter. Example for paint correction: walkaround and damage noted, before photos, wash/decon/clay, paint depth readings, compound and polish, wipe down and inspect, after photos.
- **Supplies used:** product and amount; "+ Add item". This lowers that van's inventory.
- **Bottom button:** "FINISH & COLLECT PAYMENT". Marks the job done, takes payment, and sends the customer a receipt plus a link to their before/after photos.

### 4. Customer booking page (phone, public)
- Dark header with logo, "BOOK YOUR DETAIL", "We come to your home or office".
- Step 1: choose a package (Maintenance wash, Interior deep clean, Full detail, Ceramic coating; each with a short description and price).
- Step 2: vehicle size (Car, SUV, Truck/Van). Price can change by size.
- Step 3: pick a day and Morning or Afternoon.
- Step 4: address, and a checkbox confirming an outdoor water spigot and outlet are available.
- Bottom: summary and total, "REQUEST APPOINTMENT" button, "We'll text you to confirm the exact time."
- Submitting creates a booking request that shows up on the owner dashboard.

## Database tables (starting point)

Adjust names if needed, but cover these:

- `profiles`: staff logins (owner or tech), name, phone, role, assigned van.
- `customers`: name, phone, email, address, area, on-site notes, created date.
- `vehicles`: belongs to a customer; year, make, model, color, plate (last digits), size (car/SUV/truck-van), care notes.
- `packages`: name, description, price by vehicle size, estimated length, active yes/no. Owner can edit these in Settings.
- `checklist_templates`: steps for each package, in order.
- `booking_requests`: from the public page; customer info, vehicle info, package, requested day and window, address, status (new / accepted / declined / rescheduled).
- `jobs`: customer, vehicle, package, scheduled start, assigned tech, address, status (scheduled / on the way / in progress / done / cancelled), price, tip, payment status, started and finished times.
- `job_checklist_items`: copied from the template when a job is created; done yes/no.
- `job_photos`: job, before or after, storage path, uploaded by, time.
- `vans`: name (Van 1, Van 2), assigned tech.
- `supplies`: product name, van, current amount, full amount, unit, low-stock threshold.
- `supply_usage`: job, product, amount used.
- `expenses`: date, category, amount, note, logged by.
- `memberships`: customer, vehicle, plan name, frequency, price, Stripe subscription id, status, next charge date.
- `audit_log`: who changed what and when.

## Build order

Build and test one phase at a time. At the end of each phase, show Matt how to try it, then commit and push to GitHub so Vercel deploys it.

1. **Setup:** create the repo, Supabase project, and Vercel project; connect them. Staff login (owner and tech).
2. **Customers, vehicles, packages:** add and edit customers and vehicles; owner manages the package menu and prices.
3. **Jobs and schedule:** create jobs, assign techs, today's job list with status and filters, owner dashboard stat cards.
4. **Tech job screen:** status updates, timer, checklist, before/after photos.
5. **Public booking page:** booking requests flowing into the owner dashboard; accept, decline, or suggest a time.
6. **Supplies:** inventory per van, usage logged from jobs, low-stock alerts.
7. **Payments:** Stripe for one-time jobs (pay at finish) and monthly memberships. Test mode first.
8. **Messages:** Twilio texts (confirmation, "on the way") and Resend emails (receipt with photo link).
9. **Revenue page:** daily, weekly and monthly revenue, tips, expenses, and per-tech totals.

## Lessons from Matt's earlier portals (avoid repeating these)

- **Write RLS policies for every action** (select, insert, update, delete) on every table. A missing policy makes saves "succeed" without saving anything, with no error. Check this first whenever a save doesn't stick.
- Make sure every database call sends the logged-in user's token, or RLS will silently block them.
- Never put the Supabase secret (service role) key in browser code. Only use it inside edge functions.
- Verify Stripe webhook signatures; confirm payments on the server, not in the browser.
- Use unique IDs (database-generated, or based on the current time), never "count of rows + 1".
- Check that any library loaded from a CDN link actually exists at that version before relying on it.
- Vercel and Supabase edge functions can sometimes keep serving old code right after a deploy. If a change doesn't appear, wait a minute or redeploy before assuming the code is wrong.
- Prefer named functions over long inline `onclick="..."` strings with escaped quotes.
- Before launch: upgrade Supabase to a paid plan for backups, switch Stripe to live mode with its own webhook secret, add server-side login lockout after repeated failed attempts, and escape any free-text fields (notes, names) before showing them on the page.

## Questions for Matt to confirm with the Prestige owner

Ask Matt these before the phase that needs them, and use placeholders until then:

1. Real package names, descriptions and prices, including any differences by vehicle size. (Needed by phase 2.)
2. Business hours and how long each package usually takes. (Phase 3.)
3. How customers pay: online when booking, card at the end of the job, cash, or a mix. Is a deposit required? (Phase 7.)
4. Do they offer monthly memberships now, and at what price and frequency? (Phase 7.)
5. Service area: cities or ZIP codes they cover, and any travel fee. (Phase 5.)
6. Add-ons like pet hair removal, odor treatment, or heavy-soil charges. (Phase 2.)
7. Which email address should own the GitHub, Supabase, Vercel and Stripe accounts? (Phase 1.)
8. Do they want a custom domain (for example `book.prestigeautoclean.com`)? (Any time.)
