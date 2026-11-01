"use client";

import { DialRoot } from "dialkit";
import "dialkit/styles.css";
import Link from "next/link";
import type { CSSProperties } from "react";
import { useRef, useState } from "react";
import { RisoGraphic, loadSvgDataUri } from "@/components/riso/RisoGraphic";
import { useRisoControls } from "@/components/riso/useRisoControls";
import "@/app/riso-playground/riso-playground.css";

type BackgroundMode = "transparent" | "black" | "warm-white";
type Zoom = 1 | 2 | 4;

const TABLE_VIEW_BOX = { width: 553, height: 738 };

export function RisoPlayground() {
  const { config, applyPreset, reset, randomizeSeed } = useRisoControls();
  const [background, setBackground] = useState<BackgroundMode>("warm-white");
  const [zoom, setZoom] = useState<Zoom>(1);
  const [split, setSplit] = useState(50);
  const [notice, setNotice] = useState("");
  const stageRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<SVGSVGElement>(null);

  const updateSplit = (clientX: number) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    setSplit(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)));
  };

  const copyConfig = async () => {
    await navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    setNotice("Config copied");
    window.setTimeout(() => setNotice(""), 1600);
  };

  const downloadSvg = async () => {
    const source = previewRef.current;
    if (!source) return;
    const clone = source.cloneNode(true) as SVGSVGElement;
    const embedded = await loadSvgDataUri("/third-shapes/table.svg");
    clone.querySelectorAll("image").forEach((image) => image.setAttribute("href", embedded));
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("width", String(TABLE_VIEW_BOX.width));
    clone.setAttribute("height", String(TABLE_VIEW_BOX.height));
    const output = `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(clone)}`;
    const url = URL.createObjectURL(new Blob([output], { type: "image/svg+xml" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `mora-riso-table-seed-${config.noiseSeed}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="riso-playground">
      <header className="riso-playground__header">
        <div>
          <p className="riso-playground__eyebrow">Mora print lab</p>
          <h1>Risograph playground</h1>
        </div>
        <Link href="/third-version/">Back to Third Version</Link>
      </header>

      <section className="riso-playground__tools" aria-label="Preview controls">
        <div className="riso-tool-group">
          <span>Background</span>
          {(["transparent", "black", "warm-white"] as BackgroundMode[]).map((value) => (
            <button key={value} type="button" data-active={background === value} onClick={() => setBackground(value)}>{value.replace("-", " ")}</button>
          ))}
        </div>
        <div className="riso-tool-group">
          <span>Zoom</span>
          {([1, 2, 4] as Zoom[]).map((value) => (
            <button key={value} type="button" data-active={zoom === value} onClick={() => setZoom(value)}>{value * 100}%</button>
          ))}
        </div>
        <div className="riso-tool-group riso-tool-group--wide">
          <span>Preset</span>
          <button type="button" onClick={() => applyPreset("subtle")}>Subtle Print</button>
          <button type="button" onClick={() => applyPreset("vintage")}>Vintage Riso</button>
          <button type="button" onClick={() => applyPreset("heavy")}>Heavy Ink</button>
        </div>
        <div className="riso-tool-group riso-tool-group--wide">
          <span>Actions</span>
          <button type="button" onClick={reset}>Reset</button>
          <button type="button" onClick={randomizeSeed}>Randomize seed</button>
          <button type="button" onClick={copyConfig}>Copy JSON</button>
          <button type="button" onClick={downloadSvg}>Download SVG</button>
          <output aria-live="polite">{notice}</output>
        </div>
      </section>

      <div className="riso-playground__workspace">
        <section className="riso-preview-viewport" aria-label="Before and after preview">
          <div
            ref={stageRef}
            className="riso-preview-stage"
            data-background={background}
            style={{
              "--riso-stage-width": `${660 * zoom}px`,
              "--riso-stage-height": `${880 * zoom}px`,
              "--riso-art-width": `${460 * zoom}px`,
              "--riso-split": `${split}%`,
            } as CSSProperties}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              updateSplit(event.clientX);
            }}
            onPointerMove={(event) => {
              if (event.currentTarget.hasPointerCapture(event.pointerId)) updateSplit(event.clientX);
            }}
          >
            <div className="riso-preview-art">
              <RisoGraphic
                className="riso-preview-graphic"
                src="/third-shapes/table.svg"
                viewBox={TABLE_VIEW_BOX}
                config={{ ...config, enabled: false }}
                inkColor={config.inkColor}
                decorative
              />
              <div className="riso-preview-effect">
                <RisoGraphic
                  ref={previewRef}
                  className="riso-preview-graphic"
                  src="/third-shapes/table.svg"
                  viewBox={TABLE_VIEW_BOX}
                  config={config}
                  decorative
                />
              </div>
              <span className="riso-preview-divider" aria-hidden="true" />
              <span className="riso-preview-label riso-preview-label--before">Before</span>
              <span className="riso-preview-label riso-preview-label--after">After</span>
            </div>
          </div>
        </section>
        <aside className="riso-playground__dial" aria-label="Risograph parameters">
          <DialRoot mode="inline" theme="dark" defaultOpen />
        </aside>
      </div>
    </main>
  );
}
