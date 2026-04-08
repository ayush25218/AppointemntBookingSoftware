export type AdminAppointmentStatus =
  | "Confirmed"
  | "Checked In"
  | "Pending Payment"
  | "Completed"
  | "Cancelled";

export interface AdminAppointmentRecord {
  id: string;
  patientName: string;
  doctorName: string;
  specialty: string;
  slotLabel: string;
  status: AdminAppointmentStatus;
  payment: "Paid" | "Pending" | "Refunded";
  bookingSource: "Web" | "Reception" | "Admin";
  issue: string;
}

export interface BookingRequestRecord {
  id: string;
  patientName: string;
  doctorName: string;
  requestedSlot: string;
  urgency: "Low" | "Medium" | "High";
  reason: string;
}

export interface DoctorLoadRecord {
  doctorName: string;
  specialty: string;
  queueCount: number;
  nextFreeSlot: string;
}

export interface BillingAlertRecord {
  id: string;
  patientName: string;
  amount: string;
  status: "Pending Payment" | "Refund Review";
  note: string;
}

export const adminAppointments: AdminAppointmentRecord[] = [
  {
    id: "APT-2401",
    patientName: "Vikram Patel",
    doctorName: "Dr. Riya Sharma",
    specialty: "Cardiology",
    slotLabel: "09:30 AM",
    status: "Confirmed",
    payment: "Paid",
    bookingSource: "Web",
    issue: "Recurring chest tightness"
  },
  {
    id: "APT-2402",
    patientName: "Sophia Dias",
    doctorName: "Dr. Daniel Fernandes",
    specialty: "Neurology",
    slotLabel: "10:00 AM",
    status: "Checked In",
    payment: "Paid",
    bookingSource: "Reception",
    issue: "Migraine follow-up"
  },
  {
    id: "APT-2403",
    patientName: "Rohan Sethi",
    doctorName: "Dr. Aisha Khan",
    specialty: "Pediatrics",
    slotLabel: "10:30 AM",
    status: "Pending Payment",
    payment: "Pending",
    bookingSource: "Admin",
    issue: "Fever and throat pain"
  },
  {
    id: "APT-2404",
    patientName: "Meera Nair",
    doctorName: "Dr. Riya Sharma",
    specialty: "Cardiology",
    slotLabel: "11:00 AM",
    status: "Confirmed",
    payment: "Paid",
    bookingSource: "Reception",
    issue: "ECG review"
  },
  {
    id: "APT-2405",
    patientName: "Kabir Malhotra",
    doctorName: "Dr. Daniel Fernandes",
    specialty: "Neurology",
    slotLabel: "12:15 PM",
    status: "Cancelled",
    payment: "Refunded",
    bookingSource: "Web",
    issue: "Dizziness assessment"
  },
  {
    id: "APT-2406",
    patientName: "Ananya Rao",
    doctorName: "Dr. Aisha Khan",
    specialty: "Pediatrics",
    slotLabel: "01:00 PM",
    status: "Completed",
    payment: "Paid",
    bookingSource: "Web",
    issue: "Vaccination consultation"
  }
];

export const bookingRequests: BookingRequestRecord[] = [
  {
    id: "REQ-101",
    patientName: "Neel Joshi",
    doctorName: "Dr. Riya Sharma",
    requestedSlot: "Today, 4:30 PM",
    urgency: "High",
    reason: "Post-surgery palpitations"
  },
  {
    id: "REQ-102",
    patientName: "Sara Thomas",
    doctorName: "Dr. Daniel Fernandes",
    requestedSlot: "Tomorrow, 11:00 AM",
    urgency: "Medium",
    reason: "Persistent headaches"
  },
  {
    id: "REQ-103",
    patientName: "Ishaan Gupta",
    doctorName: "Dr. Aisha Khan",
    requestedSlot: "Today, 5:00 PM",
    urgency: "Low",
    reason: "Routine child check-up"
  }
];

export const doctorLoad: DoctorLoadRecord[] = [
  {
    doctorName: "Dr. Riya Sharma",
    specialty: "Cardiology",
    queueCount: 6,
    nextFreeSlot: "4:30 PM"
  },
  {
    doctorName: "Dr. Daniel Fernandes",
    specialty: "Neurology",
    queueCount: 4,
    nextFreeSlot: "5:15 PM"
  },
  {
    doctorName: "Dr. Aisha Khan",
    specialty: "Pediatrics",
    queueCount: 5,
    nextFreeSlot: "3:45 PM"
  }
];

export const billingAlerts: BillingAlertRecord[] = [
  {
    id: "PAY-11",
    patientName: "Rohan Sethi",
    amount: "INR 1,200",
    status: "Pending Payment",
    note: "Appointment held for 20 more minutes"
  },
  {
    id: "PAY-12",
    patientName: "Kabir Malhotra",
    amount: "INR 1,800",
    status: "Refund Review",
    note: "Cancelled after payment capture"
  }
];

export const doctorOptions = [
  "Dr. Riya Sharma",
  "Dr. Daniel Fernandes",
  "Dr. Aisha Khan"
] as const;

