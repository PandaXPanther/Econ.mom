import { useEffect, useRef, useState } from "react";
import { Headphones, Pause, Play, Square } from "lucide-react";

/**
 * AudioCompanion
 *
 * Press-to-listen button. When an `audioSrc` is provided (a pre-rendered
 * Gemini TTS MP3 saved under /audio/<slug>.mp3) we play that through a real
 * <audio> element, which sounds dramatically better than browsers' built-in
 * Web Speech voices. If the MP3 fails to load (404, network, autoplay block)
 * we fall back to SpeechSynthesis so nobody is left stranded.
 *
 * Auditory learners, ESL readers, dyslexic readers, and anyone who just
 * wants to multitask while learning AP Econ benefit from this.
 */
export function AudioCompanion({
  text,
  audioSrc,
  label = "Listen",
  testId = "audio-companion",
}: {
  text: string;
  audioSrc?: string;
  label?: string;
  testId?: string;
}) {
  const [supported, setSupported] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Decide what's available. We always render the button if either MP3 src
  // exists or speechSynthesis is available.
  useEffect(() => {
    const hasSpeech =
      typeof window !== "undefined" && "speechSynthesis" in window;
    setSupported(Boolean(audioSrc) || hasSpeech);
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [audioSrc]);

  function startSpeechFallback() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const voice =
      voices.find((v) => /en[-_]US/i.test(v.lang) && /natural|neural|samantha|aria/i.test(v.name)) ||
      voices.find((v) => /en[-_]US/i.test(v.lang)) ||
      voices.find((v) => /^en/i.test(v.lang)) ||
      voices[0];
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
    setUseFallback(true);
  }

  function play() {
    if (audioSrc) {
      // Use a real MP3 (Gemini TTS).
      if (!audioRef.current) {
        const a = new Audio(audioSrc);
        a.preload = "auto";
        a.onended = () => {
          setPlaying(false);
          setPaused(false);
        };
        a.onerror = () => {
          // MP3 failed; fall back to speech synthesis.
          startSpeechFallback();
        };
        audioRef.current = a;
      }
      const a = audioRef.current;
      a.currentTime = a.currentTime || 0;
      const p = a.play();
      if (p && typeof p.catch === "function") {
        p.catch(() => startSpeechFallback());
      }
      setPlaying(true);
      setPaused(false);
      setUseFallback(false);
      return;
    }
    // No MP3 provided: use SpeechSynthesis directly.
    startSpeechFallback();
  }

  function togglePause() {
    if (!playing) return;
    if (useFallback) {
      if (paused) {
        window.speechSynthesis.resume();
        setPaused(false);
      } else {
        window.speechSynthesis.pause();
        setPaused(true);
      }
      return;
    }
    const a = audioRef.current;
    if (!a) return;
    if (paused) {
      a.play();
      setPaused(false);
    } else {
      a.pause();
      setPaused(true);
    }
  }

  function stop() {
    if (useFallback) {
      window.speechSynthesis.cancel();
    } else if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPlaying(false);
    setPaused(false);
  }

  if (!supported) return null;

  return (
    <div className="inline-flex items-center gap-2" data-testid={testId}>
      {!playing ? (
        <button
          type="button"
          onClick={play}
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
