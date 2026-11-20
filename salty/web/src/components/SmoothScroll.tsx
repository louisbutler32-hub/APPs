"use client";

import Lenis from "lenis";
import { useEffect } from "react";

let lenis: Lenis | null = null;

/**
 * Scroll an element to the top of the screen. Uses the page's smooth scrolling when it is running,
 * and the browser's own otherwise (no motion for people who have asked for less of it).
 */
export function scrollToElement(element: HTMLElement | null, gap = 24) {
  if (!element) return;
  if (lenis) {
    lenis.scrollTo(element, { offset: -gap, duration: 0.9 });
    return;
  }
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  element.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
}

/**
 * Hold the page still behind a dialog, and let it go again. The smooth scrolling has to be told
 * as well, or the page would keep moving under the dialog.
 */
export function lockScroll(locked: boolean) {
  document.documentElement.style.overflow = locked ? "hidden" : "";
  if (locked) lenis?.stop();
  else lenis?.start();
}

/**
 * Smooth wheel scrolling (Lenis). It leaves touch scrolling to the phone, lets menus and dialogs
 * scroll on their own, and stays off entirely for people who have asked their device for less motion.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const instance = new Lenis({ autoRaf: true, anchors: true, allowNestedScroll: true, lerp: 0.14 });
    lenis = instance;
    return () => {
      instance.destroy();
      lenis = null;
    };
  }, []);
  return null;
}
