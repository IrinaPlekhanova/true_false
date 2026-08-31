import { TIME_PER_QUESTION } from "../data/questions";

/* ─────────────────── Шкала «Эрудиция» ─────────────────── */

const ZONES = [
  { from: 0,    label: "Старт",      color: "#ff4d5e", glow: "rgba(255,77,94,0.6)" },
  { from: 0.25, label: "Разгон",     color: "#ff9f43", glow: "rgba(255,159,67,0.6)" },
  { from: 0.5,  label: "Мощь",       color: "#9d6bff", glow: "rgba(157,107,255,0.6)" },
  { from: 0.75, label: "Сверхразум", color: "#ffc94d", glow: "rgba(255,201,77,0.65)" },
];

export function zoneFor(fraction: number) {
  const f = Math.max(0, Math.min(1, fraction));
  if (f >= 0.75) return ZONES[3];
  if (f >= 0.5) return ZONES[2];
  if (f >= 0.25) return ZONES[1];
  return ZONES[0];
}

export function EruditionMeter({
  score,
  max,
  large = false,
}: {
  score: number;
  max: number;
  large?: boolean;
}) {
  const frac = Math.max(0, Math.min(1, score / max));
  const zone = zoneFor(frac);
  const pct = frac * 100;

  return (
    <div className="w-full">
      <div className={`flex items-end justify-between gap-3 ${large ? "mb-2" : "mb-1.5"}`}>
        <span
          className={`font-hud font-semibold tracking-[0.22em] uppercase ${large ? "text-sm" : "text-[10px]"}`}
          style={{ color: zone.color }}
        >
          Эрудиция · {zone.label}
        </span>
        <span className={`font-hud text-dim ${large ? "text-sm" : "text-[10px]"}`}>
          {score} / {max}
        </span>
      </div>
      <div
        className={`relative overflow-hidden rounded-sm border border-white/10 bg-white/[0.04] ${
          large ? "h-5" : "h-2.5"
        }`}
      >
        {/* риски зон 25/50/75 */}
        {[25, 50, 75].map((m) => (
          <span key={m} className="absolute top-0 bottom-0 z-10 w-px bg-white/25" style={{ left: `${m}%` }} />
        ))}
        <div
          className="absolute inset-y-0 left-0 rounded-sm transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${ZONES[0].color} 0%, ${ZONES[1].color} 34%, ${ZONES[2].color} 62%, ${zone.color} 100%)`,
            backgroundSize: "400% 100%",
            boxShadow: `0 0 ${large ? 18 : 10}px ${zone.glow}`,
          }}
        />
        {/* блик, бегущий по заполненной части */}
        <div
          className="absolute inset-y-0 left-0 transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            backgroundImage:
              "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.25) 50%, transparent 65%)",
            backgroundSize: "200% 100%",
            animation: "kf-sheen-slide 2.6s linear infinite",
          }}
        />
      </div>
      {large && (
        <div className="mt-1.5 flex justify-between font-hud text-[10px] text-faint">
          <span>0</span><span>125</span><span>250</span><span>375</span><span>{max}</span>
        </div>
      )}
    </div>
  );
}

/* ─────────────────── Кольцо таймера ─────────────────── */

export function TimerRing({ tenths }: { tenths: number }) {
  const total = TIME_PER_QUESTION * 10;
  const frac = Math.max(0, Math.min(1, tenths / total));
  const R = 44;
  const C = 2 * Math.PI * R;
  const secs = Math.ceil(tenths / 10);
  const cls = tenths <= 30 ? "timer-crit" : tenths <= 60 ? "timer-warn" : "timer-ok";
  const alarm = tenths <= 30 && tenths > 0;

  return (
    <div className={`relative h-16 w-16 sm:h-20 sm:w-20 ${alarm ? "anim-alarm" : ""}`}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={R} fill="none" strokeWidth="7" className="timer-track" />
        <circle
          cx="50" cy="50" r={R} fill="none" strokeWidth="7" strokeLinecap="round"
          className={cls}
          strokeDasharray={C}
          strokeDashoffset={C * (1 - frac)}
          style={{ transition: "stroke-dashoffset 0.1s linear, stroke 0.3s" }}
        />
      </svg>
      <span
        className={`font-hud absolute inset-0 flex items-center justify-center font-bold tabular-nums ${
          alarm ? "text-alert" : secs <= 6 ? "text-gold" : "text-neon"
        } ${alarm ? "text-2xl" : "text-xl sm:text-2xl"}`}
      >
        {secs}
      </span>
    </div>
  );
}

/* ─────────────────── Прогресс раунда (10 сегментов) ─────────────────── */

export type PipState = "correct" | "wrong" | null;

export function RoundPips({ results, current }: { results: PipState[]; current: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-label="Прогресс раунда">
      {results.map((r, i) => {
        const isCurrent = i === current && r === null;
        return (
          <span
            key={i}
            className={`h-2 flex-1 rounded-full transition-all duration-300 sm:h-2.5 ${
              r === "correct"
                ? "bg-neon shadow-[0_0_8px_rgba(0,229,255,0.8)]"
                : r === "wrong"
                ? "bg-flux shadow-[0_0_8px_rgba(255,46,166,0.7)]"
                : isCurrent
                ? "bg-ink/80 anim-pulse-soft"
                : "bg-white/10"
            }`}
            style={{ minWidth: 10 }}
          />
        );
      })}
    </div>
  );
}

/* ─────────────────── Пипсы раундов 1–5 ─────────────────── */

export function RoundDots({ currentRound }: { currentRound: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((r) => (
        <span
          key={r}
          className={`flex h-6 w-6 items-center justify-center rounded-sm border font-hud text-[10px] font-bold transition-all duration-300 ${
            r < currentRound
              ? "border-neon/50 bg-neon/15 text-neon"
              : r === currentRound
              ? "border-flux bg-flux/20 text-flux shadow-[0_0_12px_rgba(255,46,166,0.45)]"
              : "border-white/10 bg-white/[0.03] text-faint"
          }`}
        >
          {r}
        </span>
      ))}
    </div>
  );
}

/* ─────────────────── Кнопка звука ─────────────────── */

export function MuteButton({ muted, onToggle }: { muted: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      aria-label={muted ? "Включить звук" : "Выключить звук"}
      title={muted ? "Включить звук" : "Выключить звук"}
      className="btn-press flex h-9 w-9 items-center justify-center rounded-sm border border-white/15 bg-white/[0.04] text-dim hover:border-neon/50 hover:text-neon"
    >
      {muted ? (
        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 5 6 9H2v6h4l5 4V5z" fill="currentColor" stroke="none" opacity="0.85" />
          <line x1="16" y1="9" x2="22" y2="15" />
          <line x1="22" y1="9" x2="16" y2="15" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 5 6 9H2v6h4l5 4V5z" fill="currentColor" stroke="none" opacity="0.85" />
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          <path d="M18.5 5.5a9 9 0 0 1 0 13" />
        </svg>
      )}
    </button>
  );
}
