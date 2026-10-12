import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New landing preview",
  description: "A preview of the new Mora Dining landing animation.",
};

export default function LandingTestPage() {
  // The persistent route-aware preview lives in ExperienceRouter so section
  // navigation can retain its landing composition behind the panel.
  return null;
}
