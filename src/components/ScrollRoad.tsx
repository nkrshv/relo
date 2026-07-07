"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A decorative road that weaves down the landing page, with a small car
 * that drives along it as the visitor scrolls. Desktop only, skipped for
 * prefers-reduced-motion. Sits behind the content (-z-10).
 */
export default function ScrollRoad() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const roadRef = useRef<SVGPathElement>(null);
  const doneRef = useRef<SVGPathElement>(null);
  const carRef = useRef<SVGGElement>(null);
  const [geom, setGeom] = useState<{
    w: number;
    h: number;
    d: string;
    startY: number;
  } | null>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const wide = window.matchMedia("(min-width: 1024px)");
    if (reduced.matches) return;

    const measure = () => {
      if (!wide.matches) {
        setGeom(null);
        return;
      }
      const el = wrapRef.current?.parentElement;
      if (!el) return;
      const w = el.clientWidth;
      const h = el.scrollHeight;
      // start right under the hero CTA so the road "pulls away" from it
      const cta = el.querySelector<HTMLElement>("a[href='/plan']");
      const startY = cta
        ? cta.getBoundingClientRect().bottom -
          el.getBoundingClientRect().top +
          48
        : Math.min(620, h * 0.2);
      const endY = h + 60;
      const span = endY - startY;
      const bends = Math.max(3, Math.round(span / 900));
      const step = span / bends;
      const xs = (i: number) =>
        i === 0 ? w * 0.5 : i % 2 === 1 ? w * 0.82 : w * 0.18;
      let d = `M ${xs(0)} ${startY}`;
      for (let i = 1; i <= bends; i++) {
        const y0 = startY + (i - 1) * step;
        const y1 = startY + i * step;
        const x = i === bends ? w * 0.5 : xs(i);
        d += ` C ${xs(i - 1)} ${y0 + step * 0.55}, ${x} ${y1 - step * 0.55}, ${x} ${y1}`;
      }
      setGeom({ w, h: endY, d, startY });
    };

    measure();
    const t = setTimeout(measure, 400);
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    if (!geom) return;
    const road = roadRef.current;
    const done = doneRef.current;
    const car = carRef.current;
    if (!road || !done || !car) return;
    const len = road.getTotalLength();
    done.style.strokeDasharray = `${len}`;

    let raf = 0;
    const update = () => {
      raf = 0;
      const el = wrapRef.current?.parentElement;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = rect.height - vh;
      const p = Math.min(1, Math.max(0, -rect.top / Math.max(1, total)));
      const at = len * p;
      const pt = road.getPointAtLength(at);
      const ahead = road.getPointAtLength(Math.min(len, at + 2));
      const angle =
        (Math.atan2(ahead.y - pt.y, ahead.x - pt.x) * 180) / Math.PI + 90;
      car.setAttribute(
        "transform",
        `translate(${pt.x} ${pt.y}) rotate(${angle})`,
      );
      done.style.strokeDashoffset = `${len - at}`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [geom]);

  return (
    <div
      ref={wrapRef}
      className="pointer-events-none absolute inset-0 -z-10 hidden overflow-hidden lg:block"
      aria-hidden
    >
      {geom && (
        <svg
          width={geom.w}
          height={geom.h}
          viewBox={`0 0 ${geom.w} ${geom.h}`}
          className="absolute top-0 left-0"
        >
          <defs>
            <linearGradient
              id="road-fade"
              gradientUnits="userSpaceOnUse"
              x1="0"
              x2="0"
              y1={geom.startY}
              y2={geom.startY + 320}
            >
              <stop offset="0" stopColor="white" stopOpacity="0" />
              <stop offset="1" stopColor="white" stopOpacity="1" />
            </linearGradient>
            <mask id="road-fade-mask">
              <rect
                x="0"
                y="0"
                width={geom.w}
                height={geom.h}
                fill="url(#road-fade)"
              />
            </mask>
          </defs>
          <g mask="url(#road-fade-mask)">
          {/* road bed */}
          <path
            ref={roadRef}
            d={geom.d}
            fill="none"
            stroke="var(--color-stone-200)"
            strokeOpacity="0.7"
            strokeWidth="14"
            strokeLinecap="round"
          />
          {/* traveled part, tinted slightly darker */}
          <path
            ref={doneRef}
            d={geom.d}
            fill="none"
            stroke="var(--color-stone-300)"
            strokeOpacity="0.55"
            strokeWidth="14"
            strokeLinecap="round"
          />
          {/* dashed centerline */}
          <path
            d={geom.d}
            fill="none"
            stroke="white"
            strokeWidth="1.5"
            strokeDasharray="7 9"
          />
          {/* car, top-down view */}
          <g ref={carRef}>
            <g transform="translate(-7 -11)">
              <rect
                width="14"
                height="22"
                rx="4.5"
                fill="var(--color-stone-800)"
              />
              <rect
                x="2"
                y="4"
                width="10"
                height="5"
                rx="1.5"
                fill="var(--color-amber-200)"
              />
              <rect
                x="2"
                y="14"
                width="10"
                height="4"
                rx="1.5"
                fill="var(--color-stone-600)"
              />
            </g>
          </g>
          </g>
        </svg>
      )}
    </div>
  );
}
