# AutoCare

A premium, responsive automotive service website built with Next.js, TypeScript, and Tailwind CSS.

AutoCare is designed as a reusable, company-ready template for a modern car maintenance, diagnostics, repairs, and preventive care business. It is structured so the brand, service list, pricing, locations, testimonials, FAQs, and contact details can all be updated from a central configuration layer without redesigning the UI.

## Overview

This project is inspired by the conversion-focused structure of professional automotive service brands but implemented as an original, reusable template for a real automotive company. It includes:

- Premium landing page experience
- Service catalog and detail pages
- Booking flow and quote request form
- Vehicle brand support pages
- Service area coverage pages
- Blog/resources section
- About and contact pages
- Mobile-responsive layout and modern styling

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Lucide React icons

## Project Structure

```bash
src/
  app/
  components/
  config/
  lib/
  types/
public/
```

### Main configuration files

- `src/config/company.ts` — company profile, branding, navigation, hero, contact, and business data
- `src/config/services.ts` — services, pricing, features, and detail content
- `src/config/vehicles.ts` — supported brands and models
- `src/config/locations.ts` — service areas and city coverage
- `src/config/faqs.ts` — FAQ content
- `src/config/blog.ts` — blog/article data
- `src/config/images.ts` — centralized image references

This makes the project easy to adapt for another automotive company without refactoring the visual system.

## Features

- Responsive design for desktop, tablet, and mobile
- Reusable content-driven architecture
- Multi-step booking wizard
- Quote request form with validation
- Service detail pages with dynamic content
- Vehicle and location browsing
- SEO-friendly page structure
- Accessible UI patterns and semantic markup

## Getting Started

### Install dependencies

```bash
npm install
```

### Run locally

```bash
npm run dev
```

Then open:

```bash
http://localhost:3000
```

## Production build

```bash
npm run build
```

## Recommended GitHub repo name

Good options:

- `autocare-site`
- `autocare-auto-service`
- `autocare-website`
- `autocare-automotive-brand`

Recommended repo description:

> Premium responsive automotive service website built with Next.js and Tailwind CSS for a mobile and workshop-based car care business.

## Suggested Git commands

After creating the repo on GitHub, run:

```bash
git init
git add .
git commit -m "Initial commit: AutoCare automotive service website"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git push -u origin main
```

## Notes for future developers

- Update the brand and business information in `src/config/company.ts`
- Replace imagery in `src/config/images.ts`
- Add or edit services in `src/config/services.ts`
- Keep the UI generic and reuse the layout; do not hardcode company-specific copy into components

## License

This project is intended for demo, portfolio, or business website use. Add your preferred license before publishing publicly.

## Future improvements

- CMS/API integration
- Real booking backend
- Admin dashboard for service and content updates
- Real map integration
- Payment and scheduling workflows
