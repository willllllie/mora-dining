"use client";

import { forwardRef, useEffect, useId, useMemo, useState } from "react";
import type { RisoConfig } from "@/components/riso/riso-config";

export type RisoGraphicProps = {
  src: string;
  viewBox: { width: number; height: number };
  config: RisoConfig;
  inkColor?: string;
  className?: string;
  title?: string;
  decorative?: boolean;
};

const svgDataCache = new Map<string, Promise<string>>();

export function loadSvgDataUri(src: string) {
  if (!src.startsWith("/")) return Promise.reject(new Error("RisoGraphic only supports same-origin SVG paths."));
  const cached = svgDataCache.get(src);
  if (cached) return cached;
  const request = fetch(src)
    .then((response) => {
      if (!response.ok) throw new Error(`Unable to load ${src}`);
      return response.text();
    })
    .then((svg) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
  svgDataCache.set(src, request);
  return request;
}

function useEmbeddedSvg(src: string) {
  const [href, setHref] = useState(src);
  useEffect(() => {
    let live = true;
    loadSvgDataUri(src).then((uri) => {
      if (live) setHref(uri);
    }).catch(() => {
      if (live) setHref(src);
    });
    return () => { live = false; };
  }, [src]);
  return href;
}

function missingInkTable(amount: number) {
  const steps = 64;
  const missing = Math.round((Math.max(0, Math.min(20, amount)) / 100) * steps);
  return Array.from({ length: steps }, (_, index) => index < missing ? "0" : "1").join(" ");
}

export const RisoGraphic = forwardRef<SVGSVGElement, RisoGraphicProps>(function RisoGraphic({
  src,
  viewBox,
  config,
  inkColor,
  className,
  title,
  decorative = false,
}, ref) {
  const rawId = useId();
  const id = useMemo(() => rawId.replace(/[^a-zA-Z0-9_-]/g, ""), [rawId]);
  const href = useEmbeddedSvg(src);
  const color = inkColor ?? config.inkColor;
  const opacity = Math.max(0, Math.min(1, config.inkOpacity / 100));
  const grain = Math.max(0, Math.min(1, config.fineGrainStrength / 100));
  const density = Math.max(0, Math.min(0.75, config.densityVariation / 100));
  const paper = Math.max(0, Math.min(0.65, config.paperTexture / 100));
  const pad = Math.ceil(config.inkBleed + config.bleedSoftness * 2 + config.edgeDistortion + 6);
  const fineFrequency = Math.max(0.002, 0.18 / Math.max(0.1, config.grainScale));
  const paperFrequency = Math.max(0.001, 0.007 / Math.max(0.1, config.grainScale));
  const holeTable = missingInkTable(config.missingInk);
  const titleId = `${id}-title`;

  return (
    <svg
      ref={ref}
      className={className}
      viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
      preserveAspectRatio="none"
      aria-hidden={decorative || !title ? true : undefined}
      aria-labelledby={!decorative && title ? titleId : undefined}
      role={!decorative && title ? "img" : undefined}
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      {!decorative && title && <title id={titleId}>{title}</title>}
      <defs>
        <filter
          id={`${id}-flat`}
          x={-pad}
          y={-pad}
          width={viewBox.width + pad * 2}
          height={viewBox.height + pad * 2}
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodColor={color} floodOpacity={opacity} result="flatColor" />
          <feComposite in="flatColor" in2="SourceAlpha" operator="in" />
        </filter>
        <filter
          id={`${id}-bleed`}
          x={-pad}
          y={-pad}
          width={viewBox.width + pad * 2}
          height={viewBox.height + pad * 2}
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feMorphology in="SourceAlpha" operator="dilate" radius={config.inkBleed} result="expanded" />
          <feTurbulence
            type="fractalNoise"
            baseFrequency={config.edgeNoiseScale}
            numOctaves={2}
            seed={config.noiseSeed}
            result="edgeNoise"
          />
          <feDisplacementMap
            in="expanded"
            in2="edgeNoise"
            scale={config.edgeDistortion}
            xChannelSelector="R"
            yChannelSelector="G"
            result="roughBleed"
          />
          <feGaussianBlur in="roughBleed" stdDeviation={config.bleedSoftness} result="softBleed" />
          <feFlood floodColor={color} floodOpacity={opacity * 0.32} result="bleedColor" />
          <feComposite in="bleedColor" in2="softBleed" operator="in" />
        </filter>
        <filter
          id={`${id}-ink`}
          x={-pad}
          y={-pad}
          width={viewBox.width + pad * 2}
          height={viewBox.height + pad * 2}
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency={fineFrequency}
            numOctaves={3}
            seed={config.noiseSeed + 11}
            result="fineNoise"
          />
          <feColorMatrix
            in="fineNoise"
            type="matrix"
            values={`0 0 0 0 0
                     0 0 0 0 0
                     0 0 0 0 0
                     .333 .333 .333 0 0`}
            result="fineAlpha"
          />
          <feComponentTransfer in="fineAlpha" result="fineCoverage">
            <feFuncA type="linear" slope={grain * 0.7} intercept={1 - grain * 0.35} />
          </feComponentTransfer>

          <feTurbulence
            type="fractalNoise"
            baseFrequency={Math.max(0.002, config.edgeNoiseScale * 0.55)}
            numOctaves={2}
            seed={config.noiseSeed + 23}
            result="densityNoise"
          />
          <feColorMatrix
            in="densityNoise"
            type="matrix"
            values={`0 0 0 0 0
                     0 0 0 0 0
                     0 0 0 0 0
                     .333 .333 .333 0 0`}
            result="densityAlpha"
          />
          <feComponentTransfer in="densityAlpha" result="densityCoverage">
            <feFuncA type="linear" slope={density} intercept={1 - density * 0.5} />
          </feComponentTransfer>

          <feTurbulence
            type="fractalNoise"
            baseFrequency={paperFrequency}
            numOctaves={4}
            seed={config.noiseSeed + 37}
            result="paperNoise"
          />
          <feColorMatrix
            in="paperNoise"
            type="matrix"
            values={`0 0 0 0 0
                     0 0 0 0 0
                     0 0 0 0 0
                     .333 .333 .333 0 0`}
            result="paperAlpha"
          />
          <feComponentTransfer in="paperAlpha" result="paperCoverage">
            <feFuncA type="linear" slope={paper} intercept={1 - paper * 0.5} />
          </feComponentTransfer>

          <feTurbulence
            type="turbulence"
            baseFrequency={fineFrequency * 0.55}
            numOctaves={2}
            seed={config.noiseSeed + 51}
            result="holeNoise"
          />
          <feColorMatrix
            in="holeNoise"
            type="matrix"
            values={`0 0 0 0 0
                     0 0 0 0 0
                     0 0 0 0 0
                     .333 .333 .333 0 0`}
            result="holeAlpha"
          />
          <feComponentTransfer in="holeAlpha" result="holeCoverage">
            <feFuncA type="discrete" tableValues={holeTable} />
          </feComponentTransfer>

          <feComposite in="fineCoverage" in2="densityCoverage" operator="arithmetic" k1="1" result="grainDensity" />
          <feComposite in="grainDensity" in2="paperCoverage" operator="arithmetic" k1="1" result="texturedCoverage" />
          <feComposite in="texturedCoverage" in2="holeCoverage" operator="arithmetic" k1="1" result="coverage" />
          <feComposite in="SourceAlpha" in2="coverage" operator="in" result="inkMask" />
          <feFlood floodColor={color} floodOpacity={opacity} result="inkColor" />
          <feComposite in="inkColor" in2="inkMask" operator="in" />
        </filter>
      </defs>
      {config.enabled && config.inkBleed > 0 && (
        <image
          href={href}
          x="0"
          y="0"
          width={viewBox.width}
          height={viewBox.height}
          preserveAspectRatio="none"
          filter={`url(#${id}-bleed)`}
        />
      )}
      <image
        href={href}
        x="0"
        y="0"
        width={viewBox.width}
        height={viewBox.height}
        preserveAspectRatio="none"
        filter={`url(#${id}-${config.enabled ? "ink" : "flat"})`}
      />
    </svg>
  );
});
