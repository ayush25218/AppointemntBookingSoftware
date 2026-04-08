import { DoctorDirectory, type DoctorDirectoryItem } from "@/components/doctors/DoctorDirectory";
import { safeApiFetchServer } from "@/lib/api/server";
import { getServerSession } from "@/lib/auth/serverSession";

interface DoctorsResponse {
  success: boolean;
  items: DoctorDirectoryItem[];
}

export default async function DoctorsPage() {
  const [session, doctorsResponse] = await Promise.all([
    getServerSession(),
    safeApiFetchServer<DoctorsResponse>("/doctors?limit=12")
  ]);

  const bookingRole =
    session?.role === "PATIENT" ? "PATIENT" : session?.role === "SUPER_ADMIN" || session?.role === "RECEPTION" ? "STAFF" : "NONE";

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-10 md:px-8">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Doctors</p>
        <h1 className="mt-2 text-4xl font-semibold text-ink">Find a specialist and book live slots</h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Search by specialty or city, review consultation fees, and create appointments with backend slot protection.
        </p>
      </div>

      <DoctorDirectory
        doctors={doctorsResponse?.items ?? []}
        canBook={bookingRole !== "NONE"}
        bookingRole={bookingRole}
      />
    </main>
  );
}

