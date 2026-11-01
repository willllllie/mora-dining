"use client";

import { useDialKitController } from "dialkit";
import type { DialKitController } from "dialkit";
import { useCallback, useEffect, useRef } from "react";
import {
  configToDialValues,
  resolveRisoDialValues,
  risoDialConfig,
  risoPresets,
  type RisoPresetName,
} from "@/components/riso/riso-config";

export function useRisoControls() {
  const controllerRef = useRef<DialKitController<typeof risoDialConfig> | null>(null);
  const controller = useDialKitController("Mora Risograph", risoDialConfig, {
    id: "mora-risograph-v1",
    persist: { key: "mora-risograph", storage: "localStorage", presets: true },
    onAction: (action) => {
      const current = controllerRef.current;
      if (!current) return;
      if (action === "actions.reset") current.resetValues();
      if (action === "actions.randomizeSeed") current.setValue("noise.noiseSeed", Math.floor(Math.random() * 100) + 1);
      if (action === "presets.subtlePrint") current.setValues(configToDialValues(risoPresets.subtle));
      if (action === "presets.vintageRiso") current.setValues(configToDialValues(risoPresets.vintage));
      if (action === "presets.heavyInk") current.setValues(configToDialValues(risoPresets.heavy));
    },
  });
  useEffect(() => {
    controllerRef.current = controller;
  }, [controller]);

  const applyPreset = useCallback((preset: RisoPresetName) => {
    controller.setValues(configToDialValues(risoPresets[preset]));
  }, [controller]);

  const randomizeSeed = useCallback(() => {
    controller.setValue("noise.noiseSeed", Math.floor(Math.random() * 100) + 1);
  }, [controller]);

  return {
    controller,
    config: resolveRisoDialValues(controller.values),
    applyPreset,
    reset: controller.resetValues,
    randomizeSeed,
  };
}
