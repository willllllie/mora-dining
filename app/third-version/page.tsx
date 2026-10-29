import type { Metadata } from "next";
import { ThirdVersion } from "@/components/ThirdVersion";

export const metadata: Metadata = {
  title: "Third version preview",
  description: "An alternate Mora Dining landing composition.",
};

export default function ThirdVersionPage() {
  return <ThirdVersion />;
}
