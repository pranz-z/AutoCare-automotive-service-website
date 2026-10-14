# AutoCare Automotive Service Platform

A modern automotive service website and operations platform built with Next.js, React, TypeScript, and Tailwind CSS. The project combines a customer-facing business website with a protected internal admin dashboard for bookings, conversations, customer records, and operational support.

## Overview

AutoCare is designed for a Philippine automotive service business with mobile and workshop operations. It includes:

- Premium customer-facing website and landing pages
- Multi-step booking flow and service request system
- Vehicle, service, and branch content driven from configuration data
- AI-powered customer service assistant using Google Gemini (`gemini-3.8-flash` by default)
- Protected admin dashboard for operations and staff control
- Appointment and inquiry management views
- Customer conversation inbox and AI escalation flow
- Role-based access for admin, manager, and staff users

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Lucide React icons
- Google Gemini API integration via `@google/genai` (server-side only)

## Current Features

### Customer-facing app
- Responsive automotive service home page
- Service catalog and service detail pages
- Booking flow for vehicle, service, location, date, and contact details
- Quote request forms and customer contact pages
- Vehicle brand and branch/service area pages
- Blog and resource sections
- SEO-friendly app-router structure

### AI customer service
- Server-side AI assistant integrated with the website
- Google Gemini API inference (`GEMINI_MODEL`, default `gemini-3.8-flash`)
- Philippine-market service and pricing context
- Safety-aware responses for critical vehicle concerns
- Fallback messaging if the model is unavailable
- Role-aware prompt behavior and permission checks

### Admin operations dashboard
- Protected /admin route with login flow
- Dashboard overview for bookings, pending work, escalations, and activity
- Appointment management screens and detail views
- Customer management and operational records
- Chat inbox for customer/AI/staff conversations
- Inquiry management and escalation tracking
- Role-aware access: admin, manager, staff

## Project Structure

```bash
src/
  app/
    admin/
    api/
    ...customer pages
  components/
    admin/
    ai/
    booking/
    layout/
    ui/
  config/
  lib/
    ai/
    admin-data.ts
    admin-auth.ts
  types/
public/
```

### Key configuration files

- `src/config/company.ts` — brand, contact, service business profile, and site content
- `src/config/services.ts` — service catalog and pricing data
- `src/config/vehicles.ts` — vehicle brands and supported models
- `src/config/locations.ts` — service areas, provinces, and city coverage
- `src/config/faqs.ts` — customer support FAQ content
- `src/config/blog.ts` — resources and article content

## Admin Access

The admin dashboard is protected and requires a valid session. There are **no
built-in credentials** — accounts are configured per user via env vars:

```bash
# One var per account (admin, manager, staff), format "salt_hex:scrypt_hash_hex".
# Generate a credential pair:
node -e "const c=require('crypto');const s=c.randomBytes(16).toString('hex');console.log(s+':'+c.scryptSync('YOUR_PASSWORD',s,64).toString('hex'))"

# Then set in .env.local (dev) or Vercel env vars (production):
ADMIN_CREDENTIAL_ADMIN=<salt>:<hash>
ADMIN_CREDENTIAL_MANAGER=<salt>:<hash>
ADMIN_CREDENTIAL_STAFF=<salt>:<hash>
```

When none are set, `POST /api/admin/login` returns 503 and `/admin` cannot be
used. Sessions are HMAC-signed cookies (`ADMIN_SESSION_SECRET`, required in
production).

Access the dashboard at:

```bash
http://localhost:3000/admin
```

## Local Development

### Install dependencies

```bash
npm install
```

### Run the app

```bash
npm run dev
```

Then open:

```bash
http://localhost:3000
```

### Database (libsql / Turso)

The app uses `@libsql/client` + Drizzle ORM and reads `DATABASE_URL` (plus
`DATABASE_AUTH_TOKEN` for remote databases). Nothing migrates or seeds at
request time — schema and demo data are explicit CLI steps:

```bash
npm run db:migrate   # apply versioned migrations (safe to run twice)
npm run db:seed      # insert the fictional demo dataset (only if DB is empty)
```

Three connection modes:

| Mode | `DATABASE_URL` | Notes |
|---|---|---|
| Ephemeral (default) | unset → `:memory:` | Self-initializing demo; data vanishes on restart. Tests and CI use this. |
| Local file | `file:./data/autocare.db` | Persistent dev database. Run `db:migrate` (creates `data/`), then `db:seed` for demo data. |
| Turso (production) | `libsql://<db>-<org>.turso.io` | Requires `DATABASE_AUTH_TOKEN`. |

**Turso + Vercel setup:**

```bash
# 1. Install the Turso CLI and create a database
turso db create autocare
turso db show autocare          # copy the libsql:// URL
turso db tokens create autocare # copy the auth token

# 2. Apply schema from your machine (env vars or .env.local)
DATABASE_URL=libsql://... DATABASE_AUTH_TOKEN=... npm run db:migrate

# 3. Optional: demo data — only if you want it in production
DATABASE_URL=libsql://... DATABASE_AUTH_TOKEN=... npm run db:seed -- --production

# 4. Set env vars on Vercel: Project Settings → Environment Variables
#    DATABASE_URL=libsql://<db>-<org>.turso.io
#    DATABASE_AUTH_TOKEN=<token>
#    Then redeploy.
```

