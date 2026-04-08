"use client";

import { startTransition, useDeferredValue, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus2, CircleDollarSign, Clock3, Search, Stethoscope, TimerReset } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils/cn";
import { formatCurrency, formatDateTime, formatTime } from "@/lib/utils/formatters";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

type QueueStatus = "PENDING_PAYMENT" | "CONFIRMED" | "CHECKED_IN" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

const statusFilters = ["ALL", "PENDING_PAYMENT", "CONFIRMED", "CHECKED_IN", "COMPLETED", "CANCELLED"] as const;
const queueStatusOptions = ["PENDING_PAYMENT", "CONFIRMED", "CHECKED_IN", "COMPLETED", "CANCELLED", "NO_SHOW"] as const;

const statusClasses: Record<QueueStatus, string> = {
  PENDING_PAYMENT: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-emerald-100 text-emerald-700",
  CHECKED_IN: "bg-sky-100 text-sky-700",
  COMPLETED: "bg-slate-200 text-slate-700",
  CANCELLED: "bg-rose-100 text-rose-700",
  NO_SHOW: "bg-rose-100 text-rose-700"
};

const paymentMethods = ["UPI", "CARD", "CASH", "NET_BANKING", "WALLET"] as const;

export interface AdminDashboardPayload {
  stats: {
    totalDoctors: number;
    todayAppointments: number;
    pendingPayments: number;
    averageRating: string;
  };
  doctorLoad: Array<{
    doctorName: string;
    specialty: string;
    queueCount: number;
    nextFreeSlot: string | null;
  }>;
  paymentAlerts: Array<{
    id: string;
    patientName: string;
    doctorName: string;
    paymentStatus: string;
    consultationFee: string;
  }>;
}

export interface AdminAppointmentQueueItem {
  id: string;
  appointmentStartAt: string;
  status: QueueStatus;
  paymentStatus: "PENDING" | "PAID" | "REFUNDED" | "FAILED";
  reasonForVisit: string;
  patient: {
    fullName: string;
    phone: string;
  };
  doctorProfile: {
    specialty: string;
    consultationFee: string;
    user: {
      fullName: string;
    };
  };
}

export interface AdminDoctorOption {
  id: string;
  specialty: string;
  consultationFee: string;
  user: {
    fullName: string;
  };
}

interface AdminAppointmentsWorkspaceProps {
  mode?: "overview" | "full";
  dashboard: AdminDashboardPayload;
  appointments: AdminAppointmentQueueItem[];
  doctors: AdminDoctorOption[];
}

