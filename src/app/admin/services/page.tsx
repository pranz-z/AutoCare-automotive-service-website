import { AdminPageFrame } from "@/components/admin/AdminLayout";
import { requireAdminSession } from "@/lib/admin-auth";
import { getServices } from "@/lib/content";

export default async function AdminServicesPage() {
  await requireAdminSession("appointments.view");
  const services = getServices();

  return (
    <AdminPageFrame title="Services" subtitle="Managed service catalog and pricing">
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <div key={service.id} className="rounded-xl border border-line bg-canvas p-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted">{service.category}</p>
              <h3 className="mt-3 font-heading text-xl">{service.name}</h3>
              <p className="mt-2 text-sm text-muted">{service.shortDescription}</p>
              <p className="mt-3 font-medium">Starts at {service.priceFrom}</p>
            </div>
          ))}
        </div>
      </div>
    </AdminPageFrame>
  );
}
