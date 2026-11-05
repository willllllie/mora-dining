"use client";

import { DialRoot, useDialKit } from "dialkit";
import type { DialConfig } from "dialkit";
import "dialkit/styles.css";
import gsap from "gsap";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { isSectionSlug, type SectionSlug } from "@/lib/sections";
import "@/app/third-version/third-version.css";

type ShapeName = "jelly" | "chair" | "jug" | "cup" | "table";
type ShapeStyle = CSSProperties & Record<`--${string}`, string>;
type Shape = {
  name: ShapeName;
  slug: SectionSlug;
  title: string;
  hoverTitle?: string;
  href: string;
  openInNewTab?: boolean;
  width: number;
  height: number;
  rotation: number;
  flipY?: boolean;
};

const shapes: Shape[] = [
  { name: "jelly", slug: "contact", title: "Contact", href: "/contact/", width: 348.887, height: 350.694, rotation: -5.86 },
  { name: "chair", slug: "supper", title: "Supper Supper Supper", hoverTitle: "Supper\nSupper\nSupper", href: "/supper/", width: 408.706, height: 492.633, rotation: 23.19 },
  { name: "jug", slug: "sample-menus", title: "Sample Menus", hoverTitle: "Sample\nMenus", href: "/menus/mora-sample-menu.pdf", openInNewTab: true, width: 261.221, height: 344.09, rotation: 173.08, flipY: true },
  { name: "cup", slug: "about", title: "About us", href: "/about/", width: 169.391, height: 339.827, rotation: 16.84 },
  { name: "table", slug: "how-we-work", title: "Offerings", href: "/how-we-work/", width: 553, height: 738, rotation: 0 },
];

function SectionCopy({ slug }: { slug: SectionSlug }) {
  if (slug === "about") return <>
    <p>We are two friends who met working in a canalside restaurant in London. Grace is from Cornwall and Sophie is from Northern California, both places deeply connected to the sea and the seasonal rhythms of the coast. We share a love of excellent food done simply, craft, and hosting, and decided to start MORA to share this with others.</p>
    <p>In Cornish Mora means “to go out to sea”; for us it evokes a sense of place, seasonality and adventure, as well as the ambition to create something of our own.</p>
  </>;
  if (slug === "how-we-work") return <>
    <p>We are a boutique catering company specializing in seasonal, simple food done well. We believe the best food comes from exceptional ingredients and like to work with those who think so too. We work with our friends at Natoora, Flock and Herd Butchery, Neal’s Yard, and others and our wines are sourced from Tutto.</p>
    <p>We provide catering for weddings, photo shoots, offices, parties, and private households. We also host a recurring supper club, SUPPER SUPPER SUPPER.</p>
  </>;
  if (slug === "supper") return <>
    <p>SUPPER SUPPER SUPPER is our recurring supper club. It’s our favorite way to bring together a group of people for what we think is a perfect evening. Held in an outdoor/indoor courtyard of a converted clock factory in Camberwell, it begins with a welcome cocktail and mingling before switching to a family style three course meal. We’re lucky to have guests that come back each time – if you’d like to be notified by email of the next event, sign up below.</p>
  </>;
  if (slug === "contact") return <p>
    You can email us at<br />
    <a href="mailto:hello@moradining.com">hello@moradining.com</a>
    <br /><br />
    or follow us on <a href="https://www.instagram.com/moradining/">instagram</a>
  </p>;
  return <p>Sample menus coming soon.</p>;
}

const mobilePanelTitles: Record<SectionSlug, string> = {
  about: "About us",
  "how-we-work": "What we do",
  "sample-menus": "Sample menus",
  supper: "Supper\nSupper\nSupper",
  contact: "Contact us",
};

function inverseHex(color: string) {
  const value = color.replace("#", "");
  const hex = value.length === 3 ? [...value].map((digit) => digit + digit).join("") : value;
  if (!/^[0-9a-f]{6}$/i.test(hex)) return "#131414";
  return `#${[0, 2, 4].map((index) =>
    (255 - Number.parseInt(hex.slice(index, index + 2), 16)).toString(16).padStart(2, "0")).join("")}`;
}

