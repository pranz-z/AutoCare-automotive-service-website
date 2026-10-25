import { AdminPageFrame } from "@/components/admin/AdminLayout";
import { requireAdminSession } from "@/lib/admin-auth";
import { getLocations } from "@/lib/content";

export default async function AdminBranchesPage() {
  await requireAdminSession("appointments.view");
  const locations = getLocations();

  return (
    <AdminPageFrame title="Branches" subtitle="Service coverage and active operational sites">
      <div className="border border-white/10 bg-[#0c1925]">
        {locations.map((area) => (
          <div key={area.id} className="grid gap-3 border-b border-white/10 px-4 py-4 last:border-b-0 sm:grid-cols-[12rem_1fr] sm:gap-6">
            <div>
              <p className="text-[10px] uppercase tracking-[0.12em] text-accent">{area.region}</p>
              <h2 className="mt-1 font-heading text-2xl leading-none text-inverted">{area.province}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {area.cities.map((city) => (
                <span key={city.name} className="border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.1em] text-inverted/50">
                  {city.name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AdminPageFrame>
  );
}
