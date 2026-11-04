import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Third version preview",
  description: "An alternate Mora Dining landing composition.",
};

export default function ThirdVersionPage() {
  redirect("/");
}
