import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pearl Hospital Appointment Platform",
  description: "Doctor appointment booking system with hospital administration dashboards"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

