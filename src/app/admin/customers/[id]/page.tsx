import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageFrame } from "@/components/admin/AdminLayout";
import { requireAdminSession } from "@/lib/admin-auth";
import { getDb } from "@/lib/db/client";
import { createRepository } from "@/lib/db/repository";
import { fmtDate, titleCase } from "@/lib/agent/cards";
import { getService } from "@/lib/content";

/** Exported for tests: throws notFound() (404) when the id is unknown. */
export async function getCustomerOr404(id: string) {
  const repo = createRepository(await getDb());
  const record = await repo.getCustomer(id);
  if (!record) notFound();
  const [vehicles, appointments] = await Promise.all([
    repo.listVehicles(),
    repo.listAppointmentsDetailed(),
  ]);
  return {
    customer: record,
    vehicles: vehicles.filter((v) => v.customerId === record.id),
    appointments: appointments.filter((a) => a.customerId === record.id).slice(0, 10),
  };
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-muted">{label}</p>
      <p className="mt-1.5 font-medium">{children}</p>
    </div>
  );
}

export default async function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminSession("customers.view");
  const { id } = await params;
  const { customer, vehicles, appointments } = await getCustomerOr404(id);

  return (
    <AdminPageFrame title={customer.name} subtitle="Customer record">
      <Link href="/admin/customers" className="text-xs uppercase tracking-[0.18em] text-muted hover:text-ink">
        ← Back to list
      </Link>
      <div className="mt-4 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="border border-line bg-surface p-6">
          <h2 className="font-heading text-2xl">Contact</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Row label="Email">{customer.email}</Row>
            <Row label="Phone">{customer.phone}</Row>
            <Row label="Customer since">{fmtDate(customer.createdAt)}</Row>
          </div>

          <h3 className="mt-8 border-t border-line pt-6 font-heading text-xl">Vehicles</h3>
          {vehicles.length ? (
            <ul className="mt-4 space-y-2 text-sm">
              {vehicles.map((v) => (
                <li key={v.id} className="rounded-lg border border-line bg-canvas px-4 py-3">
                  <span className="font-medium">{v.make} {v.model} {v.year}</span>
                  <span className="ml-3 text-muted">{v.plate}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted">No vehicles on file.</p>
          )}
        </section>

        <aside className="space-y-4 border border-line bg-surface p-6">
          <h3 className="font-heading text-xl">Recent appointments</h3>
          {appointments.length ? (
            <ul className="space-y-2 text-sm">
              {appointments.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/admin/appointments/${encodeURIComponent(a.id)}`}
                    className="block rounded-lg border border-line bg-canvas px-4 py-3 hover:border-accent"
                  >
                    <span className="font-medium">{a.reference}</span>
                    <span className="ml-2 text-muted">{getService(a.serviceId)?.name ?? a.serviceId}</span>
                    <span className="mt-1 block text-xs text-muted">
                      {fmtDate(a.date)} · {titleCase(a.status)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No appointments yet.</p>
          )}
        </aside>
      </div>
    </AdminPageFrame>
  );
}
