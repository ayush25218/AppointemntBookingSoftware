import { PatientAppointmentsPanel, type PatientAppointmentItem } from "@/components/patient/PatientAppointmentsPanel";
import { apiFetchServer, getServerAccessToken } from "@/lib/api/server";

interface AppointmentsResponse {
  success: boolean;
  items: PatientAppointmentItem[];
}

export default async function PatientAppointmentsPage() {
  const token = await getServerAccessToken();
  const response = await apiFetchServer<AppointmentsResponse>("/appointments?limit=20", { token });

  return (
    <section className="space-y-4">
      <div className="rounded-[28px] bg-white p-6 shadow-panel">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Appointments</p>
        <h2 className="mt-2 text-2xl font-semibold text-ink">Your booking history and live schedule</h2>
      </div>
      <PatientAppointmentsPanel appointments={response.items} />
    </section>
  );
}

