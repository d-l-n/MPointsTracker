import { useEffect, useRef, useState, useCallback } from "react";

interface UseNavVisibilityOptions {
  showNavOverlay: boolean;
  showAuthModal: unknown;
  navLeaveTarget: unknown;
  historyViewKey: string | null;
  nav: string;
  selected: string | null;
  pathname: string;
  search: string;
}

const RELEVANT_SCROLL_SELECTOR = ".app-content,.app-content-inner,.tbody,.page,.admin-page,.fb-page,.detail-wrapper";
const MIN_SCROLLABLE_OVERFLOW = 8;
const BOTTOM_EDGE_THRESHOLD = 4;
const TOP_EDGE_THRESHOLD = 10;
const MIN_SCROLL_DELTA = 5;
const SCROLL_IDLE_REVEAL_DELAY = 300;
const TOUCH_END_REVEAL_DELAY = 300;

type ScrollChromeAction = "hide" | "show" | "none";

export function isVerticallyScrollable(element: HTMLElement | null) {
  if (!element) return false;
  return element.scrollHeight - element.clientHeight > MIN_SCROLLABLE_OVERFLOW;
}

function isAtBottom(element: HTMLElement) {
  return element.scrollHeight - element.clientHeight - element.scrollTop <= BOTTOM_EDGE_THRESHOLD;
}

function isAtTop(scrollTop: number) {
  return scrollTop <= TOP_EDGE_THRESHOLD;
}

export function getScrollChromeAction({
  scrollTop,
  prevScrollTop,
  atBottom,
}: {
  scrollTop: number;
  prevScrollTop: number;
  atBottom: boolean;
}): ScrollChromeAction {
  const delta = scrollTop - prevScrollTop;

  if (Math.abs(delta) < MIN_SCROLL_DELTA) return "none";
  if (isAtTop(scrollTop) || atBottom) return "show";
  return "hide";
}

function isAvailableScrollContainer(element: Element): element is HTMLElement {
  if (!(element instanceof HTMLElement) || !isVerticallyScrollable(element)) return false;
  const styles = window.getComputedStyle(element);
  return styles.display !== "none" && styles.visibility !== "hidden";
}

function getActiveScrollableContainer() {
  if (typeof document === "undefined") return null;

  const appContent = document.querySelector(".app-content");
  if (appContent instanceof HTMLElement && isVerticallyScrollable(appContent)) {
    return appContent;
  }

  return Array.from(document.querySelectorAll(RELEVANT_SCROLL_SELECTOR)).find(isAvailableScrollContainer) || null;
}

export function getRelevantScrollContainer(target: EventTarget | null) {
  const startNode =
    target instanceof Element
      ? target
      : target instanceof Node
        ? target.parentElement
        : null;

  let current = startNode;
  while (current instanceof Element) {
    if (current.matches(RELEVANT_SCROLL_SELECTOR) && current instanceof HTMLElement && isVerticallyScrollable(current)) {
      return current;
    }
    current = current.parentElement;
  }

  return getActiveScrollableContainer();
}

function isChromeScrollIntentTarget(target: EventTarget | null) {
  const startNode =
    target instanceof Element
      ? target
      : target instanceof Node
        ? target.parentElement
        : null;

  if (!startNode) return false;
  if (startNode.closest(RELEVANT_SCROLL_SELECTOR)) return true;
  if (startNode.closest(".home-header-surface,.app-layout-header,.hdr")) return true;
  return Boolean(startNode.closest(".nav"));
}

