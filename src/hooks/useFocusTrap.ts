import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTORS = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex=\"-1\"])",
].join(", ");

/**
 * Traps keyboard focus inside `containerRef` while the modal is open,
 * and restores focus to the previously-focused element on unmount.
 *
 * @param isOpen  – When false the trap is inactive (e.g. conditionally rendered modals
 *                  can just pass `true` since they're only rendered when open).
 */
export function useFocusTrap(isOpen = true) {
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Auto-focus the first focusable element inside the modal
    const focusables = containerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS);
    if (focusables && focusables.length > 0) {
      focusables[0].focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !containerRef.current) return;

      const all = Array.from(containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS));
      if (all.length === 0) return;

      const first = all[0];
      const last = all[all.length - 1];

      if (event.shiftKey) {
        // Shift+Tab: if focus is at the first element, wrap to last
        if (document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      } else {
        // Tab: if focus is at the last element, wrap to first
        if (document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Restore focus to the element that was focused before the modal opened
      previouslyFocused?.focus?.();
    };
  }, [isOpen]);

  return containerRef;
}
