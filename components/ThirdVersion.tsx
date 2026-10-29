"use client";

import { DialRoot, useDialKit } from "dialkit";
import type { DialConfig } from "dialkit";
import "dialkit/styles.css";
import gsap from "gsap";
import Link from "next/link";
import type { CSSProperties } from "react";
import { useLayoutEffect, useRef, useState } from "react";
import "@/app/third-version/third-version.css";

type ShapeName = "jelly" | "chair" | "jug" | "cup" | "table";
type ShapeStyle = CSSProperties & Record<`--${string}`, string>;
type Shape = {
  name: ShapeName;
  title: string;
  hoverTitle?: string;
  href: string;
  width: number;
  height: number;
  rotation: number;
  flipY?: boolean;
};

const shapes: Shape[] = [
  { name: "jelly", title: "Contact", href: "/contact/", width: 348.887, height: 350.694, rotation: -5.86 },
  { name: "chair", title: "About us", href: "/about/", width: 408.706, height: 492.633, rotation: 23.19 },
  { name: "jug", title: "Sample Menus", hoverTitle: "Sample\nMenus", href: "/sample-menus/", width: 261.221, height: 344.09, rotation: 173.08, flipY: true },
  { name: "cup", title: "Offerings", href: "/how-we-work/", width: 169.391, height: 339.827, rotation: 16.84 },
  { name: "table", title: "Supper Supper Supper", hoverTitle: "Supper\nSupper\nSupper", href: "/supper/", width: 553, height: 738, rotation: 0 },
];

function inverseHex(color: string) {
  const value = color.replace("#", "");
  const hex = value.length === 3 ? [...value].map((digit) => digit + digit).join("") : value;
  if (!/^[0-9a-f]{6}$/i.test(hex)) return "#131414";
  return `#${[0, 2, 4].map((index) =>
    (255 - Number.parseInt(hex.slice(index, index + 2), 16)).toString(16).padStart(2, "0")).join("")}`;
}

const dialConfig = {
  appearance: {
    background: "#ecebeb",
    logo: "#000000",
    unfocused: "#d6d6d6",
    jelly: "#ED9393",
    chair: "#351D19",
    jug: "#7A7357",
    cup: "#FE6229",
    table: "#96BEE3",
    hoverTypeSize: [48, 24, 96, 1],
  },
  intro: {
    duration: [0.72, 0.2, 1.5, 0.01],
    stagger: [0.14, 0, 0.5, 0.01],
    overshoot: [2.4, 0, 5, 0.1],
    replay: { type: "action", label: "Replay intro" },
  },
} satisfies DialConfig;

