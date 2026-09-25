import type { Testimonial } from "@/types/content";
import { images } from "./images";

export const testimonials: Testimonial[] = [
  {
    id: "t1",
    customer: "Andrea Lim",
    location: "Makati",
    vehicle: "Honda Civic 2020",
    rating: 5,
    message:
      "They arrived at the office basement on time, finished the oil service during a meeting, and left a report on my phone. No dealership wait, no guessing.",
    avatar: images.avatar2,
  },
  {
    id: "t2",
    customer: "Paolo Ramirez",
    location: "Quezon City",
    vehicle: "Toyota Innova 2018",
    rating: 5,
    message:
      "The diagnostic wasn’t a printout of codes. They explained the misfire, showed live data, and quoted the coils before touching anything.",
    avatar: images.avatar1,
  },
  {
    id: "t3",
    customer: "Christine Ong",
    location: "Cebu City",
    vehicle: "Mazda CX-5 2019",
    rating: 5,
    message:
      "Brake job was quoted clearly, rotors were measured, and the pedal felt consistent on the drive home. Workshop was clean and calm.",
    avatar: images.avatar4,
  },
  {
    id: "t4",
    customer: "Miguel Torres",
    location: "Taguig",
    vehicle: "Ford Ranger 2021",
    rating: 4,
    message:
      "Pre-purchase inspection saved me from a flood-damaged listing. A few items were advisory only, which I appreciated—they didn’t upsell fear.",
    avatar: images.avatar3,
  },
  {
    id: "t5",
    customer: "Lara Mendoza",
    location: "Davao City",
    vehicle: "Hyundai Stargazer 2023",
    rating: 5,
    message:
      "A/C was weak in traffic. They recovered, found a minor leak path, and the cabin is actually cold again. Booking on the phone was straightforward.",
    avatar: images.avatar6,
  },
  {
    id: "t6",
    customer: "Julian Reyes",
    location: "Santa Rosa",
    vehicle: "Mitsubishi Xpander 2022",
    rating: 5,
    message:
      "Battery failed on a Sunday. They tested the charging system first, fitted the right spec, and registered it. Car has been solid since.",
    avatar: images.avatar5,
  },
];
