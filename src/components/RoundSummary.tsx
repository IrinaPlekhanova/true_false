import { POINTS_PER_QUESTION, QUESTIONS_PER_ROUND, ROUNDS } from "../data/questions";
import { sfx } from "../lib/sfx";
import type { StoredRecord } from "../App";
import { EruditionMeter } from "./HUD";

function phraseFor(correct: number): string {
  if (correct === QUESTIONS_PER_ROUND) return "Идеальный раунд! Нейроны аплодируют стоя.";
  if (correct >= 8) return "Мощно. Мифы разбегаются по тёмным уголкам интернета.";
  if (correct >= 6) return "Крепкий результат. Педагогический радар настроен почти точно.";
  if (correct >= 4) return "Неплохо, но скептик внутри тебя ещё спорит с наукой.";
  return "Раунд принял удар на себя. Дальше — только вверх!";
}

export function RoundSummary({
  roundNum,
  records,
  score,
  maxScore,
  bestStreak,
  onNext,
}: {
  roundNum: number; // завершённый раунд, 1..5
  records: StoredRecord[]; // записи этого раунда
  score: number;
  maxScore: number;
  bestStreak: number;
  onNext: () => void;
}) {
  const correct = records.filter((r) => r.correct).length;
  const timeouts = records.filter((r) => r.timedOut).length;
  const roundPoints = correct * POINTS_PER_QUESTION;
  const round = ROUNDS[roundNum - 1];
  const next = ROUNDS[roundNum];

  return (
    <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-3xl flex-col items-center justify-center px-5 py-10">
      {/* штамп */}
      <div className="anim-stamp corner-frame border-2 border-flux/70 bg-panel/80 px-8 py-4 text-center backdrop-blur-sm">
        <p className="font-hud text-[11px] tracking-[0.35em] text-flux uppercase">Раунд {roundNum} завершён</p>
        <p className="font-display mt-1 text-2xl font-black text-ink uppercase sm:text-4xl">{round.name}</p>
      </div>

      <p className="anim-fade-up delay-200 mt-6 max-w-md text-center text-sm text-dim sm:text-base">{phraseFor(correct)}</p>

      {/* статистика раунда */}
      <div className="anim-fade-up delay-300 mt-8 grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { v: `${correct}/${QUESTIONS_PER_ROUND}`, l: "верных", color: "text-lime" },
          { v: `${roundPoints}`, l: "очков за раунд", color: "text-neon" },
          { v: `${score}`, l: "всего очков", color: "text-gold" },
          { v: `🔥 ${bestStreak}`, l: "лучшая серия", color: "text-ember" },
        ].map((s) => (
          <div key={s.l} className="border border-white/10 bg-panel/70 p-4 text-center backdrop-blur-sm">
            <p className={`font-hud text-2xl font-bold tabular-nums sm:text-3xl ${s.color}`}>{s.v}</p>
            <p className="mt-1 font-hud text-[10px] tracking-[0.2em] text-faint uppercase">{s.l}</p>
          </div>
        ))}
      </div>

      {timeouts > 0 && (
        <p className="anim-fade delay-400 mt-3 font-hud text-[11px] tracking-[0.2em] text-alert/90 uppercase">
          ⏰ просрочено таймером: {timeouts}
        </p>
      )}

      <div className="anim-fade-up delay-300 mt-8 w-full">
        <EruditionMeter score={score} max={maxScore} large />
      </div>

      <button
        onClick={() => { sfx.click(); onNext(); }}
        className="sheen btn-press group anim-fade-up delay-400 mt-9 inline-flex items-center gap-3 border-2 border-neon bg-neon/10 px-9 py-4 font-display text-sm font-bold tracking-[0.22em] text-neon uppercase shadow-[0_0_28px_rgba(0,229,255,0.35)] hover:bg-neon/20 hover:shadow-[0_0_44px_rgba(0,229,255,0.55)] sm:text-base"
      >
        {next ? (
          <>
            Раунд {roundNum + 1} · {next.name}
            <svg viewBox="0 0 24 24" className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </>
        ) : (
          "К финальным результатам"
        )}
      </button>

      {next && (
        <p className="anim-fade delay-400 mt-4 max-w-sm text-center text-xs text-faint">{next.tagline}</p>
      )}
    </div>
  );
}
