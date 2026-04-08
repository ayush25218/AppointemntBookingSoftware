import Link from "next/link";
import { LogoutButton } from "@/components/auth/LogoutButton";

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 md:px-8">
      <div className="mb-8 rounded-[28px] bg-ink p-6 text-white shadow-panel">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">Admin Console</p>
            <h1 className="mt-2 text-3xl font-semibold">Hospital operations and scheduling</h1>
          </div>
          <LogoutButton redirectTo="/login" />
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/admin" className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20">
            Dashboard
          </Link>
          <Link href="/admin/appointments" className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20">
            Appointments
          </Link>
          <Link href="/admin/doctors" className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20">
            Doctors
          </Link>
        </div>
      </div>
      {children}
    </main>
  );
}
