"use client";

import gsap from "gsap";
import { DialRoot, useDialKit } from "dialkit";
import type { DialConfig } from "dialkit";
import "dialkit/styles.css";
import { Bodies, Body, Common, Composite, Engine } from "matter-js";
import decomp from "poly-decomp";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { getSection, sections, type Section, type SectionSlug } from "@/lib/sections";

type MoraExperienceProps = {
  children: ReactNode;
};

type ShapeStyle = CSSProperties & Record<`--${string}`, string>;

const moraDialConfig = {
  appearance: {
    background: "#262423",
    logo: "#f5f1f0",
    jelly: "#f4cce2",
    pitcher: "#569852",
    chair: "#96bee3",
    cup: "#ed9393",
    table: "#fdce2c",
  },
  physics: {
    simulationSteps: [28, 0, 180, 1],
    gravityX: [0, -1, 1, 0.01],
    gravityY: [0, -1, 1, 0.01],
    gravityScale: [0, 0, 0.01, 0.0001],
    friction: [0.1, 0, 1, 0.01],
    frictionAir: [0.01, 0, 0.3, 0.005],
    restitution: [0, 0, 1, 0.01],
    resolveCollisions: true,
    pinChair: true,
    collisionScale: {
      _collapsed: true,
      global: [1.02, 0.4, 1.5, 0.01],
      jelly: [1, 0.4, 1.5, 0.01],
      pitcher: [1, 0.4, 1.5, 0.01],
      chair: [1, 0.4, 1.5, 0.01],
      cup: [1, 0.4, 1.5, 0.01],
      table: [1, 0.4, 1.5, 0.01],
    },
  },
  debug: {
    wireframes: false,
    bounds: false,
  },
} satisfies DialConfig;

type PhysicsControls = {
  simulationSteps: number;
  gravityX: number;
  gravityY: number;
  gravityScale: number;
  friction: number;
  frictionAir: number;
  restitution: number;
  resolveCollisions: boolean;
  pinChair: boolean;
  collisionScale: {
    global: number;
    jelly: number;
    pitcher: number;
    chair: number;
    cup: number;
    table: number;
  };
};

type DebugControls = {
  wireframes: boolean;
  bounds: boolean;
};

type PhysicsShape = {
  body: Body;
  element: HTMLElement;
  startPosition: { x: number; y: number };
};

type ShapeGeometry = Record<
  SectionSlug,
  { width: number; height: number; points: Array<{ x: number; y: number }> }
>;

Common.setDecomp(decomp);

function sampleSvgPath(pathData: string) {
  const namespace = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(namespace, "svg");
  const path = document.createElementNS(namespace, "path");
  svg.style.position = "fixed";
  svg.style.width = "0";
  svg.style.height = "0";
  svg.style.visibility = "hidden";
  path.setAttribute("d", pathData);
  svg.append(path);
  document.body.append(svg);

  try {
    const length = path.getTotalLength();
    const samples = Math.max(12, Math.min(140, Math.ceil(length / 18)));
    return Array.from({ length: samples }, (_, index) => {
      const point = path.getPointAtLength((index / samples) * length);
      return { x: point.x, y: point.y };
    });
  } finally {
    svg.remove();
  }
}

function useShapeGeometry() {
  const [geometry, setGeometry] = useState<ShapeGeometry | null>(null);

  useEffect(() => {
    let active = true;

    Promise.all(
      sections.map(async (section) => {
        const response = await fetch(`/shapes/${section.shape}.svg`);
        const source = await response.text();
        const documentNode = new DOMParser().parseFromString(source, "image/svg+xml");
        const svg = documentNode.querySelector("svg");
        const outerPath = documentNode.querySelector("path");
        const viewBox = svg?.getAttribute("viewBox")?.split(/\s+/).map(Number);
        const fullPathData = outerPath?.getAttribute("d");

        if (!viewBox || viewBox.length !== 4 || !fullPathData) {
          throw new Error(`Unable to read collision geometry for ${section.shape}`);
        }

        // Ignore secondary subpaths such as the pitcher's handle opening. Matter
        // models the exterior collision silhouette; holes remain visually open.
        const outerPathData = fullPathData.split(/(?=M)/).filter(Boolean)[0];
        return [
          section.slug,
          {
            width: viewBox[2],
            height: viewBox[3],
            points: sampleSvgPath(outerPathData),
          },
        ] as const;
      }),
    ).then((entries) => {
      if (active) setGeometry(Object.fromEntries(entries) as ShapeGeometry);
    });

    return () => {
      active = false;
    };
  }, []);

  return geometry;
}

