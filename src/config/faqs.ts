import type { FaqItem } from "@/types/content";

export const faqCategories = [
  "General",
  "Booking",
  "Pricing",
  "Services",
  "Vehicles",
  "Payments",
  "Warranty",
] as const;

export const faqs: FaqItem[] = [
  {
    id: "g1",
    category: "General",
    question: "Do you only work as a mobile service?",
    answer:
      "No. We run mobile teams for scheduled maintenance, inspections, and many repairs, and a workshop for jobs that need a lift, alignment, or extended diagnostics.",
  },
  {
    id: "g2",
    category: "General",
    question: "What days are you available?",
    answer:
      "We operate seven days a week. Specific time windows depend on your city and the service you book.",
  },
  {
    id: "g3",
    category: "General",
    question: "Will someone stay with my car the whole time?",
    answer:
      "You can stay, work nearby, or leave keys with a designated contact. We never take a vehicle off-site without written consent.",
  },
  {
    id: "b1",
    category: "Booking",
    question: "How far in advance should I book?",
    answer:
      "Same-week slots are common. Peak weekends fill faster—book 2–5 days ahead for those. Urgent diagnostics are prioritized when bays allow.",
  },
  {
    id: "b2",
    category: "Booking",
    question: "Can I reschedule?",
    answer:
      "Yes. Use the confirmation email or call before the scheduled window. Late same-day changes may move you to the next available slot.",
  },
  {
    id: "b3",
    category: "Booking",
    question: "What if I’m not sure which service I need?",
    answer:
      "Start with diagnostics or a preventive visit. Describe the symptom in the booking notes—we’ll confirm the right path before work begins.",
  },
  {
    id: "p1",
    category: "Pricing",
    question: "Are the website prices final?",
    answer:
      "Listed amounts are starting prices for typical vehicles. Final quotes depend on engine size, parts spec, and findings during inspection.",
  },
  {
    id: "p2",
    category: "Pricing",
    question: "Do you charge a call-out fee?",
    answer:
      "Mobile visits inside covered cities are included in the service price. Outlying barangays may carry a small travel surcharge, shown before you confirm.",
  },
  {
    id: "p3",
    category: "Pricing",
    question: "Will you start extra work without asking?",
    answer:
      "No. Additional findings are quoted for approval. If you decline, we complete the original booked items and note the rest.",
  },
  {
    id: "s1",
    category: "Services",
    question: "Can you do timing belt or clutch work on-site?",
    answer:
      "Those jobs typically move to the workshop. We’ll advise during booking if a lift and extra time are required.",
  },
  {
    id: "s2",
    category: "Services",
    question: "Do you handle insurance repairs?",
    answer:
      "We can support mechanical items related to a claim. Bodywork and paint are referred to body shops we trust.",
  },
  {
    id: "v1",
    category: "Vehicles",
    question: "Do you service European cars?",
    answer:
      "Yes, including BMW, Mercedes-Benz, Audi, and Volkswagen, using the correct oils, filters, and scan tools. Some specialist parts may add lead time.",
  },
  {
    id: "v2",
    category: "Vehicles",
    question: "What about hybrids and EVs?",
    answer:
      "Hybrids are routinely serviced. High-voltage EV traction repairs are scoped case by case; 12V and cabin systems are commonly covered.",
  },
  {
    id: "pay1",
    category: "Payments",
    question: "How can I pay?",
    answer:
      "Cards, bank transfer, and major e-wallets are accepted. Fleet accounts can be invoiced on approved terms.",
  },
  {
    id: "pay2",
    category: "Payments",
    question: "Do I pay a deposit to book?",
    answer:
      "Most consumer bookings do not require a deposit. High-value parts orders may need a partial payment to secure stock.",
  },
  {
    id: "w1",
    category: "Warranty",
    question: "What does the service warranty cover?",
    answer:
      "Covered labor and fitted parts are warranted against defects in workmanship and materials. Wear items and pre-existing damage are excluded, as written on your invoice.",
  },
  {
    id: "w2",
    category: "Warranty",
    question: "How long is the warranty?",
    answer:
      "Standard coverage is 6 months or 10,000 km on eligible repairs, whichever comes first. Batteries and some parts follow the supplier’s longer term.",
  },
];
