import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "P2P Payment Request",
  description: "Request and manage payments between users",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
