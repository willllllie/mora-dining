import type { ReactNode } from "react";
import { ThirdVersion } from "@/components/ThirdVersion";

export default function ThirdVersionLayout({ children }: { children: ReactNode }) {
  return <><ThirdVersion />{children}</>;
}
