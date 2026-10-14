import type { DatabaseSync } from "node:sqlite";

/**
 * Synthetic demo dataset. All records are fictional and seeded only when the
 * database is empty. This is NOT real business data.
 */
export function seedIfEmpty(handle: { sqlite: DatabaseSync }): boolean {
  const { sqlite } = handle;
  const row = sqlite.prepare("SELECT COUNT(*) AS n FROM branches").get() as { n: number } | undefined;
  if (row && row.n > 0) return false;

  const insert = (sql: string) => sqlite.prepare(sql);
  const now = new Date().toISOString();

  const branchRows: [string, string, string, string, string, string, string][] = [
    ["branch-bgc", "AutoCare BGC", "High Street, Bonifacio Global City", "Taguig", "+63 917 123 4501", "Mon-Sat 8AM-6PM", '["preventive-maintenance","oil-change","brake-service","car-diagnostics","battery-service","air-conditioning","tire-wheel-service"]'],
    ["branch-makati", "AutoCare Makati", "Gil Puyat Avenue, Poblacion", "Makati", "+63 917 123 4502", "Mon-Sat 8AM-7PM", '["preventive-maintenance","oil-change","brake-service","car-diagnostics","battery-service","air-conditioning","tire-wheel-service","pre-purchase-inspection"]'],
    ["branch-quezon", "AutoCare Quezon City", "Timog Avenue, Diliman", "Quezon City", "+63 917 123 4503", "Mon-Sat 8AM-6PM, Sun 9AM-3PM", '["preventive-maintenance","oil-change","brake-service","car-diagnostics","battery-service","air-conditioning","tire-wheel-service"]'],
  ];
  const insBranch = insert("INSERT INTO branches (id,name,address,city,phone,operating_hours,available_services) VALUES (?,?,?,?,?,?,?)");
  for (const b of branchRows) insBranch.run(...b);

  const customerRows: [string, string, string, string, string, string][] = [
    ["cust-001", "Marco Dela Cruz", "marco.demo@autocare.test", "+63 912 345 6701", "needs_staff", "2025-06-15T10:30:00Z"],
    ["cust-002", "Sarah Garcia", "sarah.demo@autocare.test", "+63 912 345 6702", "ai_handling", "2025-03-20T14:15:00Z"],
    ["cust-003", "James Reyes", "james.demo@autocare.test", "+63 912 345 6703", "assigned", "2025-09-01T09:00:00Z"],
    ["cust-004", "Maria Santos", "maria.demo@autocare.test", "+63 912 345 6704", "ai_handling", "2025-07-10T11:45:00Z"],
  ];
  const insCustomer = insert("INSERT INTO customers (id,name,email,phone,conversation_status,created_at) VALUES (?,?,?,?,?,?)");
  for (const c of customerRows) insCustomer.run(...c);

  const vehicleRows: [string, string, string, string, string, string, string, string, string][] = [
    ["veh-001", "cust-001", "Toyota", "Vios", "2020", "1.3 E", "ABC 1234", "28,430 km", "2025-06-15T10:30:00Z"],
    ["veh-002", "cust-002", "Honda", "City", "2019", "V", "XYZ 5678", "45,120 km", "2025-03-20T14:15:00Z"],
    ["veh-003", "cust-003", "Mitsubishi", "Xpander", "2022", "GLS", "DEF 9012", "12,400 km", "2025-09-01T09:00:00Z"],
    ["veh-004", "cust-004", "Nissan", "Almera", "2021", "VL", "GHI 3456", "22,800 km", "2025-07-10T11:45:00Z"],
  ];
  const insVehicle = insert("INSERT INTO vehicles (id,customer_id,make,model,year,variant,plate,mileage,created_at) VALUES (?,?,?,?,?,?,?,?,?)");
  for (const v of vehicleRows) insVehicle.run(...v);

  const insAppt = insert("INSERT INTO appointments (id,reference,customer_id,vehicle_id,vehicle_info,service_id,branch_id,location,date,time,status,notes,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)");
  insAppt.run("appt-001", "AC-2025-00042", "cust-001", "veh-001", "Toyota Vios 2020 (ABC 1234)", "oil-change", "branch-bgc", "High Street, BGC, Taguig", "2025-10-08", "10:00", "confirmed", "Customer requested morning slot", "2025-10-01T08:30:00Z");
  insAppt.run("appt-002", "AC-2025-00043", "cust-002", "veh-002", "Honda City 2019 (XYZ 5678)", "preventive-maintenance", "branch-makati", "Gil Puyat Avenue, Makati", "2025-10-09", "14:00", "pending", "First-time PMS visit", "2025-10-02T15:20:00Z");
  insAppt.run("appt-003", "AC-2025-00041", "cust-003", "veh-003", "Mitsubishi Xpander 2022 (DEF 9012)", "brake-service", "branch-quezon", "Timog Avenue, Quezon City", "2025-10-05", "09:00", "completed", "Front brake pads replacement", "2025-09-28T12:00:00Z");

  const insInq = insert("INSERT INTO inquiries (id,reference,customer_id,customer_name,customer_email,customer_phone,vehicle,subject,category,priority,status,message,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)");
  insInq.run("inq-001", "QI-2025-00156", null, "Ana Lim", "ana.demo@autocare.test", "+63 912 345 6799", "Toyota Innova 2021", "Quote for full service", "quote", "medium", "new", "Hi, I'd like to get a quote for a complete preventive maintenance service for my Toyota Innova 2021. Please include brake inspection.", "2025-10-04T09:15:00Z");
  insInq.run("inq-002", "QI-2025-00155", null, "Robert Tan", "robert.demo@autocare.test", "+63 912 345 6788", "2018 Honda Civic", "Aircon not cooling", "general", "high", "reviewed", "My car's air conditioning is not cooling properly. It's a 2018 Honda Civic. Can you check what's wrong?", "2025-10-03T16:45:00Z");
  insInq.run("inq-003", "QI-2025-00154", null, "Emily Yu", "emily.demo@autocare.test", "+63 912 345 6777", "", "Booking inquiry", "booking", "low", "responded", "Do you have availability for an oil change next Saturday morning?", "2025-10-02T11:30:00Z");

  const insChat = insert("INSERT INTO chat_sessions (id,channel,customer_id,customer_name,customer_phone,vehicle,status,assigned_staff,conversation_type,priority,last_message,last_message_at,messages,customer_context,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
  insChat.run(
    "chat-001", "public", "cust-001", "Marco Dela Cruz", "+63 912 345 6701", "Toyota Vios 2020",
    "needs_staff", "", "ai", "high",
    "Can I book tomorrow morning?", "2 min ago",
    JSON.stringify([
      { id: "m-1", sender: "customer", senderLabel: "Customer", content: "How much is the preventive maintenance package for my Vios?", time: "9:10 AM" },
      { id: "m-2", sender: "ai", senderLabel: "AI Assistant", content: "Our PMS package starts at the listed preventive maintenance price.", time: "9:11 AM", metadata: "Demo assistant" },
      { id: "m-3", sender: "customer", senderLabel: "Customer", content: "Can I book tomorrow morning?", time: "9:12 AM" },
      { id: "m-4", sender: "system", senderLabel: "System", content: "AI escalated to staff due to booking follow-up needs.", time: "9:14 AM" },
    ]),
    JSON.stringify({ phone: "+63 912 345 6701", email: "marco.demo@autocare.test", vehicle: "Toyota Vios 2020", bookingsTotal: 1, upcomingBooking: "Oct 8, 2025", branch: "Taguig" }),
    now,
  );
  insChat.run(
    "chat-002", "public", "cust-002", "Sarah Garcia", "+63 912 345 6702", "Honda City 2019",
    "ai_handling", "", "ai", "normal",
    "Can I get an oil change this week?", "5 min ago",
    JSON.stringify([
      { id: "m-1", sender: "customer", senderLabel: "Customer", content: "Can I get an oil change this week?", time: "9:18 AM" },
      { id: "m-2", sender: "ai", senderLabel: "AI Assistant", content: "Yes, oil change slots are listed this week at active branches.", time: "9:18 AM" },
    ]),
    JSON.stringify({ phone: "+63 912 345 6702", email: "sarah.demo@autocare.test", vehicle: "Honda City 2019", bookingsTotal: 1, upcomingBooking: "Oct 9, 2025", branch: "Makati" }),
    now,
  );
  insChat.run(
    "chat-003", "public", "cust-003", "James Reyes", "+63 912 345 6703", "Mitsubishi Xpander 2022",
    "assigned", "John Santos", "mixed", "urgent",
    "The brake pedal feels soft after the rain.", "10 min ago",
    JSON.stringify([
      { id: "m-1", sender: "customer", senderLabel: "Customer", content: "The brake pedal feels soft after the rain.", time: "8:56 AM" },
      { id: "m-2", sender: "ai", senderLabel: "AI Assistant", content: "This may need urgent inspection. Please avoid driving if braking feels weak.", time: "8:57 AM" },
      { id: "m-3", sender: "staff", senderLabel: "Staff", content: "I have scheduled a brake inspection.", time: "8:59 AM" },
    ]),
    JSON.stringify({ phone: "+63 912 345 6703", email: "james.demo@autocare.test", vehicle: "Mitsubishi Xpander 2022", bookingsTotal: 1, upcomingBooking: "Oct 5, 2025", branch: "Quezon City" }),
    now,
  );

  return true;
}
