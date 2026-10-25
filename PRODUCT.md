# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are Philippine vehicle owners who need preventive maintenance, diagnostics, repairs, or inspections at a workshop or mobile location. They use the public site to compare services, understand coverage, request a quote, and book a visit. Secondary users are AutoCare operations staff, managers, and administrators who use the protected admin dashboard to manage appointments, customer records, conversations, inquiries, approvals, reports, and service settings.

## Product Purpose

AutoCare combines a customer-facing automotive service website with an internal operations dashboard. The public site should make professional car care feel reachable and trustworthy, then move a visitor toward booking or requesting a quote. The admin surface should help staff answer the day's operational questions quickly and act on records without losing context.

## Positioning

AutoCare offers dealership-grade maintenance, diagnostics, and repair standards through a mixed workshop and mobile-service model. The differentiator is not a single service but the combination of manufacturer-matched work, transparent written findings, and service that can happen at the customer's location or in a properly equipped bay.

## Operating Context

Customers browse on phones and desktop, often while comparing prices or handling a vehicle issue between work and home. Bookings involve service selection, vehicle details, location coverage, date and time windows, and contact information. Staff work through appointment status, customer history, conversation handoff, inquiry triage, and approval queues. The application uses synthetic demo records for local and evaluation use; those records must not be presented as real customer proof.

## Capabilities and Constraints

The project is a Next.js 16 App Router application with React 19, TypeScript, Tailwind CSS 4, Drizzle ORM, and libsql. Public routes include home, about, booking, contact, locations, privacy, quote, resources, services, terms, and vehicles, with dynamic service, article, and vehicle-brand pages. Admin routes cover dashboard, appointments, approvals, assistant, audit, branches, chats, customers, inquiries, reports, services, settings, and vehicles. Authentication is session-cookie based and credentials are environment-configured. Existing route paths, business facts, service names, prices, vehicle coverage, and functional behavior must be preserved. The redesign may change layout, visual system, interaction patterns, and component structure without changing product truth.

## Brand Commitments

The AutoCare name, logo, navy-and-amber brand palette, sharp-edged button language, and car-care subject are established commitments. The redesign must keep the theme recognizable as an automotive service business. The user requested a motorsport-technical direction across both public and admin surfaces, and requested that existing routes and copy remain intact.

## Evidence on Hand

The repository contains service catalog data, vehicle-brand coverage, service-area data, FAQ content, article content, booking fields, admin demo records, and generated screenshots under `screenshots/`. The demo dataset is synthetic. There is no confirmed real customer testimonial, press coverage, certification, or performance benchmark beyond the configured site copy; future work must not invent proof.

## Product Principles

1. Make the next action obvious: book a service, request a quote, or act on the record in front of you.
2. Show evidence before asking for trust: clear service scope, prices, coverage, status, and written findings.
3. Keep operational work fast: scanability, consistent records, visible state, and minimal navigation cost.
4. Preserve the car-care identity while making the interface feel precise, mechanical, and current.
5. Use real product content and honest states; never fill space with invented proof or decorative dashboard noise.

## Accessibility & Inclusion

Interactive controls need visible keyboard focus, readable contrast, semantic labels, and touch-safe targets. Motion must respect `prefers-reduced-motion`. Responsive layouts must remain usable at phone, tablet, and desktop widths.
