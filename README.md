# 📌 The Board

A cork-board style link saver — paste a link, pin it, find it later. Every user has a private, password-protected board backed by Supabase.

**Live demo:** https://the-board-five-amber.vercel.app

![Status](https://img.shields.io/badge/status-live-brightgreen)

## Features

- 🔐 **Email/password authentication** — each person gets their own private board
- 🔑 **Forgot password / reset flow** — full self-service password recovery via email
- 📌 **One-click saving** — paste any link (YouTube, Instagram, X, GitHub, TikTok, or anything else) and pin it
- 🧩 **Browser extension** — pin the page you're on with one click or a right-click, no copy-pasting (see `extension/`)
- 📲 **Android share target (PWA)** — install The Board on your phone and it appears in the native "Share to…" sheet from Instagram, YouTube, or any app
- 🏷️ **Categories + tags** — sort pins into categories, and add free-form tags for finer organization
- 🎨 **Custom categories** — add, rename, recolor, or delete your own categories from Account → Categories; everyone starts with the same 10 defaults but can fully customize their own list
- ✏️ **Edit pins** — rename a pin after the fact without deleting and re-adding it
- 🔍 **Search & filter** — find pins by title, URL, tag, or category
- ↕️ **Sorting** — newest, oldest, or alphabetical
- 🖼️ **YouTube thumbnails + favicons** — visual previews for YouTube links, favicons for everything else
- ⚡ **Realtime sync** — pins appear instantly across your own open tabs/devices (Supabase Realtime, no polling)
- ⬇️ **Export** — download all your pins as JSON any time
- 🌗 **Light/dark theme toggle**
- ⚙️ **Account settings** — change your password or wipe all your pins, self-service
- ⌨️ **Keyboard shortcuts** — `/` to search, `Esc` to close dialogs
- ☁️ **Cloud sync** — pins are stored in a real database (Supabase/Postgres), not just local storage
- 🔒 **Row-level security** — the database itself enforces that you can only see, edit, or delete your own pins

## Tech stack

- **Frontend:** Single-file HTML/CSS/JavaScript (no build step, no framework)
- **Backend:** [Supabase](https://supabase.com) (Postgres database + Auth + Realtime)
- **Hosting:** [Vercel](https://vercel.com)
- **Extension:** Manifest V3 browser extension (Chrome/Edge/Brave), see `extension/`
- **Fonts:** Permanent Marker, JetBrains Mono, Caveat (Google Fonts)

## How it works

1. Sign up with an email and password (min 6 characters)
2. Paste a link into the composer, optionally give it a label, category, and tags, and hit **Pin it**
3. Your pins are saved to Supabase, tied to your account, and sync instantly to any other tab/device you're logged in on
4. Only you can view, edit, or delete your own pins — enforced by Postgres Row-Level Security policies, not just app logic
5. Forgot your password? Use **Forgot password?** on the login screen — Supabase emails you a reset link
6. Install the browser extension (`extension/`) to pin whatever page you're on without opening the board first
7. **On Android:** open the site in Chrome → menu (⋮) → **"Install app"** (or **"Add to Home screen"**). Once installed, sharing a link from Instagram, YouTube, or any app shows **The Board** in the native Share sheet — tap it and the link is pinned automatically

## Project structure

```
the-board.html      # entire web app: markup, styles, and client-side JS in one file
manifest.json        # PWA manifest — enables install + Android share target
sw.js                 # minimal service worker required for PWA installability
icons/                # PWA icons (192/512, regular + maskable)
extension/           # browser extension source (see extension/README.md to install)
  manifest.json
  background.js
  icons/
```

## Setup / self-hosting

1. **Create a Supabase project** at [supabase.com](https://supabase.com)
2. **Create the `links` table:**
   ```sql
   create table public.links (
     id uuid primary key default gen_random_uuid(),
     url text not null,
     title text not null,
     category text not null,
     platform text not null default 'generic',
     youtube_id text,
     tags text[] not null default '{}',
     user_id uuid not null references auth.users(id),
     user_name text,
     user_avatar text,
     created_at timestamptz not null default now()
   );

   alter table public.links enable row level security;

   create policy "users can view their own links"
     on public.links for select
     to authenticated
     using (auth.uid() = user_id);

   create policy "authenticated users can insert their own links"
     on public.links for insert
     to authenticated
     with check (auth.uid() = user_id);

   create policy "users can update their own links"
     on public.links for update
     to authenticated
     using (auth.uid() = user_id)
     with check (auth.uid() = user_id);

   create policy "users can delete their own links"
     on public.links for delete
     to authenticated
     using (auth.uid() = user_id);

   -- Enable realtime sync
   alter publication supabase_realtime add table public.links;
   ```

   **Per-user custom categories table:**
   ```sql
   create table public.categories (
     id uuid primary key default gen_random_uuid(),
     user_id uuid not null references auth.users(id) on delete cascade,
     slug text not null,
     label text not null,
     hex text not null default '#8a7f6a',
     sort_order int not null default 0,
     created_at timestamptz not null default now(),
     unique (user_id, slug)
   );

   alter table public.categories enable row level security;

   create policy "users can view their own categories"
     on public.categories for select to authenticated using (auth.uid() = user_id);
   create policy "users can insert their own categories"
     on public.categories for insert to authenticated with check (auth.uid() = user_id);
   create policy "users can update their own categories"
     on public.categories for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
   create policy "users can delete their own categories"
     on public.categories for delete to authenticated using (auth.uid() = user_id);

   alter publication supabase_realtime add table public.categories;
   ```

   New users are automatically seeded with 10 default categories (AI, Startup, Hosting, etc.) on first login — see `loadCategories()` in `the-board.html`.
3. **Disable email confirmation** (optional, for instant login): Supabase Dashboard → Authentication → Sign In / Providers → Email → turn off "Confirm email"
4. **Add your production URL** to Supabase Dashboard → Authentication → URL Configuration (Site URL + Redirect URLs) — required for password reset emails to link back correctly
5. **Add your Supabase URL and anon key** to the `SUPABASE_URL` and `SUPABASE_ANON_KEY` constants near the top of the `<script>` block in `the-board.html`
6. **Deploy** — drag-and-drop the HTML file into [Vercel](https://vercel.com/new), Netlify, GitHub Pages, or any static host. **Important:** `manifest.json`, `sw.js`, and the `icons/` folder must be deployed alongside `the-board.html` at the same site root for the Android install + share target to work.
7. **(Optional) Install the browser extension** — see `extension/README.md`. Update `BOARD_URL` in `extension/background.js` to match your deployment first.

### Notes on the Android share target

- Only works once the site is **installed** as a PWA on the phone (Chrome menu → "Install app") — a plain browser tab won't show up in the Share sheet
- Only supported on **Android/Chrome**. iOS/Safari has never implemented the Web Share Target API, so this feature won't appear on iPhone — the browser extension is the closest equivalent there
- If you change your deployed domain, no extra config is needed — the share target is relative to wherever `manifest.json` is hosted

## Security notes

- The Supabase anon key is meant to be public — it only grants what your Row-Level Security policies allow
- Actual access control lives in Postgres RLS policies, not in the frontend code
- If you deploy this yourself, make sure to add your production domain to Supabase's **Authentication → URL Configuration** (Site URL + Redirect URLs)
- Consider turning on **Leaked Password Protection** in Supabase Dashboard → Authentication → Policies, which blocks passwords known to be compromised (checked against HaveIBeenPwned)

## License

MIT — see [LICENSE](./LICENSE). Free to use, modify, and distribute, including commercially.
