import { AdminPageFrame } from "@/components/admin/AdminLayout";
import { requireAdminSession } from "@/lib/admin-auth";
import { getVehicleBrands } from "@/lib/content";

export default async function AdminVehiclesPage() {
  await requireAdminSession("customers.view");
  const brands = getVehicleBrands();

  return (
    <AdminPageFrame title="Vehicles" subtitle="Supported makes and models">
      <div className="border border-white/10 bg-[#0c1925]">
        {brands.map((brand) => (
          <div key={brand.id} className="grid gap-3 border-b border-white/10 px-4 py-4 last:border-b-0 sm:grid-cols-[12rem_1fr] sm:gap-6">
            <div className="flex items-baseline gap-3">
              <span className="font-heading text-xl leading-none text-accent">{brand.logo}</span>
              <h2 className="font-heading text-2xl leading-none text-inverted">{brand.name}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {brand.models.map((model) => (
                <span key={model.name} className="border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.1em] text-inverted/50">
                  {model.name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AdminPageFrame>
  );
}
