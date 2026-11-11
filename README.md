# Prestige Auto Clean Portal

A custom web portal for Prestige Auto Clean (mobile auto detailing): owner
dashboard, tech job screen, and customer booking page. Built by Matt Obergas /
City Park Solutions. Background and full plan: [PRESTIGE_BUILD_BRIEF.md](PRESTIGE_BUILD_BRIEF.md).

This is **Phase 1: accounts connected + staff login**. There's no real
dashboard yet — just enough wiring to prove an owner and a tech can each log
in and the system knows which is which. Later phases build the real screens
on top of this.

## What's in this folder

```
index.html          Sends you to login.html or dashboard.html
login.html           Staff login page
dashboard.html        Placeholder page (proves login + role works)
assets/logo.png       Prestige Auto Clean logo
css/variables.css     Colors, fonts, sizes — the brand "tokens"
css/styles.css        Shared page styles
js/config.js          Supabase project URL + public key (you fill this in)
js/supabaseClient.js   Connects the pages to Supabase
js/auth.js             Login / logout / "who's logged in" helpers
supabase/001_profiles_and_auth.sql   Database setup script for Phase 1
```

## Matt's setup steps

Do these in order. Nothing here requires coding — it's all clicking through
websites and copy/pasting. Ask the Prestige owner **which email address**
should own these accounts before you start (see question 7 in the build
brief) — use that same email for all four services below, so the business
owns its own accounts and a handoff later is clean.

### Step 1 — GitHub (stores the code)

1. Go to github.com and sign up (or log in) with the Prestige business email.
2. Click the **+** in the top right → **New repository**.
3. Name it `prestige-portal`. Keep it **Private**. Don't check any of the
   "initialize with..." boxes. Click **Create repository**.
4. GitHub will show you a page with commands under "...or push an existing
   repository from the command line." Keep that page open — send me (Claude
   Code) the repository's URL (it looks like
   `https://github.com/yourname/prestige-portal.git`) and I'll push this code
   up for you.

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

1. Go to vercel.com and sign up with the same business email — you can
   choose "Continue with GitHub" to link it to the account from Step 1.
2. Click **Add New** → **Project**, then **Import** the `prestige-portal`
   repository from GitHub (once I've pushed the code there).
3. Leave all the build settings as default (this is a plain HTML/CSS/JS site,
   nothing to configure) and click **Deploy**.
4. Vercel gives you a URL like `prestige-portal.vercel.app` — that's the
   live site. Every time new code is pushed to GitHub, Vercel updates it
   automatically within a minute or two.

### Step 4 — try it

1. Open the Vercel URL once it's deployed. (You can also preview locally
   before pushing anything — in Claude Code, open the Browser pane and
   start the "static-preview" server from `.claude/launch.json`; don't just
   double-click `login.html`, since opening a file directly skips the
   styling and scripts.)
2. Log in with the owner email/password from Step 2.6. You should land on a
   page that says "Signed in as [your name] OWNER".
3. Log out, then log in with a tech account — it should say "TECH" instead.

If a login fails, the most common cause is `js/config.js` still having the
placeholder text instead of your real Supabase URL/key (Step 2.5).

## What's next

Phase 2 adds customer and vehicle records and the package/pricing menu. See
`PRESTIGE_BUILD_BRIEF.md` for the full build order and the questions to
confirm with the Prestige owner before each phase.
