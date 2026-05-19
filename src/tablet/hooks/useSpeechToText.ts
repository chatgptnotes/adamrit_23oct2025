import { useCallback, useEffect, useRef, useState } from "react";

function getSpeechRecognition(): any {
  if (typeof window === "undefined") return null;
  return (
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition ||
    null
  );
}

export interface SpeechToTextOptions {
  /** BCP-47 language tag, e.g. "en-IN" or "hi-IN". */
  lang: string;
  /** Finalised transcript chunk — commit this to the field. */
  onFinal: (text: string) => void;
  /** Live (not-yet-final) transcript — show it, don't commit it. */
  onInterim: (text: string) => void;
}

export interface UseSpeechToText {
  supported: boolean;
  listening: boolean;
  start: () => void;
  stop: () => void;
}

/**
 * Voice-to-text via the browser's built-in Web Speech API — no dependency, no cost.
 * Surfaces both live interim text and finalised chunks, and honours the chosen
 * recognition language.
 */
export function useSpeechToText(opts: SpeechToTextOptions): UseSpeechToText {
  const SR = getSpeechRecognition();
  const supported = !!SR;
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Always read the latest options without re-creating the recogniser.
  const optsRef = useRef(opts);
  optsRef.current = opts;

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {
        /* ignore */
      }
    };
  }, []);

  const start = useCallback(() => {
    if (!SR || recognitionRef.current) return;
    const rec = new SR();
    rec.lang = optsRef.current.lang;
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (e: any) => {
      let finalText = "";
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finalText += res[0].transcript;
        else interimText += res[0].transcript;
      }
      if (interimText.trim()) optsRef.current.onInterim(interimText.trim());
      if (finalText.trim()) {
        optsRef.current.onFinal(finalText.trim());
        optsRef.current.onInterim("");
      }
    };
    rec.onend = () => {
      recognitionRef.current = null;
      setListening(false);
      optsRef.current.onInterim("");
    };
    rec.onerror = () => {
      recognitionRef.current = null;
      setListening(false);
      optsRef.current.onInterim("");
    };

    recognitionRef.current = rec;
    setListening(true);
    try {
      rec.start();
    } catch {
      recognitionRef.current = null;
      setListening(false);
    }
  }, [SR]);

  const stop = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* ignore */
    }
    recognitionRef.current = null;
    setListening(false);
    optsRef.current.onInterim("");
  }, []);

  return { supported, listening, start, stop };
}
