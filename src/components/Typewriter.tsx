"use client";

import { useEffect, useState } from "react";

const TYPE_MS = 70;
const DELETE_MS = 40;
const HOLD_MS = 1800;

// Cycles through words with a type-and-delete rhythm and a blinking caret.
// Renders the first word in full on the server so there is no empty flash.
// A hidden copy of the longest word reserves the slot width, so surrounding
// text never reflows while letters are typed.
export default function Typewriter({ words }: { words: string[] }) {
  const [wordIndex, setWordIndex] = useState(0);
  const [length, setLength] = useState(words[0].length);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
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

  const longest = words.reduce((a, b) => (b.length > a.length ? b : a));

  return (
    <span className="relative inline-block whitespace-nowrap text-left">
      <span className="invisible" aria-hidden>
        {longest}
      </span>
      <span className="absolute inset-y-0 left-0">
        {words[wordIndex].slice(0, length)}
        <span className="caret" aria-hidden />
      </span>
    </span>
  );
}
