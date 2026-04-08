import Link from "next/link";
import { apiFetchServer, getServerAccessToken } from "@/lib/api/server";
import { formatCurrency, formatDateTime } from "@/lib/utils/formatters";

interface PatientDashboardResponse {
  success: boolean;
  data: {
    stats: {
      upcomingCount: number;
      pendingPayments: number;
      completedAppointments: number;
      reviewEligibleCount: number;
    };
    upcomingAppointments: Array<{
      id: string;
      appointmentStartAt: string;
      status: string;
      doctorProfile: {
        specialty: string;
        consultationFee: string;
        user: {
          fullName: string;
        };
      };
    }>;
    recentTransactions: Array<{
      id: string;
      amount: string;
      status: string;
      paymentMethod: string;
      appointment: {
        appointmentStartAt: string;
        doctorProfile: {
          specialty: string;
          user: {
            fullName: string;
          };
        };
      };
    }>;
  };
}

interface MeResponse {
  success: boolean;
  data: {
    fullName: string;
    email: string;
  };
}

export default async function PatientDashboardPage() {
  const token = await getServerAccessToken();
  const [dashboardResponse, meResponse] = await Promise.all([
    apiFetchServer<PatientDashboardResponse>("/dashboard/patient", { token }),
    apiFetchServer<MeResponse>("/auth/me", { token })
  ]);

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] bg-hero-wash px-6 py-8 shadow-panel">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Welcome back</p>
        <h2 className="mt-2 text-3xl font-semibold text-ink">{meResponse.data.fullName}</h2>
        <p className="mt-3 text-slate-600">{meResponse.data.email}</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Upcoming" value={String(dashboardResponse.data.stats.upcomingCount)} />
        <StatCard label="Payments pending" value={String(dashboardResponse.data.stats.pendingPayments)} />
        <StatCard label="Completed" value={String(dashboardResponse.data.stats.completedAppointments)} />
        <StatCard label="Reviews left" value={String(dashboardResponse.data.stats.reviewEligibleCount)} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[28px] bg-white p-6 shadow-panel">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Upcoming Appointments</p>
              <h3 className="mt-2 text-2xl font-semibold text-ink">Your next consultations</h3>
            </div>
            <Link href="/patient/appointments" className="text-sm font-semibold text-accent">
              View all
            </Link>
          </div>

          <div className="mt-5 space-y-4">
            {dashboardResponse.data.upcomingAppointments.map((appointment) => (
              <div key={appointment.id} className="rounded-[22px] border border-slate-100 p-4">
                <p className="font-semibold text-ink">{appointment.doctorProfile.user.fullName}</p>
                <p className="mt-1 text-sm text-slate-500">{appointment.doctorProfile.specialty}</p>
                <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-600">
                  <span>{formatDateTime(appointment.appointmentStartAt)}</span>
                  <span>{formatCurrency(appointment.doctorProfile.consultationFee)}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {appointment.status.replaceAll("_", " ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] bg-white p-6 shadow-panel">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Recent Payments</p>
          <h3 className="mt-2 text-2xl font-semibold text-ink">Transaction timeline</h3>
          <div className="mt-5 space-y-4">
            {dashboardResponse.data.recentTransactions.map((transaction) => (
              <div key={transaction.id} className="rounded-[22px] bg-slate-50 p-4">
                <p className="font-semibold text-ink">{transaction.appointment.doctorProfile.user.fullName}</p>
                <p className="mt-1 text-sm text-slate-500">{transaction.appointment.doctorProfile.specialty}</p>
                <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                  <span>{formatCurrency(transaction.amount)}</span>
                  <span>{transaction.paymentMethod.replace("_", " ")}</span>
                </div>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{transaction.status}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] bg-white p-5 shadow-panel">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-ink">{value}</p>
    </div>
  );
}

