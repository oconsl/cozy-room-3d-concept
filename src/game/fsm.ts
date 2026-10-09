import type { AvatarState } from "./types";
export type AvatarEvent =
  "move" | "turn" | "stop" | "sit" | "stand" | "wave" | "interact" | "done";
interface StateSpec {
  /** Keyboard and path following may move the avatar. */
  locomotion: boolean;
  /** Seconds before the state fires `done` on its own. */
  duration?: number;
  on: Partial<Record<AvatarEvent, AvatarState>>;
}
// Actions that any standing state can start.
const actions = {
  sit: "SITTING",
  wave: "WAVING",
  interact: "INTERACTING",
} as const;
const free = {
  ...actions,
  move: "WALKING",
  turn: "TURNING",
  stop: "IDLE",
  done: "IDLE",
} as const;
const timed = { ...actions, done: "IDLE" } as const;
export const avatarStates: Record<AvatarState, StateSpec> = {
  IDLE: { locomotion: true, on: free },
  WALKING: { locomotion: true, on: free },
  TURNING: { locomotion: true, on: free },
  SITTING: { locomotion: false, on: { stand: "STANDING" } },
  STANDING: { locomotion: false, duration: 0.5, on: timed },
  WAVING: { locomotion: false, duration: 1.8, on: timed },
  INTERACTING: { locomotion: false, duration: 0.85, on: timed },
};
/** Next state for an event; events a state does not handle are ignored. */
export function transition(
  state: AvatarState,
  event: AvatarEvent,
): AvatarState {
  return avatarStates[state].on[event] ?? state;
}
