import Link from "next/link";
import { CalendarClock, ShieldCheck, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function Hero() {
  return (
    <section className="rounded-[32px] bg-hero-wash px-6 py-16 shadow-panel md:px-10">
      <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div>
          <p className="mb-4 inline-flex rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-ink">
            Hospital-grade appointment coordination
          </p>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-ink md:text-6xl">
            Book trusted doctors, manage schedules, and run your hospital desk from one place.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700">
            Designed for patients, doctors, reception teams, and administrators with timezone-safe booking and slot protection.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/doctors">
              <Button size="lg">Explore Doctors</Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary" size="lg">Staff Sign In</Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-4 rounded-[28px] bg-white/85 p-6">
          <div className="rounded-3xl border border-slate-200 p-5">
            <CalendarClock className="h-8 w-8 text-accent" />
            <h2 className="mt-4 text-xl font-semibold text-ink">Live slot booking</h2>
            <p className="mt-2 text-sm text-slate-600">Serializable transactions prevent double-booking when two users hit the same slot together.</p>
          </div>
          <div className="rounded-3xl border border-slate-200 p-5">
            <Stethoscope className="h-8 w-8 text-coral" />
            <h2 className="mt-4 text-xl font-semibold text-ink">Doctor-first scheduling</h2>
            <p className="mt-2 text-sm text-slate-600">Specialty, consultation fee, timings, and review signals are all surfaced in one profile.</p>
          </div>
          <div className="rounded-3xl border border-slate-200 p-5">
            <ShieldCheck className="h-8 w-8 text-gold" />
            <h2 className="mt-4 text-xl font-semibold text-ink">Role-protected dashboards</h2>
            <p className="mt-2 text-sm text-slate-600">Admins, doctors, patients, and reception staff each get a safe, scoped workflow.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
