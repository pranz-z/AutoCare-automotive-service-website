import { AdminPageFrame } from "@/components/admin/AdminLayout";
import { requireAdminSession } from "@/lib/admin-auth";
import { formatPrice, getServices } from "@/lib/content";

export default async function AdminServicesPage() {
  await requireAdminSession("appointments.view");
  const services = getServices();

  return (
    <AdminPageFrame title="Services" subtitle="Managed service catalog and pricing">
      <div className="border border-white/10 bg-[#0c1925]">
        <div className="hidden grid-cols-[10rem_1fr_9rem] gap-4 border-b border-white/10 px-4 py-3 text-[10px] uppercase tracking-[0.12em] text-inverted/35 sm:grid">
          <span>Category</span>
          <span>Service</span>
          <span className="text-right">Starting price</span>
        </div>
        {services.map((service) => (
          <div
            key={service.id}
            className="grid gap-2 border-b border-white/10 px-4 py-4 last:border-b-0 sm:grid-cols-[10rem_1fr_9rem] sm:items-start sm:gap-4"
          >
            <p className="text-[10px] uppercase tracking-[0.12em] text-accent">{service.category}</p>
            <div>
              <h2 className="font-heading text-2xl leading-none text-inverted">{service.name}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-inverted/45">{service.shortDescription}</p>
            </div>
            <p className="font-heading text-xl text-inverted sm:text-right">
              {formatPrice(service.priceFrom, service.currency)}
            </p>
          </div>
        ))}
      </div>
    </AdminPageFrame>
  );
}
