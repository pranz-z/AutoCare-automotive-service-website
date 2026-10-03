export type AppointmentStatus =
  | "Pending"
  | "Confirmed"
  | "In Service"
  | "Completed"
  | "Cancelled"
  | "No Show"
  | "Rescheduled";

export type InquiryPriority = "Low" | "Normal" | "High" | "Urgent";
export type InquiryCategory =
  | "Maintenance"
  | "Booking"
  | "Pricing"
  | "Branch"
  | "Warranty"
  | "Complaint"
  | "Other";

export type Appointment = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  vehicle: string;
  make: string;
  model: string;
  year: string;
  variant: string;
  mileage?: string;
  service: string;
  serviceDescription: string;
  price: string;
  duration: string;
  branch: string;
  branchAddress: string;
  branchContact: string;
  operatingHours: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  createdAt: string;
  customerNotes: string;
  aiSummary?: string;
  activities: Array<{
    time: string;
    actorType: "customer" | "staff" | "admin" | "ai" | "system";
    action: string;
  }>;
};

export type CustomerProfile = {
  id: string;
  name: string;
  phone: string;
  email: string;
  vehicles: Array<{ make: string; model: string; year: string; variant: string; mileage?: string }>;
  totalBookings: number;
  lastBooking: string;
  upcomingBooking: string;
  conversationStatus: "AI Handling" | "Needs Staff" | "Assigned" | "Resolved" | "Closed";
};

export type ConversationMessage = {
  id: string;
  sender: "customer" | "ai" | "staff" | "system";
  senderLabel: string;
  content: string;
  time: string;
  metadata?: string;
};

export type ChatConversation = {
  id: string;
  customerName: string;
  customerPhone: string;
  vehicle: string;
  lastMessage: string;
  timestamp: string;
  status: "AI Handling" | "Needs Staff" | "Assigned" | "Resolved" | "Closed";
  assignedStaff: string;
  conversationType: "AI" | "Staff" | "Mixed";
  priority: "Normal" | "High" | "Urgent";
  messages: ConversationMessage[];
  customerContext: {
    phone: string;
    email: string;
    vehicle: string;
    bookingsTotal: number;
    upcomingBooking: string;
    branch: string;
  };
};

export type Inquiry = {
  id: string;
  customer: string;
  vehicle: string;
  category: InquiryCategory;
  description: string;
  branch: string;
  priority: InquiryPriority;
  status: "Open" | "Assigned" | "Resolved" | "Closed";
  assignedStaff: string;
  createdAt: string;
};

