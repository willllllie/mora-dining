"use client";

import { DialRoot, useDialKit } from "dialkit";
import type { DialConfig } from "dialkit";
import "dialkit/styles.css";
import gsap from "gsap";
import type { CSSProperties } from "react";
import { useLayoutEffect, useRef, useState } from "react";

type ShapeStyle = CSSProperties & Record<`--${string}`, string>;

const pieces = [
  { name: "Chair", file: "chair.svg", photo: "chair.png", href: "/how-we-work/", width: 266, height: 329 },
  { name: "Cup", file: "cup.svg", photo: "cup.png", href: "/about/", width: 177, height: 358 },
  { name: "Jug", file: "jug.svg", photo: "jug.png", href: "/sample-menus/", width: 209, height: 275 },
  { name: "Table", file: "table.svg", photo: "table.png", href: "/contact/", width: 300, height: 311 },
  { name: "Jelly", file: "jelly.svg", photo: "jelly.png", href: "/supper/", width: 273, height: 269 },
] as const;

const artWidth = pieces.reduce((total, piece) => total + piece.width, 0);
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
  intro: {
    popPhysics: {
      tension: [155, 30, 600, 5],
      damping: [8, 1, 60, 1],
      mass: [0.45, 0.2, 4, 0.05],
    },
    popDuration: [0.27, 0.15, 0.9, 0.01],
    cadence: [0.18, 0.06, 0.5, 0.01],
    cadenceRandomness: [0.4, 0, 1, 0.05],
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
  const [replay, setReplay] = useState(0);
  const [activePiece, setActivePiece] = useState<string | null>(null);
  const dial = useDialKit("Mora Landing Motion", landingDialConfig, {
    // A new persistence key makes the revised defaults visible to existing previews.
    id: "mora-landing-motion-v2",
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
  const { tension: popTension, damping: popDamping, mass: popMass } = popPhysics;
  const { tension: expansionTension, damping: expansionDamping, mass: expansionMass } = expansionPhysics;

  useLayoutEffect(() => {
    const stage = stageRef.current;
    const line = lineRef.current;
    const left = leftRef.current;
    const right = rightRef.current;
    const track = trackRef.current;
    if (!stage || !line || !left || !right || !track) return;

    const shapes = Array.from(track.querySelectorAll<HTMLElement>(".landing-piece"));
    const mobile = window.matchMedia("(max-width: 899px)");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const measure = () => {
      const stageWidth = stage.clientWidth;
      const mobileScale = Math.max(0.12, Math.min(stageWidth / 1150,
        (window.innerHeight - 200) / mobileArtHeight));
      const groupWidth = mobile.matches
        ? artWidth * mobileScale
        : Math.max(210, Math.min(1210, stageWidth - 96 - left.offsetWidth - right.offsetWidth - 40));
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

      if (reduceMotion) {
        gsap.set(shapes, {
          width: (index: number) => dimensions.widths[index],
          opacity: 1,
        });
        if (!mobile.matches) gsap.set(line, { width: dimensions.lineWidth });
        stage.classList.add("is-ready");
        return;
      }

      const compactWidths = dimensions.widths.map((width) => width * 0.56);
      const popEase = springEase(popTension, popDamping, popMass, popDuration);
      const expansionEase = springEase(expansionTension, expansionDamping, expansionMass, expansionDuration);
      let start = 0.35;
      timeline = gsap.timeline({ onComplete: () => stage.classList.add("is-ready") });

      if (mobile.matches) {
        // Keep the line content-sized: each entering shape alone pushes the
        // words apart by its own rendered height.
        pieces.forEach((_, index) => {
          if (index > 0) {
            const variation = (Math.random() * 2 - 1) * 0.3 * cadenceRandomness;
            start += cadence * (1 + variation);
          }
          timeline!.to(shapes[index], {
            width: dimensions.widths[index],
            opacity: 1,
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
        timeline!.to(
          shapes[index],
          {
            width: compactWidths[index],
            opacity: 1,
            duration: popDuration,
            ease: popEase,
          },
          start,
        );
      });

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
      if (!mobile.matches) gsap.set(line, { width: next.lineWidth });
      else gsap.set(line, { clearProps: "width,height" });
      stage.classList.add("is-ready");
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      context.revert();
      stage.classList.remove("is-ready");
    };
  }, [popTension, popDamping, popMass, popDuration, cadence, cadenceRandomness,
    expansionTension, expansionDamping, expansionMass, expansionDuration, replay]);

  return (
    <main
      ref={stageRef}
      className="landing-test"
      data-has-active={activePiece !== null}
      aria-label="Mora Dining landing preview"
    >
      <div ref={lineRef} className="landing-line">
        <span ref={leftRef} className="landing-word">MORA</span>
        <div ref={trackRef} className="landing-track" aria-label="Explore Mora Dining">
          {pieces.map((piece) => (
            <a
              key={piece.name}
              className={`landing-piece landing-piece--${piece.name.toLowerCase()}`}
              href={piece.href}
              aria-label={piece.name}
              data-active={activePiece === piece.name}
              style={{
                "--shape-mask": `url(/landing-shapes/${piece.file})`,
                "--shape-photo": `url(/landing-hover/${piece.photo})`,
              } as ShapeStyle}
              onMouseEnter={() => {
                if (stageRef.current?.classList.contains("is-ready")) setActivePiece(piece.name);
              }}
              onMouseLeave={() => setActivePiece(null)}
              onFocus={() => setActivePiece(piece.name)}
              onBlur={() => setActivePiece(null)}
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
            </a>
          ))}
        </div>
        <span ref={rightRef} className="landing-word">Dining &amp; service</span>
      </div>
      <DialRoot position="top-right" theme="dark" defaultOpen={false} />
    </main>
  );
}
