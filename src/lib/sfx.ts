/** Крошечный синтезатор на WebAudio: без внешних файлов, только короткие блипы. */
class SfxEngine {
  private ctx: AudioContext | null = null;
  muted = false;

  /** Вызывать по пользовательскому жесту (клик «Начать игру»). */
  unlock() {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AC();
      }
      if (this.ctx.state === "suspended") void this.ctx.resume();
    } catch {
      this.ctx = null;
    }
  }

  private tone(freq: number, dur: number, type: OscillatorType, gain: number, delay = 0, slideTo?: number) {
    if (this.muted || !this.ctx) return;
    try {
      const t0 = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g).connect(this.ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    } catch {
      /* тишина лучше падения */
    }
  }

  click()   { this.tone(540, 0.06, "triangle", 0.07); }
  select()  { this.tone(720, 0.07, "triangle", 0.06); }
  correct() { this.tone(660, 0.1, "sine", 0.1); this.tone(990, 0.16, "sine", 0.1, 0.09); }
  wrong()   { this.tone(170, 0.28, "sawtooth", 0.07, 0, 110); }
  tick()    { this.tone(940, 0.035, "square", 0.035); }
  timeout() { this.tone(300, 0.22, "sawtooth", 0.08, 0, 90); }
  round()   { [440, 554, 659, 880].forEach((f, i) => this.tone(f, 0.14, "triangle", 0.08, i * 0.09)); }
  fanfare() { [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone(f, 0.2, "triangle", 0.09, i * 0.11)); }
}

export const sfx = new SfxEngine();
