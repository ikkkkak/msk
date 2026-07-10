/**
 * Instant card store – synchronous updates, minimal re-renders.
 * Use with useSyncExternalStore so only the card re-renders on show/hide.
 * Bypasses MapUIState context → heavy SearchScreen tree re-render delay (~340ms).
 */

type Listener = () => void;

let state: { visible: boolean; property: any } = { visible: false, property: null };
const listeners = new Set<Listener>();

function getSnapshot() {
  return state;
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function emit() {
  listeners.forEach((l) => l());
}

export const instantCardStore = {
  getSnapshot,
  subscribe,

  show(property: any) {
    state = { visible: true, property };
    emit();
  },

  hide() {
    state = { visible: false, property: null };
    emit();
  },
};
