"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

type LoginResponse = {
  success: boolean;
  message?: string;
  code?: string;
  data?: {
    redirectPath: string;
    user: {
      id: string;
      fullName: string;
      email: string;
      role: string;
    };
  };
};

const demoAccounts = [
  { label: "Admin", email: "admin@apollocare.in", password: "Admin@123" },
  { label: "Reception", email: "reception@apollocare.in", password: "Reception@123" },
  { label: "Doctor", email: "riya.sharma@apollocare.in", password: "Doctor@123" },
  { label: "Patient", email: "vikram.patel@gmail.com", password: "Patient@123" }
];

export function LoginForm() {
  const [email, setEmail] = useState("admin@apollocare.in");
  const [password, setPassword] = useState("Admin@123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const result = (await response.json()) as LoginResponse;

      if (!response.ok || !result.success || !result.data?.redirectPath) {
        setError(result.message ?? "Sign in failed");
        return;
      }

      window.location.assign(result.data.redirectPath);
    } catch {
      setError("Unable to reach the API. Please check that backend and MySQL are running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
          <input
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-0"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="doctor@hospital.com"
            required
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
          <input
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-0"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="********"
            required
          />
        </label>
        {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
        <Button fullWidth loading={loading} type="submit">
          Continue
        </Button>
      </form>

      <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-ink">Demo credentials</p>
        <div className="mt-3 grid gap-2">
          {demoAccounts.map((account) => (
            <button
              key={account.label}
              type="button"
              className="rounded-2xl border border-white bg-white px-3 py-3 text-left transition hover:border-slate-200"
              onClick={() => {
                setEmail(account.email);
                setPassword(account.password);
                setError(null);
              }}
            >
              <p className="text-sm font-semibold text-ink">{account.label}</p>
              <p className="text-xs text-slate-600">{account.email}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

