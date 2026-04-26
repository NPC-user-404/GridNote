import type { StateCreator, StoreMutatorIdentifier } from 'zustand';

export interface HistoryState {
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

interface HistoryStore<T> {
  past: T[];
  future: T[];
}

const MAX_HISTORY = 50;

type Temporal = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  stateCreator: StateCreator<T, Mps, Mcs>,
  options?: { equality?: (a: T, b: T) => boolean; select?: (s: T) => unknown }
) => StateCreator<T & HistoryState, Mps, Mcs>;

type TemporalImpl = <T>(
  stateCreator: StateCreator<T, [], []>,
  options?: { select?: (s: T) => unknown }
) => StateCreator<T & HistoryState, [], []>;

const temporalImpl: TemporalImpl = (stateCreator, options) => (set, get, api) => {
  const history: HistoryStore<unknown> = { past: [], future: [] };
  let isUndoRedo = false;

  const select = options?.select ?? ((s: unknown) => s);

  const trackedSet: typeof set = (updater, replace) => {
    if (!isUndoRedo) {
      const current = select(get());
      history.past.push(JSON.parse(JSON.stringify(current)));
      if (history.past.length > MAX_HISTORY) history.past.shift();
      history.future = [];
    }
    set(updater as any, replace);
  };

  const initialState = stateCreator(trackedSet, get, api);

  return {
    ...initialState,
    undo: () => {
      if (history.past.length === 0) return;
      const current = select(get());
      history.future.push(JSON.parse(JSON.stringify(current)));
      const previous = history.past.pop()!;
      isUndoRedo = true;
      set((s: any) => ({ ...s, ...(previous as object) }));
      isUndoRedo = false;
    },
    redo: () => {
      if (history.future.length === 0) return;
      const current = select(get());
      history.past.push(JSON.parse(JSON.stringify(current)));
      const next = history.future.pop()!;
      isUndoRedo = true;
      set((s: any) => ({ ...s, ...(next as object) }));
      isUndoRedo = false;
    },
    canUndo: () => history.past.length > 0,
    canRedo: () => history.future.length > 0,
  };
};

export const temporal = temporalImpl as Temporal;
