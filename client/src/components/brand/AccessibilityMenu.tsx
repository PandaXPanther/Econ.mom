import { useEffect, useRef, useState } from "react";
import { Accessibility, Check, X } from "lucide-react";
import { useA11yPrefs, ensureLegibleFontLoaded, type A11yPref } from "@/lib/a11y";

/**
 * AccessibilityMenu
 *
 * Header-mounted popover with three toggles that genuinely help readers who
 * learn in different ways:
 *   - High contrast            low-vision, glare-sensitive readers
 *   - Dyslexia-friendly font   swaps Inter + Playfair for Atkinson Hyperlegible
 *   - Larger text              +12.5% root font size
 *
 * Prefs persist to localStorage and apply instantly. Pairs with the audio
 * companion (auditory learners) and the causal-chain strip (visual learners)
 * to make the site useful no matter how a student processes information.
 */
export function AccessibilityMenu() {
  const { prefs, toggle, reset, anyOn } = useA11yPrefs();
  const [open, setOpen] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);

  // Lazy-load the dyslexia font the moment that toggle flips on.
  useEffect(() => {
    if (prefs["dyslexia-friendly"]) ensureLegibleFontLoaded();
  }, [prefs]);

  // Close popover on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (popRef.current && !popRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={popRef}>
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        aria-label="Accessibility options"
        aria-expanded={open}
        data-testid="button-a11y-menu"
        className={`relative rounded-md border border-border px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ${
          anyOn ? "text-foreground" : ""
        }`}
      >
        <Accessibility size={14} />
        {anyOn && (
          <span
            aria-hidden
            className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-primary"
          />
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Accessibility options"
          className="absolute right-0 z-50 mt-2 w-72 rounded-lg border border-border bg-card p-4 shadow-xl"
          data-testid="popover-a11y"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="label-cap">Reading options</div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
          </div>
          <p className="prose-serif mb-4 text-[0.85rem] text-muted-foreground">
            Tweak how the site reads. Settings save on this device.
          </p>
          <ul className="flex flex-col gap-1.5">
            <PrefRow
              id="high-contrast"
              label="High contrast"
              hint="Boosts text + border contrast"
              on={prefs["high-contrast"]}
              onClick={() => toggle("high-contrast")}
            />
            <PrefRow
              id="dyslexia-friendly"
              label="Dyslexia-friendly font"
              hint="Atkinson Hyperlegible by Braille Institute"
              on={prefs["dyslexia-friendly"]}
              onClick={() => toggle("dyslexia-friendly")}
            />
            <PrefRow
              id="larger-text"
              label="Larger text"
              hint="Bumps body size by 12.5%"
              on={prefs["larger-text"]}
              onClick={() => toggle("larger-text")}
            />
          </ul>
          {anyOn && (
            <button
              type="button"
              onClick={reset}
              data-testid="button-a11y-reset"
              className="mt-4 w-full rounded-md border border-border px-3 py-1.5 text-[0.8rem] text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Reset to defaults
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function PrefRow({
  id,
  label,
  hint,
  on,
  onClick,
}: {
  id: A11yPref;
  label: string;
  hint: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        aria-pressed={on}
        data-testid={`toggle-a11y-${id}`}
        className={`flex w-full items-start justify-between gap-3 rounded-md border px-3 py-2 text-left transition-colors ${
          on
            ? "border-primary/40 bg-primary/5"
            : "border-border hover:bg-muted/60"
        }`}
      >
        <span className="flex flex-col">
          <span className="text-[0.9rem] font-medium text-foreground">{label}</span>
          <span className="text-[0.72rem] text-muted-foreground">{hint}</span>
        </span>
        <span
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
            on ? "border-primary bg-primary text-primary-foreground" : "border-border"
          }`}
        >
          {on && <Check size={12} />}
        </span>
      </button>
    </li>
  );
}
