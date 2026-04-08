"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency, formatDateTime } from "@/lib/utils/formatters";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

export interface PatientAppointmentItem {
  id: string;
  appointmentStartAt: string;
  appointmentEndAt: string;
  status: "PENDING_PAYMENT" | "CONFIRMED" | "CHECKED_IN" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  paymentStatus: "PENDING" | "PAID" | "REFUNDED" | "FAILED";
  reasonForVisit: string;
  cancelReason: string | null;
  doctorProfile: {
    specialty: string;
    consultationFee?: string;
    user: {
      fullName: string;
    };
  };
}

export function PatientAppointmentsPanel({ appointments }: { appointments: PatientAppointmentItem[] }) {
  const router = useRouter();
  const [selectedAppointment, setSelectedAppointment] = useState<PatientAppointmentItem | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const sortedAppointments = useMemo(() => {
    return [...appointments].sort((first, second) => {
      return new Date(second.appointmentStartAt).getTime() - new Date(first.appointmentStartAt).getTime();
    });
  }, [appointments]);

  const cancelableStatuses = new Set(["PENDING_PAYMENT", "CONFIRMED", "CHECKED_IN"]);

  const handleCancel = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedAppointment) {
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const response = await fetch(`${apiBaseUrl}/appointments/${selectedAppointment.id}/cancel`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          cancelReason
        })
      });

      const result = (await response.json()) as { success?: boolean; message?: string };

      if (!response.ok) {
        setFeedback(result.message ?? "Unable to cancel appointment");
        return;
      }

      setSelectedAppointment(null);
      setCancelReason("");
      router.refresh();
    } catch {
      setFeedback("Unable to cancel appointment right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {sortedAppointments.map((appointment) => (
        <article key={appointment.id} className="rounded-[28px] bg-white p-6 shadow-panel">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">{appointment.doctorProfile.specialty}</p>
              <h2 className="mt-2 text-2xl font-semibold text-ink">{appointment.doctorProfile.user.fullName}</h2>
              <p className="mt-3 text-sm text-slate-600">{appointment.reasonForVisit}</p>
            </div>
            <div className="flex flex-col items-start gap-2 lg:items-end">
              <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700">{appointment.status.replace("_", " ")}</span>
              <span className="rounded-full bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700">{appointment.paymentStatus}</span>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <InfoTile label="Appointment" value={formatDateTime(appointment.appointmentStartAt)} />
            <InfoTile label="Ends" value={formatDateTime(appointment.appointmentEndAt)} />
            <InfoTile label="Fee" value={formatCurrency(appointment.doctorProfile.consultationFee ?? 0)} />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {cancelableStatuses.has(appointment.status) ? (
              <Button variant="danger" onClick={() => setSelectedAppointment(appointment)}>
                Cancel Appointment
              </Button>
            ) : null}
          </div>

          {appointment.cancelReason ? (
            <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Cancel reason: {appointment.cancelReason}
            </p>
          ) : null}
        </article>
      ))}

      <Modal
        open={selectedAppointment !== null}
        onClose={() => setSelectedAppointment(null)}
        title="Cancel appointment"
        description="Tell the clinic why this appointment is being cancelled so the slot can be released properly."
        tone="danger"
      >
        <form className="space-y-4" onSubmit={handleCancel}>
          <textarea
            className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
            value={cancelReason}
            onChange={(event) => setCancelReason(event.target.value)}
            placeholder="Reason for cancellation"
            required
          />

          {feedback ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{feedback}</p> : null}

          <div className="flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={() => setSelectedAppointment(null)}>
              Keep appointment
            </Button>
            <Button variant="danger" type="submit" loading={loading}>
              Confirm cancellation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 font-semibold text-ink">{value}</p>
    </div>
  );
}