const dialConfig = {
  appearance: {
    background: "#f1ede9",
    logo: "#040237",
    unfocused: "#d8d6d41a",
    hoverColors: false,
    jelly: "#FE8F99",
    cherry: "#B43E0C",
    chair: "#5FA5E7",
    jug: "#ADD91F",
    cup: "#C3E1F9",
    table: "#5B4537",
    textureOpacity: [100, 0, 100, 1],
    hoverTextureOpacity: [46, 0, 100, 1],
    hoverTypeSize: [50, 24, 96, 1],
  },
  intro: {
    duration: [0.28, 0.2, 1.5, 0.01],
    stagger: [0.05, 0, 0.5, 0.01],
    overshoot: [0.3, 0, 5, 0.1],
    replay: { type: "action", label: "Replay intro" },
  },
} satisfies DialConfig;

export function ThirdVersion() {
  const pathname = usePathname();
  const router = useRouter();
  const pathSegment = pathname.replace(/^\/+|\/+$/g, "").split("/")[0];
  const routeSlug = pathSegment && isSectionSlug(pathSegment) ? pathSegment : null;
  const stageRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const cursorLabelRef = useRef<HTMLSpanElement>(null);
  const clippedLabelRef = useRef<HTMLSpanElement>(null);
  const clippedTextRef = useRef<HTMLSpanElement>(null);
  const [activeShape, setActiveShape] = useState<ShapeName | null>(null);
  const [visibleSlug, setVisibleSlug] = useState<SectionSlug | null>(routeSlug);
  const lastSlugRef = useRef<SectionSlug | null>(routeSlug);
  const [replay, setReplay] = useState(0);
  const dial = useDialKit("Mora Third Version", dialConfig, {
    // A fresh key makes the revised palette the default for existing previews too.
    id: "mora-third-version-v4",
    persist: true,
    onAction: (action) => {
      if (action === "intro.replay") {
        setActiveShape(null);
        setReplay((value) => value + 1);
      }
    },
  });

  useEffect(() => {
    if (routeSlug) {
      lastSlugRef.current = routeSlug;
      const frame = requestAnimationFrame(() => {
        setVisibleSlug(routeSlug);
        setActiveShape(null);
      });
      return () => cancelAnimationFrame(frame);
    }
    if (!visibleSlug) return;
    const frame = requestAnimationFrame(() => {
      setVisibleSlug(null);
      const shape = shapes.find((item) => item.slug === lastSlugRef.current);
      if (shape) stageRef.current?.querySelector<HTMLElement>(`.third-shape--${shape.name}`)?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [routeSlug, visibleSlug]);

  useEffect(() => {
    if (!visibleSlug) return;
    const focus = window.setTimeout(() => panelRef.current?.focus(), 30);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        router.push("/");
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusables = Array.from(panelRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"));
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panelRef.current)) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => { clearTimeout(focus); document.removeEventListener("keydown", onKeyDown); };
  }, [visibleSlug, router]);

  useEffect(() => {
    document.body.style.overflow = visibleSlug ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [visibleSlug]);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const resize = () => {
      const desktopSideGutter = 24;
      const compositionWidth = 1455.917;
      const compositionHeight = 903;
      const verticalContentRatio = 0.8;
      const availableWidth = Math.max(0, stage.clientWidth - desktopSideGutter * 2);
      const widthScale = availableWidth / compositionWidth;
      // Reserve 20% of the viewport height as breathing room around the
      // centered cluster: 10% above and 10% below.
      const heightScale = (stage.clientHeight * verticalContentRatio) / compositionHeight;
      const scale = Math.max(0.1, Math.min(1, widthScale, heightScale));
      const mobileLayoutScale = Math.min(1, stage.clientWidth / 393);
      stage.style.setProperty("--composition-scale", String(scale));
      stage.style.setProperty("--mobile-layout-scale", String(mobileLayoutScale));
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
    "--third-cherry": colors.cherry,
    "--third-texture-opacity": String(colors.textureOpacity / 100),
    "--third-hover-texture-opacity": String(colors.hoverTextureOpacity / 100),
    "--third-tooltip-base": inverseHex(colors.background),
    "--third-hover-type-size": `${colors.hoverTypeSize}px`,
  } as ShapeStyle;
  const selected = shapes.find((shape) => shape.name === activeShape);
  const panelStyle = visibleSlug ? {
    "--third-panel-background": "#EEEEEE",
    "--third-panel-text": "#0E086E",
  } as ShapeStyle : undefined;

  return (
    <main className="third-version" ref={stageRef} style={stageStyle} data-active={activeShape !== null} data-hover-colors={colors.hoverColors ? "on" : "off"} data-panel-open={visibleSlug !== null}>
      <header className="third-header">
        <Link href="/" onMouseEnter={() => setActiveShape(null)} onFocus={() => setActiveShape(null)}>MORA</Link>
      </header>
      <div className="third-composition">
        <Link
          className="third-mobile-logo"
          href="/"
          onFocus={() => setActiveShape(null)}
        >MORA</Link>
        {shapes.map((shape) => {
          const shapeColor = activeShape && activeShape !== shape.name && !colors.hoverColors
            ? colors.unfocused
            : colors[shape.name];
          return (
          <Link
            key={shape.name}
            className={`third-shape third-shape--${shape.name}`}
            href={shape.href}
            target={shape.openInNewTab ? "_blank" : undefined}
            rel={shape.openInNewTab ? "noopener noreferrer" : undefined}
            aria-label={shape.title}
            data-selected={activeShape === shape.name}
            onPointerEnter={(event) => {
              if (visibleSlug) return;
              positionLabel(shape, event.currentTarget, event.clientX, event.clientY);
              setActiveShape(shape.name);
            }}
            onPointerMove={(event) => { if (!visibleSlug) positionLabel(shape, event.currentTarget, event.clientX, event.clientY); }}
            onPointerLeave={() => setActiveShape(null)}
            onFocus={(event) => {
              if (visibleSlug) return;
              const rect = event.currentTarget.getBoundingClientRect();
              positionLabel(shape, event.currentTarget, rect.left + rect.width / 2, rect.top + rect.height / 2);
              setActiveShape(shape.name);
            }}
            onBlur={() => setActiveShape(null)}
            style={{
              "--shape-mask": `url(/third-shapes/${shape.name}.svg)`,
              "--shape-photo": `url(/landing-hover/${shape.name}.png)`,
              "--shape-color": shapeColor,
              "--shape-width": `${shape.width}px`,
              "--shape-height": `${shape.height}px`,
            } as ShapeStyle}
          >
            <span className="third-shape__pop">
              <span className="third-shape__art">
                <span className="third-shape__color" aria-hidden="true" />
                <span className="third-shape__texture" aria-hidden="true" />
                <span className="third-shape__photo" aria-hidden="true" />
                {shape.name === "jelly" && <>
                  <span className="third-shape__cherry-color" aria-hidden="true" />
                  <span className="third-shape__cherry-texture" aria-hidden="true" />
                  <span className="third-shape__cherry" aria-hidden="true" />
                </>}
              </span>
            </span>
          </Link>
          );
        })}
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
      {visibleSlug && <div className="third-overlay">
        <Link className="third-overlay__backdrop" href="/" aria-label="Close section" />
        <aside ref={panelRef} className="third-panel" data-slug={visibleSlug} style={panelStyle} role="dialog" aria-modal="true" aria-labelledby="third-panel-title" tabIndex={-1}>
          <div className="third-panel__frame">
            <h1 id="third-panel-title">
              <span className="third-panel__title-desktop">{shapes.find((shape) => shape.slug === visibleSlug)?.title}</span>
              <span className="third-panel__title-mobile">{mobilePanelTitles[visibleSlug]}</span>
            </h1>
            {(visibleSlug === "about" || visibleSlug === "supper") && <Image
              className="third-panel__portrait"
              src="/mobile-panels/grace-and-sophie.png"
              alt="Grace and Sophie"
              width={329}
              height={342}
              priority
            />}
            <div className="third-panel__copy"><SectionCopy slug={visibleSlug} /></div>
          </div>
          <Link className="third-panel__close" href="/" aria-label="Back to home">
            <span className="third-panel__close-label">Close</span>
            <Image className="third-panel__back-arrow" src="/mobile-panels/back-arrow.svg" alt="" width={40} height={40} />
          </Link>
        </aside>
      </div>}
      <DialRoot position="top-right" theme="dark" defaultOpen={false} />
    </main>
  );
}
