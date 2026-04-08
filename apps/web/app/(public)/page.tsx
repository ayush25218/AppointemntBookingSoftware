import { Hero } from "@/components/marketing/Hero";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-10 px-4 py-6 md:px-8">
      <header className="flex items-center justify-between rounded-full bg-white/80 px-5 py-4 shadow-panel">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Pearl Care Network</p>
          <h1 className="text-xl font-semibold text-ink">Hospital Appointment Portal</h1>
        </div>
        <p className="text-sm text-slate-600">Next.js + Express + MySQL</p>
      </header>
      <Hero />
    </main>
  );
}

