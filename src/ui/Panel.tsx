import { useEffect, useRef, useState } from "react";
import { readSaved, save } from "../game/logic";
import type { Preferences } from "../game/runtime";
export function Panel({
  type,
  onClose,
  preferences,
  onPreferences,
}: {
  type: string;
  onClose: () => void;
  preferences: Preferences;
  onPreferences: (p: Preferences) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [notes, setNotes] = useState(() =>
    readSaved("notes", "Un café, una idea y un ratito para compartir."),
  );
  const [saved, setSaved] = useState(false);
  const [book, setBook] = useState(0);
  const previousFocus = useRef(document.activeElement);
  useEffect(() => {
    const first = ref.current?.querySelector<HTMLElement>(
      "button,textarea,input",
    );
    first?.focus();
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") {
        const controls = Array.from(
          ref.current?.querySelectorAll<HTMLElement>(
            "button,textarea,input,select",
          ) ?? [],
        );
        const first = controls[0],
          last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      if (previousFocus.current instanceof HTMLElement)
        previousFocus.current.focus();
    };
  }, [onClose]);
  const titles: Record<string, string> = {
    board: "Ideas que florecen",
    book: "Una página, otro mundo",
    monitor: "La mesa está abierta",
    help: "Sentite en casa",
    settings: "A tu manera",
  };
  const books = [
    {
      title: "Pequeños mundos",
      description:
        "Un cuaderno de paseos, jardines diminutos y lugares que se convierten en hogar.",
      color: "sage",
      symbol: "✿",
    },
    {
      title: "El arte de ir despacio",
      description:
        "Una invitación a prestar atención: a la luz de la tarde, al té y a las cosas sencillas.",
      color: "rose",
      symbol: "☀",
    },
    {
      title: "Jardines de bolsillo",
      description:
        "Historias y consejos para acompañar a tus plantas, hoja por hoja.",
      color: "gold",
      symbol: "❀",
    },
  ];
  return (
    <div
      className="scrim"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`panel ${type}`}
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="panel-title"
      >
        <button className="close" aria-label="Cerrar panel" onClick={onClose}>
          ×
        </button>
        <div className="eyebrow">
          COZYSPACE /{" "}
          {type === "monitor" ? "ENCUENTRO LOCAL" : "UN MOMENTO PARA VOS"}
        </div>
        <h2 id="panel-title">{titles[type]}</h2>
        {type === "board" && (
          <>
            <p>
              Dejá una idea para tu próxima visita. Se guarda en este navegador.
            </p>
            <label htmlFor="notes">Tu pizarra</label>
            <textarea
              id="notes"
              value={notes}
              maxLength={2000}
              onChange={(e) => {
                setNotes(e.target.value);
                setSaved(false);
              }}
              rows={6}
            />
            <div className="panel-footer">
              <span aria-live="polite">
                {saved ? "✓ Notas guardadas" : `${notes.length} / 2000`}
              </span>
              <button
                className="primary"
                onClick={() => {
                  save("notes", notes);
                  setSaved(true);
                }}
              >
                Guardar notas
              </button>
            </div>
          </>
        )}
        {type === "book" && (
          <>
            <div className="book-layout">
              <div className={`book-cover ${books[book].color}`}>
                <span>COLECCIÓN DOMINGO</span>
                <strong>{books[book].title}</strong>
                <div>{books[book].symbol}</div>
                <small>Historias para quedarse</small>
              </div>
              <div>
                <div className="eyebrow">LECTURA DEL DÍA</div>
                <h3>{books[book].title}</h3>
                <p>{books[book].description}</p>
                <blockquote>
                  “A veces, un lugar pequeño alcanza para imaginar algo grande.”
                </blockquote>
              </div>
            </div>
            <div className="book-picker">
              {books.map((b, i) => (
                <button
                  key={b.title}
                  aria-pressed={book === i}
                  onClick={() => setBook(i)}
                >
                  {b.title}
                </button>
              ))}
            </div>
          </>
        )}
        {type === "monitor" && (
          <>
            <p>Un café compartido, aunque hoy sea imaginario.</p>
            <div className="call-grid">
              {[
                {
                  name: "Luna",
                  icon: "☀",
                  color: "rose",
                  status: "Preparando un té",
                },
                {
                  name: "Teo",
                  icon: "✿",
                  color: "sage",
                  status: "Dibujando ideas",
                },
                {
                  name: "Vos",
                  icon: "☺",
                  color: "gold",
                  status: "Disfrutando el rincón",
                },
              ].map((p) => (
                <div className={`call-person ${p.color}`} key={p.name}>
                  <div className="illustrated-face">{p.icon}</div>
                  <strong>{p.name}</strong>
                  <small>{p.status}</small>
                </div>
              ))}
            </div>
            <div className="call-footer">
              <span>● Demo local · sin cámara ni micrófono</span>
              <button className="primary" onClick={onClose}>
                Hasta pronto
              </button>
            </div>
          </>
        )}
        {type === "help" && (
          <>
            <p>
              Este pequeño departamento es tuyo. Explorá, cuidá una planta o
              quedate un rato escuchando música.
            </p>
            <div className="help-grid">
              <div>
                <kbd>W A S D</kbd>
                <span>Caminar según la vista de cámara</span>
              </div>
              <div>
                <kbd>Mouse</kbd>
                <span>Clic en el piso para elegir un destino</span>
              </div>
              <div>
                <kbd>E</kbd>
                <span>Interactuar · levantarte de un asiento</span>
              </div>
              <div>
                <kbd>Shift</kbd>
                <span>Caminar un poquito más rápido</span>
              </div>
              <div>
                <kbd>Q</kbd>
                <span>Saludar</span>
              </div>
              <div>
                <kbd>Rueda</kbd>
                <span>Acercar o alejar la cámara</span>
              </div>
            </div>
            <p className="fine">
              También podés usar «Explorar» para caminar hasta un objeto. Todos
              los controles de la interfaz funcionan con Tab y Enter.
            </p>
            <button className="primary" onClick={onClose}>
              Vamos a explorar
            </button>
          </>
        )}
        {type === "settings" && (
          <>
            <p>Pequeños ajustes para disfrutar el espacio.</p>
            <label className="setting">
              Calidad gráfica
              <select
                value={preferences.quality}
                onChange={(e) =>
                  onPreferences({
                    ...preferences,
                    quality: e.target.value as Preferences["quality"],
                  })
                }
              >
                <option value="high">Alta · sombras cálidas</option>
                <option value="low">Liviana · sin sombras</option>
              </select>
            </label>
            <label className="setting">
              Volumen de la radio
              <input
                aria-label="Volumen de la radio"
                type="range"
                min="0"
                max="1"
                step=".05"
                value={preferences.volume}
                onChange={(e) =>
                  onPreferences({
                    ...preferences,
                    volume: Number(e.target.value),
                  })
                }
              />
              <span>{Math.round(preferences.volume * 100)}%</span>
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={preferences.reduced}
                onChange={(e) =>
                  onPreferences({ ...preferences, reduced: e.target.checked })
                }
              />
              Reducir animaciones ambientales
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={preferences.fps}
                onChange={(e) =>
                  onPreferences({ ...preferences, fps: e.target.checked })
                }
              />
              Mostrar FPS de diagnóstico
            </label>
            <button className="primary" onClick={onClose}>
              Listo
            </button>
          </>
        )}
      </div>
    </div>
  );
}
