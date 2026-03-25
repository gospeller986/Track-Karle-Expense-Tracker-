/**
 * Lightweight pub-sub for triggering cross-screen data refreshes.
 * Used when a modal screen (e.g. add expense) needs to signal the
 * background screen to refetch without sharing component state.
 */
type Listener = () => void;

function createBus() {
  const subs = new Set<Listener>();
  return {
    emit: () => subs.forEach(fn => fn()),
    subscribe: (fn: Listener) => {
      subs.add(fn);
      return () => { subs.delete(fn); };
    },
  };
}

export const expenseRefreshBus = createBus();
