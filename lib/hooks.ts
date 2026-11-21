import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * Hook to safely detect if the component has mounted on the client.
 * Returns false on SSR and initial hydration (matching server HTML),
 * then updates to true immediately after hydration without cascading renders.
 */
export function useIsMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
