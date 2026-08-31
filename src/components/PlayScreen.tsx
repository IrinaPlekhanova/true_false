import { useCallback, useEffect, useRef, useState } from "react";
import { POINTS_PER_QUESTION, QUESTIONS_PER_ROUND, Question, ROUNDS, TOTAL_QUESTIONS } from "../data/questions";
import { sfx } from "../lib/sfx";
import { MuteButton, RoundDots, RoundPips, TimerRing, EruditionMeter, type PipState } from "./HUD";

export interface AnswerRecord {
  correct: boolean;
  timedOut: boolean;
}

interface Props {
  q: Question;
  globalIndex: number; // 0-based
  score: number;
  streak: number;
  roundPips: PipState[];
  maxScore: number;
  muted: boolean;
  onToggleMute: () => void;
  onResult: (rec: AnswerRecord) => void;
  onAdvance: () => void;
}

const LETTERS = ["А", "Б", "В", "Г"];

export function PlayScreen({
  q, globalIndex, score, streak, roundPips, maxScore, muted, onToggleMute, onResult, onAdvance,
}: Props) {
  const TOTAL_TENTHS = 100;
  const [tenths, setTenths] = useState(TOTAL_TENTHS);
  const [answered, setAnswered] = useState<{ pick: number | boolean | null; correct: boolean; timedOut: boolean } | null>(null);
  const answeredRef = useRef(false);
  const prevSecondRef = useRef(11);

  const roundIdx = q.round - 1;
  const posInRound = globalIndex % QUESTIONS_PER_ROUND;

  /* ── таймер (замирает после ответа) ── */
  useEffect(() => {
    const iv = setInterval(
      () => setTenths((t) => (t > 0 && !answeredRef.current ? t - 1 : t)),
      100
    );
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const sec = Math.ceil(tenths / 10);
    if (!answeredRef.current && sec !== prevSecondRef.current && sec <= 3 && sec > 0) sfx.tick();
    prevSecondRef.current = sec;
  }, [tenths]);

  useEffect(() => {
    if (tenths === 0 && !answeredRef.current) resolve(null, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenths]);

  /* ── ответ ── */
  const resolve = useCallback(
    (pick: number | boolean | null, timedOut: boolean) => {
      if (answeredRef.current) return;
      answeredRef.current = true;
      const correct = !timedOut && pick === q.answer;
      setAnswered({ pick, correct, timedOut });
      if (correct) sfx.correct();
      else if (timedOut) sfx.timeout();
      else sfx.wrong();
      onResult({ correct, timedOut });
    },
    [q, onResult]
  );

  /* ── клавиатура ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (answered) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onAdvance(); }
        return;
      }
      if (q.type === "tf") {
        if (e.key === "ArrowLeft") resolve(true, false);
        if (e.key === "ArrowRight") resolve(false, false);
      } else {
        const idx = e.code.startsWith("Numpad") ? Number(e.code.slice(6)) - 1 : ["1", "2", "3", "4"].indexOf(e.key);
        if (idx >= 0 && idx <= 3) resolve(idx, false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [q, answered, resolve, onAdvance]);

  /* ── стили вариантов ── */
  const optionClass = (isCorrectOption: boolean, isPicked: boolean) => {
    if (!answered)
      return "border-white/15 bg-white/[0.04] hover:border-neon/70 hover:bg-neon/[0.08] hover:shadow-[0_0_22px_rgba(0,229,255,0.25)] text-ink";
    if (isCorrectOption)
      return "border-lime bg-lime/10 text-lime shadow-[0_0_24px_rgba(157,255,87,0.35)]";
    if (isPicked)
      return "border-alert bg-alert/10 text-alert anim-shake";
    return "border-white/10 bg-white/[0.02] text-faint opacity-60";
  };

  const verdict = answered?.correct ? "ВЕРНО" : answered?.timedOut ? "ВРЕМЯ ВЫШЛО" : "МИМО";
  const verdictColor = answered?.correct ? "text-lime" : "text-alert";

  return (
    <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-4xl flex-col px-4 py-5 sm:px-8 sm:py-7">
      {/* ── HUD ── */}
      <header className="anim-fade space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <RoundDots currentRound={q.round} />
            <div>
              <p className="font-display text-xs font-bold tracking-[0.22em] text-ink uppercase sm:text-sm">
                Раунд {q.round}/5 · <span className="text-flux">{ROUNDS[roundIdx].name}</span>
              </p>
              <p className="font-hud text-[10px] tracking-[0.2em] text-faint uppercase">
                Вопрос {globalIndex + 1} из {TOTAL_QUESTIONS}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {streak >= 2 && (
              <span
                key={streak}
                className="anim-fade-up font-hud text-sm font-bold text-ember"
                title="Серия правильных ответов"
              >
                🔥 ×{streak}
              </span>
            )}
            <div className="relative text-right">
              <p className="font-hud text-[10px] tracking-[0.2em] text-faint uppercase">Очки</p>
              <p key={score} className="font-hud text-xl font-bold text-neon tabular-nums text-glow-cyan sm:text-2xl">
                {score}
              </p>
              {answered?.correct && (
                <span className="font-hud absolute -top-3 right-0 text-xs font-bold text-lime" style={{ animation: "kf-float-score 1s ease-out both" }}>
                  +{POINTS_PER_QUESTION}
                </span>
              )}
            </div>
            <MuteButton muted={muted} onToggle={onToggleMute} />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <RoundPips results={roundPips} current={posInRound} />
          <TimerRing tenths={tenths} />
        </div>

        <EruditionMeter score={score} max={maxScore} />
      </header>

      {/* ── вопрос ── */}
      <main className="mt-6 flex-1 sm:mt-8">
        <article key={q.id} className="anim-fade-up corner-frame relative overflow-hidden border border-white/10 bg-panel/80 p-6 backdrop-blur-sm sm:p-9">
          {/* водяной номер */}
          <span
            aria-hidden
            className="font-display pointer-events-none absolute -top-6 -right-2 text-[7rem] font-black text-white/[0.035] select-none sm:text-[10rem]"
          >
            {String(globalIndex + 1).padStart(2, "0")}
          </span>

          <div className="mb-4 flex flex-wrap items-center gap-3">
            {q.type === "tf" ? (
              <span className="border border-neon/60 bg-neon/10 px-3 py-1 font-hud text-[11px] font-bold tracking-[0.25em] text-neon uppercase">
                Правда / Миф
              </span>
            ) : (
              <span className="border border-viol/60 bg-viol/10 px-3 py-1 font-hud text-[11px] font-bold tracking-[0.25em] text-viol uppercase">
                Выбор ответа
              </span>
            )}
            {answered && (
              <span className={`font-display text-xs font-bold tracking-[0.25em] uppercase ${verdictColor}`}>
                {verdict}
              </span>
            )}
          </div>

          <h2 className="max-w-2xl text-xl leading-snug font-bold text-ink sm:text-3xl sm:leading-snug">
            {q.prompt}
          </h2>

          {/* ответы */}
          {q.type === "tf" ? (
            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <button
                onClick={() => resolve(true, false)}
                disabled={!!answered}
                className={`sheen btn-press group border-2 px-6 py-6 text-left transition-colors ${optionClass(q.answer === true, answered?.pick === true)}`}
              >
                <span className="font-hud text-[10px] tracking-[0.3em] opacity-60 uppercase">клавиша ←</span>
                <span className="font-display mt-1 block text-2xl font-black tracking-wide uppercase sm:text-3xl">
                  Правда
                </span>
                <span className="mt-1 block text-xs opacity-60">факт подтверждён наукой</span>
              </button>
              <button
                onClick={() => resolve(false, false)}
                disabled={!!answered}
                className={`sheen btn-press group border-2 px-6 py-6 text-left transition-colors ${optionClass(q.answer === false, answered?.pick === false)}`}
              >
                <span className="font-hud text-[10px] tracking-[0.3em] opacity-60 uppercase">клавиша →</span>
                <span className="font-display mt-1 block text-2xl font-black tracking-wide uppercase sm:text-3xl">
                  Миф
                </span>
                <span className="mt-1 block text-xs opacity-60">красивая, но выдумка</span>
              </button>
            </div>
          ) : (
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {q.options!.map((opt, i) => {
                const isCorrectOption = q.answer === i;
                const isPicked = answered?.pick === i;
                return (
                  <button
                    key={i}
                    onClick={() => resolve(i, false)}
                    disabled={!!answered}
                    className={`btn-press flex items-center gap-4 border-2 px-5 py-4 text-left ${optionClass(isCorrectOption, isPicked)}`}
                  >
                    <span className="font-display flex h-9 w-9 shrink-0 items-center justify-center border border-current text-sm font-bold opacity-80">
                      {LETTERS[i]}
                    </span>
                    <span className="text-sm font-semibold sm:text-base">{opt}</span>
                    {answered && isCorrectOption && <span className="ml-auto font-hud text-lg">✓</span>}
                    {answered && isPicked && !isCorrectOption && <span className="ml-auto font-hud text-lg">✗</span>}
                  </button>
                );
              })}
            </div>
          )}
          <p className="mt-4 font-hud text-[10px] tracking-[0.2em] text-faint uppercase sm:hidden">
            клавиши: {q.type === "tf" ? "← правда · → миф" : "1–4 — выбор"}
          </p>
        </article>

        {/* ── разбор ответа ── */}
        {answered && (
          <div className="anim-slide-in mt-5 flex flex-col gap-4 sm:flex-row sm:items-stretch">
            <div
              className={`flex-1 border-l-4 bg-panel/80 p-5 backdrop-blur-sm sm:p-6 ${
                answered.correct ? "border-lime" : "border-alert"
              }`}
            >
              <p className={`font-hud text-[11px] font-bold tracking-[0.3em] uppercase ${answered.correct ? "text-lime" : "text-alert"}`}>
                {answered.correct ? "🎉 Факт-контроль пройден" : answered.timedOut ? "⏰ Таймер оказался быстрее" : "😅 Мимо цели"}
              </p>
              {!answered.correct && (
                <p className="mt-2 text-sm font-semibold text-ink">
                  Верный ответ:{" "}
                  <span className={answered.timedOut ? "text-ember" : "text-lime"}>
                    {q.type === "tf" ? (q.answer ? "Правда" : "Миф") : q.options![q.answer as number]}
                  </span>
                </p>
              )}
              <p className="mt-2 text-sm leading-relaxed text-dim sm:text-base">
                <span className="font-hud text-[10px] tracking-[0.25em] text-faint uppercase">Факт // </span>
                {q.fact}
              </p>
            </div>
            <div className="flex items-center">
              <button
                onClick={onAdvance}
                className="sheen btn-press group inline-flex w-full items-center justify-center gap-3 border-2 border-gold bg-gold/10 px-8 py-5 font-display text-sm font-bold tracking-[0.2em] text-gold uppercase shadow-[0_0_24px_rgba(255,201,77,0.3)] hover:bg-gold/20 sm:w-auto"
              >
                {globalIndex + 1 === TOTAL_QUESTIONS ? "Финал" : posInRound + 1 === QUESTIONS_PER_ROUND ? "Итоги раунда" : "Дальше"}
                <svg viewBox="0 0 24 24" className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ── эмодзи-реакция ── */}
      {answered && (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center">
          <span key={q.id + "-burst"} className="anim-emoji text-[26vw] sm:text-[10rem]" role="img" aria-label={answered.correct ? "Праздник" : "Не вышло"}>
            {answered.correct ? "🎉" : "😅"}
          </span>
        </div>
      )}
    </div>
  );
}
