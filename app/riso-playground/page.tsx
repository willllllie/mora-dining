import type { Metadata } from "next";
import { RisoPlayground } from "@/components/riso/RisoPlayground";

export const metadata: Metadata = {
  title: "Mora Risograph Playground",
  description: "Tune and export the Mora risograph print treatment.",
};

export default function RisoPlaygroundPage() {
  return <RisoPlayground />;
}