export const adminAppointments: Appointment[] = [
  {
    id: "MG-2026-0012",
    customerName: "Juan Dela Cruz",
    customerPhone: "+63 917 555 0142",
    customerEmail: "juan.dela.cruz@email.com",
    vehicle: "2020 Honda Civic 1.8",
    make: "Honda",
    model: "Civic",
    year: "2020",
    variant: "1.8 Sport",
    mileage: "28,430 km",
    service: "Preventive Maintenance",
    serviceDescription: "Full service package, fluid check, inspection and maintenance planning.",
    price: "₱ 3,200",
    duration: "2.5 hours",
    branch: "Pampanga",
    branchAddress: "Northpoint Service Hub, Pampanga",
    branchContact: "+63 917 123 4567",
    operatingHours: "Mon-Sun • 8:00 AM - 7:00 PM",
    date: "2026-09-27",
    time: "10:00 AM",
    status: "Pending",
    createdAt: "2026-09-26 09:10",
    customerNotes: "Vehicle is due for PMS and wants same-day inspection before long trip.",
    aiSummary: "Customer asked about preventive maintenance and current price options.",
    activities: [
      { time: "09:12 AM", actorType: "customer", action: "Customer created booking" },
      { time: "09:18 AM", actorType: "admin", action: "Staff confirmed booking request" },
      { time: "09:45 AM", actorType: "ai", action: "AI suggested PMS package" },
    ],
  },
  {
    id: "MG-2026-0016",
    customerName: "Maria Santos",
    customerPhone: "+63 921 800 2211",
    customerEmail: "maria.santos@email.com",
    vehicle: "2022 Toyota Vios",
    make: "Toyota",
    model: "Vios",
    year: "2022",
    variant: "1.3 E",
    mileage: "18,120 km",
    service: "Oil Change",
    serviceDescription: "Synthetic engine oil replacement with filter change and quick inspection.",
    price: "₱ 1,800",
    duration: "1.5 hours",
    branch: "Quezon City",
    branchAddress: "AutoCare QC Branch",
    branchContact: "+63 919 001 9810",
    operatingHours: "Mon-Sun • 8:00 AM - 7:00 PM",
    date: "2026-09-29",
    time: "11:30 AM",
    status: "Confirmed",
    createdAt: "2026-09-25 17:30",
    customerNotes: "Prefers a morning slot and has a work-from-home schedule.",
    aiSummary: "Oil change request with a confirmed time slot.",
    activities: [
      { time: "17:30 PM", actorType: "customer", action: "Requested oil change" },
      { time: "17:42 PM", actorType: "system", action: "Booking assigned to Quezon City branch" },
      { time: "18:05 PM", actorType: "staff", action: "Confirmed appointment" },
    ],
  },
  {
    id: "MG-2026-0021",
    customerName: "Pedro Reyes",
    customerPhone: "+63 995 112 7824",
    customerEmail: "pedro.reyes@email.com",
    vehicle: "2019 Mitsubishi Mirage G4",
    make: "Mitsubishi",
    model: "Mirage G4",
    year: "2019",
    variant: "GLX",
    mileage: "42,240 km",
    service: "Brake Service",
    serviceDescription: "Brake inspection, rotor and pad check and replacement planning.",
    price: "₱ 5,600",
    duration: "3 hours",
    branch: "Taguig",
    branchAddress: "AutoCare Taguig Workshop",
    branchContact: "+63 917 771 9890",
    operatingHours: "Mon-Sun • 8:00 AM - 7:00 PM",
    date: "2026-09-28",
    time: "2:00 PM",
    status: "In Service",
    createdAt: "2026-09-24 15:10",
    customerNotes: "Vehicle brakes feel soft after rain - safety concern. Requested urgent priority.",
    aiSummary: "AI escalated the conversation after the customer reported possible brake issue.",
    activities: [
      { time: "15:10 PM", actorType: "ai", action: "AI flagged safety-critical concern" },
      { time: "15:16 PM", actorType: "staff", action: "Assigned to workshop and moved to in service" },
    ],
  },
  {
    id: "MG-2026-0025",
    customerName: "Ken Lopez",
    customerPhone: "+63 920 334 8990",
    customerEmail: "ken.lopez@email.com",
    vehicle: "2023 Honda City",
    make: "Honda",
    model: "City",
    year: "2023",
    variant: "RS",
    mileage: "8,900 km",
    service: "Battery Service",
    serviceDescription: "Battery health check and replacement when needed.",
    price: "₱ 2,900",
    duration: "1 hour",
    branch: "Cebu",
    branchAddress: "AutoCare Cebu Service Bay",
    branchContact: "+63 926 988 7761",
    operatingHours: "Mon-Sun • 8:00 AM - 7:00 PM",
    date: "2026-09-30",
    time: "9:00 AM",
    status: "Completed",
    createdAt: "2026-09-20 11:20",
    customerNotes: "Battery warning light appeared after start-up. Customer reports intermittent start issues.",
    aiSummary: "Battery diagnosis and replacement completed.",
    activities: [
      { time: "11:20 AM", actorType: "customer", action: "Requested battery check" },
      { time: "11:38 AM", actorType: "staff", action: "Completed service and closed booking" },
    ],
  },
];

export const adminCustomers: CustomerProfile[] = [
  {
    id: "C-1001",
    name: "Juan Dela Cruz",
    phone: "+63 917 555 0142",
    email: "juan.dela.cruz@email.com",
    vehicles: [
      { make: "Honda", model: "Civic", year: "2020", variant: "1.8 Sport", mileage: "28,430 km" },
    ],
    totalBookings: 3,
    lastBooking: "Preventive Maintenance | Sep 20, 2026",
    upcomingBooking: "PMS | Sep 27, 2026",
    conversationStatus: "Needs Staff",
  },
  {
    id: "C-1002",
    name: "Maria Santos",
    phone: "+63 921 800 2211",
    email: "maria.santos@email.com",
    vehicles: [
      { make: "Toyota", model: "Vios", year: "2022", variant: "1.3 E", mileage: "18,120 km" },
    ],
    totalBookings: 2,
    lastBooking: "Oil Change | Sep 15, 2026",
    upcomingBooking: "Oil Change | Sep 29, 2026",
    conversationStatus: "AI Handling",
  },
  {
    id: "C-1003",
    name: "Pedro Reyes",
    phone: "+63 995 112 7824",
    email: "pedro.reyes@email.com",
    vehicles: [
      { make: "Mitsubishi", model: "Mirage G4", year: "2019", variant: "GLX", mileage: "42,240 km" },
    ],
    totalBookings: 4,
    lastBooking: "Brake Service | Sep 18, 2026",
    upcomingBooking: "Brake Service | Sep 28, 2026",
    conversationStatus: "Assigned",
  },
];

