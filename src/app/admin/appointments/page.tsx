import Link from "next/link";
import { AdminPageFrame } from "@/components/admin/AdminLayout";
import { requireAdminSession } from "@/lib/admin-auth";
import { getAppointmentsByStatus } from "@/lib/admin-data";
import { getDb } from "@/lib/db/client";
import { createRepository, type Repository } from "@/lib/db/repository";
import { getService } from "@/lib/content";
import { fmtDate, titleCase } from "@/lib/agent/cards";
import { DetailRow, RecordDrawer, RecordNotice } from "@/components/admin/RecordDrawer";
import { AppointmentPanelActions, PendingDecision } from "@/components/admin/RecordActions";
import {
  appointmentActionsFor,
  pendingActionsForRecord,
  type PendingForRecord,
} from "@/lib/admin/record-mutations";

const statusOptions = ["All", "Pending", "Confirmed", "In Service", "Completed", "Cancelled", "No Show", "Rescheduled"];

type AppointmentRow = Awaited<ReturnType<Repository["listAppointmentsDetailed"]>>[number];

/** Resolves ?open= by internal id or display reference. */
export async function getOpenAppointment(open: string | undefined) {
  if (!open) return { appointment: null, missing: false };
  const repo = createRepository(getDb());
  const appointment =
    (await repo.listAppointmentsDetailed()).find(
      (a) => a.id === open || a.reference === open,
    ) ?? null;
  return { appointment, missing: !appointment };
}

export async function getAppointmentPending(record: AppointmentRow): Promise<PendingForRecord[]> {
  if (!record) return [];
  return pendingActionsForRecord(createRepository(getDb()), [record.id, record.reference]);
}

function AppointmentPanel({ appointment, pending }: { appointment: AppointmentRow; pending: PendingForRecord[] }) {
  const service = getService(appointment.serviceId);
  return (
    <div className="space-y-5">
      {pending.map((p) => (
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
        <DetailRow label="Customer">{appointment.customerName}</DetailRow>
        <DetailRow label="Reference">{appointment.reference}</DetailRow>
        <DetailRow label="Phone">{appointment.customerPhone}</DetailRow>
        <DetailRow label="Email">{appointment.customerEmail || "—"}</DetailRow>
        <DetailRow label="Vehicle">{appointment.vehicleInfo || "—"}</DetailRow>
        <DetailRow label="Service">{service?.name ?? appointment.serviceId}</DetailRow>
        <DetailRow label="Branch">{appointment.branchName}</DetailRow>
        <DetailRow label="Status">{titleCase(appointment.status)}</DetailRow>
        <DetailRow label="Date">{fmtDate(appointment.date)}</DetailRow>
        <DetailRow label="Time">{appointment.time}</DetailRow>
        <DetailRow label="Created">{fmtDate(appointment.createdAt)}</DetailRow>
      </div>

      {appointment.notes ? (
        <div className="rounded-lg border border-line bg-canvas p-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted">Notes</p>
          <p className="mt-1.5 whitespace-pre-wrap text-sm">{appointment.notes}</p>
        </div>
      ) : null}

      <AppointmentPanelActions id={appointment.id} allowed={appointmentActionsFor(appointment.status)} />
    </div>
  );
}

export default async function AdminAppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ open?: string }>;
}) {
  await requireAdminSession("appointments.view");
  const { open } = await searchParams;
  const [{ appointment, missing }, appointments] = await Promise.all([
    getOpenAppointment(open),
    getAppointmentsByStatus("All"),
  ]);
  const pending = appointment ? await getAppointmentPending(appointment) : [];

  return (
    <AdminPageFrame title="Appointments" subtitle="Booking management and service status updates">
      {missing ? <RecordNotice message="Record not found." closeHref="/admin/appointments" /> : null}
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap gap-3">
          {statusOptions.map((status) => (
            <span key={status} className="rounded-full border border-line px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-muted">
              {status}
            </span>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="px-3 py-3">Booking ID</th>
                <th className="px-3 py-3">Customer</th>
                <th className="px-3 py-3">Vehicle</th>
                <th className="px-3 py-3">Service</th>
                <th className="px-3 py-3">Branch</th>
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr key={appointment.id} className="border-b border-line align-top hover:bg-canvas">
                  <td className="px-3 py-3 font-medium">{appointment.id}</td>
                  <td className="px-3 py-3">
                    <p>{appointment.customerName}</p>
                    <p className="text-muted">{appointment.customerPhone}</p>
                  </td>
                  <td className="px-3 py-3">{appointment.vehicle}</td>
                  <td className="px-3 py-3">{appointment.service}</td>
                  <td className="px-3 py-3">{appointment.branch}</td>
                  <td className="px-3 py-3">{appointment.date}<br/>{appointment.time}</td>
                  <td className="px-3 py-3">
                    <span className="rounded-full border border-line px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-muted">
                      {appointment.status}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <Link href={`/admin/appointments?open=${encodeURIComponent(appointment.id)}`} className="text-accent underline-offset-4 hover:underline">
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {appointment ? (
        <RecordDrawer
          title={`Booking ${appointment.reference}`}
          subtitle={`${getService(appointment.serviceId)?.name ?? appointment.serviceId} · ${appointment.customerName}`}
          closeHref="/admin/appointments"
        >
          <AppointmentPanel appointment={appointment} pending={pending} />
        </RecordDrawer>
      ) : null}
    </AdminPageFrame>
  );
}
