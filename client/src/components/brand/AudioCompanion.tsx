import { useEffect, useRef, useState } from "react";
import { Headphones, Pause, Play, Square } from "lucide-react";

/**
 * AudioCompanion
 *
 * Press-to-listen button that reads a block of text aloud using the browser's
 * built-in SpeechSynthesis API. No backend, no cost, no signup. Works in every
 * modern browser. Auditory learners, ESL readers, dyslexic readers, and folks
 * who just want to multitask all benefit.
 *
 * Hidden gracefully when the browser doesn't support TTS (looking at you,
 * older Linux Firefox without speech-dispatcher).
 */
export function AudioCompanion({
  text,
  label = "Listen",
  testId = "audio-companion",
}: {
  text: string;
  label?: string;
  testId?: string;
}) {
  const [supported, setSupported] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // We show the button whenever the API exists. Voices populate async on
    // most browsers, so gating on voices.length leads to false negatives.
    // If the user clicks and the engine truly has nothing, we just no-op.
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setSupported(true);
      return () => {
        window.speechSynthesis.cancel();
      };
    }
  }, []);

  function pickVoice(): SpeechSynthesisVoice | undefined {
    const voices = window.speechSynthesis.getVoices();
    // Prefer a natural-sounding English voice; fall back to anything English.
    return (
      voices.find((v) => /en[-_]US/i.test(v.lang) && /natural|neural|samantha|aria/i.test(v.name)) ||
      voices.find((v) => /en[-_]US/i.test(v.lang)) ||
      voices.find((v) => /^en/i.test(v.lang)) ||
      voices[0]
    );
  }

  function speak() {
    if (!supported) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voice = pickVoice();
    if (voice) u.voice = voice;
    u.rate = 1;
    u.pitch = 1;
    u.onend = () => {
      setPlaying(false);
      setPaused(false);
    };
    u.onerror = () => {
      setPlaying(false);
      setPaused(false);
    };
    utteranceRef.current = u;
    window.speechSynthesis.speak(u);
    setPlaying(true);
    setPaused(false);
  }

  function togglePause() {
    if (!playing) return;
    if (paused) {
      window.speechSynthesis.resume();
      setPaused(false);
    } else {
      window.speechSynthesis.pause();
      setPaused(true);
    }
  }

  function stop() {
    window.speechSynthesis.cancel();
    setPlaying(false);
    setPaused(false);
  }

  if (!supported) return null;

  return (
    <div className="inline-flex items-center gap-2" data-testid={testId}>
      {!playing ? (
        <button
          type="button"
          onClick={speak}
          aria-label={label}
          data-testid={`${testId}-play`}
          className="group inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3.5 py-1.5 text-[0.78rem] font-medium text-foreground/80 transition-all hover:border-primary/40 hover:bg-card hover:text-foreground"
        >
          <Headphones size={13} className="text-primary" />
          {label}
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={togglePause}
            aria-label={paused ? "Resume" : "Pause"}
            data-testid={`${testId}-pause`}
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-[0.78rem] font-medium text-foreground"
          >
            {paused ? <Play size={13} /> : <Pause size={13} />}
            <span>{paused ? "Resume" : "Reading…"}</span>
          </button>
          <button
            type="button"
            onClick={stop}
            aria-label="Stop"
            data-testid={`${testId}-stop`}
            className="inline-flex items-center justify-center rounded-full border border-border bg-card/60 p-1.5 text-muted-foreground hover:text-foreground"
          >
            <Square size={11} />
          </button>
        </>
      )}
    </div>
  );
}
