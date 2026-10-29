"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { LandingPreview } from "@/components/LandingPreview";
import { MoraExperience } from "@/components/MoraExperience";
import { isSectionSlug } from "@/lib/sections";

export function ExperienceRouter({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const route = pathname.replace(/\/+$/, "");
  if (route === "/third-version" || route.startsWith("/third-version/")) return <>{children}</>;

  if (route === "/landing-test" || isSectionSlug(route.slice(1))) {
    return <LandingPreview />;
  }

  return <MoraExperience>{children}</MoraExperience>;
}