Both variables are server-only — never prefix them with `NEXT_PUBLIC_`.

## Deploy to Vercel

Production startup checks run in `src/instrumentation.ts` (`register()`): the
deploy **fails loudly** if `DATABASE_URL` is missing or not remote, and logs a
warning when no admin credentials are configured.

**Checklist:**

1. **Database** — `turso db create autocare`, then set on Vercel:
   - `DATABASE_URL=libsql://<db>-<org>.turso.io` (**required** — build/startup guard)
   - `DATABASE_AUTH_TOKEN=<token>` (**required** for the remote URL)
2. **Migrate** — from your machine or CI:
   ```bash
   DATABASE_URL=libsql://... DATABASE_AUTH_TOKEN=... npm run db:migrate
   ```
3. **Seed (optional, demo data only)** — fictional data, opt-in:
   ```bash
   DATABASE_URL=libsql://... DATABASE_AUTH_TOKEN=... npm run db:seed -- --production
   ```
4. **Sessions** — `ADMIN_SESSION_SECRET=<64-hex>` (see `.env.example` for the
   generator one-liner). Without it, sessions die on every cold start.
5. **Admin credentials** — at least one of `ADMIN_CREDENTIAL_ADMIN` /
   `ADMIN_CREDENTIAL_MANAGER` / `ADMIN_CREDENTIAL_STAFF`, format `salt:hash`
   (generator command under "Admin Access"). Admin login returns 503 without
   them.
6. **AI assistant (optional)** — `GEMINI_API_KEY` + `GEMINI_MODEL` after the
   data-handling review noted below. The assistant degrades to safe fallback
   responses when unset.
7. **Optional** — `NEXT_PUBLIC_SITE_URL=https://<domain>` (logout redirect);
   `ALLOW_DEMO_RESET=true` only if the demo-reset route/agent tool must stay
   live in production (off by default).
8. **Deploy** — push; Vercel runs `npm run build`. All API routes are Node
   runtime (`AsyncLocalStorage` is used for transaction scoping).

## AI assistant (Google Gemini)

The public sitewide chat calls `/api/ai/chat` on the server. It selects a small number of relevant public service, vehicle, location, FAQ, and article excerpts per question and displays server-selected source links. It has no access to private records or live availability; unsupported questions direct customers to contact or quote pages. Conversation history stays in the browser and is bounded per request; public chat does not persist conversations on the server. The quote form’s optional service guide calls `/api/ai/service-guide`, sending only the issue description and available make, model, and year. The Gemini API key stays on the server and is never sent to the browser. The guide uses the public catalog, validates suggested service IDs, and shows deterministic safety guidance for potentially unsafe symptoms; it is general guidance, not a diagnosis.

Copy `.env.example` to `.env.local` and set:

```bash
GEMINI_API_KEY=your_google_gemini_api_key
GEMINI_MODEL=gemini-3.8-flash
```

This is a professional demo, not a live automotive service. Use **synthetic demo scenarios only** with the free Gemini tier; do not enter actual client/customer data, personal or confidential information. Both AI endpoints reject common email, phone, VIN, plate, and labeled identifier patterns in submitted text, but free-form filtering cannot guarantee detection of every identifier or sensitive detail. The quote form itself remains separate from the AI guide. Do not invite external visitors to use live Gemini calls until the owner reviews Google's current API terms/data handling and confirms the audience and access posture meet the under-18 restriction. The repository does not configure Vercel Deployment Protection or a shared rate-limit store; verify deployment access settings in Vercel. Current rate limits are best-effort per serverless instance, not global. Keep `GEMINI_API_KEY` unset on publicly accessible environments until these decisions are resolved.

On Vercel, add server-side variables only after that review in Project Settings → Environment Variables. Do not use a `NEXT_PUBLIC_` prefix for the API key.

## Production Build

```bash
npm run build
```

## Testing

```bash
npm test
```

## Notes

- The app is intentionally structured around local configuration and app-driven content rather than a full database-first backend.
- The admin dashboard uses the current project architecture and local data patterns without breaking the customer-facing website.
- `GEMINI_API_KEY` must be set in the server environment (local `.env.local` or Vercel project settings) for the AI assistant and service guide to respond beyond fallback messaging. The service guide is an optional beta feature; get project-owner confirmation that its intended audience meets Google’s current Gemini API terms before enabling it in production.

## License

This project is intended for business, portfolio, or demo use. Add your preferred license before publishing publicly.

## Future roadmap

- Connect the admin dashboard to a real database backend
- Add persistent appointment and chat storage
- Add real authentication integration with a production identity provider
- Add richer reporting, analytics, and real-time updates
- Expand admin workflows for service operations and team management
