import { useCallback, useMemo, useState } from "react";
import { Application } from "@playcanvas/react";
import { Scene } from "../game/Scene";
import {
  defaults,
  type Bridge,
  type Preferences,
  type Snapshot,
} from "../game/runtime";
import { readSaved } from "../game/logic";
import { interactions } from "../world/config";
import { Panel } from "../ui/Panel";
function Icon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    sound: "M4 9h4l5-4v14l-5-4H4z M17 8q5 4 0 8 M19 5q8 7 0 14",
    mute: "M4 9h4l5-4v14l-5-4H4z M17 9l5 6 M22 9l-5 6",
    camera: "M4 7h4l2-3h4l2 3h4v13H4z M16 13a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
    settings:
      "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M12 2v3 M12 19v3 M2 12h3 M19 12h3 M5 5l2 2 M17 17l2 2 M5 19l2-2 M17 7l2-2",
    help: "M9 8a3 3 0 1 1 5 2c-2 1-2 2-2 3 M12 17v.1 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
    arrow: "M5 12h14 M13 6l6 6-6 6",
    leaf: "M19 4C7 3 2 9 6 16s15 3 13-12 M5 20 15 9",
    wave: "M6 13V7q0-2 2-2v7 M8 8V4q0-2 2-2v10 M10 5q0-2 2-2v9 M12 6q0-2 2-2v10 M14 12l3-3q2-1 2 1l-3 8q-2 4-6 4-5 0-5-6z",
  };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] ?? paths.leaf} />
    </svg>
  );
}
const initial: Snapshot = {
  ready: false,
  position: { x: 0, z: 0.3 },
  state: "IDLE",
  fps: 0,
  lamp: true,
  music: false,
  message: "Preparando tu rincón…",
  room: { name: "ESTUDIO 01", mood: "LUZ DE TARDE" },
};
export function App() {
  const bridge = useMemo<Bridge>(() => ({}), []);
  const [snapshot, setSnapshot] = useState(initial);
  const [preferences, setPreferences] = useState<Preferences>(() =>
    readSaved("preferences", {
      ...defaults,
      reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    }),
  );
  const [panel, setPanel] = useState<string>();
  const [explore, setExplore] = useState(false);
  const openPanel = useCallback(
    (type: string) => {
      setPanel(type);
      bridge.command?.({ type: "panel", open: true });
    },
    [bridge],
  );
  const closePanel = useCallback(() => {
    setPanel(undefined);
    bridge.command?.({ type: "panel", open: false });
  }, [bridge]);
  const changePreferences = (p: Preferences) => {
    setPreferences(p);
    bridge.command?.({ type: "preferences", value: p });
  };
  return (
    <main className={preferences.reduced ? "cozy reduced" : "cozy"}>
      <div
        className="world-canvas"
        data-testid="scene"
        data-ready={snapshot.ready}
      >
        <Application graphicsDeviceOptions={{ antialias: true, alpha: false }}>
          <Scene
            bridge={bridge}
            preferences={preferences}
            onSnapshot={setSnapshot}
            onPanel={openPanel}
          />
        </Application>
      </div>
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">
            <Icon name="leaf" />
          </div>
          <div>
            <h1>CozySpace</h1>
            <div className="offline">
              <i /> Offline Demo <span>·</span> Hecho para quedarse
            </div>
          </div>
        </div>
        <nav aria-label="Ajustes del espacio">
          <button
            className="icon-button"
            onClick={() => bridge.command?.({ type: "sound" })}
            aria-label={snapshot.music ? "Apagar sonido" : "Activar sonido"}
            aria-pressed={snapshot.music}
            title="Radio de domingo"
          >
            <Icon name={snapshot.music ? "sound" : "mute"} />
          </button>
          <button
            className="icon-button"
            aria-label="Alternar cámara"
            aria-pressed={preferences.camera === "follow"}
            title={
              preferences.camera === "general"
                ? "Seguir al avatar"
                : "Ver habitación completa"
            }
            onClick={() =>
              changePreferences({
                ...preferences,
                camera: preferences.camera === "general" ? "follow" : "general",
              })
            }
          >
            <Icon name="camera" />
          </button>
          <button
            className="icon-button"
            aria-label="Ajustes"
            onClick={() => openPanel("settings")}
          >
            <Icon name="settings" />
          </button>
          <button
            className="icon-button"
            aria-label="Ayuda"
            onClick={() => openPanel("help")}
          >
            <Icon name="help" />
          </button>
        </nav>
      </header>
      <div className="room-caption">
        <span className="eyebrow">TU PEQUEÑO REFUGIO</span>
        <h2>Un domingo sin apuro.</h2>
        <p>Un café, un libro y un mundo por habitar.</p>
      </div>
      {!snapshot.ready && (
        <div className="loading" role="status">
          <Icon name="leaf" />
          <span>Abriendo las ventanas…</span>
        </div>
      )}
      {snapshot.ready && snapshot.indicator && !panel && (
        <button
          className="world-prompt"
          style={{ left: snapshot.indicator.x, top: snapshot.indicator.y }}
          onClick={() => bridge.command?.({ type: "interact" })}
        >
          <kbd>E</kbd>
          <span>
            {snapshot.state === "SITTING" ? "Levantarse" : snapshot.nearName}
            <small>Presioná E para interactuar</small>
          </span>
        </button>
      )}
      <aside className="explore-area">
        <button
          className="explore-toggle"
          aria-expanded={explore}
          onClick={() => setExplore(!explore)}
        >
          <Icon name="leaf" />
          <span>
            Explorar el espacio<small>Diez pequeñas cosas para disfrutar</small>
          </span>
          <span className="toggle-sign">{explore ? "−" : "+"}</span>
        </button>
        {explore && (
          <div className="destinations">
            {interactions.map((o, i) => (
              <button
                key={o.id}
                onClick={() => {
                  bridge.command?.({ type: "visit", id: o.id });
                  setExplore(false);
                }}
                data-testid={`visit-${o.id}`}
              >
                <span className="destination-number">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{o.name}</span>
                <Icon name="arrow" />
              </button>
            ))}
          </div>
        )}
      </aside>
      <footer className="bottom-bar">
        <div className="status-message">
          <i />
          <span role="status">{snapshot.message}</span>
        </div>
        <div className="control-strip">
          <span>
            <kbd>W A S D</kbd> Mover
          </span>
          <span>
            <kbd>Mouse</kbd> Destino
          </span>
          <span>
            <kbd>E</kbd> Interactuar
          </span>
          <span>
            <kbd>Shift</kbd> Paso rápido
          </span>
          <button
            onClick={() => bridge.command?.({ type: "wave" })}
            aria-label="Saludar"
          >
            <Icon name="wave" /> Saludar <kbd>Q</kbd>
          </button>
        </div>
      </footer>
      <div className="room-label">
        {snapshot.room.name} <span>·</span> {snapshot.room.mood}
      </div>
      {preferences.fps && (
        <output className="fps">
          {snapshot.fps} FPS · {preferences.quality}
        </output>
      )}
      <output
        className="diagnostic"
        data-testid="avatar"
        data-x={snapshot.position.x.toFixed(3)}
        data-z={snapshot.position.z.toFixed(3)}
        data-state={snapshot.state}
        data-near={snapshot.near ?? ""}
        data-lamp={snapshot.lamp}
        data-music={snapshot.music}
      >
        Nilo · {snapshot.state}
      </output>
      {panel && (
        <Panel
          type={panel}
          onClose={closePanel}
          preferences={preferences}
          onPreferences={changePreferences}
        />
      )}
    </main>
  );
}
