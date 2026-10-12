"use client";

import { DialRoot, useDialKit } from "dialkit";
import type { DialConfig } from "dialkit";
import "dialkit/styles.css";
import "@/app/landing-test/landing.css";
import gsap from "gsap";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { isSectionSlug, type SectionSlug } from "@/lib/sections";

type ShapeStyle = CSSProperties & Record<`--${string}`, string>;

const pieces = [
  { name: "Chair", title: "About us", file: "chair.svg", photo: "chair.png", href: "/about/", width: 266, height: 329 },
  { name: "Cup", title: "Offerings", file: "cup.svg", photo: "cup.png", href: "/how-we-work/", width: 177, height: 358 },
  { name: "Jug", title: "Sample menus", file: "jug.svg", photo: "jug.png", href: "/sample-menus/", width: 209, height: 275 },
  { name: "Table", title: "Supper Supper Supper", file: "table.svg", photo: "table.png", href: "/supper/", width: 300, height: 311 },
  { name: "Jelly", title: "Contact", file: "jelly.svg", photo: "jelly.png", href: "/contact/", width: 273, height: 269 },
] as const;

const artWidth = pieces.reduce((total, piece) => total + piece.width, 0);
const compactArtWidth = 678.371;
const popOrder = [1, 0, 3, 2, 4]; // Table enters third, but stays fourth in the finished row.
const mobileScaleByPiece = [1.05, 1.13, 1.34, 1.2, 1.22];
const mobileArtHeight = pieces.reduce((total, piece, index) =>
  total + piece.height * mobileScaleByPiece[index], 0);

function springEase(tension: number, damping: number, mass: number, duration: number) {
  const frequency = Math.sqrt(tension / mass);
  const dampingRatio = damping / (2 * Math.sqrt(tension * mass));
  const displacement = (time: number) => {
    if (dampingRatio < 1) {
      const dampedFrequency = frequency * Math.sqrt(1 - dampingRatio ** 2);
      return Math.exp(-dampingRatio * frequency * time) *
        (Math.cos(dampedFrequency * time) +
          (dampingRatio * frequency / dampedFrequency) * Math.sin(dampedFrequency * time));
    }
    if (Math.abs(dampingRatio - 1) < 0.0001) {
      return Math.exp(-frequency * time) * (1 + frequency * time);
    }
    const root = Math.sqrt(dampingRatio ** 2 - 1);
    const slow = -frequency * (dampingRatio - root);
    const fast = -frequency * (dampingRatio + root);
    return (fast * Math.exp(slow * time) - slow * Math.exp(fast * time)) / (fast - slow);
  };
  const finish = 1 - displacement(duration);
  return (progress: number) => progress === 1 ? 1 : (1 - displacement(progress * duration)) / finish;
}

const landingDialConfig = {
  layout: {
    variation1CenteredExpansion: false,
  },
  intro: {
    popPhysics: {
      tension: [280, 30, 600, 5],
      damping: [11, 1, 60, 1],
      mass: [0.35, 0.2, 4, 0.05],
    },
    popDuration: [0.22, 0.1, 0.9, 0.01],
    cadence: [0.13, 0.06, 0.5, 0.01],
    cadenceRandomness: [0.1, 0, 1, 0.05],
    expansionPhysics: {
      tension: [280, 30, 600, 5],
      damping: [17, 1, 60, 1],
      mass: [0.2, 0.2, 4, 0.05],
    },
    expansionDuration: [0.8, 0.3, 2, 0.05],
    replay: { type: "action", label: "Replay intro" },
  },
} satisfies DialConfig;

