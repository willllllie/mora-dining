import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isSectionSlug, sectionSlugs } from "@/lib/sections";

type SectionPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return sectionSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: SectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!isSectionSlug(slug)) return {};
  return { title: `${slug === "how-we-work" ? "Offerings" : slug === "about" ? "About us" : slug === "supper" ? "Supper Supper Supper" : slug === "sample-menus" ? "Sample Menus" : "Contact"} — Third version` };
}

export default async function ThirdVersionSectionPage({ params }: SectionPageProps) {
  const { slug } = await params;
  if (!isSectionSlug(slug)) notFound();
  return null;
}
