import { notFound } from "next/navigation";
import { AdminPageFrame } from "@/components/admin/AdminLayout";
import { requireAdminSession } from "@/lib/admin-auth";
import { adminAppointments } from "@/lib/admin-data";

export default async function AdminAppointmentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminSession("appointments.view");
  const { id } = await params;
  const appointment = adminAppointments.find((item) => item.id === id);

  if (!appointment) {
    notFound();
  }

  return (
    <AdminPageFrame title={`Booking ${appointment.id}`} subtitle={appointment.service}>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
          <h2 className="font-heading text-2xl">Customer details</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div><p className="text-[10px] uppercase tracking-[0.2em] text-muted">Customer</p><p className="mt-2 font-semibold">{appointment.customerName}</p></div>
            <div><p className="text-[10px] uppercase tracking-[0.2em] text-muted">Phone</p><p className="mt-2">{appointment.customerPhone}</p></div>
            <div><p className="text-[10px] uppercase tracking-[0.2em] text-muted">Email</p><p className="mt-2">{appointment.customerEmail}</p></div>
            <div><p className="text-[10px] uppercase tracking-[0.2em] text-muted">Vehicle</p><p className="mt-2">{appointment.vehicle}</p></div>
            <div><p className="text-[10px] uppercase tracking-[0.2em] text-muted">Make / Model</p><p className="mt-2">{appointment.make} {appointment.model}</p></div>
            <div><p className="text-[10px] uppercase tracking-[0.2em] text-muted">Year / Variant</p><p className="mt-2">{appointment.year} / {appointment.variant}</p></div>
            <div><p className="text-[10px] uppercase tracking-[0.2em] text-muted">Mileage</p><p className="mt-2">{appointment.mileage ?? "Not provided"}</p></div>
            <div><p className="text-[10px] uppercase tracking-[0.2em] text-muted">Status</p><p className="mt-2">{appointment.status}</p></div>
          </div>

          <div className="mt-8 border-t border-line pt-6">
            <h3 className="font-heading text-xl">Service</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div><p className="text-[10px] uppercase tracking-[0.2em] text-muted">Service</p><p className="mt-2">{appointment.service}</p></div>
              <div><p className="text-[10px] uppercase tracking-[0.2em] text-muted">Price</p><p className="mt-2">{appointment.price}</p></div>
              <div><p className="text-[10px] uppercase tracking-[0.2em] text-muted">Duration</p><p className="mt-2">{appointment.duration}</p></div>
              <div><p className="text-[10px] uppercase tracking-[0.2em] text-muted">Branch</p><p className="mt-2">{appointment.branch}</p></div>
            </div>
            <p className="mt-5 text-sm text-muted">{appointment.serviceDescription}</p>
          </div>
        </section>

        <aside className="space-y-6 rounded-2xl border border-line bg-surface p-6 shadow-sm">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted">Appointment</p>
            <p className="mt-2 font-medium">{appointment.date} • {appointment.time}</p>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted">Branch</p>
            <p className="mt-2 font-medium">{appointment.branch}</p>
            <p className="mt-1 text-sm text-muted">{appointment.branchAddress}</p>
            <p className="mt-1 text-sm text-muted">{appointment.branchContact}</p>
            <p className="mt-1 text-sm text-muted">{appointment.operatingHours}</p>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted">Notes</p>
            <p className="mt-2 text-sm text-muted">{appointment.customerNotes}</p>
          </div>

          <div className="space-y-2">
            <button className="w-full border border-line bg-canvas px-3 py-2 text-xs uppercase tracking-[0.18em]">Confirm</button>
            <button className="w-full border border-line bg-canvas px-3 py-2 text-xs uppercase tracking-[0.18em]">Reschedule</button>
            <button className="w-full border border-line bg-canvas px-3 py-2 text-xs uppercase tracking-[0.18em]">Mark in service</button>
            <button className="w-full border border-line bg-canvas px-3 py-2 text-xs uppercase tracking-[0.18em]">Complete</button>
          </div>
        </aside>
      </div>
    </AdminPageFrame>
  );
}
