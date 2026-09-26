"use client";

import gsap from "gsap";
import { Bodies, Composite, Engine } from "matter-js";
import type { Body } from "matter-js";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { getSection, sections, type Section, type SectionSlug } from "@/lib/sections";

type MoraExperienceProps = {
  children: ReactNode;
};

type ShapeStyle = CSSProperties & Record<`--${string}`, string>;

type PhysicsShape = {
  body: Body;
  element: HTMLElement;
  home: { x: number; y: number };
};

const collisionScale: Record<SectionSlug, { x: number; y: number }> = {
  supper: { x: 0.82, y: 0.82 },
  "sample-menus": { x: 0.82, y: 0.76 },
  "how-we-work": { x: 0.68, y: 0.86 },
  about: { x: 0.72, y: 0.88 },
  contact: { x: 0.84, y: 0.72 },
};

function useResolvedPhysics(
  compositionRef: React.RefObject<HTMLElement | null>,
  isMobile: boolean | null,
  revision: number,
) {
  useLayoutEffect(() => {
    const composition = compositionRef.current;
    if (!composition || isMobile === null) return;

    const elements = Array.from(composition.querySelectorAll<HTMLElement>("[data-shape]"));
    if (!elements.length) return;

    const engine = Engine.create();
    engine.gravity.scale = 0;

    const shapeBodies: PhysicsShape[] = elements.map((element) => {
      const slug = element.dataset.sectionSlug as SectionSlug;
      const section = getSection(slug)!;
      const width = element.offsetWidth;
      const height = element.offsetHeight;
      const home = {
        x: element.offsetLeft + width / 2,
        y: element.offsetTop + height / 2,
      };
      const rotation = parseFloat(isMobile ? section.mobile.rotation : section.desktop.rotation);
      const scale = collisionScale[slug];
      const body = Bodies.rectangle(home.x, home.y, width * scale.x, height * scale.y, {
        angle: (rotation * Math.PI) / 180,
        inertia: Infinity,
        isStatic: slug === "how-we-work",
        isSensor: !isMobile,
        label: slug,
      });

      return { body, element, home };
    });

    Composite.add(engine.world, shapeBodies.map(({ body }) => body));

    // Resolve any collisions before the browser paints. The chair is the fixed
    // anchor; the other pieces make only the tiny adjustments needed around it.
    for (let frame = 0; frame < 28; frame += 1) {
      Engine.update(engine, 1000 / 60);
    }

    for (const shape of shapeBodies) {
      const x = shape.body.position.x - shape.home.x;
      const y = shape.body.position.y - shape.home.y;
      const angle = (shape.body.angle * 180) / Math.PI;
      shape.element.style.setProperty("--physics-x", `${x.toFixed(2)}px`);
      shape.element.style.setProperty("--physics-y", `${y.toFixed(2)}px`);
      shape.element.style.setProperty("--physics-rotation", `${angle.toFixed(3)}deg`);
      shape.element.style.setProperty("--physics-counter-rotation", `${(-angle).toFixed(3)}deg`);
    }
    composition.dataset.physics = "resolved";
    Engine.clear(engine);

    return () => {
      delete composition.dataset.physics;
      for (const { element } of shapeBodies) {
        element.style.removeProperty("--physics-x");
        element.style.removeProperty("--physics-y");
        element.style.removeProperty("--physics-rotation");
        element.style.removeProperty("--physics-counter-rotation");
      }
    };
  }, [compositionRef, isMobile, revision]);
}

function getSlugFromPath(pathname: string): SectionSlug | null {
  const slug = pathname.split("/").filter(Boolean)[0];
  return slug && getSection(slug) ? (slug as SectionSlug) : null;
}

