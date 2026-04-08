"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, MapPin, Search, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/formatters";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

type WorkingHoursDay = {
  dayOfWeek: number;
  windows: Array<{
    start: string;
    end: string;
  }>;
};

export interface DoctorDirectoryItem {
  id: string;
  specialty: string;
  qualification: string | null;
  consultationFee: string;
  yearsOfExperience: number;
  slotDurationMinutes: number;
  timezone: string;
  workingHoursJson: WorkingHoursDay[];
  clinicCity: string | null;
  clinicState: string | null;
  averageRating: string;
  totalReviews: number;
  user: {
    fullName: string;
    avatarUrl: string | null;
  };
}

interface DoctorDirectoryProps {
  doctors: DoctorDirectoryItem[];
  canBook: boolean;
  bookingRole: "PATIENT" | "STAFF" | "NONE";
}

const paymentMethods = ["UPI", "CARD", "CASH", "NET_BANKING", "WALLET"] as const;

export function DoctorDirectory({ doctors, canBook, bookingRole }: DoctorDirectoryProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorDirectoryItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [bookingForm, setBookingForm] = useState({
    appointmentDate: "",
    appointmentTime: "",
    reasonForVisit: "",
    patientEmail: "",
    paymentMethod: "UPI" as (typeof paymentMethods)[number]
  });

  const deferredSearch = useDeferredValue(search);

  const filteredDoctors = useMemo(() => {
    const normalized = deferredSearch.trim().toLowerCase();

    if (!normalized) {
      return doctors;
    }

    return doctors.filter((doctor) => {
      return (
        doctor.user.fullName.toLowerCase().includes(normalized) ||
        doctor.specialty.toLowerCase().includes(normalized) ||
        `${doctor.clinicCity ?? ""} ${doctor.clinicState ?? ""}`.toLowerCase().includes(normalized)
      );
    });
  }, [deferredSearch, doctors]);

  const handleBookAppointment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedDoctor) {
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const appointmentStartLocal = `${bookingForm.appointmentDate}T${bookingForm.appointmentTime}:00`;
      const body: Record<string, unknown> = {
        doctorProfileId: selectedDoctor.id,
        appointmentStartLocal,
        patientTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        reasonForVisit: bookingForm.reasonForVisit,
        paymentMethod: bookingForm.paymentMethod
      };

      if (bookingRole === "STAFF" && bookingForm.patientEmail) {
        body.patientEmail = bookingForm.patientEmail;
      }

      const response = await fetch(`${apiBaseUrl}/appointments/book`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      const result = (await response.json()) as { success?: boolean; message?: string };

      if (!response.ok) {
        setErrorMessage(result.message ?? "Unable to book appointment");
        return;
      }

      setSelectedDoctor(null);
      setBookingForm({
        appointmentDate: "",
        appointmentTime: "",
        reasonForVisit: "",
        patientEmail: "",
        paymentMethod: "UPI"
      });
      setSuccessMessage(`Appointment booked with ${selectedDoctor.user.fullName}.`);
      router.refresh();
    } catch {
      setErrorMessage("Unable to reach the booking API right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[28px] bg-white p-5 shadow-panel md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Consultant Directory</p>
          <h2 className="mt-2 text-2xl font-semibold text-ink">Search, compare, and book real clinic slots</h2>
        </div>
        <label className="relative block w-full md:max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-11 py-3 outline-none"
            placeholder="Search doctor, specialty, or city"
          />
        </label>
      </div>

      {successMessage ? (
        <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredDoctors.map((doctor) => (
          <article key={doctor.id} className="rounded-[28px] bg-white p-6 shadow-panel">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-accent">{doctor.specialty}</p>
                <h3 className="mt-2 text-2xl font-semibold text-ink">{doctor.user.fullName}</h3>
              </div>
              <div className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
                <span className="inline-flex items-center gap-1">
                  <Star className="h-4 w-4 fill-current" />
                  {doctor.averageRating}
                </span>
              </div>
            </div>

            <p className="mt-3 text-sm text-slate-600">{doctor.qualification ?? "Consultant physician"}</p>
            <p className="mt-2 inline-flex items-center gap-2 text-sm text-slate-600">
              <MapPin className="h-4 w-4" />
              {[doctor.clinicCity, doctor.clinicState].filter(Boolean).join(", ")}
            </p>

            <div className="mt-5 grid gap-3 rounded-[22px] bg-slate-50 p-4">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Consultation fee</span>
                <span className="font-semibold text-ink">{formatCurrency(doctor.consultationFee)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Experience</span>
                <span className="font-semibold text-ink">{doctor.yearsOfExperience} years</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Slot duration</span>
                <span className="font-semibold text-ink">{doctor.slotDurationMinutes} mins</span>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Clinic timings</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {doctor.workingHoursJson.slice(0, 3).map((day) => (
                  <span key={`${doctor.id}-${day.dayOfWeek}`} className="rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700">
                    Day {day.dayOfWeek}: {day.windows[0]?.start} - {day.windows[0]?.end}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6">
              {canBook ? (
                <Button fullWidth onClick={() => setSelectedDoctor(doctor)} leftIcon={<CalendarClock className="h-4 w-4" />}>
                  Book Appointment
                </Button>
              ) : (
                <a
                  href="/login"
                  className={cn(
                    "inline-flex w-full items-center justify-center rounded-2xl bg-accent-soft px-5 py-3 text-sm font-semibold text-ink transition hover:bg-emerald-100"
                  )}
                >
                  Sign in to book
                </a>
              )}
            </div>
          </article>
        ))}
      </div>

      <Modal
        open={selectedDoctor !== null}
        onClose={() => setSelectedDoctor(null)}
        title={selectedDoctor ? `Book with ${selectedDoctor.user.fullName}` : "Book appointment"}
        description="Select your date, time, and consultation reason. Slot conflicts are protected by the backend."
      >
        <form className="space-y-4" onSubmit={handleBookAppointment}>
          {bookingRole === "STAFF" ? (
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Patient email</span>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
                value={bookingForm.patientEmail}
                onChange={(event) => setBookingForm((current) => ({ ...current, patientEmail: event.target.value }))}
                type="email"
                placeholder="patient@gmail.com"
                required
              />
            </label>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Date</span>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
                type="date"
                value={bookingForm.appointmentDate}
                onChange={(event) => setBookingForm((current) => ({ ...current, appointmentDate: event.target.value }))}
                required
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Time</span>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
                type="time"
                step={1800}
                value={bookingForm.appointmentTime}
                onChange={(event) => setBookingForm((current) => ({ ...current, appointmentTime: event.target.value }))}
                required
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Reason for visit</span>
            <textarea
              className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
              value={bookingForm.reasonForVisit}
              onChange={(event) => setBookingForm((current) => ({ ...current, reasonForVisit: event.target.value }))}
              placeholder="Describe symptoms or consultation purpose"
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Payment method</span>
            <select
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
              value={bookingForm.paymentMethod}
              onChange={(event) =>
                setBookingForm((current) => ({
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

          {errorMessage ? (
            <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </p>
          ) : null}

          <div className="flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={() => setSelectedDoctor(null)}>
              Close
            </Button>
            <Button loading={loading} type="submit">
              Confirm Booking
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

