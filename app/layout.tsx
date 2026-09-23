import type { Metadata } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import { MoraExperience } from "@/components/MoraExperience";
import "./globals.css";

const fasthand = localFont({
  src: "../public/fonts/Fasthand-Regular.ttf",
  variable: "--font-fasthand",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Mora Dining",
    template: "%s — Mora Dining",
  },
  description: "Playful food, generous tables, and memorable gatherings by Mora Dining.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={fasthand.variable}>
      <body>
        <MoraExperience>{children}</MoraExperience>
      </body>
    </html>
  );
}
