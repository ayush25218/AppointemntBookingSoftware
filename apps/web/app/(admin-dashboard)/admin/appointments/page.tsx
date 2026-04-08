import { AdminAppointmentsWorkspace, type AdminAppointmentQueueItem, type AdminDashboardPayload, type AdminDoctorOption } from "@/components/admin/AdminAppointmentsWorkspace";
import { apiFetchServer, getServerAccessToken } from "@/lib/api/server";

interface AdminDashboardResponse {
  success: boolean;
  data: AdminDashboardPayload;
}

interface DoctorsResponse {
  success: boolean;
  items: AdminDoctorOption[];
}

interface AppointmentsResponse {
  success: boolean;
  items: AdminAppointmentQueueItem[];
}

export default async function AdminAppointmentsPage() {
  const token = await getServerAccessToken();
  const [dashboardResponse, doctorsResponse, appointmentsResponse] = await Promise.all([
    apiFetchServer<AdminDashboardResponse>("/dashboard/admin", { token }),
    apiFetchServer<DoctorsResponse>("/doctors?limit=20", { token }),
    apiFetchServer<AppointmentsResponse>("/appointments?limit=30", { token })
  ]);

  return (
    <AdminAppointmentsWorkspace
      mode="full"
      dashboard={dashboardResponse.data}
      doctors={doctorsResponse.items}
      appointments={appointmentsResponse.items}
    />
  );
}

