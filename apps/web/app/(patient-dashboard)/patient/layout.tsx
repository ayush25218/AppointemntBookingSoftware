import Link from "next/link";
import { LogoutButton } from "@/components/auth/LogoutButton";

export default function PatientLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8 md:px-8">
      <div className="mb-8 rounded-[28px] bg-white p-6 shadow-panel">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Patient Dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold text-ink">Manage appointments, payments, and care follow-ups</h1>
          </div>
          <LogoutButton />
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/patient" className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200">
            Overview
          </Link>
          <Link href="/patient/appointments" className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200">
            Appointments
          </Link>
          <Link href="/doctors" className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200">
            Book Doctors
          </Link>
        </div>
      </div>
      {children}
    </main>
  );
}

