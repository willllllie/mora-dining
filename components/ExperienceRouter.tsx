"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { MoraExperience } from "@/components/MoraExperience";

export function ExperienceRouter({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname.replace(/\/+$/, "") === "/landing-test") return <>{children}</>;

  return <MoraExperience>{children}</MoraExperience>;
}
