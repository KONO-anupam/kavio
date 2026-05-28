// app/layout.tsx

import type { Metadata } from "next";
import { Instrument_Serif, DM_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s — Kavio",
    default: "Kavio",
  },
  description:
    "Scheduling and lead management for local service businesses.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${dmSans.variable}`}
    >
      <body>
        {children}
        <Toaster
          position="bottom-right"
          gap={8}
          toastOptions={{
            duration: 4000,
          }}
        />
      </body>
    </html>
  );
}