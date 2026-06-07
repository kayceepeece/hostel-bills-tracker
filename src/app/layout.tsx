import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hostel Bills Tracker",
  description: "Track light bill, sweeping, environmental, and electricity payments",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}
