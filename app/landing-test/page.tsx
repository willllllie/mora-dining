import type { Metadata } from "next";
import { LandingPreview } from "@/components/LandingPreview";
import "./landing.css";

export const metadata: Metadata = {
  title: "New landing preview",
  description: "A preview of the new Mora Dining landing animation.",
};

export default function LandingTestPage() {
  return <LandingPreview />;
}
