import { useEffect } from "react";
import { useApp } from "@playcanvas/react/hooks";
import {
  Runtime,
  type Bridge,
  type Preferences,
  type Snapshot,
} from "./runtime";
export function Scene({
  bridge,
  preferences,
  onSnapshot,
  onPanel,
}: {
  bridge: Bridge;
  preferences: Preferences;
  onSnapshot: (s: Snapshot) => void;
  onPanel: (type: string) => void;
}) {
  const app = useApp();
  useEffect(() => {
    const runtime = new Runtime(app, preferences, onSnapshot, onPanel);
    bridge.command = runtime.command;
    return () => {
      bridge.command = undefined;
      runtime.destroy();
    };
  }, [app, bridge, onSnapshot, onPanel]);
  return null;
}
