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

The admin dashboard is protected and requires a valid session.

Default local demo credentials used in the app:

- admin / admin123
- manager / manager123
- staff / staff123

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

### AI assistant (Google Gemini)

The chat UI calls `/api/ai/chat` on the server. The quote form’s optional service guide calls `/api/ai/service-guide`, sending only the issue description and available make, model, and year. The Gemini API key stays on the server and is never sent to the browser. The guide uses the public catalog, validates suggested service IDs, and shows deterministic safety guidance for potentially unsafe symptoms; it is general guidance, not a diagnosis.

Copy `.env.example` to `.env.local` and set:

```bash
GEMINI_API_KEY=your_google_gemini_api_key
GEMINI_MODEL=gemini-3.8-flash
```

On Vercel, add the same variables in Project Settings → Environment Variables. Do not use a `NEXT_PUBLIC_` prefix for the API key.

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
