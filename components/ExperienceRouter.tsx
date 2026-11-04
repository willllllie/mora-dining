"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ThirdVersion } from "@/components/ThirdVersion";
import { isSectionSlug } from "@/lib/sections";

export function ExperienceRouter({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const route = pathname.replace(/\/+$/, "");
  if (route === "" || isSectionSlug(route.slice(1))) {
    return <ThirdVersion />;
  }

  return <>{children}</>;
}
