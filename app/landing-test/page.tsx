import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "New landing preview",
  description: "A preview of the new Mora Dining landing animation.",
};

export default function LandingTestPage() {
  redirect("/");
}