export function LandingPreview() {
  const pathname = usePathname();
  const router = useRouter();
  const pathSegment = pathname.replace(/\/+$/, "").slice(1);
  const routeSlug = isSectionSlug(pathSegment) ? pathSegment : null;
  const [visibleSlug, setVisibleSlug] = useState<SectionSlug | null>(routeSlug);
  const [panelClosing, setPanelClosing] = useState(false);
  const initialSectionRef = useRef(routeSlug !== null);
  const [replay, setReplay] = useState(0);
  const [activePiece, setActivePiece] = useState<string | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const lastSlugRef = useRef<SectionSlug | null>(routeSlug);
  const dial = useDialKit("Mora Landing Motion", landingDialConfig, {
    // Keep this pass independent of older saved tuning values.
    id: "mora-landing-motion-v3",
    persist: true,
    onAction: (action) => {
      if (action === "intro.replay") {
        setActivePiece(null);
        setReplay((value) => value + 1);
      }
    },
  });
  const stageRef = useRef<HTMLElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLSpanElement>(null);
  const rightRef = useRef<HTMLSpanElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const { popPhysics, popDuration, cadence, cadenceRandomness, expansionPhysics, expansionDuration } = dial.intro;
  const { variation1CenteredExpansion } = dial.layout;
  const { tension: popTension, damping: popDamping, mass: popMass } = popPhysics;
  const { tension: expansionTension, damping: expansionDamping, mass: expansionMass } = expansionPhysics;

  useEffect(() => {
    if (routeSlug) {
      lastSlugRef.current = routeSlug;
      const frame = window.requestAnimationFrame(() => {
        setVisibleSlug(routeSlug);
        setPanelClosing(false);
      });
      return () => window.cancelAnimationFrame(frame);
    }
    if (!visibleSlug) return;
    const frame = window.requestAnimationFrame(() => setPanelClosing(true));
    const timeout = window.setTimeout(() => {
      setVisibleSlug(null);
      const lastSlug = lastSlugRef.current;
      document.querySelector<HTMLElement>(`[data-landing-slug="${lastSlug}"]`)?.focus();
    }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 520);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [routeSlug, visibleSlug]);

  useEffect(() => {
    if (!visibleSlug || panelClosing) return;
    const focus = window.setTimeout(() => panelRef.current?.focus(), 50);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        router.push("/landing-test/");
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(focus);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [visibleSlug, panelClosing, router]);

  useEffect(() => {
    document.body.style.overflow = visibleSlug ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [visibleSlug]);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    const line = lineRef.current;
    const left = leftRef.current;
    const right = rightRef.current;
    const track = trackRef.current;
    if (!stage || !line || !left || !right || !track) return;

    const shapes = Array.from(track.querySelectorAll<HTMLElement>(".landing-piece"));
    const mobile = window.matchMedia("(max-width: 767px)");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const measure = () => {
      const stageWidth = stage.clientWidth;
      const compactScale = Math.min(1, stageWidth / 1920);
      const mobileScale = Math.max(0.12, Math.min(stageWidth / 1150,
        (window.innerHeight - 200) / mobileArtHeight));
      const groupWidth = mobile.matches
        ? artWidth * mobileScale
        : variation1CenteredExpansion
          ? Math.max(210, Math.min(1210, stageWidth - 96 - left.offsetWidth - right.offsetWidth - 40))
          : Math.max(0, Math.min(compactArtWidth * compactScale,
            stageWidth - 128 * compactScale - left.offsetWidth - right.offsetWidth));
      return {
        lineWidth: Math.max(0, stageWidth - 96),
        widths: pieces.map((piece, index) => (piece.width / artWidth) * groupWidth *
          (mobile.matches ? mobileScaleByPiece[index] : 1)),
      };
    };

    const dimensions = measure();
    let timeline: gsap.core.Timeline | null = null;
    const context = gsap.context(() => {
      gsap.set(shapes, { width: 0, opacity: 0 });

      if (reduceMotion || initialSectionRef.current) {
        gsap.set(shapes, {
          width: (index: number) => dimensions.widths[index],
          opacity: 1,
        });
        if (!mobile.matches && variation1CenteredExpansion) {
          gsap.set(line, { width: dimensions.lineWidth });
        }
        stage.classList.add("is-ready");
        return;
      }

      const introWidths = variation1CenteredExpansion
        ? dimensions.widths.map((width) => width * 0.56)
        : dimensions.widths;
      const popEase = springEase(popTension, popDamping, popMass, popDuration);
      const expansionEase = springEase(expansionTension, expansionDamping, expansionMass, expansionDuration);
      let start = 0.22;
      timeline = gsap.timeline({ onComplete: () => stage.classList.add("is-ready") });

      if (mobile.matches) {
        // Keep the line content-sized: each entering shape alone pushes the
        // words apart by its own rendered height.
        pieces.forEach((_, index) => {
          if (index > 0) {
            const variation = (Math.random() * 2 - 1) * 0.3 * cadenceRandomness;
            start += cadence * (1 + variation);
          }
          timeline!.set(shapes[index], { opacity: 1 }, start);
          timeline!.to(shapes[index], {
            width: dimensions.widths[index],
            duration: popDuration,
            ease: popEase,
          }, start);
        });
        return;
      }

      popOrder.forEach((index, order) => {
        if (order > 0) {
          const variation = (Math.random() * 2 - 1) * 0.3 * cadenceRandomness;
          start += cadence * (1 + variation);
        }
        timeline!.set(shapes[index], { opacity: 1 }, start);
        timeline!.to(
          shapes[index],
          {
            width: introWidths[index],
            duration: popDuration,
            ease: popEase,
          },
          start,
        );
      });

      if (!variation1CenteredExpansion) return;

      // The line remains content-sized while each "letter" is inserted. Only
      // after the fifth pop does the whole row grow into the 48px-inset layout.
      const expandAt = start + popDuration + 0.08;
      timeline.call(() => gsap.set(line, { width: line.offsetWidth }), undefined, expandAt);
      timeline.to(
        shapes,
        {
          width: (index: number) => dimensions.widths[index],
          duration: expansionDuration,
          ease: expansionEase,
        },
        expandAt,
      );
      timeline.to(
        line,
        { width: dimensions.lineWidth, duration: expansionDuration, ease: expansionEase },
        expandAt,
      );
    }, stage);

    const onResize = () => {
      if (timeline?.isActive()) timeline.progress(1);
      const next = measure();
      gsap.set(shapes, { width: (index: number) => next.widths[index], opacity: 1 });
      if (!mobile.matches && variation1CenteredExpansion) {
        gsap.set(line, { width: next.lineWidth });
      } else {
        gsap.set(line, { clearProps: "width,height" });
      }
      stage.classList.add("is-ready");
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      context.revert();
      stage.classList.remove("is-ready");
    };
  }, [popTension, popDamping, popMass, popDuration, cadence, cadenceRandomness,
    expansionTension, expansionDamping, expansionMass, expansionDuration,
    variation1CenteredExpansion, replay]);

  const selectedPiece = routeSlug || visibleSlug
    ? undefined
    : pieces.find((piece) => piece.name === activePiece);
  const panelPiece = pieces.find((piece) => piece.href === `/${visibleSlug}/`);

  return (
    <main
      ref={stageRef}
      className="landing-test"
      data-has-active={selectedPiece !== undefined}
      data-panel-open={visibleSlug !== null}
      data-variation={variation1CenteredExpansion ? "centered-expansion" : "left-compact"}
      aria-label="Mora Dining landing preview"
    >
      <div ref={lineRef} className="landing-line" aria-hidden={visibleSlug !== null}>
        <span ref={leftRef} className="landing-word">MORA</span>
        <div ref={trackRef} className="landing-track" aria-label="Explore Mora Dining">
          {pieces.map((piece) => (
            <Link
              key={piece.name}
              className={`landing-piece landing-piece--${piece.name.toLowerCase()}`}
              href={piece.href}
              aria-label={piece.title}
              data-active={selectedPiece?.name === piece.name}
              data-landing-slug={piece.href.slice(1, -1)}
              style={{
                "--shape-mask": `url(/landing-shapes/${piece.file})`,
                "--shape-photo": `url(/landing-hover/${piece.photo})`,
              } as ShapeStyle}
              onMouseEnter={() => {
                if (!visibleSlug && stageRef.current?.classList.contains("is-ready")) setActivePiece(piece.name);
              }}
              onMouseLeave={() => { if (!visibleSlug) setActivePiece(null); }}
              onFocus={() => { if (!visibleSlug) setActivePiece(piece.name); }}
              onBlur={() => { if (!visibleSlug) setActivePiece(null); }}
            >
              {/* Supplied SVG artwork has the intended colors and proportions. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="landing-piece__base"
                src={`/landing-shapes/${piece.file}`}
                width={piece.width}
                height={piece.height}
                alt=""
                draggable={false}
              />
              <span className="landing-piece__muted" aria-hidden="true" />
              <span className="landing-piece__photo" aria-hidden="true" />
              {piece.name === "Jelly" && (
                // The jelly's cherry remains colored above its photo fill.
                // eslint-disable-next-line @next/next/no-img-element
                <img className="landing-piece__cherry" src={`/landing-shapes/${piece.file}`} alt="" aria-hidden="true" />
              )}
            </Link>
          ))}
        </div>
        <span ref={rightRef} className="landing-word" aria-live="polite">{selectedPiece?.title ?? ""}</span>
      </div>
      {visibleSlug && panelPiece && (
        <>
          <button
            className={`landing-panel-backdrop${panelClosing ? " is-closing" : ""}`}
            type="button"
            aria-label="Close section"
            style={{ backdropFilter: "blur(23.5px)" }}
            onClick={() => router.push("/landing-test/")}
          />
          <aside
            ref={panelRef}
            className={`landing-panel${panelClosing ? " is-closing" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="landing-panel-title"
            tabIndex={-1}
          >
            <button
              className="landing-panel__close"
              type="button"
              aria-label="Close section"
              onClick={() => router.push("/landing-test/")}
            >×</button>
            <h1 id="landing-panel-title">{panelPiece.title}</h1>
            <div className="landing-panel__copy">
              {visibleSlug === "about" ? (
                <>
                  <p>We are two friends who met working in a canalside restaurant in London. Grace is from Cornwall and Sophie is from Northern California, both places deeply connected to the sea and the seasonal rhythms of the coast. We share a love of excellent food done simply, craft, and hosting, and decided to start MORA to share this with others.</p>
                  <p>In Cornish Mora means “to go out to sea”; for us it evokes a sense of place, seasonality and adventure, as well as the ambition to create something of our own.</p>
                </>
              ) : visibleSlug === "how-we-work" ? (
                <>
                  <p>We are a boutique catering company specializing in seasonal, simple food done well. We believe the best food comes from exceptional ingredients and like to work with those who think so too. We work with our friends at Natoora, Flock and Herd Butchery, Neal’s Yard, and others and our wines are sourced from Tutto.</p>
                  <p>We provide catering for weddings, photo shoots, offices, parties, and private households. We also host a recurring supper club, SUPPER SUPPER SUPPER.</p>
                </>
              ) : visibleSlug === "supper" ? (
                <>
                  <p>SUPPER SUPPER SUPPER is our recurring supper club. It’s our favorite way to bring together a group of people for what we think is a perfect evening. Held in an outdoor/indoor courtyard of a converted clock factory in Camberwell, it begins with a welcome cocktail and mingling before switching to a family style three course meal. We’re lucky to have guests that come back each time – if you’d like to be notified by email of the next event, sign up below.</p>
                  <p>Get notified</p>
                </>
              ) : visibleSlug === "contact" ? (
                <p>Email address coming soon.</p>
              ) : (
                <p>Content coming soon.</p>
              )}
            </div>
          </aside>
        </>
      )}
      {!visibleSlug && <DialRoot position="top-right" theme="dark" defaultOpen={false} />}
    </main>
  );
}
