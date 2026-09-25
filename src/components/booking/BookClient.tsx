"use client";

import { useSearchParams } from "next/navigation";
import { BookingWizard } from "@/components/booking/BookingWizard";

export function BookClient() {
  const params = useSearchParams();
  return <BookingWizard initialService={params.get("service") ?? ""} />;
}