function useResolvedPhysics(
  compositionRef: React.RefObject<HTMLElement | null>,
  isMobile: boolean | null,
  revision: number,
  physics: PhysicsControls,
  debug: DebugControls,
  geometry: ShapeGeometry | null,
) {
  useLayoutEffect(() => {
    const composition = compositionRef.current;
    if (!composition || isMobile === null || !geometry) return;

    const elements = Array.from(composition.querySelectorAll<HTMLElement>("[data-shape]"));
    if (!elements.length) return;

    const engine = Engine.create();
    engine.positionIterations = 12;
    engine.gravity.x = physics.gravityX;
    engine.gravity.y = physics.gravityY;
    engine.gravity.scale = physics.gravityScale;

    const scaleForSlug: Record<SectionSlug, number> = {
      supper: physics.collisionScale.jelly,
      "sample-menus": physics.collisionScale.pitcher,
      "how-we-work": physics.collisionScale.chair,
      about: physics.collisionScale.cup,
      contact: physics.collisionScale.table,
    };

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
      const rotationRadians = (rotation * Math.PI) / 180;
      const tunedScale = physics.collisionScale.global * scaleForSlug[slug];
      const sourceGeometry = geometry[slug];
      const vertices = sourceGeometry.points.map((point) => ({
        x: (point.x / sourceGeometry.width) * width,
        y: (point.y / sourceGeometry.height) * height,
      }));
      const vertexBounds = vertices.reduce(
        (bounds, vertex) => ({
          minX: Math.min(bounds.minX, vertex.x),
          minY: Math.min(bounds.minY, vertex.y),
          maxX: Math.max(bounds.maxX, vertex.x),
          maxY: Math.max(bounds.maxY, vertex.y),
        }),
        { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
      );
      const body = Bodies.fromVertices(
        home.x,
        home.y,
        [vertices],
        {
          friction: physics.friction,
          frictionAir: physics.frictionAir,
          restitution: physics.restitution,
          inertia: Infinity,
          isStatic: physics.pinChair && slug === "how-we-work",
          isSensor: !physics.resolveCollisions,
          slop: 0.02,
          label: slug,
        },
        true,
        0.01,
        8,
        0.01,
      );

      // `fromVertices` recentres a compound body on its centre of mass. Align
      // its unrotated outline back to the SVG's box, then perform scaling and
      // rotation around the same centre used by CSS. This keeps the collision
      // silhouette and the visible artwork in the same coordinate system.
      const desiredBoundsCenter = {
        x: home.x + (vertexBounds.minX + vertexBounds.maxX) / 2 - width / 2,
        y: home.y + (vertexBounds.minY + vertexBounds.maxY) / 2 - height / 2,
      };
      Body.translate(body, {
        x: desiredBoundsCenter.x - (body.bounds.min.x + body.bounds.max.x) / 2,
        y: desiredBoundsCenter.y - (body.bounds.min.y + body.bounds.max.y) / 2,
      });
      Body.scale(body, tunedScale, tunedScale, home);
      const offsetFromVisualCenter = {
        x: body.position.x - home.x,
        y: body.position.y - home.y,
      };
      Body.setPosition(body, {
        x:
          home.x +
          offsetFromVisualCenter.x * Math.cos(rotationRadians) -
          offsetFromVisualCenter.y * Math.sin(rotationRadians),
        y:
          home.y +
          offsetFromVisualCenter.x * Math.sin(rotationRadians) +
          offsetFromVisualCenter.y * Math.cos(rotationRadians),
      });
      Body.rotate(body, rotationRadians);

      return {
        body,
        element,
        startPosition: { x: body.position.x, y: body.position.y },
      };
    });

    Composite.add(engine.world, shapeBodies.map(({ body }) => body));

    // Resolve any collisions before the browser paints. The chair is the fixed
    // anchor; the other pieces make only the tiny adjustments needed around it.
    for (let frame = 0; frame < physics.simulationSteps; frame += 1) {
      Engine.update(engine, 1000 / 60);
    }

    for (const shape of shapeBodies) {
      const x = shape.body.position.x - shape.startPosition.x;
      const y = shape.body.position.y - shape.startPosition.y;
      const angle = (shape.body.angle * 180) / Math.PI;
      shape.element.style.setProperty("--physics-x", `${x.toFixed(2)}px`);
      shape.element.style.setProperty("--physics-y", `${y.toFixed(2)}px`);
      shape.element.style.setProperty("--physics-rotation", `${angle.toFixed(3)}deg`);
      shape.element.style.setProperty("--physics-counter-rotation", `${(-angle).toFixed(3)}deg`);
    }

    let debugLayer: SVGSVGElement | null = null;
    if (debug.wireframes || debug.bounds) {
      const namespace = "http://www.w3.org/2000/svg";
      debugLayer = document.createElementNS(namespace, "svg");
      debugLayer.classList.add("physics-debug");
      debugLayer.setAttribute("viewBox", `0 0 ${composition.clientWidth} ${composition.clientHeight}`);
      debugLayer.setAttribute("aria-hidden", "true");

      for (const { body } of shapeBodies) {
        if (debug.wireframes) {
          const parts = body.parts.length > 1 ? body.parts.slice(1) : [body];
          for (const part of parts) {
            const polygon = document.createElementNS(namespace, "polygon");
            polygon.setAttribute(
              "points",
              part.vertices.map((vertex) => `${vertex.x},${vertex.y}`).join(" "),
            );
            polygon.setAttribute("data-body", body.label);
            polygon.classList.add("physics-debug__body");
            debugLayer.append(polygon);
          }
        }

        if (debug.bounds) {
          const rect = document.createElementNS(namespace, "rect");
          rect.setAttribute("x", String(body.bounds.min.x));
          rect.setAttribute("y", String(body.bounds.min.y));
          rect.setAttribute("width", String(body.bounds.max.x - body.bounds.min.x));
          rect.setAttribute("height", String(body.bounds.max.y - body.bounds.min.y));
          rect.setAttribute("data-bound", body.label);
          rect.classList.add("physics-debug__bounds");
          debugLayer.append(rect);
        }
      }

      composition.append(debugLayer);
    }
    composition.dataset.physics = "resolved";
    Engine.clear(engine);

    return () => {
      delete composition.dataset.physics;
      debugLayer?.remove();
      for (const { element } of shapeBodies) {
        element.style.removeProperty("--physics-x");
        element.style.removeProperty("--physics-y");
        element.style.removeProperty("--physics-rotation");
        element.style.removeProperty("--physics-counter-rotation");
      }
    };
  }, [
    compositionRef,
    debug.bounds,
    debug.wireframes,
    isMobile,
    physics.collisionScale.chair,
    physics.collisionScale.cup,
    physics.collisionScale.global,
    physics.collisionScale.jelly,
    physics.collisionScale.pitcher,
    physics.collisionScale.table,
    physics.friction,
    physics.frictionAir,
    physics.gravityScale,
    physics.gravityX,
    physics.gravityY,
    physics.pinChair,
    physics.resolveCollisions,
    physics.restitution,
    physics.simulationSteps,
    geometry,
    revision,
  ]);
}

