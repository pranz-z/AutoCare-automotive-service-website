import { AdminPageFrame } from "@/components/admin/AdminLayout";
import { requireAdminSession } from "@/lib/admin-auth";
import { adminInquiries } from "@/lib/admin-data";

export default async function AdminInquiriesPage() {
  await requireAdminSession("ai.view");

  return (
    <AdminPageFrame title="Inquiries" subtitle="Customer issues and escalations needing attention">
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="px-3 py-3">Inquiry ID</th>
                <th className="px-3 py-3">Customer</th>
                <th className="px-3 py-3">Vehicle</th>
                <th className="px-3 py-3">Category</th>
                <th className="px-3 py-3">Priority</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Branch</th>
              </tr>
            </thead>
            <tbody>
              {adminInquiries.map((inquiry) => (
                <tr key={inquiry.id} className="border-b border-line hover:bg-canvas">
                  <td className="px-3 py-3">{inquiry.id}</td>
                  <td className="px-3 py-3">{inquiry.customer}</td>
                  <td className="px-3 py-3">{inquiry.vehicle}</td>
                  <td className="px-3 py-3">{inquiry.category}</td>
                  <td className="px-3 py-3">{inquiry.priority}</td>
                  <td className="px-3 py-3">{inquiry.status}</td>
                  <td className="px-3 py-3">{inquiry.branch}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminPageFrame>
  );
}
