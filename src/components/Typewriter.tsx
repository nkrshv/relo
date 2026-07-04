"use client";

import { useEffect, useState } from "react";

const TYPE_MS = 70;
const DELETE_MS = 40;
const HOLD_MS = 1600;

// Cycles through words with a type-and-delete rhythm and a blinking caret.
export default function Typewriter({ words }: { words: string[] }) {
  const [wordIndex, setWordIndex] = useState(0);
  const [length, setLength] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = words[wordIndex];
    let delay = deleting ? DELETE_MS : TYPE_MS;
    if (!deleting && length === word.length) delay = HOLD_MS;

    const t = setTimeout(() => {
      if (!deleting && length === word.length) {
        setDeleting(true);
      } else if (deleting && length === 0) {
        setDeleting(false);
        setWordIndex((wordIndex + 1) % words.length);
      } else {
        setLength(length + (deleting ? -1 : 1));
      }
    }, delay);
    return () => clearTimeout(t);
  }, [words, wordIndex, length, deleting]);

  return (
    <span className="whitespace-nowrap">
      {words[wordIndex].slice(0, length)}
      <span className="caret" aria-hidden />
    </span>
  );
}