export function useNavVisibility({
  showNavOverlay,
  showAuthModal,
  navLeaveTarget,
  historyViewKey,
  nav,
  selected,
  pathname,
  search,
}: UseNavVisibilityOptions) {
  const [navHiddenByScroll, setNavHiddenByScroll] = useState(false);
  const [chromeHiddenByScroll, setChromeHiddenByScroll] = useState(false);
  const [isMobileBottomBar, setIsMobileBottomBar] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 900,
  );
  const lastScrollTopRef = useRef<number>(0);
  const hiddenRef = useRef(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const showAll = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    setChromeHiddenByScroll(false);
    setNavHiddenByScroll(false);
    hiddenRef.current = false;
  }, []);

  const scheduleShowAll = useCallback((delay: number) => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = setTimeout(() => {
      showAll();
    }, delay);
  }, [showAll]);

  const hideAll = useCallback(() => {
    setChromeHiddenByScroll(true);
    setNavHiddenByScroll(true);
    hiddenRef.current = true;
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 899px)");
    const syncViewportMode = (event: MediaQueryList | MediaQueryListEvent) => setIsMobileBottomBar(event.matches);
    syncViewportMode(mq);
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", syncViewportMode);
      return () => mq.removeEventListener("change", syncViewportMode);
    }
    mq.addListener(syncViewportMode);
    return () => mq.removeListener(syncViewportMode);
  }, []);

  useEffect(() => {
    const shouldDisableChromeAutoHide = !isMobileBottomBar || showNavOverlay || Boolean(showAuthModal) || Boolean(navLeaveTarget);
    const shouldDisableNavAutoHide = !isMobileBottomBar || shouldDisableChromeAutoHide;

    if (shouldDisableChromeAutoHide) {
      setChromeHiddenByScroll(false);
    }
    if (shouldDisableNavAutoHide) {
      setNavHiddenByScroll(false);
    }
    if (shouldDisableChromeAutoHide) {
      return undefined;
    }

    const handleScroll = (e: Event) => {
      const container = getRelevantScrollContainer(e.target);
      if (!container) return;

      const scrollTop = container.scrollTop;
      const prevScrollTop = lastScrollTopRef.current;
      const action = getScrollChromeAction({
        scrollTop,
        prevScrollTop,
        atBottom: isAtBottom(container),
      });

      lastScrollTopRef.current = scrollTop;

      if (action === "none") return;

      if (action === "show") {
        showAll();
        return;
      }

      if (!hiddenRef.current) {
        hideAll();
      }

      scheduleShowAll(SCROLL_IDLE_REVEAL_DELAY);
    };

    const syncLastScrollTopAfterWheel = (container: HTMLElement | null) => {
      if (!container) return;
      const sync = () => {
        lastScrollTopRef.current = container.scrollTop;
      };
      if (typeof window.requestAnimationFrame === "function") {
        window.requestAnimationFrame(sync);
      } else {
        setTimeout(sync, 0);
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (!isChromeScrollIntentTarget(e.target)) return;
      if (Math.abs(e.deltaY) < MIN_SCROLL_DELTA) return;
      const container = getRelevantScrollContainer(e.target);
      syncLastScrollTopAfterWheel(container);

      if (container && ((isAtTop(container.scrollTop) && e.deltaY < 0) || (isAtBottom(container) && e.deltaY > 0))) {
        showAll();
        return;
      }

      hideAll();
      scheduleShowAll(SCROLL_IDLE_REVEAL_DELAY);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartYRef.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isChromeScrollIntentTarget(e.target)) return;
      if (e.touches.length !== 1 || touchStartYRef.current === null) return;

      const touchY = e.touches[0].clientY;
      const deltaY = touchStartYRef.current - touchY;
      touchStartYRef.current = touchY;
      if (Math.abs(deltaY) < MIN_SCROLL_DELTA) return;

      const container = getRelevantScrollContainer(e.target);
      if (!container) return;

      if ((isAtTop(container.scrollTop) && deltaY < 0) || (isAtBottom(container) && deltaY > 0)) {
        showAll();
        return;
      }

      hideAll();
      scheduleShowAll(SCROLL_IDLE_REVEAL_DELAY);
    };

    const handleTouchEnd = () => {
      touchStartYRef.current = null;
      if (hiddenRef.current) {
        scheduleShowAll(TOUCH_END_REVEAL_DELAY);
      }
    };

    // Capture scrolls on any scroll container in the document
    const scrollOpts: AddEventListenerOptions = { capture: true, passive: true };
    document.addEventListener("scroll", handleScroll, scrollOpts);
    document.addEventListener("wheel", handleWheel, scrollOpts);
    document.addEventListener("touchstart", handleTouchStart, scrollOpts);
    document.addEventListener("touchmove", handleTouchMove, scrollOpts);
    document.addEventListener("touchend", handleTouchEnd, scrollOpts);
    document.addEventListener("touchcancel", handleTouchEnd, scrollOpts);

    return () => {
      document.removeEventListener("scroll", handleScroll, scrollOpts);
      document.removeEventListener("wheel", handleWheel, scrollOpts);
      document.removeEventListener("touchstart", handleTouchStart, scrollOpts);
      document.removeEventListener("touchmove", handleTouchMove, scrollOpts);
      document.removeEventListener("touchend", handleTouchEnd, scrollOpts);
      document.removeEventListener("touchcancel", handleTouchEnd, scrollOpts);
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, [isMobileBottomBar, navLeaveTarget, showAuthModal, showNavOverlay, showAll, hideAll, scheduleShowAll]);

  useEffect(() => {
    setChromeHiddenByScroll(false);
    setNavHiddenByScroll(false);
    lastScrollTopRef.current = 0;
  }, [historyViewKey, nav, pathname, search, selected]);

  return {
    isMobileBottomBar,
    navHiddenByScroll,
    chromeHiddenByScroll,
  };
}
