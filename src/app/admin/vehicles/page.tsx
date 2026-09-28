import { AdminPageFrame } from "@/components/admin/AdminLayout";
import { requireAdminSession } from "@/lib/admin-auth";
import { getVehicleBrands } from "@/lib/content";

export default async function AdminVehiclesPage() {
  await requireAdminSession("customers.view");
  const brands = getVehicleBrands();

  return (
    <AdminPageFrame title="Vehicles" subtitle="Supported makes and models">
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <div className="space-y-4">
          {brands.map((brand) => (
            <div key={brand.id} className="rounded-xl border border-line bg-canvas p-4">
              <h3 className="font-heading text-xl">{brand.name}</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {brand.models.slice(0, 6).map((model) => (
                  <span key={model.name} className="rounded-full border border-line px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-muted">
                    {model.name}
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
