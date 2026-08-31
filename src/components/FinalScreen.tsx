import { useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { POINTS_PER_QUESTION, QUESTIONS_PER_ROUND, ROUND_COUNT, TITLES, TOTAL_QUESTIONS } from "../data/questions";
import { sfx } from "../lib/sfx";
import type { StoredRecord } from "../App";
import { EruditionMeter } from "./HUD";
import { useScramble } from "./StartScreen";

function useCountUp(target: number, duration = 1300) {
  const reduced = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );
  const [value, setValue] = useState(reduced ? target : 0);
  useEffect(() => {
    if (reduced) { setValue(target); return; }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(eased * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, reduced]);
  return value;
}

export function FinalScreen({
  records,
  score,
  maxScore,
  bestStreak,
  onRestart,
}: {
  records: StoredRecord[];
  score: number;
  maxScore: number;
  bestStreak: number;
  onRestart: () => void;
}) {
  const correct = records.filter((r) => r.correct).length;
  const pct = Math.round((correct / TOTAL_QUESTIONS) * 100);
  const title = TITLES.find((t) => correct >= t.min) ?? TITLES[TITLES.length - 1];
  const timeouts = records.filter((r) => r.timedOut).length;

  const shown = useCountUp(score);
  const titleText = useScramble(title.title.toUpperCase(), 500);
  const fired = useRef(false);

  /* процентное кольцо */
  const R = 52;
  const C = 2 * Math.PI * R;
  const [ringOn, setRingOn] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setRingOn(true), 350);
    return () => clearTimeout(t);
  }, []);

  /* салют для сильных результатов */
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    sfx.fanfare();
    if (pct < 70 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const colors = ["#00e5ff", "#ff2ea6", "#ffc94d", "#9d6bff", "#ffffff"];
    const burst = (opts: confetti.Options) => confetti({ zIndex: 60, disableForReducedMotion: true, ...opts });
    burst({ particleCount: 90, spread: 75, origin: { x: 0.15, y: 0.4 }, colors });
    burst({ particleCount: 90, spread: 75, origin: { x: 0.85, y: 0.4 }, colors });
    const t = setTimeout(() => burst({ particleCount: 140, spread: 110, origin: { x: 0.5, y: 0.3 }, colors }), 450);
    return () => clearTimeout(t);
  }, [pct]);

  /* разбивка по раундам */
  const byRound = useMemo(() => {
    return Array.from({ length: ROUND_COUNT }, (_, r) => {
      const slice = records.slice(r * QUESTIONS_PER_ROUND, (r + 1) * QUESTIONS_PER_ROUND);
      return slice.filter((x) => x.correct).length;
    });
  }, [records]);

  return (
    <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-4xl flex-col justify-center px-5 py-10 sm:px-8">
      <p className="anim-fade font-hud text-xs font-semibold tracking-[0.35em] text-flux uppercase">
        // протокол завершён · 50/50 обработано
      </p>

      <div className="anim-fade-up mt-4 flex flex-wrap items-end gap-x-8 gap-y-4">
        <div>
          <p className="font-hud text-[11px] tracking-[0.3em] text-faint uppercase">твоё звание</p>
          <h1 className="font-display mt-1 text-4xl font-black text-gold text-glow-gold sm:text-6xl">
            {title.icon} {titleText}
          </h1>
          <p className="anim-fade-up delay-300 mt-3 max-w-lg text-sm text-dim sm:text-base">{title.blurb}</p>
        </div>

        {/* кольцо процента */}
        <div className="anim-fade-up delay-200 ml-auto flex items-center gap-4">
          <div className="relative h-32 w-32 sm:h-36 sm:w-36">
            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
              <circle cx="60" cy="60" r={R} fill="none" strokeWidth="9" className="timer-track" />
              <circle
                cx="60" cy="60" r={R} fill="none" strokeWidth="9" strokeLinecap="round"
                stroke={pct >= 70 ? "#ffc94d" : pct >= 50 ? "#9d6bff" : "#ff9f43"}
                strokeDasharray={C}
                strokeDashoffset={ringOn ? C * (1 - pct / 100) : C}
                style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)", filter: "drop-shadow(0 0 8px rgba(255,201,77,0.5))" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-hud text-3xl font-bold text-ink tabular-nums sm:text-4xl">{pct}%</span>
              <span className="font-hud text-[9px] tracking-[0.25em] text-faint uppercase">точность</span>
            </div>
          </div>
        </div>
      </div>

      {/* большая цифра очков + шкала */}
      <div className="anim-fade-up delay-200 mt-8 border border-white/10 bg-panel/70 p-5 backdrop-blur-sm sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-hud text-[10px] tracking-[0.3em] text-faint uppercase">итоговый счёт</p>
            <p className="font-display text-5xl font-black text-neon text-glow-cyan tabular-nums sm:text-6xl">
              {shown}
              <span className="ml-2 text-lg font-bold text-faint sm:text-xl">/ {maxScore}</span>
            </p>
          </div>
          <div className="flex gap-6 font-hud">
            <div className="text-center">
              <p className="text-2xl font-bold text-lime tabular-nums">{correct}<span className="text-sm text-faint">/{TOTAL_QUESTIONS}</span></p>
              <p className="text-[10px] tracking-[0.2em] text-faint uppercase">верных</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-ember tabular-nums">🔥 {bestStreak}</p>
              <p className="text-[10px] tracking-[0.2em] text-faint uppercase">серия</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-alert tabular-nums">{timeouts}</p>
              <p className="text-[10px] tracking-[0.2em] text-faint uppercase">тайм-аутов</p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <EruditionMeter score={score} max={maxScore} large />
        </div>
      </div>

      {/* разбивка по раундам */}
      <div className="anim-fade-up delay-300 mt-6 grid gap-2.5 sm:grid-cols-5">
        {byRound.map((n, r) => (
          <div key={r} className="group border border-white/10 bg-panel/60 p-3 transition-colors hover:border-neon/40">
            <div className="flex items-center justify-between">
              <span className="font-hud text-[10px] tracking-[0.2em] text-faint uppercase">Р{r + 1}</span>
              <span className={`font-hud text-xs font-bold tabular-nums ${n >= 8 ? "text-lime" : n >= 5 ? "text-gold" : "text-alert"}`}>
                {n * POINTS_PER_QUESTION}
              </span>
            </div>
            <div className="mt-2 flex gap-[3px]">
              {Array.from({ length: QUESTIONS_PER_ROUND }, (_, i) => (
                <span
                  key={i}
                  className={`h-1.5 flex-1 rounded-full ${i < n ? "bg-neon shadow-[0_0_5px_rgba(0,229,255,0.8)]" : "bg-white/10"}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="anim-fade-up delay-400 mt-9 flex flex-wrap items-center gap-4">
        <button
          onClick={() => { sfx.click(); onRestart(); }}
          className="sheen btn-press group inline-flex items-center gap-3 border-2 border-neon bg-neon/10 px-8 py-4 font-display text-sm font-bold tracking-[0.22em] text-neon uppercase shadow-[0_0_28px_rgba(0,229,255,0.35)] hover:bg-neon/20 hover:shadow-[0_0_44px_rgba(0,229,255,0.55)] sm:text-base"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 transition-transform duration-500 group-hover:rotate-180" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" />
          </svg>
          Играть снова
        </button>
        <p className="font-hud text-[11px] tracking-[0.2em] text-faint uppercase">
          порядок вопросов перемешается заново
        </p>
      </div>
    </div>
  );
}
