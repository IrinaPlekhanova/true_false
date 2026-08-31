import { useEffect, useMemo, useState } from "react";
import { MARQUEE_FACTS, QUESTIONS_PER_ROUND, ROUND_COUNT, TIME_PER_QUESTION, TITLES, TOTAL_QUESTIONS } from "../data/questions";
import { sfx } from "../lib/sfx";

/** Эффект «расшифровки» строки из кибер-символов. Уважает prefers-reduced-motion. */
export function useScramble(text: string, delayMs = 0) {
  const reduced = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );
  const [out, setOut] = useState(reduced ? text : "\u00a0");

  useEffect(() => {
    if (reduced) { setOut(text); return; }
    const glyphs = "▓▒░#%@*+=<>/\\?";
    const TOTAL = 26;
    let frame = 0;
    let raf = 0;
    const startAt = performance.now() + delayMs;
    const tick = (now: number) => {
      if (now < startAt) { raf = requestAnimationFrame(tick); return; }
      frame += 1;
      const settled = Math.floor((frame / TOTAL) * text.length);
      let s = text.slice(0, settled);
      for (let i = settled; i < text.length; i++) {
        s += text[i] === " " ? " " : glyphs[Math.floor(Math.random() * glyphs.length)];
      }
      setOut(frame >= TOTAL ? text : s);
      if (frame < TOTAL) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, delayMs, reduced]);

  return out;
}

const RULES = [
  { code: "01", text: `${ROUND_COUNT} раундов по ${QUESTIONS_PER_ROUND} вопросов — после каждого промежуточный итог.` },
  { code: "02", text: "Два режима: «Правда / Миф» и выбор одного из четырёх вариантов." },
  { code: "03", text: `На раздумья — ${TIME_PER_QUESTION} секунд. Время вышло = ошибка, но с разбором.` },
  { code: "04", text: "+10 очков за каждый верный ответ. Максимум — 500." },
  { code: "05", text: "Шкала «Эрудиция» греется от красной зоны до золотой." },
];

