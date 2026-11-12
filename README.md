# Prestige Auto Clean Portal

A custom web portal for Prestige Auto Clean (mobile auto detailing): owner
dashboard, tech job screen, and customer booking page. Built by Matt Obergas /
City Park Solutions. Background and full plan: [PRESTIGE_BUILD_BRIEF.md](PRESTIGE_BUILD_BRIEF.md).

**Phases 1–4** are done: accounts + staff login, customers/vehicles/packages,
jobs and schedule, and the tech job screen (status, timer, checklist,
before/after photos). The public booking page and everything after are
later phases.

## Current accounts (Phase 1 setup)

- **GitHub:** code lives at `github.com/prestige-autoclean-cps/prestige-autoclean-portal`,
  owned by the `prestige-autoclean-cps` organization (Matt's `mobergas`
  account is a member with write access). The repo is currently **public** —
  see "Why the repo is public" below.
- **Supabase:** project `prestige-portal`, connected via `js/config.js`.
- **Vercel:** deployed under Matt's personal `mobergas` Hobby account/team
  (`City Park Solutions`), not a separate Prestige team — see "Why it's on
  the personal Vercel account" below.

### Why the repo is public

Vercel's free Hobby plan can't deploy from a **private** GitHub organization
repo — only its paid Pro plan can. Rather than pay before there's anything
worth paying for, we made the repo public instead. That's safe here: the only
credential committed anywhere in this project is the Supabase **publishable**
key, which is meant to be public (every table is locked down with Row Level
Security). The Supabase **secret** key has never been committed. Flip the
repo back to private once Prestige upgrades Vercel to Pro before real launch.

### Why it's on the personal Vercel account

Vercel also requires a paid plan for a second Team under one login, and
signing up a fully separate Vercel account hit a "phone number already in
use" wall (Vercel ties account uniqueness to phone number, not just email).
For now the project just lives as a second project in Matt's existing
personal Vercel Hobby account, alongside his other clients' projects —
billing/hosting isn't separated from City Park's other work yet. Move it to
its own Team (paid) later if/when that separation matters enough to pay for.

## What's in this folder

```
index.html          Sends you to login.html or dashboard.html
login.html           Staff login page
dashboard.html        Owner's "Today" dashboard; a tech's "My jobs today" list
schedule.html          Jobs in a date range you pick (defaults to the next 30 days), owner only
customers.html         List of customers, add a new one
customer.html          One customer: their info and their vehicles
packages.html          The package menu (owner only — names, prices, length, checklist)
job.html               One job: status, timer, checklist, before/after photos
assets/logo.png       Prestige Auto Clean logo
css/variables.css     Colors, fonts, sizes — the brand "tokens"
css/styles.css        Shared page styles
js/config.js          Supabase project URL + public key (you fill this in)
js/supabaseClient.js   Connects the pages to Supabase
js/auth.js             Login / logout / "who's logged in" helpers
js/util.js             Shared helpers (top nav bar, text escaping, date/time, etc.)
js/customers.js         Customer + vehicle database calls
js/packages.js          Package database calls
js/jobs.js              Job database calls
js/checklist.js         Checklist template + per-job checklist database calls
js/jobPhotos.js         Before/after photo upload + database calls
supabase/001_profiles_and_auth.sql              Database setup script for Phase 1
supabase/002_customers_vehicles_packages.sql     Database setup script for Phase 2
supabase/003_jobs.sql                            Database setup script for Phase 3
supabase/004_tech_job_screen.sql                 Database setup script for Phase 4
```

## Setup steps (already done — kept here for reference / a future handoff)

### Step 1 — GitHub (stores the code)

Done. Code is pushed to `github.com/prestige-autoclean-cps/prestige-autoclean-portal`.
If this ever needs redoing from scratch (e.g. a full handoff to a fresh
account): create a new repo under whichever account/org should own it, keep
it private if that account has a Vercel Pro plan (see "Why the repo is
public" above for why this one isn't), and push this folder's code to it.

### Step 2 — Supabase (database + logins)

1. Go to supabase.com and sign up with the same business email.
2. Click **New project**. Name it `prestige-portal`. Pick a strong database
   password and **save it somewhere safe** (a password manager) — you likely
   won't need it day-to-day, but you can't see it again later.
3. Once the project finishes setting up, click **SQL Editor** in the left
   sidebar → **New query**.
4. Open the file `supabase/001_profiles_and_auth.sql` in this folder, copy
   everything in it, paste it into the SQL Editor, and click **Run**. This
   creates the staff-login table and its security rules.
5. Click **Project Settings** (gear icon) → **API**. You'll see a
   **Project URL** and an **anon public** key. Send me both (or paste them
   into `js/config.js` yourself, replacing the two placeholder lines) —
   these are safe to put in the code, they are not secret.
6. Click **Authentication** → **Users** → **Add user** → **Create new
   user**. Add yourself as the first account (use a real email you can get
   into, and a password). This is the owner account.
7. Go back to **SQL Editor** → **New query** and run this, replacing the
   email with the one you just used, to make that first account the owner
   (every other new login defaults to "tech"):
   ```sql
   update profiles set role = 'owner'
   where id = (select id from auth.users where email = 'owner@example.com');
   ```
8. Repeat step 6 for each tech, using their real email addresses. No SQL
   needed for techs — "tech" is the default role.

### Step 3 — Vercel (hosting)

Done. Deployed from the repo above into Matt's personal Vercel account (see
"Why it's on the personal Vercel account" above). Every push to the GitHub
repo's `master` branch redeploys automatically within a minute or two.