function ShapeLink({
  section,
  active,
  muted,
  onActivate,
  onDeactivate,
}: {
  section: Section;
  active: boolean;
  muted: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
}) {
  const shapePath = `/shapes/${section.shape}.svg`;
  const style: ShapeStyle = {
    "--d-left": section.desktop.left,
    "--d-top": section.desktop.top,
    "--d-width": section.desktop.width,
    "--d-rotation": section.desktop.rotation,
    "--label-left": section.desktop.labelLeft,
    "--label-top": section.desktop.labelTop,
    "--m-left": section.mobile.left,
    "--m-top": section.mobile.top,
    "--m-width": section.mobile.width,
    "--m-rotation": section.mobile.rotation,
  };

  return (
    <Link
      href={`/${section.slug}/`}
      className={`shape-link shape-link--${section.slug}${active ? " is-active" : ""}${muted ? " is-muted" : ""}`}
      style={style}
      data-shape
      data-section-slug={section.slug}
      aria-label={`Open ${section.title}`}
      aria-current={active ? "page" : undefined}
      onMouseEnter={onActivate}
      onMouseLeave={onDeactivate}
      onFocus={onActivate}
      onBlur={onDeactivate}
    >
      <span
        className="shape-link__photo-mask"
        style={{
          maskImage: `url(${shapePath})`,
          WebkitMaskImage: `url(${shapePath})`,
        }}
        aria-hidden="true"
      >
        {/* Images remain decorative here; the link supplies the accessible name. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={section.image} alt="" style={{ objectPosition: section.imagePosition }} />
      </span>
      <span
        className="shape-link__neutral-mask"
        style={{
          maskImage: `url(${shapePath})`,
          WebkitMaskImage: `url(${shapePath})`,
        }}
        aria-hidden="true"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="shape-link__base" src={shapePath} alt="" aria-hidden="true" />
      <span className="shape-link__label" aria-hidden="true">
        {section.title}
      </span>
    </Link>
  );
}

export function MoraExperience({ children }: MoraExperienceProps) {
  const pathname = usePathname();
  const router = useRouter();
  const routeSlug = getSlugFromPath(pathname);
  const [hoveredSlug, setHoveredSlug] = useState<SectionSlug | null>(null);
  const [mobileActiveSlug, setMobileActiveSlug] = useState<SectionSlug>("how-we-work");
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [physicsRevision, setPhysicsRevision] = useState(0);
  const shellRef = useRef<HTMLDivElement>(null);
  const compositionRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const previousRouteRef = useRef<SectionSlug | null>(routeSlug);

  const activeSlug = routeSlug ?? (isMobile === true ? mobileActiveSlug : hoveredSlug);
  const hasActive = activeSlug !== null;
  const currentSection = useMemo(
    () => (routeSlug ? getSection(routeSlug) ?? null : null),
    [routeSlug],
  );

  useEffect(() => {
    const query = window.matchMedia("(max-width: 899px), (max-height: 649px)");
    const sync = () => setIsMobile(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    let resizeTimer = 0;
    const refreshPhysics = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => setPhysicsRevision((value) => value + 1), 180);
    };
    window.addEventListener("resize", refreshPhysics);
    return () => {
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", refreshPhysics);
    };
  }, []);

  useResolvedPhysics(compositionRef, isMobile, physicsRevision);

  useLayoutEffect(() => {
    if (!shellRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const context = gsap.context(() => {
      gsap.fromTo("[data-logo]", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.45 });
    }, shellRef);

    return () => context.revert();
  }, []);

  useEffect(() => {
    if (isMobile !== true || routeSlug || menuOpen) return;

    const shapes = Array.from(document.querySelectorAll<HTMLElement>("[data-shape]"));
    let ticking = false;

    const updateActive = () => {
      const center = window.innerHeight * 0.5;
      let nearest: { slug: SectionSlug; distance: number } | null = null;

      for (const shape of shapes) {
        const rect = shape.getBoundingClientRect();
        if (rect.bottom < -80 || rect.top > window.innerHeight + 80) continue;
        const slug = shape.dataset.sectionSlug as SectionSlug;
        const distance = Math.abs(rect.top + rect.height / 2 - center);
        if (!nearest || distance < nearest.distance) nearest = { slug, distance };
      }

      if (nearest) setMobileActiveSlug((current) => (current === nearest!.slug ? current : nearest!.slug));
      ticking = false;
    };

    const requestUpdate = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(updateActive);
      }
    };

    updateActive();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, [isMobile, menuOpen, routeSlug]);

  useEffect(() => {
    if (routeSlug) {
      previousRouteRef.current = routeSlug;
      document.body.classList.add("is-panel-open");
      window.requestAnimationFrame(() => drawerRef.current?.focus());
    } else {
      document.body.classList.remove("is-panel-open");
      const previousSlug = previousRouteRef.current;
      if (previousSlug) {
        window.setTimeout(() => {
          document.querySelector<HTMLElement>(`[data-section-slug="${previousSlug}"]`)?.focus();
        }, 80);
      }
    }

    return () => document.body.classList.remove("is-panel-open");
  }, [routeSlug]);

  useEffect(() => {
    if (!routeSlug || !drawerRef.current) return;

    const drawer = drawerRef.current;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        router.push("/");
        return;
      }

      if (event.key !== "Tab") return;
      const focusable = Array.from(
        drawer.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [routeSlug, router]);

  useEffect(() => {
    document.body.classList.toggle("is-menu-open", menuOpen);
    return () => document.body.classList.remove("is-menu-open");
  }, [menuOpen]);

  return (
    <div ref={shellRef} className="site-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>

      <header className="site-header">
        <Link href="/" className="site-logo" aria-label="Mora Dining home" data-logo>
          <span aria-hidden="true" />
        </Link>
        <button
          className={`menu-button${menuOpen ? " is-open" : ""}`}
          type="button"
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
        </button>
      </header>

      <main id="main-content">
        <section
          className={`shape-stage${hasActive ? " has-active" : ""}`}
          aria-label="Explore Mora Dining"
          aria-hidden={Boolean(routeSlug)}
        >
          <div ref={compositionRef} className="shape-composition">
            {sections.map((section) => (
              <ShapeLink
                key={section.slug}
                section={section}
                active={activeSlug === section.slug}
                muted={hasActive && activeSlug !== section.slug}
                onActivate={() => isMobile === false && !routeSlug && setHoveredSlug(section.slug)}
                onDeactivate={() => isMobile === false && !routeSlug && setHoveredSlug(null)}
              />
            ))}
          </div>
        </section>

        {routeSlug && currentSection ? (
          <>
            <button
              className="panel-backdrop"
              type="button"
              aria-label="Close section"
              onClick={() => router.push("/")}
            />
            <aside
              ref={drawerRef}
              className="section-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="section-panel-title"
              tabIndex={-1}
            >
              <div className="section-panel__bar">
                <Link href="/" className="section-panel__close" aria-label="Close section">
                  <span aria-hidden="true">Close</span>
                  <span aria-hidden="true">×</span>
                </Link>
              </div>
              <div id="section-panel-title" className="visually-hidden">
                {currentSection.title}
              </div>
              {children}
              <nav className="section-panel__nav" aria-label="Mora sections">
                {sections.map((section) => (
                  <Link
                    key={section.slug}
                    href={`/${section.slug}/`}
                    aria-current={section.slug === routeSlug ? "page" : undefined}
                  >
                    {section.navigationTitle}
                  </Link>
                ))}
              </nav>
            </aside>
          </>
        ) : null}
      </main>

      <nav
        id="mobile-navigation"
        className={`mobile-navigation${menuOpen ? " is-open" : ""}`}
        aria-hidden={!menuOpen}
        aria-label="Main navigation"
      >
        {sections.map((section, index) => (
          <Link
            key={section.slug}
            href={`/${section.slug}/`}
            tabIndex={menuOpen ? 0 : -1}
            onClick={() => setMenuOpen(false)}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            {section.navigationTitle}
          </Link>
        ))}
      </nav>
    </div>
  );
}
