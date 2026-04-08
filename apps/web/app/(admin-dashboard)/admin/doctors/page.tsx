import { apiFetchServer, getServerAccessToken } from "@/lib/api/server";
import { formatCurrency } from "@/lib/utils/formatters";

interface DoctorsResponse {
  success: boolean;
  items: Array<{
    id: string;
    specialty: string;
    qualification: string | null;
    consultationFee: string;
    yearsOfExperience: number;
    averageRating: string;
    totalReviews: number;
    clinicCity: string | null;
    clinicState: string | null;
    user: {
      fullName: string;
    };
  }>;
}

export default async function AdminDoctorsPage() {
  const token = await getServerAccessToken();
  const response = await apiFetchServer<DoctorsResponse>("/doctors?limit=20", { token });

  return (
    <section className="space-y-4">
      <div className="rounded-[28px] bg-white p-6 shadow-panel">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Doctor Management</p>
        <h2 className="mt-2 text-2xl font-semibold text-ink">Live specialist directory</h2>
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {response.items.map((doctor) => (
          <article key={doctor.id} className="rounded-[28px] bg-white p-6 shadow-panel">
            <p className="text-sm font-medium text-accent">{doctor.specialty}</p>
            <h3 className="mt-2 text-2xl font-semibold text-ink">{doctor.user.fullName}</h3>
            <p className="mt-2 text-sm text-slate-600">{doctor.qualification}</p>
            <div className="mt-5 grid gap-3 rounded-[22px] bg-slate-50 p-4">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Fee</span>
                <span className="font-semibold text-ink">{formatCurrency(doctor.consultationFee)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Experience</span>
                <span className="font-semibold text-ink">{doctor.yearsOfExperience} years</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Reviews</span>
                <span className="font-semibold text-ink">{doctor.averageRating} / {doctor.totalReviews}</span>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              {[doctor.clinicCity, doctor.clinicState].filter(Boolean).join(", ")}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
