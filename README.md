# The Board

A cork-board style link saver — paste a link, pin it, find it later.

Pin links from anywhere (YouTube, Instagram, TikTok, or any URL), organize them
into categories, tag them, and get an automatic AI-generated label when a
caption/thumbnail is available. Installable as a PWA on Android/iOS/desktop.

## Stack

- **Frontend:** single static HTML file (`the-board.html`), no build step
- **Auth & database:** [Supabase](https://supabase.com) (Postgres + Auth),
  secured with Row Level Security (see [Security](#security) below)
- **AI labeling:** a Vercel serverless function (`api/label.js`) that calls
  Google's Gemini API server-side
- **Hosting:** [Vercel](https://vercel.com)

## Setup

### 1. Supabase project

Create a project at [supabase.com](https://supabase.com), then:

1. Create a `links` table and a `categories` table (see
   [`the-board.html`](./the-board.html) for the exact columns each table
   read/write expects — search for `rowToLink` / `rowToCategory`).
2. **Enable Row Level Security on both tables** and add policies restricting
   `select` / `insert` / `update` / `delete` to rows where
   `user_id = auth.uid()`. This is the real access-control boundary for this
   app — see [Security](#security).
3. In `the-board.html`, set `SUPABASE_URL` and `SUPABASE_ANON_KEY` to your
   project's values (Project Settings → API in the Supabase dashboard).
   The anon key is a public, client-safe key by design — it is **not** a
   secret — but it only stays safe to expose if RLS is correctly configured.

### 2. AI labeling (optional)

1. Get a free API key from [Google AI Studio](https://aistudio.google.com).
2. In your Vercel project, set an environment variable:
   ```
   GEMINI_API_KEY = your_key_here
   ```
   Set this in **Vercel → Project Settings → Environment Variables** —
   never commit it to source control. The app works without this; links just
   won't get an AI-suggested title.

### 3. Deploy

Deploy the repo to Vercel (or `vercel deploy` from the CLI). `vercel.json`
already configures security headers for the deployment — see below.

## Security

This app has been reviewed and hardened with the following in place. If
you're forking or extending it, please keep these intact:

- **Rate limiting** — the `/api/label` endpoint enforces a per-IP request
  limit (see `api/_rateLimit.js`) and returns `429` with `Retry-After` once
  exceeded.
- **Input validation** — all input to `/api/label` is validated against a
  strict allow-list schema (type, length, and format checks; unexpected
  fields are rejected outright). See `api/_validate.js`.
- **Server-side secrets** — `GEMINI_API_KEY` is read only from an environment
  variable inside the serverless function and is never sent to or readable
  by the browser. Rotate it immediately (see comments in `api/label.js`) if
  it's ever exposed.
- **Row Level Security is the real data boundary.** The Supabase anon key
  embedded in the frontend is meant to be public, but it only grants access
  Supabase decides to allow — that decision lives entirely in your RLS
  policies, not in this codebase. Misconfigured RLS means any anon key
  holder could read or write any user's data, regardless of anything else
  in this app.
- **Output escaping** — all user-supplied content (titles, tags, category
  names, URLs) is HTML-escaped before being rendered, and links are only
  ever rendered as clickable if they're a genuine `http(s)://` URL.
- **Security headers & CSP** — see `vercel.json` for the headers applied to
  every response, including a Content-Security-Policy scoped to the small
  set of external hosts this app actually talks to.

If you find a security issue, please open a private report rather than a
public issue — see [Reporting a vulnerability](#reporting-a-vulnerability).

### Reporting a vulnerability

If you discover a security vulnerability, please **do not open a public
GitHub issue**. Instead, report it privately (e.g. via GitHub's
["Report a vulnerability"](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing/privately-reporting-a-security-vulnerability)
flow under this repo's Security tab, or by contacting the maintainer
directly) so it can be fixed before details are public.

## License

Add a license of your choice (e.g. MIT) before making this public, if you
haven't already — GitHub treats repos without a `LICENSE` file as "all rights
reserved" by default.
