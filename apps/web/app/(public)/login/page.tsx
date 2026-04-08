import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <section className="w-full max-w-md rounded-[32px] bg-white p-8 shadow-panel">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Secure Access</p>
        <h1 className="mt-3 text-3xl font-semibold text-ink">Sign in to your dashboard</h1>
        <p className="mt-3 text-sm text-slate-600">
          Use a seeded account below, or sign in with a user stored in MySQL.
        </p>
        <div className="mt-8">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