export function StartScreen({ onStart }: { onStart: () => void }) {
  const [showHow, setShowHow] = useState(false);
  const line1 = useScramble("ПРАВДА", 150);
  const line2 = useScramble("ИЛИ", 600);
  const line3 = useScramble("МИФ", 850);

  return (
    <div className="relative z-10 flex min-h-dvh flex-col">
      {/* верхняя служебная строка */}
      <header className="anim-fade flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-10">
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 24 24" className="h-6 w-6 text-neon" fill="currentColor" aria-hidden>
            <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" />
          </svg>
          <span className="font-hud text-xs font-semibold tracking-[0.3em] text-dim uppercase">
            Кибер-викторина · v4.0
          </span>
        </div>
        <span className="anim-flicker font-hud text-[10px] tracking-[0.25em] text-faint uppercase sm:text-xs">
          педколледж · 4 курс · доступ разрешён
        </span>
      </header>

      {/* основной блок: асимметрия — слева запуск, справа брифинг */}
      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-5 py-10 sm:px-10 lg:grid-cols-[1.25fr_1fr] lg:gap-14">
        <section>
          <p className="anim-fade-up font-hud text-xs font-semibold tracking-[0.35em] text-neon uppercase text-glow-cyan">
            // загрузка протокола знаний
          </p>

          <h1 className="mt-5 font-display leading-[0.95] font-black">
            <span className="block text-[13vw] text-neon text-glow-cyan sm:text-7xl lg:text-8xl">{line1}</span>
            <span className="mt-1 flex items-center gap-4">
              <span className="block text-[6vw] text-dim sm:text-3xl lg:text-4xl">{line2}</span>
              <span className="h-px flex-1 bg-gradient-to-r from-neon/60 via-flux/40 to-transparent" aria-hidden />
            </span>
            <span className="block text-[13vw] text-flux text-glow-flux sm:text-7xl lg:text-8xl">{line3}</span>
          </h1>

          <p className="anim-fade-up delay-300 mt-6 max-w-xl text-base leading-relaxed text-dim sm:text-lg">
            50 вопросов на стыке науки и педагогики. 10 секунд на решение.
            Разрушай мифы, собирай серию и докажи, что будущий педагог
            отличает факт от красивой легенды.
          </p>

          {/* счётчики миссии */}
          <div className="anim-fade-up delay-300 mt-7 flex flex-wrap items-center gap-x-8 gap-y-3 font-hud">
            {[
              { v: "50", l: "вопросов" },
              { v: "5", l: "раундов" },
              { v: "10с", l: "на ответ" },
              { v: "500", l: "макс. очков" },
            ].map((s) => (
              <div key={s.l} className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-ink sm:text-3xl">{s.v}</span>
                <span className="text-[11px] tracking-[0.2em] text-faint uppercase">{s.l}</span>
              </div>
            ))}
          </div>

          <div className="anim-fade-up delay-400 mt-9 flex flex-wrap items-center gap-4">
            <button
              onClick={() => { sfx.unlock(); sfx.round(); onStart(); }}
              className="sheen btn-press group inline-flex items-center gap-3 border-2 border-neon bg-neon/10 px-8 py-4 font-display text-sm font-bold tracking-[0.2em] text-neon uppercase shadow-[0_0_28px_rgba(0,229,255,0.35)] hover:bg-neon/20 hover:shadow-[0_0_44px_rgba(0,229,255,0.55)] sm:text-base"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" fill="currentColor" aria-hidden>
                <path d="M6 4 20 12 6 20z" />
              </svg>
              Начать игру
            </button>
            <button
              onClick={() => { sfx.click(); setShowHow((v) => !v); }}
              className="btn-press inline-flex items-center gap-2 border border-white/20 px-5 py-4 font-hud text-xs font-semibold tracking-[0.2em] text-dim uppercase hover:border-flux/60 hover:text-flux"
            >
              {showHow ? "Скрыть правила" : "Как играть?"}
              <span className={`inline-block transition-transform duration-300 ${showHow ? "rotate-180" : ""}`}>▾</span>
            </button>
          </div>

          {showHow && (
            <div className="anim-slide-in mt-6 max-w-xl border-l-2 border-neon/60 bg-panel/60 p-4 text-sm leading-relaxed text-dim">
              Жми <b className="text-neon">«Правда»</b> / <b className="text-flux">«Миф»</b> или выбирай вариант.
              После ответа увидишь верное решение и факт-пояснение. Следи за таймером:
              на красной зоне он начинает паниковать — как студент на экзамене.
            </div>
          )}
        </section>

        {/* панель брифинга */}
        <aside className="anim-fade-up delay-200 corner-frame relative border border-white/10 bg-panel/70 p-6 backdrop-blur-sm sm:p-7">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-bold tracking-[0.3em] text-ink uppercase">Брифинг</h2>
            <span className="flex items-center gap-1.5 font-hud text-[10px] tracking-[0.2em] text-lime uppercase">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-lime shadow-[0_0_8px_rgba(157,255,87,0.9)] anim-pulse-soft" />
              online
            </span>
          </div>

          <ul className="mt-5 space-y-4">
            {RULES.map((r, i) => (
              <li key={r.code} className="anim-fade-up flex gap-4" style={{ animationDelay: `${0.25 + i * 0.08}s` }}>
                <span className="font-hud text-sm font-bold text-flux">{r.code}</span>
                <span className="text-sm leading-relaxed text-dim">{r.text}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 border-t border-white/10 pt-5">
            <p className="font-hud text-[10px] tracking-[0.25em] text-faint uppercase">Шкала званий</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[...TITLES].reverse().map((t) => (
                <span
                  key={t.title}
                  className="border border-white/10 bg-white/[0.04] px-2.5 py-1.5 font-hud text-[11px] text-dim transition-colors hover:border-gold/50 hover:text-gold"
                >
                  {t.icon} {t.title}
                </span>
              ))}
            </div>
          </div>
        </aside>
      </main>

      {/* бегущая строка фактов */}
      <footer className="anim-fade delay-400 overflow-hidden border-t border-white/10 bg-abyss/80 py-3">
        <div className="marquee-track gap-0">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1}>
              {MARQUEE_FACTS.map((f, i) => (
                <span key={i} className="flex items-center font-hud text-[11px] tracking-[0.22em] text-dim/80 uppercase">
                  <span className="px-5">{f}</span>
                  <span className={`h-1.5 w-1.5 rotate-45 ${i % 2 === 0 ? "bg-neon" : "bg-flux"}`} />
                </span>
              ))}
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}
