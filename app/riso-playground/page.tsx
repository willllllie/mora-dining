import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Mora Risograph Playground",
  description: "Tune and export the Mora risograph print treatment.",
};

export default function RisoPlaygroundPage() {
  redirect("/");
}