export const adminChats: ChatConversation[] = [
  {
    id: "CH-101",
    customerName: "Juan Dela Cruz",
    customerPhone: "+63 917 555 0142",
    vehicle: "2020 Honda Civic 1.8",
    lastMessage: "How much is the preventive maintenance package for my Civic?",
    timestamp: "2 min ago",
    status: "Needs Staff",
    assignedStaff: "Unassigned",
    conversationType: "AI",
    priority: "High",
    customerContext: {
      phone: "+63 917 555 0142",
      email: "juan.dela.cruz@email.com",
      vehicle: "2020 Honda Civic 1.8",
      bookingsTotal: 3,
      upcomingBooking: "Sep 27, 2026",
      branch: "Pampanga",
    },
    messages: [
      { id: "m-1", sender: "customer", senderLabel: "Customer", content: "How much is the preventive maintenance package for my Civic?", time: "9:10 AM" },
      { id: "m-2", sender: "ai", senderLabel: "AI Assistant", content: "Our current PMS package starts at ₱ 3,200 for the standard preventive maintenance service.", time: "9:11 AM", metadata: "Gemini 3.8 Flash • Service Database • 1.8s" },
      { id: "m-3", sender: "customer", senderLabel: "Customer", content: "Can I book tomorrow morning?", time: "9:12 AM" },
      { id: "m-4", sender: "ai", senderLabel: "AI Assistant", content: "We can check the early slot for your preferred branch and service.", time: "9:13 AM" },
      { id: "m-5", sender: "system", senderLabel: "System", content: "AI escalated to staff due to booking follow-up needs.", time: "9:14 AM" },
    ],
  },
  {
    id: "CH-102",
    customerName: "Maria Santos",
    customerPhone: "+63 921 800 2211",
    vehicle: "2022 Toyota Vios",
    lastMessage: "Can I get an oil change this week?",
    timestamp: "5 min ago",
    status: "AI Handling",
    assignedStaff: "Unassigned",
    conversationType: "AI",
    priority: "Normal",
    customerContext: {
      phone: "+63 921 800 2211",
      email: "maria.santos@email.com",
      vehicle: "2022 Toyota Vios",
      bookingsTotal: 2,
      upcomingBooking: "Sep 29, 2026",
      branch: "Quezon City",
    },
    messages: [
      { id: "m-1", sender: "customer", senderLabel: "Customer", content: "Can I get an oil change this week?", time: "9:18 AM" },
      { id: "m-2", sender: "ai", senderLabel: "AI Assistant", content: "Yes, we have oil change slots available this week. I can help review the recommended timing and branch options.", time: "9:18 AM" },
    ],
  },
  {
    id: "CH-103",
    customerName: "Pedro Reyes",
    customerPhone: "+63 995 112 7824",
    vehicle: "2019 Mitsubishi Mirage G4",
    lastMessage: "The brake pedal feels soft after the rain.",
    timestamp: "10 min ago",
    status: "Assigned",
    assignedStaff: "John Santos",
    conversationType: "Mixed",
    priority: "Urgent",
    customerContext: {
      phone: "+63 995 112 7824",
      email: "pedro.reyes@email.com",
      vehicle: "2019 Mitsubishi Mirage G4",
      bookingsTotal: 4,
      upcomingBooking: "Sep 28, 2026",
      branch: "Taguig",
    },
    messages: [
      { id: "m-1", sender: "customer", senderLabel: "Customer", content: "The brake pedal feels soft after the rain.", time: "8:56 AM" },
      { id: "m-2", sender: "ai", senderLabel: "AI Assistant", content: "This may need urgent inspection. Please avoid driving if you feel a loss of braking performance.", time: "8:57 AM" },
      { id: "m-3", sender: "staff", senderLabel: "Staff", content: "I have scheduled a brake inspection and can move this to the workshop.", time: "8:59 AM" },
    ],
  },
];

export const adminInquiries: Inquiry[] = [
  {
    id: "INQ-1101",
    customer: "Juan Dela Cruz",
    vehicle: "2020 Honda Civic 1.8",
    category: "Booking",
    description: "Customer wants a morning PMS booking but prefers a mobile check before the visit.",
    branch: "Pampanga",
    priority: "High",
    status: "Open",
    assignedStaff: "Unassigned",
    createdAt: "2026-09-27 08:45",
  },
  {
    id: "INQ-1103",
    customer: "Pedro Reyes",
    vehicle: "2019 Mitsubishi Mirage G4",
    category: "Complaint",
    description: "Customer reports soft braking and wants immediate review.",
    branch: "Taguig",
    priority: "Urgent",
    status: "Assigned",
    assignedStaff: "John Santos",
    createdAt: "2026-09-27 08:12",
  },
];

export function getAdminDashboardStats() {
  const totalAppointments = adminAppointments.length;
  const pending = adminAppointments.filter((item) => item.status === "Pending").length;
  const confirmed = adminAppointments.filter((item) => item.status === "Confirmed").length;
  const inService = adminAppointments.filter((item) => item.status === "In Service").length;
  const completed = adminAppointments.filter((item) => item.status === "Completed").length;
  const customerConversations = adminChats.length;
  const aiConversations = adminChats.filter((item) => item.conversationType === "AI" || item.conversationType === "Mixed").length;
  const escalations = adminChats.filter((item) => item.status === "Needs Staff" || item.priority === "Urgent").length;

  return {
    totalAppointments,
    pending,
    confirmed,
    inService,
    completed,
    customerConversations,
    aiConversations,
    escalations,
  };
}

export function getRecentAppointments(limit = 4) {
  return [...adminAppointments].slice(0, limit);
}

export function getAppointmentsByStatus(status?: string) {
  if (!status || status === "All") return adminAppointments;
  return adminAppointments.filter((item) => item.status === status);
}

export function getAdminChatsByStatus(status?: string) {
  if (!status || status === "All") return adminChats;
  return adminChats.filter((item) => item.status === status);
}
