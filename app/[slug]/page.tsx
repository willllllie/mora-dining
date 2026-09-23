import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSection, isSectionSlug, sectionSlugs } from "@/lib/sections";

type SectionPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return sectionSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: SectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const section = getSection(slug);

  if (!section) return {};

  return {
    title: section.title,
    description: `${section.title} at Mora Dining.`,
  };
}

export default async function SectionPage({ params }: SectionPageProps) {
  const { slug } = await params;

  if (!isSectionSlug(slug)) notFound();

  const section = getSection(slug);
  if (!section) notFound();

  return (
    <article className="section-copy">
      <p className="section-copy__eyebrow">Mora Dining</p>
      <h1>{section.title}</h1>
      {slug === "contact" ? (
        <p className="section-copy__intro">Email address coming soon.</p>
      ) : (
        <>
          <p className="section-copy__intro">Content coming soon.</p>
          <div className="section-copy__rule" aria-hidden="true" />
          <p>
            This space is ready for the stories, details, images, and practical information
            that will bring this part of Mora to life.
          </p>
        </>
      )}
    </article>
  );
}