### Step 4 — try it

1. Open the live Vercel URL. (You can also preview locally before pushing
   anything — in Claude Code, open the Browser pane and start the
   "static-preview" server from `.claude/launch.json`; don't just
   double-click `login.html`, since opening a file directly skips the
   styling and scripts.)
2. Log in with the owner email/password from Step 2.6. You should land on a
   page that says "Signed in as [your name] OWNER". Confirmed working.
3. Log out, then log in with a tech account — it should say "TECH" instead.

If a login fails, the most common cause is `js/config.js` still having the
placeholder text instead of your real Supabase URL/key (Step 2.5).

### Step 5 — Phase 2 setup (customers, vehicles, packages)

1. In Supabase, click **SQL Editor** → **New query**.
2. Open `supabase/002_customers_vehicles_packages.sql` in this folder, copy
   everything in it, paste it in, and click **Run**. This creates the
   customers, vehicles and packages tables (with the same kind of security
   rules as Step 2.4), and adds four **placeholder** packages so the
   Packages page isn't empty.
3. Log in as the owner on the live site. You'll see **Customers** and
   **Packages** in the top bar.
4. On the **Packages** page, click **Edit** on each placeholder package and
   replace the name, description and prices with the real ones from the
   Prestige owner (`PRESTIGE_BUILD_BRIEF.md`, question 1). No SQL needed —
   that page saves straight to the database.
5. On the **Customers** page, try **+ Add customer**, then open that
   customer and try **+ Add vehicle**. A tech login can view this page but
   can't add, edit, or delete — only the owner can.

### Step 6 — Phase 3 setup (jobs and schedule)

1. In Supabase, click **SQL Editor** → **New query**.
2. Open `supabase/003_jobs.sql` in this folder, copy everything in it,
   paste it in, and click **Run**. This creates the jobs table and its
   security rules.
3. Log in as the owner on the live site. The **Dashboard** now shows
   today's jobs, three stat cards (jobs today, revenue today, tips today —
   revenue and tips only count jobs marked "Done"), and a **+ New job**
   button. **Schedule** shows every upcoming job for the next 30 days.
4. Creating a job needs at least one customer with a vehicle (Customers
   page) and at least one tech login (Step 2.8) — add those first if you
   haven't yet.
5. Try **+ New job**: pick a customer, then one of their vehicles, then a
   package (price and length fill in automatically from the package menu —
   you can still edit them), a tech, and a date/time.
6. On a job, **Edit** lets the owner change the date/time, length, price,
   tip, assigned tech, address, or status (Scheduled → On the way → In
   progress → Done, or Cancelled). A tech login can only see jobs assigned
   to them — the real tech screen with status buttons and a timer comes in
   Phase 4.

### Step 7 — Phase 4 setup (tech job screen)

1. In Supabase, click **SQL Editor** → **New query**.
2. Open `supabase/004_tech_job_screen.sql` in this folder, copy everything
   in it, paste it in, and click **Run**. This creates the checklist and
   photo tables, lets a tech update the status of their own jobs (nothing
   else — an owner still controls price, address, assignment, etc.), and
   sets up a Storage "bucket" (a folder for uploaded files) for job photos.
3. On the **Packages** page, click **Checklist** on each package and add
   the steps a tech should follow for it (e.g. "Before photos", "Vacuum
   interior", "Wipe down dash"). These only apply to jobs created *after*
   you add them — existing jobs keep whatever checklist they were created
   with. There's no reorder button yet; delete and re-add a step to move
   it.
4. Log in as a **tech** on the live site. The dashboard now shows "My jobs
   today" instead of the old placeholder — click **Open job** on one.
5. Try the flow: **On my way** → **Start job** (starts a live timer) →
   check off checklist steps → take a **before** and **after** photo (on a
   phone this opens the camera) → **Finish job**.
6. As the owner, open that same job from the Dashboard or Schedule (**View
   job**) — you can see the tech's checklist progress and photos, and still
   use **Edit** to change price, address, or anything else a tech can't.

Payment collection at the "Finish job" step and texting the customer come
later (Phases 7–8), once Stripe and Twilio are connected.

## What's next

Phase 5 builds the public booking page: customers choose a package and time
without logging in, and the request shows up on the owner dashboard to
accept, decline, or reschedule. See `PRESTIGE_BUILD_BRIEF.md` for the full
build order and the questions to confirm with the Prestige owner before
each phase.
