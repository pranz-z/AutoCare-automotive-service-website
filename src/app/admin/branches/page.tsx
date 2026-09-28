import { AdminPageFrame } from "@/components/admin/AdminLayout";
import { requireAdminSession } from "@/lib/admin-auth";
import { getLocations } from "@/lib/content";

export default async function AdminBranchesPage() {
  await requireAdminSession("appointments.view");
  const locations = getLocations();

  return (
    <AdminPageFrame title="Branches" subtitle="Service coverage and active operational sites">
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {locations.map((area) => (
            <div key={area.id} className="rounded-xl border border-line bg-canvas p-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted">{area.region}</p>
              <h3 className="mt-3 font-heading text-xl">{area.province}</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {area.cities.map((city) => (
                  <span key={city.name} className="rounded-full border border-line px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-muted">
                    {city.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminPageFrame>
  );
}
