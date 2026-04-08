import { apiFetchServer, getServerAccessToken } from "@/lib/api/server";
import { formatCurrency, formatDateTime, formatTime } from "@/lib/utils/formatters";

interface DoctorDashboardResponse {
  success: boolean;
  data: {
    profile: {
      fullName: string;
      specialty: string;
      consultationFee: string;
      averageRating: string;
      totalReviews: number;
    };
    stats: {
      todayConsultations: number;
      checkedInCount: number;
      completedCount: number;
      nextAppointmentAt: string | null;
    };
    todayAppointments: Array<{
      id: string;
      appointmentStartAt: string;
      status: string;
      reasonForVisit: string;
      patient: {
        fullName: string;
        phone: string;
      };
    }>;
  };
}

export default async function DoctorDashboardPage() {
  const token = await getServerAccessToken();
  const response = await apiFetchServer<DoctorDashboardResponse>("/dashboard/doctor", { token });
  const { profile, stats, todayAppointments } = response.data;

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] bg-hero-wash px-6 py-8 shadow-panel">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">{profile.specialty}</p>
        <h2 className="mt-2 text-3xl font-semibold text-ink">{profile.fullName}</h2>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
          <span>{formatCurrency(profile.consultationFee)}</span>
          <span>{profile.averageRating} rating</span>
          <span>{profile.totalReviews} reviews</span>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DoctorStatCard label="Today’s consultations" value={String(stats.todayConsultations)} />
        <DoctorStatCard label="Checked in" value={String(stats.checkedInCount)} />
        <DoctorStatCard label="Completed" value={String(stats.completedCount)} />
        <DoctorStatCard label="Next slot" value={stats.nextAppointmentAt ? formatTime(stats.nextAppointmentAt) : "Open"} />
      </section>

      <section className="rounded-[28px] bg-white p-6 shadow-panel">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Today’s Schedule</p>
        <h3 className="mt-2 text-2xl font-semibold text-ink">Patient queue</h3>
        <div className="mt-5 space-y-4">
          {todayAppointments.map((appointment) => (
            <div key={appointment.id} className="rounded-[22px] border border-slate-100 p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-semibold text-ink">{appointment.patient.fullName}</p>
                  <p className="mt-1 text-sm text-slate-500">{appointment.reasonForVisit}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{appointment.patient.phone}</p>
                </div>
                <div className="flex flex-col items-start gap-2 md:items-end">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {appointment.status.replaceAll("_", " ")}
                  </span>
                  <span className="text-sm font-medium text-slate-600">{formatDateTime(appointment.appointmentStartAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function DoctorStatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] bg-white p-5 shadow-panel">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-ink">{value}</p>
    </div>
  );
}

