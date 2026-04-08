"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

export function LogoutButton({ redirectTo = "/login" }: { redirectTo?: string }) {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);

    try {
      await fetch(`${apiBaseUrl}/auth/logout`, {
        method: "POST",
        credentials: "include"
      });
    } finally {
      window.location.assign(redirectTo);
    }
  };

  return (
    <Button variant="ghost" onClick={handleLogout} loading={loading} leftIcon={<LogOut className="h-4 w-4" />}>
      Sign out
    </Button>
  );
}
