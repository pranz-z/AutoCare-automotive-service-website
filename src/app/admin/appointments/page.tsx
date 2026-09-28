import Link from "next/link";
import { AdminPageFrame } from "@/components/admin/AdminLayout";
import { requireAdminSession } from "@/lib/admin-auth";
import { getAppointmentsByStatus } from "@/lib/admin-data";

const statusOptions = ["All", "Pending", "Confirmed", "In Service", "Completed", "Cancelled", "No Show", "Rescheduled"];

export default async function AdminAppointmentsPage() {
  await requireAdminSession("appointments.view");
  const appointments = getAppointmentsByStatus("All");

  return (
    <AdminPageFrame title="Appointments" subtitle="Booking management and service status updates">
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
                    <Link href={`/admin/appointments/${appointment.id}`} className="text-accent underline-offset-4 hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminPageFrame>
  );
}
