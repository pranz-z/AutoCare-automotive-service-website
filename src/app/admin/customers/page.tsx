import Link from "next/link";
import { AdminPageFrame } from "@/components/admin/AdminLayout";
import { requireAdminSession } from "@/lib/admin-auth";
import { getAdminCustomers } from "@/lib/admin-data";
import { getDb } from "@/lib/db/client";
import { createRepository } from "@/lib/db/repository";
import { getService } from "@/lib/content";
import { fmtDate, titleCase } from "@/lib/agent/cards";
import { DetailRow, RecordDrawer, RecordNotice } from "@/components/admin/RecordDrawer";
import { PendingDecision } from "@/components/admin/RecordActions";
import { pendingActionsForRecord } from "@/lib/admin/record-mutations";

/** Resolves ?open= by internal customer id. */
export async function getOpenCustomer(open: string | undefined) {
  if (!open) return { customer: null, missing: false };
  const customer = (await createRepository(await getDb()).getCustomer(open)) ?? null;
  return { customer, missing: !customer };
}

export async function getOpenCustomerContext(id: string) {
  const repo = createRepository(await getDb());
  const [vehicles, appointments, pending] = await Promise.all([
    repo.listVehicles(),
    repo.listAppointmentsDetailed(),
    pendingActionsForRecord(repo, [id]),
  ]);
  return {
    vehicles: vehicles.filter((v) => v.customerId === id),
    appointments: appointments.filter((a) => a.customerId === id).slice(0, 10),
    pending,
  };
}

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ open?: string }>;
}) {
  await requireAdminSession("customers.view");
  const { open } = await searchParams;
  const [{ customer, missing }, adminCustomers] = await Promise.all([
    getOpenCustomer(open),
    getAdminCustomers(),
  ]);
  const ctx = customer ? await getOpenCustomerContext(customer.id) : null;

  return (
    <AdminPageFrame title="Customers" subtitle="Customer records, vehicle history, and recent bookings">
      {missing ? <RecordNotice message="Record not found." closeHref="/admin/customers" /> : null}
      <div className="border border-line bg-surface p-5">
        <div className="divide-y divide-line md:hidden">
          {adminCustomers.map((customer) => (
            <Link
              key={customer.id}
              href={`/admin/customers?open=${encodeURIComponent(customer.id)}`}
              className="block py-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{customer.name}</p>
                  <p className="mt-1 text-sm text-muted">{customer.phone}</p>
                </div>
                <span className="shrink-0 border border-line px-2 py-1 text-[10px] uppercase tracking-[0.1em] text-muted">
                  {customer.totalBookings} bookings
                </span>
              </div>
              <p className="mt-2 text-sm text-muted">Next: {customer.upcomingBooking}</p>
            </Link>
          ))}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="px-3 py-3">Customer</th>
                <th className="px-3 py-3">Phone</th>
                <th className="hidden px-3 py-3 md:table-cell">Email</th>
                <th className="px-3 py-3">Bookings</th>
                <th className="hidden px-3 py-3 lg:table-cell">Last booking</th>
                <th className="px-3 py-3">Next booking</th>
              </tr>
            </thead>
            <tbody>
              {adminCustomers.map((customer) => (
                <tr key={customer.id} className="border-b border-line hover:bg-canvas">
                  <td className="px-3 py-3 font-medium">
                    <Link
                      href={`/admin/customers?open=${encodeURIComponent(customer.id)}`}
                      className="text-accent underline-offset-4 hover:underline"
                    >
                      {customer.name}
                    </Link>
                  </td>
                  <td className="px-3 py-3">{customer.phone}</td>
                  <td className="hidden px-3 py-3 md:table-cell">{customer.email}</td>
                  <td className="px-3 py-3">{customer.totalBookings}</td>
                  <td className="hidden px-3 py-3 lg:table-cell">{customer.lastBooking}</td>
                  <td className="px-3 py-3">{customer.upcomingBooking}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {customer && ctx ? (
        <RecordDrawer
          title={customer.name}
          subtitle="Customer record"
          closeHref="/admin/customers"
        >
          <div className="space-y-5">
            {ctx.pending.map((p) => (
              <PendingDecision
                key={p.id}
                pendingId={p.id}
                token={p.token}
                summary={p.summary}
                action={p.action}
                expired={p.expired}
              />
            ))}

            <div className="grid grid-cols-2 gap-3">
              <DetailRow label="Email">{customer.email}</DetailRow>
              <DetailRow label="Phone">{customer.phone}</DetailRow>
              <DetailRow label="Customer since">{fmtDate(customer.createdAt)}</DetailRow>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted">Vehicles</p>
              {ctx.vehicles.length ? (
                <ul className="mt-2 space-y-2 text-sm">
                  {ctx.vehicles.map((v) => (
                    <li key={v.id} className="rounded-lg border border-line bg-canvas px-3 py-2">
                      <span className="font-medium">{v.make} {v.model} {v.year}</span>
                      <span className="ml-2 text-muted">{v.plate}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted">No vehicles on file.</p>
              )}
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted">Recent appointments</p>
              {ctx.appointments.length ? (
                <ul className="mt-2 space-y-2 text-sm">
                  {ctx.appointments.map((a) => (
                    <li key={a.id}>
                      <Link
                        href={`/admin/appointments?open=${encodeURIComponent(a.id)}`}
                        className="block rounded-lg border border-line bg-canvas px-3 py-2 hover:border-accent"
                      >
                        <span className="font-medium">{a.reference}</span>
                        <span className="ml-2 text-muted">
                          {getService(a.serviceId)?.name ?? a.serviceId}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted">
                          {fmtDate(a.date)} · {titleCase(a.status)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted">No appointments yet.</p>
              )}
            </div>
          </div>
        </RecordDrawer>
      ) : null}
    </AdminPageFrame>
  );
}
