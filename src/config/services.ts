import type { ServiceItem } from "@/types/content";
import { images } from "./images";

const currency = "PHP";

export const services: ServiceItem[] = [
  {
    id: "preventive-maintenance",
    slug: "preventive-maintenance",
    name: "Preventive Maintenance",
    category: "Maintenance",
    shortDescription: "Scheduled service that keeps engines, fluids, and filters within spec.",
    description:
      "A structured preventive maintenance visit covering fluids, filters, belts, and a multi-point inspection. Designed around manufacturer intervals—not a one-size oil-and-go.",
    priceFrom: 2890,
    currency,
    duration: "2–3 hours",
    image: images.workshop,
    icon: "shield",
    features: ["Multi-point inspection", "Fluid service", "Filter replacement", "Digital report"],
    included: [
      "Engine oil and filter (spec-matched)",
      "Cabin and/or engine air filter as required",
      "Brake, coolant, and washer level check",
      "Battery health and charging test",
      "Tire pressure set to placard",
      "Written inspection with recommended next interval",
    ],
    benefits: [
      "Reduces breakdown risk on long trips",
      "Protects warranty-style service history",
      "Catches wear before it becomes a roadside event",
    ],
    vehicleCompatibility: "Gasoline, diesel, and hybrid passenger vehicles and light SUVs.",
    faqs: [
      {
        question: "How often should I book preventive maintenance?",
        answer:
          "Follow the interval in your owner’s manual—often every 5,000 to 10,000 km, or every six months, whichever comes first. Severe city use may need the shorter interval.",
      },
      {
        question: "Do you follow my car’s brand schedule?",
        answer:
          "Yes. We map the visit to the manufacturer’s maintenance chart and note any skipped items so you can decide.",
      },
    ],
    cta: { label: "View Service", href: "/services/preventive-maintenance" },
    bookCta: { label: "Book Now", href: "/book?service=preventive-maintenance" },
  },
  {
    id: "oil-change",
    slug: "oil-change",
    name: "Oil Change",
    category: "Maintenance",
    shortDescription: "Spec-matched oil, a new filter, and a leak-free drain—done on your time.",
    description:
      "Engine oil is cheap insurance. We use the viscosity and specification your engine actually requires, replace the filter, reset the reminder, and inspect for leaks while we’re under the car.",
    priceFrom: 1490,
    currency,
    duration: "45–75 minutes",
    image: images.oil,
    icon: "droplet",
    features: ["Spec-matched oil", "Filter included", "Reminder reset", "Leak check"],
    included: [
      "Drain and refill with correct grade",
      "New oil filter",
      "Washer and crush washer as required",
      "Oil life / service light reset where supported",
      "Underbody leak inspection",
    ],
    benefits: [
      "Quieter cold starts and cleaner internals",
      "Helps turbocharged engines survive city heat",
      "Documented service for resale",
    ],
    vehicleCompatibility: "Most gasoline and diesel engines; synthetic and high-mileage blends available.",
    faqs: [
      {
        question: "Can I choose conventional or fully synthetic?",
        answer:
          "We recommend what the manufacturer specifies. Fully synthetic is standard on most modern engines we service.",
      },
    ],
    cta: { label: "View Service", href: "/services/oil-change" },
    bookCta: { label: "Book Now", href: "/book?service=oil-change" },
  },
  {
    id: "brake-service",
    slug: "brake-service",
    name: "Brake Service",
    category: "Safety",
    shortDescription: "Pads, rotors, fluid, and a measured pedal—not a guess from the driveway.",
    description:
      "Stopping power is not a cosmetic job. We measure pad thickness, check rotor condition, inspect hoses and calipers, and service fluid when moisture content or mileage demands it.",
    priceFrom: 2190,
    currency,
    duration: "1.5–3 hours",
    image: images.brakes,
    icon: "disc",
    features: ["Pad measurement", "Rotor inspection", "Fluid check", "Road test"],
    included: [
      "Four-wheel visual and measured inspection",
      "Hardware lubrication where applicable",
      "Brake fluid moisture test",
      "Test drive for pull, noise, and pedal feel",
    ],
    benefits: [
      "Shorter, more consistent stopping distances",
      "Fewer grooved rotors from metal-on-metal neglect",
      "Clear quote before any parts are fitted",
    ],
    vehicleCompatibility: "Passenger cars, crossovers, and light SUVs with disc or drum rear brakes.",
    faqs: [
      {
        question: "Do I always need new rotors with pads?",
        answer:
          "No. We measure thickness and runout. Rotors are replaced or machined only when they are below spec or damaged.",
      },
    ],
    cta: { label: "View Service", href: "/services/brake-service" },
    bookCta: { label: "Book Now", href: "/book?service=brake-service" },
  },
  {
    id: "car-diagnostics",
    slug: "car-diagnostics",
    name: "Car Diagnostics",
    category: "Diagnostics",
    shortDescription: "Factory-level scanning, live data, and a written finding—not just a code readout.",
    description:
      "A warning light is a starting point. We pull manufacturer-level codes, review live data, and isolate the system that’s actually failing so you don’t replace parts by trial and error.",
    priceFrom: 990,
    currency,
    duration: "45–90 minutes",
    image: images.diagnostics,
    icon: "scan",
    features: ["OEM-level scan", "Live data", "Written findings", "Repair path"],
    included: [
      "Full system scan (not engine-only)",
      "Freeze-frame and pending code review",
      "Basic actuation tests where needed",
      "Printed or emailed diagnostic summary",
    ],
    benefits: [
      "Avoids shotgun parts replacement",
      "Gives you a prioritized repair list",
      "Can be applied toward the repair if you proceed with us",
    ],
    vehicleCompatibility: "OBD-II vehicles 1996 and newer, including many hybrids. Older vehicles quoted case by case.",
    faqs: [
      {
        question: "Is the diagnostic fee waived if I repair with you?",
        answer:
          "The scan fee is credited toward related repair work booked within 14 days, as noted on your quote.",
      },
    ],
    cta: { label: "View Service", href: "/services/car-diagnostics" },
    bookCta: { label: "Book Now", href: "/book?service=car-diagnostics" },
  },
  {
    id: "battery-service",
    slug: "battery-service",
    name: "Battery Service",
    category: "Electrical",
    shortDescription: "Load test, charging system check, and fitment of the right group size.",
    description:
      "Slow cranks and flickering lights are rarely “just the battery.” We test the battery, alternator, and starter circuit, then fit a correctly sized replacement if the cell is done.",
    priceFrom: 1290,
    currency,
    duration: "40–70 minutes",
    image: images.battery,
    icon: "battery",
    features: ["Load test", "Charging check", "Correct group size", "Registration where needed"],
    included: [
      "Conductance and load test",
      "Charging voltage check",
      "Terminal clean and protect",
      "Battery registration / coding when the vehicle requires it",
    ],
    benefits: [
      "Fewer no-start mornings",
      "Protects sensitive electronics from under-voltage",
      "Warranty logged against the fitted unit",
    ],
    vehicleCompatibility: "12V automotive batteries including AGM and EFB start-stop systems.",
    faqs: [
      {
        question: "Do start-stop cars need a special battery?",
        answer:
          "Yes. Fitting a conventional flooded battery on an EFB/AGM system usually shortens life and can trigger faults. We match the spec.",
      },
    ],
    cta: { label: "View Service", href: "/services/battery-service" },
    bookCta: { label: "Book Now", href: "/book?service=battery-service" },
  },
  {
    id: "air-conditioning",
    slug: "air-conditioning",
    name: "Air Conditioning Service",
    category: "Comfort",
    shortDescription: "Performance test, leak awareness, and a cold cabin that lasts the commute.",
    description:
      "Philippine heat punishes weak A/C. We measure vent temperature, inspect the compressor circuit, and service refrigerant to spec. Major leaks are quoted before we chase them blindly.",
    priceFrom: 1690,
    currency,
    duration: "1–2 hours",
    image: images.ac,
    icon: "snowflake",
    features: ["Vent temp test", "System inspection", "Recharge to spec", "Cabin filter option"],
    included: [
      "Performance and pressure check",
      "Visual inspection of condenser and lines",
      "Recharge to manufacturer capacity when the system is sound",
      "Cabin filter inspection",
    ],
    benefits: [
      "Colder, drier air in traffic",
      "Reduces compressor strain from low charge",
      "Optional antibacterial treatment available",
    ],
    vehicleCompatibility: "Factory R134a and R1234yf systems on passenger vehicles. Dual-zone systems supported.",
    faqs: [
      {
        question: "Why didn’t a recharge fix my A/C last time?",
        answer:
          "If the system leaks, gas leaves again. We test performance first and will recommend leak diagnosis instead of repeated top-ups.",
      },
    ],
    cta: { label: "View Service", href: "/services/air-conditioning" },
    bookCta: { label: "Book Now", href: "/book?service=air-conditioning" },
  },
  {
    id: "tire-wheel-service",
    slug: "tire-wheel-service",
    name: "Tire & Wheel Service",
    category: "Wheels",
    shortDescription: "Rotation, balance, puncture assessment, and pressure set to the door placard.",
    description:
      "Uneven wear and vibration usually start at the wheels. We rotate to the correct pattern, balance when needed, and inspect sidewalls and tread before a long trip.",
    priceFrom: 790,
    currency,
    duration: "45–90 minutes",
    image: images.tires,
    icon: "circle",
    features: ["Rotation", "Balance", "Pressure set", "Tread report"],
    included: [
      "Tread depth at multiple points",
      "Rotation to vehicle-appropriate pattern",
      "Torque to spec",
      "TPMS check where fitted",
    ],
    benefits: [
      "Longer tire life",
      "Straighter tracking and less vibration",
      "Safer wet-weather grip",
    ],
    vehicleCompatibility: "Steel and alloy wheels on passenger cars and SUVs. Run-flat handling available on request.",
    faqs: [
      {
        question: "Can you repair a sidewall puncture?",
        answer:
          "Sidewall injuries are not safely repairable. We’ll show you the damage and quote a replacement tire if needed.",
      },
    ],
    cta: { label: "View Service", href: "/services/tire-wheel-service" },
    bookCta: { label: "Book Now", href: "/book?service=tire-wheel-service" },
  },
  {
    id: "pre-purchase-inspection",
    slug: "pre-purchase-inspection",
    name: "Pre-Purchase Inspection",
    category: "Inspection",
    shortDescription: "An independent look at a used car before you transfer the payment.",
    description:
      "A second-hand listing can hide flood history, tired engines, and cosmetic cover-ups. We inspect structure, mechanicals, and electronics, then give you a plain-language go / caution / walk-away summary.",
    priceFrom: 2490,
    currency,
    duration: "1.5–2.5 hours",
    image: images.inspection,
    icon: "search",
    features: ["150+ checkpoint list", "Road test when possible", "Photo notes", "Buyer briefing"],
    included: [
      "Body and underbody visual inspection",
      "Engine, transmission, and leak check",
      "Brake and suspension assessment",
      "Scan for stored faults",
      "Written report you can share with the seller",
    ],
    benefits: [
      "Negotiation leverage with documented findings",
      "Avoids buying someone else’s repair bill",
      "Independent of the seller and dealership",
    ],
    vehicleCompatibility: "Used passenger cars and SUVs. Seller must allow access and a short road test where legal and safe.",
    faqs: [
      {
        question: "Can you inspect at the seller’s location?",
        answer:
          "Yes, within our service areas. We’ll need a safe space and the vehicle to be available at the booked window.",
      },
    ],
    cta: { label: "View Service", href: "/services/pre-purchase-inspection" },
    bookCta: { label: "Book Now", href: "/book?service=pre-purchase-inspection" },
  },
];

export const serviceCategories = [
  ...new Set(services.map((service) => service.category)),
];
