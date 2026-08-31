const SPARKS = [
  { left: "8%",  delay: "0s",   dur: "11s", color: "rgba(0,229,255,0.7)",  size: 4 },
  { left: "18%", delay: "3.2s", dur: "14s", color: "rgba(255,46,166,0.6)", size: 3 },
  { left: "29%", delay: "6s",   dur: "12s", color: "rgba(255,201,77,0.55)", size: 3 },
  { left: "44%", delay: "1.4s", dur: "15s", color: "rgba(157,107,255,0.6)", size: 4 },
  { left: "58%", delay: "8s",   dur: "11s", color: "rgba(0,229,255,0.55)", size: 3 },
  { left: "69%", delay: "4.4s", dur: "13s", color: "rgba(255,46,166,0.55)", size: 4 },
  { left: "81%", delay: "2.1s", dur: "12s", color: "rgba(255,201,77,0.5)", size: 3 },
  { left: "92%", delay: "7s",   dur: "14s", color: "rgba(0,229,255,0.6)",  size: 4 },
];

/** Слоистый кибер-фон: свечения, перспективная сетка, сканлайны, шум, искры. */
export function BackgroundFX() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* базовый градиент глубины */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(1200px 700px at 70% -10%, rgba(157,107,255,0.16), transparent 60%)," +
            "radial-gradient(900px 600px at 10% 15%, rgba(0,229,255,0.12), transparent 55%)," +
            "radial-gradient(1000px 700px at 90% 85%, rgba(255,46,166,0.12), transparent 55%)," +
            "linear-gradient(180deg, #05070f 0%, #070b1a 45%, #05070f 100%)",
        }}
      />

      {/* дрейфующие неоновые облака */}
      <div
        className="absolute -top-32 -left-24 h-[480px] w-[480px] rounded-full blur-[120px]"
        style={{ background: "rgba(0,229,255,0.16)", animation: "kf-drift-a 16s ease-in-out infinite" }}
      />
      <div
        className="absolute top-1/3 -right-32 h-[520px] w-[520px] rounded-full blur-[130px]"
        style={{ background: "rgba(255,46,166,0.14)", animation: "kf-drift-b 19s ease-in-out infinite" }}
      />
      <div
        className="absolute -bottom-40 left-1/4 h-[420px] w-[420px] rounded-full blur-[120px]"
        style={{ background: "rgba(255,201,77,0.09)", animation: "kf-drift-a 22s ease-in-out infinite" }}
      />

      {/* перспективная сетка снизу */}
      <div className="grid-floor absolute inset-x-[-20%] bottom-[-6%] h-[46vh]" />

      {/* восходящие искры */}
      {SPARKS.map((s, i) => (
        <span
          key={i}
          className="spark absolute bottom-[-12px] block rounded-full"
          style={{
            left: s.left,
            width: s.size,
            height: s.size,
            background: s.color,
            boxShadow: `0 0 8px ${s.color}`,
            animationDelay: s.delay,
            animationDuration: s.dur,
          }}
        />
      ))}

      {/* сканлайны + шум поверх */}
      <div className="scanlines absolute inset-0" />
      <div className="noise-layer absolute inset-0" />

      {/* виньетка */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(120% 90% at 50% 40%, transparent 55%, rgba(2,4,10,0.75) 100%)" }}
      />
    </div>
  );
}
