/**
 * One place to ask whether the visitor wants motion.
 *
 * This check was written inline in three separate places in `World.tsx` and then
 * needed in `FloatingIsland.tsx` too, which is exactly how one copy ends up
 * respecting the preference and another quietly does not.
 *
 * Read live rather than cached: someone can change the setting mid-visit, and the
 * media query is cheap.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
