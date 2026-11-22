import { useState, useEffect } from "react";

/**
 * Hook to safely detect if the component has mounted on the client.
 * Returns false on SSR and during initial client hydration (guaranteeing
 * identical HTML to prevent hydration mismatch errors), then updates to true
 * immediately after hydration completes.
 */
export function useIsMounted(): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(handle);
  }, []);

  return mounted;
}
