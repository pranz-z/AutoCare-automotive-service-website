import {
  BatteryCharging,
  CalendarDays,
  Car,
  CircleDot,
  ClipboardList,
  Disc3,
  Droplets,
  MapPin,
  ScanLine,
  Search,
  ShieldCheck,
  Snowflake,
  Star,
  Wrench,
  type LucideIcon,
} from "lucide-react";

const icons: Record<string, LucideIcon> = {
  car: Car,
  map: MapPin,
  star: Star,
  calendar: CalendarDays,
  clipboard: ClipboardList,
  wrench: Wrench,
  shield: ShieldCheck,
  droplet: Droplets,
  disc: Disc3,
  scan: ScanLine,
  battery: BatteryCharging,
  snowflake: Snowflake,
  circle: CircleDot,
  search: Search,
};

export function ConfigIcon({
  name,
  className = "h-5 w-5",
}: {
  name: string;
  className?: string;
}) {
  const Icon = icons[name] ?? Wrench;
  return <Icon className={className} aria-hidden />;
}
