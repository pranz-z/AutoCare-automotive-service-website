import { AdminPageFrame } from "@/components/admin/AdminLayout";
import { requireAdminSession } from "@/lib/admin-auth";
import { adminCustomers } from "@/lib/admin-data";

export default async function AdminCustomersPage() {
  await requireAdminSession("customers.view");

  return (
    <AdminPageFrame title="Customers" subtitle="Customer records, vehicle history, and recent bookings">
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="px-3 py-3">Customer</th>
                <th className="px-3 py-3">Phone</th>
                <th className="px-3 py-3">Email</th>
                <th className="px-3 py-3">Bookings</th>
                <th className="px-3 py-3">Last booking</th>
                <th className="px-3 py-3">Next booking</th>
              </tr>
            </thead>
            <tbody>
              {adminCustomers.map((customer) => (
                <tr key={customer.id} className="border-b border-line hover:bg-canvas">
                  <td className="px-3 py-3 font-medium">{customer.name}</td>
                  <td className="px-3 py-3">{customer.phone}</td>
                  <td className="px-3 py-3">{customer.email}</td>
                  <td className="px-3 py-3">{customer.totalBookings}</td>
                  <td className="px-3 py-3">{customer.lastBooking}</td>
                  <td className="px-3 py-3">{customer.upcomingBooking}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminPageFrame>
  );
}