export function ThirdVersion() {
  const stageRef = useRef<HTMLDivElement>(null);
  const cursorLabelRef = useRef<HTMLSpanElement>(null);
  const clippedLabelRef = useRef<HTMLSpanElement>(null);
  const clippedTextRef = useRef<HTMLSpanElement>(null);
  const [activeShape, setActiveShape] = useState<ShapeName | null>(null);
  const [replay, setReplay] = useState(0);
  const dial = useDialKit("Mora Third Version", dialConfig, {
    // A fresh key makes the revised palette the default for existing previews too.
    id: "mora-third-version-v2",
    persist: true,
    onAction: (action) => {
      if (action === "intro.replay") {
        setActiveShape(null);
        setReplay((value) => value + 1);
      }
    },
  });

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const resize = () => {
      const scale = Math.min(stage.clientWidth / 1920, stage.clientHeight / 1114);
      stage.style.setProperty("--composition-scale", String(scale));
    };
    const observer = new ResizeObserver(resize);
    observer.observe(stage);
    resize();
    return () => observer.disconnect();
  }, []);

  const { duration, stagger, overshoot } = dial.intro;
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const order: ShapeName[] = ["jug", "jelly", "table", "chair", "cup"];
    const pops = order.map((name) => stage.querySelector<HTMLElement>(`.third-shape--${name} .third-shape__pop`));
    if (pops.some((pop) => !pop)) return;
    const context = gsap.context(() => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(pops, { scale: 1, opacity: 1 });
        return;
      }
      gsap.fromTo(pops,
        { scale: 0.48, opacity: 0 },
        { scale: 1, opacity: 1, duration, stagger, ease: `back.out(${overshoot})`, delay: 0.12 },
      );
    }, stage);
    return () => context.revert();
  }, [duration, stagger, overshoot, replay]);

  const positionLabel = (shape: Shape, element: HTMLElement, x: number, y: number) => {
    const label = cursorLabelRef.current;
    const clip = clippedLabelRef.current;
    const ink = clippedTextRef.current;
    const stage = stageRef.current;
    if (!label || !clip || !ink || !stage) return;

    label.style.left = `${x}px`;
    label.style.top = `${y}px`;

    // Compose the white title against an invisible, solid-black version of the
    // active SVG. The photo remains visible, but never affects the title color.
    const scale = Number.parseFloat(stage.style.getPropertyValue("--composition-scale")) || 1;
    const slot = element.getBoundingClientRect();
    const centerX = slot.left + slot.width / 2;
    const centerY = slot.top + slot.height / 2;
    const radians = shape.rotation * Math.PI / 180;
    const cosine = Math.cos(radians);
    const sine = Math.sin(radians);
    const dx = x - centerX;
    const dy = y - centerY;
    const localX = shape.flipY ? cosine * dx - sine * dy : cosine * dx + sine * dy;
    const localY = shape.flipY ? -sine * dx - cosine * dy : -sine * dx + cosine * dy;

    clip.style.left = `${centerX}px`;
    clip.style.top = `${centerY}px`;
    clip.style.width = `${shape.width * scale}px`;
    clip.style.height = `${shape.height * scale}px`;
    clip.style.maskImage = `url(/third-shapes/${shape.name}.svg)`;
    clip.style.webkitMaskImage = `url(/third-shapes/${shape.name}.svg)`;
    clip.style.transform = `translate(-50%, -50%) ${shape.flipY ? "scaleY(-1) " : ""}rotate(${shape.rotation}deg)`;
    ink.style.left = `${shape.width * scale / 2 + localX}px`;
    ink.style.top = `${shape.height * scale / 2 + localY}px`;
    ink.style.transform = `translate(-50%, -50%) rotate(${-shape.rotation}deg)${shape.flipY ? " scaleY(-1)" : ""}`;
  };

  const colors = dial.appearance;
  const stageStyle = {
    "--third-background": colors.background,
    "--third-logo": colors.logo,
    "--third-unfocused": colors.unfocused,
    "--third-tooltip-base": inverseHex(colors.background),
    "--third-hover-type-size": `${colors.hoverTypeSize}px`,
  } as ShapeStyle;
  const selected = shapes.find((shape) => shape.name === activeShape);

  return (
    <main className="third-version" ref={stageRef} style={stageStyle} data-active={activeShape !== null}>
      <header className="third-header">
        <Link href="/third-version/" onMouseEnter={() => setActiveShape(null)} onFocus={() => setActiveShape(null)}>MORA</Link>
      </header>
      <div className="third-composition">
        {shapes.map((shape) => (
          <Link
            key={shape.name}
            className={`third-shape third-shape--${shape.name}`}
            href={shape.href}
            aria-label={shape.title}
            data-selected={activeShape === shape.name}
            onPointerEnter={(event) => {
              positionLabel(shape, event.currentTarget, event.clientX, event.clientY);
              setActiveShape(shape.name);
            }}
            onPointerMove={(event) => positionLabel(shape, event.currentTarget, event.clientX, event.clientY)}
            onPointerLeave={() => setActiveShape(null)}
            onFocus={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              positionLabel(shape, event.currentTarget, rect.left + rect.width / 2, rect.top + rect.height / 2);
              setActiveShape(shape.name);
            }}
            onBlur={() => setActiveShape(null)}
            style={{
              "--shape-mask": `url(/third-shapes/${shape.name}.svg)`,
              "--shape-photo": `url(/landing-hover/${shape.name}.png)`,
              "--shape-color": colors[shape.name],
              "--shape-width": `${shape.width}px`,
              "--shape-height": `${shape.height}px`,
            } as ShapeStyle}
          >
            <span className="third-shape__pop">
              <span className="third-shape__art">
                <span className="third-shape__base" aria-hidden="true" />
                <span className="third-shape__photo" aria-hidden="true" />
              </span>
            </span>
          </Link>
        ))}
      </div>
      <span
        ref={cursorLabelRef}
        className="third-pointer-label"
        data-visible={selected !== undefined}
        aria-hidden="true"
      >{selected?.hoverTitle ?? selected?.title ?? ""}</span>
      <span
        ref={clippedLabelRef}
        className="third-pointer-label-clip"
        data-visible={selected !== undefined}
        aria-hidden="true"
      >
        <span ref={clippedTextRef} className="third-pointer-label-ink">{selected?.hoverTitle ?? selected?.title ?? ""}</span>
      </span>
      <DialRoot position="top-right" theme="dark" defaultOpen={false} />
    </main>
  );
}
