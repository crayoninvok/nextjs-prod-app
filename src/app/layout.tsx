import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PA/UA Dashboard",
  description:
    "Upload Excel to analyze Physical Availability (PA%), Use of Availability (UA%), and consolidated equipment metrics.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased">
        {children}
      </body>
    </html>
  );
}
