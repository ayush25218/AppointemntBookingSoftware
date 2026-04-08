import { LogoutButton } from "@/components/auth/LogoutButton";

export default function DoctorLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8 md:px-8">
      <div className="mb-8 rounded-[28px] bg-white p-6 shadow-panel">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Doctor Workspace</p>
            <h1 className="mt-2 text-3xl font-semibold text-ink">Daily schedule, queue, and consultation flow</h1>
          </div>
          <LogoutButton />
        </div>
      </div>
      {children}
    </main>
  );
}