export function AdminAppointmentsWorkspace({
  mode = "overview",
  dashboard,
  appointments,
  doctors
}: AdminAppointmentsWorkspaceProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<(typeof statusFilters)[number]>("ALL");
  const [isQuickBookOpen, setIsQuickBookOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    patientEmail: "vikram.patel@gmail.com",
    doctorProfileId: doctors[0]?.id ?? "",
    appointmentDate: "",
    appointmentTime: "",
    reasonForVisit: "",
    paymentMethod: "UPI" as (typeof paymentMethods)[number]
  });
  const [statusDrafts, setStatusDrafts] = useState<Record<string, QueueStatus>>(() =>
    Object.fromEntries(appointments.map((appointment) => [appointment.id, appointment.status]))
  );
  const [updatingAppointmentId, setUpdatingAppointmentId] = useState<string | null>(null);
  const [statusMessages, setStatusMessages] = useState<Record<string, string>>({});

  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    setStatusDrafts(Object.fromEntries(appointments.map((appointment) => [appointment.id, appointment.status])));
    setStatusMessages({});
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    const normalized = deferredSearch.trim().toLowerCase();

    return appointments.filter((appointment) => {
      const matchesStatus = selectedStatus === "ALL" || appointment.status === selectedStatus;

      const matchesSearch =
        normalized.length === 0 ||
        appointment.patient.fullName.toLowerCase().includes(normalized) ||
        appointment.doctorProfile.user.fullName.toLowerCase().includes(normalized) ||
        appointment.doctorProfile.specialty.toLowerCase().includes(normalized) ||
        appointment.reasonForVisit.toLowerCase().includes(normalized);

      return matchesStatus && matchesSearch;
    });
  }, [appointments, deferredSearch, selectedStatus]);

  const visibleAppointments = mode === "overview" ? filteredAppointments.slice(0, 5) : filteredAppointments;

  const handleQuickBook = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const appointmentStartLocal = `${formState.appointmentDate}T${formState.appointmentTime}:00`;
      const response = await fetch(`${apiBaseUrl}/appointments/book`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          doctorProfileId: formState.doctorProfileId,
          patientEmail: formState.patientEmail,
          appointmentStartLocal,
          patientTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          reasonForVisit: formState.reasonForVisit,
          paymentMethod: formState.paymentMethod
        })
      });

      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        setErrorMessage(result.message ?? "Unable to create booking");
        return;
      }

      setIsQuickBookOpen(false);
      setFormState({
        patientEmail: "vikram.patel@gmail.com",
        doctorProfileId: doctors[0]?.id ?? "",
        appointmentDate: "",
        appointmentTime: "",
        reasonForVisit: "",
        paymentMethod: "UPI"
      });
      startTransition(() => {
        router.refresh();
      });
    } catch {
      setErrorMessage("Unable to reach the booking API.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (appointmentId: string) => {
    const nextStatus = statusDrafts[appointmentId];

    if (!nextStatus) {
      return;
    }

    setUpdatingAppointmentId(appointmentId);
    setStatusMessages((current) => ({ ...current, [appointmentId]: "" }));

    try {
      const response = await fetch(`${apiBaseUrl}/appointments/${appointmentId}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status: nextStatus
        })
      });

      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        setStatusMessages((current) => ({
          ...current,
          [appointmentId]: result.message ?? "Unable to update appointment status."
        }));
        return;
      }

      setStatusMessages((current) => ({
        ...current,
        [appointmentId]: "Status updated successfully."
      }));
      startTransition(() => {
        router.refresh();
      });
    } catch {
      setStatusMessages((current) => ({
        ...current,
        [appointmentId]: "Unable to reach the status update API."
      }));
    } finally {
      setUpdatingAppointmentId(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Doctors" value={String(dashboard.stats.totalDoctors)} icon={<Stethoscope className="h-5 w-5" />} />
        <MetricCard label="Today appointments" value={String(dashboard.stats.todayAppointments)} icon={<CalendarPlus2 className="h-5 w-5" />} />
        <MetricCard label="Pending payments" value={String(dashboard.stats.pendingPayments)} icon={<CircleDollarSign className="h-5 w-5" />} />
        <MetricCard label="Average rating" value={dashboard.stats.averageRating} icon={<TimerReset className="h-5 w-5" />} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
        <div className="rounded-[28px] bg-white p-6 shadow-panel">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Appointment Operations</p>
              <h2 className="mt-2 text-2xl font-semibold text-ink">Booking queue and front-desk actions</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {mode === "overview" ? (
                <a
                  href="/admin/appointments"
                  className="inline-flex items-center justify-center rounded-2xl bg-accent-soft px-5 py-3 text-sm font-semibold text-ink transition hover:bg-emerald-100"
                >
                  Open Full Queue
                </a>
              ) : null}
              <Button onClick={() => setIsQuickBookOpen(true)}>Quick Book Appointment</Button>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <label className="relative block w-full lg:max-w-sm">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search patient, doctor, specialty"
                className="w-full rounded-2xl border border-slate-200 px-11 py-3 text-sm outline-none"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              {statusFilters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setSelectedStatus(filter)}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition",
                    selectedStatus === filter ? "bg-ink text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {filter.replaceAll("_", " ")}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-[24px] border border-slate-100">
            <table className="min-w-full border-collapse">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="px-4 py-4">Patient</th>
                  <th className="px-4 py-4">Doctor</th>
                  <th className="px-4 py-4">Slot</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Update status</th>
                  <th className="px-4 py-4">Payment</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {visibleAppointments.map((appointment) => {
                  const draftStatus = statusDrafts[appointment.id] ?? appointment.status;
                  const isFinalized = appointment.status === "COMPLETED" || appointment.status === "CANCELLED";
                  const isUpdating = updatingAppointmentId === appointment.id;
                  const hasDraftChange = draftStatus !== appointment.status;
                  const statusMessage = statusMessages[appointment.id];

                  return (
                    <tr key={appointment.id} className="border-t border-slate-100 align-top">
                      <td className="px-4 py-4">
                        <p className="font-semibold text-ink">{appointment.patient.fullName}</p>
                        <p className="mt-1 text-sm text-slate-500">{appointment.reasonForVisit}</p>
                        <p className="mt-1 text-xs text-slate-400">{appointment.patient.phone}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-ink">{appointment.doctorProfile.user.fullName}</p>
                        <p className="mt-1 text-sm text-slate-500">{appointment.doctorProfile.specialty}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-ink">{formatDateTime(appointment.appointmentStartAt)}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-semibold", statusClasses[appointment.status])}>
                          {appointment.status.replaceAll("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-2">
                          <select
                            className="w-full min-w-44 rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none disabled:bg-slate-50 disabled:text-slate-400"
                            value={draftStatus}
                            disabled={isFinalized || isUpdating}
                            onChange={(event) =>
                              setStatusDrafts((current) => ({
                                ...current,
                                [appointment.id]: event.target.value as QueueStatus
                              }))
                            }
                          >
                            {queueStatusOptions.map((statusOption) => (
                              <option key={statusOption} value={statusOption}>
                                {statusOption.replaceAll("_", " ")}
                              </option>
                            ))}
                          </select>

                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              loading={isUpdating}
                              disabled={!hasDraftChange || isFinalized}
                              onClick={() => void handleStatusUpdate(appointment.id)}
                            >
                              Save
                            </Button>
                            {isFinalized ? <span className="text-xs font-medium text-slate-400">Finalized</span> : null}
                          </div>

                          {statusMessage ? (
                            <p
                              className={cn(
                                "text-xs",
                                statusMessage.toLowerCase().includes("success") ? "text-emerald-600" : "text-rose-600"
                              )}
                            >
                              {statusMessage}
                            </p>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-slate-600">{appointment.paymentStatus}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-[28px] bg-white p-6 shadow-panel">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Doctor Load</p>
              <h3 className="mt-2 text-xl font-semibold text-ink">Schedule pressure</h3>
            </div>

            <div className="mt-5 space-y-4">
              {dashboard.doctorLoad.map((doctor) => (
                <div key={doctor.doctorName} className="rounded-[22px] bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">{doctor.doctorName}</p>
                      <p className="mt-1 text-sm text-slate-500">{doctor.specialty}</p>
                    </div>
                    <Stethoscope className="h-5 w-5 text-accent" />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                    <span>{doctor.queueCount} patients in queue</span>
                    <span>{doctor.nextFreeSlot ? `Next slot: ${formatTime(doctor.nextFreeSlot)}` : "No open slot today"}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] bg-white p-6 shadow-panel">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Payment Exceptions</p>
              <h3 className="mt-2 text-xl font-semibold text-ink">Revenue risks around bookings</h3>
            </div>

            <div className="mt-5 space-y-4">
              {dashboard.paymentAlerts.map((alert) => (
                <div key={alert.id} className="rounded-[22px] border border-slate-100 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-ink">{alert.patientName}</p>
                      <p className="mt-1 text-sm text-slate-500">{alert.doctorName}</p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                      {alert.paymentStatus}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-700">{formatCurrency(alert.consultationFee)}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>

      <Modal
        open={isQuickBookOpen}
        onClose={() => setIsQuickBookOpen(false)}
        title="Quick Book Appointment"
        description="Create a real booking directly in MySQL for a patient by email."
      >
        <form className="space-y-4" onSubmit={handleQuickBook}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Patient email</span>
            <input
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
              value={formState.patientEmail}
              onChange={(event) => setFormState((current) => ({ ...current, patientEmail: event.target.value }))}
              type="email"
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Doctor</span>
            <select
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
              value={formState.doctorProfileId}
              onChange={(event) => setFormState((current) => ({ ...current, doctorProfileId: event.target.value }))}
            >
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.user.fullName} / {doctor.specialty}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Date</span>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
                type="date"
                value={formState.appointmentDate}
                onChange={(event) => setFormState((current) => ({ ...current, appointmentDate: event.target.value }))}
                required
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Time</span>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
                type="time"
                step={1800}
                value={formState.appointmentTime}
                onChange={(event) => setFormState((current) => ({ ...current, appointmentTime: event.target.value }))}
                required
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Reason for visit</span>
            <textarea
              className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
              value={formState.reasonForVisit}
              onChange={(event) => setFormState((current) => ({ ...current, reasonForVisit: event.target.value }))}
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Payment method</span>
            <select
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
              value={formState.paymentMethod}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  paymentMethod: event.target.value as (typeof paymentMethods)[number]
                }))
              }
            >
              {paymentMethods.map((paymentMethod) => (
                <option key={paymentMethod} value={paymentMethod}>
                  {paymentMethod.replace("_", " ")}
                </option>
              ))}
            </select>
          </label>

          {errorMessage ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</p> : null}

          <div className="flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={() => setIsQuickBookOpen(false)}>
              Close
            </Button>
            <Button loading={loading} type="submit">
              Create Booking
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="rounded-[24px] bg-white p-5 shadow-panel">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">{label}</p>
        <span className="rounded-full bg-slate-100 p-2 text-slate-600">{icon}</span>
      </div>
      <p className="mt-3 text-3xl font-semibold text-ink">{value}</p>
    </div>
  );
}
