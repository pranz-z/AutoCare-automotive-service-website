import type { BlogArticle } from "@/types/content";
import { images } from "./images";

export const articles: BlogArticle[] = [
  {
    slug: "how-often-should-you-change-engine-oil",
    title: "How Often Should You Change Your Engine Oil?",
    excerpt:
      "Interval stickers lie when you only drive short trips. Here’s how to read your manual against Philippine road conditions.",
    category: "Maintenance",
    readTime: "6 min",
    date: "2026-03-12",
    image: images.article1,
    author: "Workshop Desk",
    content: [
      {
        paragraphs: [
          "Oil does two jobs that city driving punishes: it lubricates bearings and it carries heat and soot away from the engine. If your week is school runs and parking-structure commutes, the oil may never fully warm, which means moisture and fuel dilution stay in the sump.",
          "Start with the manufacturer’s interval, then shorten it if you idle in traffic, tow, or rarely exceed 20 minutes per trip. Many modern engines are happiest on fully synthetic oil at 5,000–8,000 km in metro use, even if the book allows 10,000 km.",
        ],
      },
      {
        heading: "What “severe service” actually means",
        paragraphs: [
          "Severe service is not a scare word. It is the schedule for dusty roads, high ambient temperature, and stop-go traffic—the default for most Philippine drivers. If your manual lists two charts, use the severe one.",
          "Reset the reminder only after the oil and filter are changed. A light that was cleared without a service is not a maintenance record.",
        ],
      },
    ],
  },
  {
    slug: "warning-signs-your-car-needs-service",
    title: "5 Warning Signs Your Car Needs Service",
    excerpt:
      "Noises, smells, and lights that are cheaper to investigate this week than next month.",
    category: "Diagnostics",
    readTime: "5 min",
    date: "2026-04-02",
    image: images.article2,
    author: "Diagnostics Team",
    content: [
      {
        paragraphs: [
          "Cars rarely fail without a preview. The preview is easy to ignore because the vehicle still moves. Treat these five as a booking prompt, not a personality test.",
        ],
      },
      {
        heading: "The five",
        paragraphs: [
          "1. A new vibration through the steering or seat at highway speed—often tires, but sometimes brakes or a failing joint. 2. A sweet or sharp smell after shutdown—coolant or an electrical hot spot. 3. A brake pedal that travels farther or pulses. 4. A battery that cranks slower after two days parked. 5. Any persistent warning lamp, even if the car “feels fine.”",
          "A scan and a short inspection usually cost less than a missed commute. Capture when the symptom happens: cold start, rain, or only after an hour on the expressway.",
        ],
      },
    ],
  },
  {
    slug: "prepare-your-car-for-long-trips",
    title: "How to Prepare Your Car for Long Trips",
    excerpt:
      "A provincial run is not the same as a city loop. Check these systems before you load the luggage.",
    category: "Travel",
    readTime: "7 min",
    date: "2026-04-28",
    image: images.article3,
    author: "Mobile Teams",
    content: [
      {
        paragraphs: [
          "Long trips raise engine temperature, tire heat, and the cost of a breakdown. A 40-minute inspection a few days before departure is more useful than a trunk full of tools you don’t know how to use.",
        ],
      },
      {
        heading: "The night-before list",
        paragraphs: [
          "Confirm oil level on level ground, cold. Set tire pressures to the door placard with a real gauge, including the spare. Check coolant in the reservoir—not by opening a hot radiator. Pack a charged power bank, not just a cable. If the A/C has been weak in city traffic, it will not magically improve on a sun-baked highway.",
          "If the last service was more than 5,000 km ago, book fluids and a belt glance before you leave, not at a highway stall.",
        ],
      },
    ],
  },
  {
    slug: "understanding-dashboard-warning-lights",
    title: "Understanding Your Dashboard Warning Lights",
    excerpt:
      "Red means stop thinking about it. Amber means schedule it. Here’s a practical decoding without the panic.",
    category: "Electronics",
    readTime: "6 min",
    date: "2026-05-19",
    image: images.article4,
    author: "Electronics Desk",
    content: [
      {
        paragraphs: [
          "Modern clusters mix convenience lights with actual safety warnings. Color is the first filter: red generally means stop as soon as it is safe. Amber means the car can often be driven, but the underlying system is compromised.",
        ],
      },
      {
        heading: "Don’t clear and hope",
        paragraphs: [
          "Oil pressure, brake, and temperature warnings are not “sensor mood.” Pull over. Engine management and ABS lights deserve a scan the same week. Battery lights often mean the charging system, not the 12-volt battery alone.",
          "A stored code remains useful even if the lamp goes out. Have it read before disconnecting the battery, which can erase freeze-frame data.",
        ],
      },
    ],
  },
  {
    slug: "basic-preventive-maintenance-checklist",
    title: "Basic Preventive Maintenance Checklist",
    excerpt:
      "A monthly walk-around that takes ten minutes and prevents most “it just happened” stories.",
    category: "Maintenance",
    readTime: "5 min",
    date: "2026-06-08",
    image: images.article5,
    author: "Workshop Desk",
    content: [
      {
        paragraphs: [
          "You do not need a lift to notice the problems that become invoices. A consistent checklist beats an ambitious one you never finish.",
        ],
      },
      {
        heading: "Once a month",
        paragraphs: [
          "Walk the tires for nails and uneven inner-edge wear. Check the windshield washer and note any new drips on the driveway. Listen to the first five seconds of cold start—knock, squeal, or a long crank is information. Confirm all exterior lights with a wall or a second person.",
          "Every six months, add cabin filter, wiper blades, and a brake-feel check on a quiet street. Pair that with a professional inspection if the car is your only way to work.",
        ],
      },
    ],
  },
];
