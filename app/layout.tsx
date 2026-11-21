import type { Metadata, Viewport } from "next";
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
  metadataBase: new URL("https://mora-dining.netlify.app"),
  title: {
    default: "Mora Dining",
    template: "%s — Mora Dining",
  },
  description: "Playful food, generous tables, and memorable gatherings by Mora Dining.",
  openGraph: {
    title: "Mora Dining",
    description: "Playful food, generous tables, and memorable gatherings by Mora Dining.",
    siteName: "Mora Dining",
    type: "website",
    images: [
      {
        url: "/mora-link-preview-v2.png",
        width: 2276,
        height: 1416,
        alt: "Mora Dining’s five illustrated table objects",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mora Dining",
    description: "Playful food, generous tables, and memorable gatherings by Mora Dining.",
    images: ["/mora-link-preview-v2.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f1ede9",
  colorScheme: "light",
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
