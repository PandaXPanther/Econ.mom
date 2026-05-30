// Lightweight accessibility prefs, persisted to localStorage.
// Powers the AccessibilityMenu in the header. Adds classes on <html>
// so plain CSS (in index.css) handles the actual visual changes.
//
// Three toggles for now:
//   high-contrast      WCAG AAA-style mode, boosted borders + foreground
//   dyslexia-friendly  swap body font to OpenDyslexic (CDN-loaded)
//   larger-text        bump root font size by ~12%
//
// Reduced-motion is already honored by Tailwind / Framer via the OS preference,
// so we don't add a manual toggle for that (yet).

import { useEffect, useState } from "react";

export type A11yPref = "high-contrast" | "dyslexia-friendly" | "larger-text";

const ALL_PREFS: A11yPref[] = [
  "high-contrast",
  "dyslexia-friendly",
  "larger-text",
];

const STORAGE_KEY = "econmom_a11y";

function readPrefs(): Record<A11yPref, boolean> {
  const empty = {
    "high-contrast": false,
    "dyslexia-friendly": false,
    "larger-text": false,
  };
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw);
    return { ...empty, ...parsed };
  } catch {
    return empty;
  }
}

function writePrefs(prefs: Record<A11yPref, boolean>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Storage might be unavailable (private mode etc); silently no-op.
  }
}

function applyToDom(prefs: Record<A11yPref, boolean>) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  ALL_PREFS.forEach((pref) => {
    root.classList.toggle(`a11y-${pref}`, prefs[pref]);
  });
}

export function useA11yPrefs() {
  const [prefs, setPrefs] = useState<Record<A11yPref, boolean>>(() => readPrefs());

  // Apply on mount + any state change.
  useEffect(() => {
    applyToDom(prefs);
    writePrefs(prefs);
  }, [prefs]);

  function toggle(pref: A11yPref) {
    setPrefs((p) => ({ ...p, [pref]: !p[pref] }));
  }

  function reset() {
    setPrefs({
      "high-contrast": false,
      "dyslexia-friendly": false,
      "larger-text": false,
    });
  }

  const anyOn = ALL_PREFS.some((p) => prefs[p]);
  return { prefs, toggle, reset, anyOn };
}

// Lazy-load Atkinson Hyperlegible (Braille Institute, WCAG-friendly, helps
// low-vision + dyslexic readers per the Institute's research) the first time
// anyone turns the dyslexia pref on. Stays in the DOM afterwards.
let legibleFontLoaded = false;
export function ensureLegibleFontLoaded() {
  if (legibleFontLoaded || typeof document === "undefined") return;
  if (document.getElementById("atkinson-hyperlegible-css")) {
    legibleFontLoaded = true;
    return;
  }
  const link = document.createElement("link");
  link.id = "atkinson-hyperlegible-css";
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap";
  document.head.appendChild(link);
  legibleFontLoaded = true;
}
