import type { DialConfig, DialKitValueUpdates } from "dialkit";

export type RisoConfig = {
  enabled: boolean;
  inkColor: string;
  inkOpacity: number;
  inkBleed: number;
  bleedSoftness: number;
  edgeDistortion: number;
  edgeNoiseScale: number;
  fineGrainStrength: number;
  grainScale: number;
  densityVariation: number;
  missingInk: number;
  paperTexture: number;
  noiseSeed: number;
};

export const defaultRisoConfig: RisoConfig = {
  enabled: true,
  inkColor: "#76533D",
  inkOpacity: 100,
  inkBleed: 1.2,
  bleedSoftness: 0.5,
  edgeDistortion: 1,
  edgeNoiseScale: 0.025,
  fineGrainStrength: 20,
  grainScale: 0.65,
  densityVariation: 15,
  missingInk: 2,
  paperTexture: 10,
  noiseSeed: 8,
};

export const risoDialConfig = {
  ink: {
    enabled: defaultRisoConfig.enabled,
    inkColor: { type: "color", default: defaultRisoConfig.inkColor },
    inkOpacity: [defaultRisoConfig.inkOpacity, 0, 100, 1],
  },
  bleed: {
    inkBleed: [defaultRisoConfig.inkBleed, 0, 5, 0.1],
    bleedSoftness: [defaultRisoConfig.bleedSoftness, 0, 3, 0.1],
    edgeDistortion: [defaultRisoConfig.edgeDistortion, 0, 6, 0.1],
    edgeNoiseScale: [defaultRisoConfig.edgeNoiseScale, 0.005, 0.15, 0.001],
  },
  grain: {
    fineGrainStrength: [defaultRisoConfig.fineGrainStrength, 0, 100, 1],
    grainScale: [defaultRisoConfig.grainScale, 0.1, 2, 0.01],
    densityVariation: [defaultRisoConfig.densityVariation, 0, 60, 1],
    missingInk: [defaultRisoConfig.missingInk, 0, 20, 0.5],
  },
  paper: {
    paperTexture: [defaultRisoConfig.paperTexture, 0, 100, 1],
  },
  noise: {
    noiseSeed: [defaultRisoConfig.noiseSeed, 1, 100, 1],
  },
  presets: {
    subtlePrint: { type: "action", label: "Subtle Print" },
    vintageRiso: { type: "action", label: "Vintage Riso" },
    heavyInk: { type: "action", label: "Heavy Ink" },
  },
  actions: {
    reset: { type: "action", label: "Reset" },
    randomizeSeed: { type: "action", label: "Randomize seed" },
  },
} satisfies DialConfig;

export type RisoPresetName = "subtle" | "vintage" | "heavy";

export const risoPresets: Record<RisoPresetName, RisoConfig> = {
  subtle: {
    ...defaultRisoConfig,
    inkBleed: 0.5,
    bleedSoftness: 0.25,
    edgeDistortion: 0.35,
    edgeNoiseScale: 0.04,
    fineGrainStrength: 10,
    grainScale: 0.8,
    densityVariation: 8,
    missingInk: 0.5,
    paperTexture: 5,
  },
  vintage: defaultRisoConfig,
  heavy: {
    ...defaultRisoConfig,
    inkBleed: 2.8,
    bleedSoftness: 1.2,
    edgeDistortion: 2.4,
    edgeNoiseScale: 0.018,
    fineGrainStrength: 45,
    grainScale: 0.45,
    densityVariation: 35,
    missingInk: 6,
    paperTexture: 18,
    noiseSeed: 27,
  },
};

export function configToDialValues(config: RisoConfig): DialKitValueUpdates<typeof risoDialConfig> {
  return {
    ink: {
      enabled: config.enabled,
      inkColor: config.inkColor,
      inkOpacity: config.inkOpacity,
    },
    bleed: {
      inkBleed: config.inkBleed,
      bleedSoftness: config.bleedSoftness,
      edgeDistortion: config.edgeDistortion,
      edgeNoiseScale: config.edgeNoiseScale,
    },
    grain: {
      fineGrainStrength: config.fineGrainStrength,
      grainScale: config.grainScale,
      densityVariation: config.densityVariation,
      missingInk: config.missingInk,
    },
    paper: { paperTexture: config.paperTexture },
    noise: { noiseSeed: config.noiseSeed },
  };
}

export function resolveRisoDialValues(values: {
  ink: { enabled: boolean; inkColor: string; inkOpacity: number };
  bleed: { inkBleed: number; bleedSoftness: number; edgeDistortion: number; edgeNoiseScale: number };
  grain: { fineGrainStrength: number; grainScale: number; densityVariation: number; missingInk: number };
  paper: { paperTexture: number };
  noise: { noiseSeed: number };
}): RisoConfig {
  return {
    enabled: values.ink.enabled,
    inkColor: values.ink.inkColor,
    inkOpacity: values.ink.inkOpacity,
    inkBleed: values.bleed.inkBleed,
    bleedSoftness: values.bleed.bleedSoftness,
    edgeDistortion: values.bleed.edgeDistortion,
    edgeNoiseScale: values.bleed.edgeNoiseScale,
    fineGrainStrength: values.grain.fineGrainStrength,
    grainScale: values.grain.grainScale,
    densityVariation: values.grain.densityVariation,
    missingInk: values.grain.missingInk,
    paperTexture: values.paper.paperTexture,
    noiseSeed: values.noise.noiseSeed,
  };
}
