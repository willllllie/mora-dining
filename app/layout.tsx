import type { Metadata } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import { ExperienceRouter } from "@/components/ExperienceRouter";
import "./globals.css";

const fasthand = localFont({
  src: "../public/fonts/Fasthand-Regular.ttf",
  variable: "--font-fasthand",
  display: "swap",
});

const areal = localFont({
  src: [
    { path: "../public/fonts/areal/ABCAreal-Regular.woff2", weight: "400" },
    { path: "../public/fonts/areal/ABCAreal-Medium.woff2", weight: "500" },
    { path: "../public/fonts/areal/ABCAreal-Bold.woff2", weight: "700" },
  ],
  variable: "--font-areal",
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
    <html lang="en" className={`${fasthand.variable} ${areal.variable}`} data-scroll-behavior="smooth">
      <body>
        <ExperienceRouter>{children}</ExperienceRouter>
      </body>
    </html>
  );
}
