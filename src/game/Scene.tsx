import { useEffect, useRef } from "react";
import { useApp } from "@playcanvas/react/hooks";
import { Runtime } from "./runtime";
import type { GameStore, PanelType, Preferences } from "./store";
export function Scene({
  store,
  preferences,
  onPanel,
}: {
  store: GameStore;
  preferences: Preferences;
  onPanel: (panel: PanelType) => void;
}) {
  const app = useApp();
  // The runtime is created once with the current preferences; later changes
  // reach it as commands below, without rebuilding the world.
  const initial = useRef(preferences);
  useEffect(() => {
    const runtime = new Runtime(app, initial.current, store, onPanel);
    return () => runtime.destroy();
  }, [app, store, onPanel]);
  useEffect(() => {
    store.send({ type: "preferences", value: preferences });
  }, [store, preferences]);
  return null;
}
