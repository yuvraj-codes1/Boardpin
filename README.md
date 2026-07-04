# 📌 The Board

A cork-board style link saver — paste a link, pin it, find it later. Every user has a private, password-protected board backed by Supabase.

Website- https://board-five-amber.vercel.app/

![Status](https://img.shields.io/badge/status-live-brightgreen)

## Features

- 🔐 **Email/password authentication** — each person gets their own private board
- 📌 **One-click saving** — paste any link (YouTube, Instagram, X, GitHub, TikTok, or anything else) and pin it
- 🏷️ **Categorization** — sort pins into categories like AI, Startup, Hosting, API, and more
- 🔍 **Search & filter** — find pins by title, URL, or category
- 🖼️ **YouTube thumbnails** — auto-generated preview thumbnails for YouTube links
- ☁️ **Cloud sync** — pins are stored in a real database (Supabase/Postgres), not just local storage, so they follow you across devices
- 🔒 **Row-level security** — the database itself enforces that you can only see and delete your own pins

## Tech stack

- **Frontend:** Single-file HTML/CSS/JavaScript (no build step, no framework)
- **Backend:** [Supabase](https://supabase.com) (Postgres database + Auth)
- **Hosting:** [Vercel](https://vercel.com)
- **Fonts:** Permanent Marker, JetBrains Mono, Caveat (Google Fonts)

## How it works

1. Sign up with an email and password (min 6 characters)
2. Paste a link into the composer, optionally give it a label and category, and hit **Pin it**
3. Your pins are saved to Supabase, tied to your account
4. Log in from any device to see the same board
5. Only you can view or delete your own pins — enforced by Postgres Row-Level Security policies, not just app logic

## Project structure

```
the-board.html   # entire app: markup, styles, and client-side JS in one file
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

   create policy "users can delete their own links"
     on public.links for delete
     to authenticated
     using (auth.uid() = user_id);
   ```
3. **Disable email confirmation** (optional, for instant login): Supabase Dashboard → Authentication → Sign In / Providers → Email → turn off "Confirm email"
4. **Add your Supabase URL and anon key** to the `SUPABASE_URL` and `SUPABASE_ANON_KEY` constants near the top of the `<script>` block in `the-board.html`
5. **Deploy** — drag-and-drop the HTML file into [Vercel](https://vercel.com/new), Netlify, GitHub Pages, or any static host

## Security notes

- The Supabase anon key is meant to be public — it only grants what your Row-Level Security policies allow
- Actual access control lives in Postgres RLS policies, not in the frontend code
- If you deploy this yourself, make sure to add your production domain to Supabase's **Authentication → URL Configuration** (Site URL + Redirect URLs)

## License

MIT — see [LICENSE](./LICENSE). Free to use, modify, and distribute, including commercially.
