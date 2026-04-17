import { useEffect, useState } from "react";

interface TypewriterProps {
  text: string;
  speed?: number; // ms per character
  startDelay?: number;
  className?: string;
  caretClassName?: string;
}

/**
 * Minimal typewriter: types `text` once on mount with a blinking caret.
 */
export function Typewriter({
  text,
  speed = 70,
  startDelay = 200,
  className,
  caretClassName,
}: TypewriterProps) {
  const [shown, setShown] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    let interval: number | undefined;
    const startTimer = window.setTimeout(() => {
      interval = window.setInterval(() => {
        i += 1;
        setShown(text.slice(0, i));
        if (i >= text.length) {
          window.clearInterval(interval);
          setDone(true);
        }
      }, speed);
    }, startDelay);

    return () => {
      window.clearTimeout(startTimer);
      if (interval) window.clearInterval(interval);
    };
  }, [text, speed, startDelay]);

  return (
    <span className={className} aria-label={text}>
      {shown}
      <span
        aria-hidden="true"
        className={
          caretClassName ??
          "inline-block w-[2px] h-[0.9em] -mb-[0.05em] ml-0.5 bg-current align-middle animate-[blink_1s_steps(2,start)_infinite]"
        }
        style={{ opacity: done ? undefined : 1 }}
      />
    </span>
  );
}
