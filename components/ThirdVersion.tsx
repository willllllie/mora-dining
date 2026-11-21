"use client";

import { DialRoot, useDialKit } from "dialkit";
import type { DialConfig } from "dialkit";
import "dialkit/styles.css";
import gsap from "gsap";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { CSSProperties, MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { isSectionSlug, type SectionSlug } from "@/lib/sections";
import "@/app/third-version/third-version.css";

type ShapeName = "jelly" | "chair" | "jug" | "cup" | "table";
type ShapeStyle = CSSProperties & Record<`--${string}`, string>;
type Shape = {
  name: ShapeName;
  slug: SectionSlug;
  title: string;
  mobileTitle?: string;
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
  { name: "chair", slug: "supper", title: "Supper Supper Supper", mobileTitle: "Supper", hoverTitle: "Supper\nSupper\nSupper", href: "/supper/", width: 408.706, height: 492.633, rotation: 23.19 },
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
  const mobileTransitionRef = useRef(false);
  const touchExploreRef = useRef(false);
  const suppressTouchClickRef = useRef(false);
  const touchHoldTimerRef = useRef<number | null>(null);
  const clippedTextRef = useRef<HTMLSpanElement>(null);
  const [activeShape, setActiveShape] = useState<ShapeName | null>(null);
  const [pressedShape, setPressedShape] = useState<ShapeName | null>(null);
  const [hoverImagesReady, setHoverImagesReady] = useState(false);
  const [visibleSlug, setVisibleSlug] = useState<SectionSlug | null>(routeSlug);
  const lastSlugRef = useRef<SectionSlug | null>(routeSlug);
  const [replay, setReplay] = useState(0);
  const dial = useDialKit("Mora Third Version", dialConfig, {
    // A fresh key makes the revised palette the default for existing previews too.
    id: "mora-third-version-v6",
    persist: true,
    onAction: (action) => {
      if (action === "intro.replay") {
        setActiveShape(null);
        setReplay((value) => value + 1);
      }
    },
  });
  const colors = dial.appearance;

  useEffect(() => {
    let cancelled = false;
    const preload = shapes.map((shape) => new Promise<void>((resolve) => {
      const image = new window.Image();
      const finish = () => image.decode().catch(() => undefined).finally(resolve);
      image.decoding = "async";
      image.onload = finish;
      image.onerror = () => resolve();
      image.src = `/landing-hover/${shape.name}.webp`;
      if (image.complete) finish();
    }));

    Promise.all(preload).then(() => {
      if (!cancelled) setHoverImagesReady(true);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (routeSlug) {
      lastSlugRef.current = routeSlug;
      const frame = requestAnimationFrame(() => {
        mobileTransitionRef.current = false;
        setVisibleSlug(routeSlug);
        setActiveShape(null);
      });
      return () => cancelAnimationFrame(frame);
    }
    if (!visibleSlug) return;
    const frame = requestAnimationFrame(() => {
      setVisibleSlug(null);
      mobileTransitionRef.current = false;
      const pops = stageRef.current?.querySelectorAll<HTMLElement>(".third-shape__pop");
      const mobileLogo = stageRef.current?.querySelector<HTMLElement>(".third-mobile-logo");
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (pops) {
        if (reduceMotion) gsap.set(pops, { scale: 1, opacity: 1 });
        else gsap.fromTo(pops,
          { scale: 0.72, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.32, stagger: 0.025, ease: "back.out(1.8)" },
        );
      }
      if (mobileLogo) {
        if (reduceMotion) gsap.set(mobileLogo, { clearProps: "opacity,scale" });
        else gsap.fromTo(mobileLogo,
          { scale: 0.82, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.28, ease: "back.out(1.7)", clearProps: "scale" },
        );
      }
      const shape = shapes.find((item) => item.slug === lastSlugRef.current);
      const shapeElement = shape
        ? stageRef.current?.querySelector<HTMLElement>(`.third-shape--${shape.name}`)
        : null;
      if (shapeElement && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        shapeElement.focus({ preventScroll: true });
      } else if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
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

  useLayoutEffect(() => {
    const pageColor = visibleSlug ? "#1b1818" : colors.background;
    const root = document.documentElement;
    const previousRootColor = root.style.backgroundColor;
    const previousBodyColor = document.body.style.backgroundColor;
    const previousColorScheme = root.style.colorScheme;
    let runtimeTheme = document.querySelector<HTMLMetaElement>('meta[data-mora-theme="true"]');
    let runtimeColorScheme = document.querySelector<HTMLMetaElement>('meta[data-mora-color-scheme="true"]');
    const createdRuntimeTheme = !runtimeTheme;
    const createdRuntimeColorScheme = !runtimeColorScheme;

    if (!runtimeTheme) {
      runtimeTheme = document.createElement("meta");
      runtimeTheme.name = "theme-color";
      runtimeTheme.dataset.moraTheme = "true";
      document.head.append(runtimeTheme);
    }

    if (!runtimeColorScheme) {
      runtimeColorScheme = document.createElement("meta");
      runtimeColorScheme.name = "color-scheme";
      runtimeColorScheme.dataset.moraColorScheme = "true";
      document.head.append(runtimeColorScheme);
    }

    const applyBrowserTheme = () => {
      const colorScheme = visibleSlug ? "dark" : "light";
      document.body.style.overflow = visibleSlug ? "hidden" : "";
      document.body.style.backgroundColor = pageColor;
      root.style.backgroundColor = pageColor;
      root.style.colorScheme = colorScheme;
      document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((theme) => {
        if (theme.content !== pageColor) theme.content = pageColor;
      });
      document.querySelectorAll<HTMLMetaElement>('meta[name="color-scheme"]').forEach((scheme) => {
        if (scheme.content !== colorScheme) scheme.content = colorScheme;
      });
    };

    applyBrowserTheme();
    const frame = requestAnimationFrame(applyBrowserTheme);
    const timer = window.setTimeout(applyBrowserTheme, 120);
    const headObserver = new MutationObserver(applyBrowserTheme);
    headObserver.observe(document.head, {
      attributes: true,
      attributeFilter: ["content"],
      childList: true,
      subtree: true,
    });
    window.addEventListener("pageshow", applyBrowserTheme);
    window.addEventListener("popstate", applyBrowserTheme);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      headObserver.disconnect();
      window.removeEventListener("pageshow", applyBrowserTheme);
      window.removeEventListener("popstate", applyBrowserTheme);
      document.body.style.overflow = "";
      document.body.style.backgroundColor = previousBodyColor;
      root.style.backgroundColor = previousRootColor;
      root.style.colorScheme = previousColorScheme;
      if (createdRuntimeTheme) runtimeTheme?.remove();
      if (createdRuntimeColorScheme) runtimeColorScheme?.remove();
    };
  }, [colors.background, visibleSlug]);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const resize = () => {
      const visualViewport = window.visualViewport;
      const viewportWidth = visualViewport?.width ?? stage.clientWidth;
      const viewportHeight = visualViewport?.height ?? stage.clientHeight;
      const viewportOffsetX = visualViewport?.offsetLeft ?? 0;
      const viewportOffsetY = visualViewport?.offsetTop ?? 0;
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
      // The mobile artboard contains deliberate empty space, so fit the
      // visible 580px-tall cluster rather than shrinking against all 852px.
      // visualViewport tracks Safari and Chrome as their browser chrome opens
      // and closes, keeping the composition optically centred in what is
      // actually visible to the visitor.
      const mobileWidthScale = Math.max(0, viewportWidth - 24) / 393;
      const mobileHeightScale = Math.max(0, viewportHeight - 48) / 580;
      const mobileLayoutScale = Math.max(0.55, Math.min(1, mobileWidthScale, mobileHeightScale));
      const mobileTitleTop = 24;
      const mobilePortraitTop = Math.max(84, Math.min(141, viewportHeight * 0.1655));
      const mobileCopyTop = Math.max(280, Math.min(454, viewportHeight * 0.533));
      stage.style.setProperty("--composition-scale", String(scale));
      stage.style.setProperty("--mobile-layout-scale", String(mobileLayoutScale));
      stage.style.setProperty("--mobile-center-x", `${viewportOffsetX + viewportWidth / 2}px`);
      stage.style.setProperty("--mobile-center-y", `${viewportOffsetY + viewportHeight / 2}px`);
      stage.style.setProperty("--mobile-viewport-height", `${viewportHeight}px`);
      stage.style.setProperty("--mobile-panel-title-top", `${mobileTitleTop}px`);
      stage.style.setProperty("--mobile-panel-portrait-top", `${mobilePortraitTop}px`);
      stage.style.setProperty("--mobile-panel-copy-top", `${mobileCopyTop}px`);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(stage);
    window.visualViewport?.addEventListener("resize", resize);
    window.visualViewport?.addEventListener("scroll", resize);
    window.addEventListener("orientationchange", resize);
    resize();
    return () => {
      observer.disconnect();
      window.visualViewport?.removeEventListener("resize", resize);
      window.visualViewport?.removeEventListener("scroll", resize);
      window.removeEventListener("orientationchange", resize);
    };
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
        {
          scale: 1,
          opacity: 1,
          duration,
          ease: `back.out(${overshoot})`,
          stagger,
          delay: 0.12,
        },
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

  const openShape = (event: ReactMouseEvent<HTMLAnchorElement>, shape: Shape) => {
    if (shape.openInNewTab || !window.matchMedia("(max-width: 767px)").matches) return;
    event.preventDefault();
    if (mobileTransitionRef.current) return;

    mobileTransitionRef.current = true;
    setActiveShape(null);
    const stage = stageRef.current;
    if (!stage || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      router.push(shape.href, { scroll: false });
      return;
    }

    const pops = Array.from(stage.querySelectorAll<HTMLElement>(".third-shape__pop"));
    const mobileLogo = stage.querySelector<HTMLElement>(".third-mobile-logo");
    const clickedIndex = Math.max(0, shapes.findIndex((item) => item.name === shape.name));
    const timeline = gsap.timeline({
      onComplete: () => router.push(shape.href, { scroll: false }),
    });

    timeline.to(pops, {
      scale: 0.42,
      opacity: 0,
      duration: 0.24,
      stagger: { each: 0.025, from: clickedIndex },
      ease: "back.in(2)",
    });
    if (mobileLogo) {
      timeline.to(mobileLogo, { scale: 0.9, opacity: 0, duration: 0.18, ease: "power2.in" }, 0.02);
    }
  };

  const closePanel = (event: ReactMouseEvent<HTMLAnchorElement>) => {
    if (!visibleSlug || !window.matchMedia("(max-width: 767px)").matches) return;
    event.preventDefault();
    if (mobileTransitionRef.current) return;
    mobileTransitionRef.current = true;
    const overlay = panelRef.current?.closest<HTMLElement>(".third-overlay");
    if (!overlay || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      router.push("/", { scroll: false });
      return;
    }
    gsap.to(overlay, {
      opacity: 0,
      duration: 0.18,
      ease: "power2.in",
      onComplete: () => router.push("/", { scroll: false }),
    });
  };

  const clearTouchHold = () => {
    if (touchHoldTimerRef.current !== null) {
      window.clearTimeout(touchHoldTimerRef.current);
      touchHoldTimerRef.current = null;
    }
  };

  const getShapeAtPoint = (x: number, y: number) => {
    const shapeElement = document.elementFromPoint(x, y)?.closest<HTMLElement>(".third-shape");
    const shapeName = shapeElement?.dataset.shape as ShapeName | undefined;
    if (shapeName) return shapes.find((shape) => shape.name === shapeName) ?? null;

    // Keep exploration fluid through the small gaps between silhouettes by
    // selecting the nearest shape centre when the finger is between elements.
    return shapes.reduce<{ shape: Shape; distance: number } | null>((nearest, shape) => {
      const element = stageRef.current?.querySelector<HTMLElement>(`.third-shape--${shape.name}`);
      if (!element) return nearest;
      const rect = element.getBoundingClientRect();
      const distance = Math.hypot(x - (rect.left + rect.width / 2), y - (rect.top + rect.height / 2));
      return !nearest || distance < nearest.distance ? { shape, distance } : nearest;
    }, null)?.shape ?? null;
  };

  const startTouchPreview = (event: ReactPointerEvent<HTMLAnchorElement>, shape: Shape) => {
    if (event.pointerType !== "touch" || visibleSlug) return;
    clearTouchHold();
    touchExploreRef.current = false;
    suppressTouchClickRef.current = false;
    setPressedShape(shape.name);
    event.currentTarget.setPointerCapture(event.pointerId);
    touchHoldTimerRef.current = window.setTimeout(() => {
      touchHoldTimerRef.current = null;
      touchExploreRef.current = true;
      suppressTouchClickRef.current = true;
      setPressedShape(null);
      setActiveShape(shape.name);
    }, 340);
  };

  const moveTouchPreview = (event: ReactPointerEvent<HTMLAnchorElement>) => {
    if (event.pointerType !== "touch" || !touchExploreRef.current) return;
    event.preventDefault();
    const shape = getShapeAtPoint(event.clientX, event.clientY);
    if (shape) setActiveShape(shape.name);
  };

  const endTouchPreview = (event: ReactPointerEvent<HTMLAnchorElement>) => {
    if (event.pointerType !== "touch") return;
    clearTouchHold();
    setPressedShape(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (!touchExploreRef.current) return;
    event.preventDefault();
    touchExploreRef.current = false;
    setActiveShape(null);
    window.setTimeout(() => { suppressTouchClickRef.current = false; }, 400);
  };

  const cancelTouchPreview = (event: ReactPointerEvent<HTMLAnchorElement>) => {
    if (event.pointerType !== "touch") return;
    clearTouchHold();
    touchExploreRef.current = false;
    suppressTouchClickRef.current = false;
    setPressedShape(null);
    setActiveShape(null);
  };

  useEffect(() => () => {
    if (touchHoldTimerRef.current !== null) window.clearTimeout(touchHoldTimerRef.current);
  }, []);

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
  const mobileLogoText = selected?.mobileTitle ?? selected?.title ?? "MORA";
  const panelStyle = visibleSlug ? {
    "--third-panel-background": "#EEEEEE",
    "--third-panel-text": "#0E086E",
  } as ShapeStyle : undefined;

  return (
    <main className="third-version" ref={stageRef} style={stageStyle} data-active={activeShape !== null} data-images-ready={hoverImagesReady ? "true" : "false"} data-hover-colors={colors.hoverColors ? "on" : "off"} data-panel-open={visibleSlug !== null}>
      <header className="third-header">
        <Link href="/" onMouseEnter={() => setActiveShape(null)} onFocus={() => setActiveShape(null)}>MORA</Link>
      </header>
      <div className="third-composition">
        <Link
          className="third-mobile-logo"
          href="/"
          data-previewing={selected ? "true" : "false"}
          onFocus={() => setActiveShape(null)}
        >{mobileLogoText}</Link>
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
            data-shape={shape.name}
            data-pressed={pressedShape === shape.name}
            data-selected={activeShape === shape.name}
            onClick={(event) => {
              if (suppressTouchClickRef.current) {
                event.preventDefault();
                suppressTouchClickRef.current = false;
                return;
              }
              openShape(event, shape);
            }}
            onContextMenu={(event) => event.preventDefault()}
            onDragStart={(event) => event.preventDefault()}
            onPointerDown={(event) => startTouchPreview(event, shape)}
            onPointerEnter={(event) => {
              if (event.pointerType === "touch") return;
              if (visibleSlug) return;
              positionLabel(shape, event.currentTarget, event.clientX, event.clientY);
              setActiveShape(shape.name);
            }}
            onPointerMove={(event) => {
              if (event.pointerType === "touch") {
                moveTouchPreview(event);
                return;
              }
              if (!visibleSlug) positionLabel(shape, event.currentTarget, event.clientX, event.clientY);
            }}
            onPointerUp={endTouchPreview}
            onPointerCancel={cancelTouchPreview}
            onPointerLeave={(event) => {
              if (event.pointerType !== "touch") setActiveShape(null);
            }}
            onFocus={(event) => {
              if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
              if (visibleSlug) return;
              const rect = event.currentTarget.getBoundingClientRect();
              positionLabel(shape, event.currentTarget, rect.left + rect.width / 2, rect.top + rect.height / 2);
              setActiveShape(shape.name);
            }}
            onBlur={() => setActiveShape(null)}
            style={{
              "--shape-mask": `url(/third-shapes/${shape.name}.svg)`,
              "--shape-photo": `url(/landing-hover/${shape.name}.webp)`,
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
        <Link className="third-overlay__backdrop" href="/" aria-label="Close section" onClick={closePanel} />
        <aside ref={panelRef} className="third-panel" data-slug={visibleSlug} style={panelStyle} role="dialog" aria-modal="true" aria-labelledby="third-panel-title" tabIndex={-1}>
          <div className="third-panel__frame">
            <h1 id="third-panel-title">
              <span className="third-panel__title-desktop">{shapes.find((shape) => shape.slug === visibleSlug)?.title}</span>
              <span className="third-panel__title-mobile">{mobilePanelTitles[visibleSlug]}</span>
            </h1>
            {visibleSlug === "about" && <Image
              className="third-panel__portrait"
              src="/mobile-panels/grace-and-sophie.png"
              alt="Grace and Sophie"
              width={329}
              height={342}
              priority
            />}
            <div className="third-panel__copy"><SectionCopy slug={visibleSlug} /></div>
          </div>
          <Link className="third-panel__close" href="/" aria-label="Back to home" onClick={closePanel}>
            <span className="third-panel__close-label">Close</span>
            <Image className="third-panel__close-icon" src="/mobile-panels/close.svg" alt="" width={32} height={32} />
          </Link>
        </aside>
      </div>}
      <DialRoot position="top-right" theme="dark" defaultOpen={false} />
    </main>
  );
}
