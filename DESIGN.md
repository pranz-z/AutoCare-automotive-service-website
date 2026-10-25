# Design

## Direction

AutoCare uses a motorsport-technical service system: dense information, squared panels, visible rules, tabular figures, and one amber signal colour on a deep navy ground. The public site reads as a workshop pit board. The admin console reads as a service-control terminal. The car-care subject stays explicit through photography, service language, vehicle coverage, and booking flows; the interface is not a generic dark dashboard with automotive copy pasted on.

The user-pinned direction overrides the concept roll. The public page direction is the well-kept board: edge-to-edge modules, narrow gaps, flat fills, and varied tile contents. The admin surface uses the data-terminal style: cards darker than the ground, a 1px amber selection line, tabular numbers, and colour reserved for data and decisions.

## Colour

Brand commitments remain: navy `#0B1320`, secondary `#162433`, amber `#C47A2C`, warm canvas `#F3EFE6`, surface `#FFFBF5`, ink `#121820`, muted `#5E6A76`, line `#D7D0C4`.

The public site uses warm light fields for reading and service detail, with navy fields for hero, process, testimonials, CTA, and footer. Amber is the action and signal colour, not a decorative wash. The admin shell uses a near-black navy ground, panels one step lighter, muted steel text, and amber for selection, focus, and the primary decision. No gradients, glass, decorative shadows, or coloured halos.

## Type

Barlow Condensed is the display face for headings, section titles, and large data. Barlow is the body face. Headings are uppercase at display sizes; body and form copy stay sentence case. Numbers use tabular figures. Labels are small uppercase text at 10–12px with moderate tracking, never below 12px for body copy.

## Layout

Public pages use a 12-column grid, 80rem maximum content width, and 16–32px outer padding. Hero and footer use full-bleed boards with 8px gaps and 2px outer gutters. Sections have one heading and a clear reading order. Detail pages use a dark title board and a ruled content column.

Admin pages use a 240px labelled sidebar, a compact top bar, a 1px rule under the title row, and a 12-column data canvas. Tables become stacked record cards on phones. Lists use rules and alignment, not zebra striping. The most frequent action is visible in the title row and repeated on the record that needs it.

## Components

Buttons are sharp rectangles with a 48px minimum height, uppercase 12px labels, amber primary fill, and visible focus. Cards are flat panels with 1px rules and no resting shadow. Badges and statuses are small rectangular labels. Inputs are 48px high with a 1px rule and amber focus. Drawers are dark right-side sheets with a close action. The assistant is a compact icon control on phones and a labelled control on desktop.

## Motion

Section content enters with a short opacity and translate rise using the strong ease-out curve. Hover and focus transitions stay under 240ms. The vehicle-brand strip is the single marquee on the public home page. The admin surface avoids decorative motion and uses state changes only. Reduced motion removes travel and marquee animation while keeping content visible.

## Accessibility

All interactive controls keep visible focus rings, accessible names, and touch-safe targets. Body text meets 4.5:1 contrast. Status is never conveyed by colour alone. Tables retain header structure on desktop and become semantic record lists on phones. Motion respects `prefers-reduced-motion`.

## Known Constraints

Existing routes, business facts, service names, prices, vehicle coverage, and functional copy are preserved. The demo data is synthetic and must not be presented as real customer proof. The public assistant and admin assistant remain available but must not overlap the mobile booking action.