function getSlugFromPath(pathname: string): SectionSlug | null {
  const slug = pathname.split("/").filter(Boolean)[0];
  return slug && getSection(slug) ? (slug as SectionSlug) : null;
}

function ShapeLink({
  section,
  color,
  active,
  muted,
  onActivate,
  onDeactivate,
}: {
  section: Section;
  color: string;
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
    "--shape-color": color,
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
        className="shape-link__color-mask"
        style={{
          maskImage: `url(${shapePath})`,
          WebkitMaskImage: `url(${shapePath})`,
        }}
        aria-hidden="true"
      />
      {section.slug === "supper" ? (
        <span
          className="shape-link__accent-mask"
          style={{
            maskImage: "url(/shapes/JellyAccent.svg)",
            WebkitMaskImage: "url(/shapes/JellyAccent.svg)",
          }}
          aria-hidden="true"
        />
      ) : null}
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
  const dial = useDialKit("Mora Composition", moraDialConfig, {
    id: "mora-composition",
    persist: true,
  });
  const geometry = useShapeGeometry();
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

  useResolvedPhysics(
    compositionRef,
    isMobile,
    physicsRevision,
    dial.physics,
    dial.debug,
    geometry,
  );

  const shapeColors: Record<SectionSlug, string> = {
    supper: dial.appearance.jelly,
    "sample-menus": dial.appearance.pitcher,
    "how-we-work": dial.appearance.chair,
    about: dial.appearance.cup,
    contact: dial.appearance.table,
  };

  const shellStyle: ShapeStyle = {
    "--paper": dial.appearance.background,
    "--logo-color": dial.appearance.logo,
  };

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
    <div ref={shellRef} className="site-shell" style={shellStyle}>
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
                color={shapeColors[section.slug]}
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
      <DialRoot position="top-right" theme="dark" />
    </div>
  );
}
