import { useState } from "react";
import {
  getRoundQuestions,
  POINTS_PER_QUESTION,
  QUESTIONS_PER_ROUND,
  ROUND_COUNT,
  TOTAL_QUESTIONS,
  type Question,
} from "./data/questions";
import { sfx } from "./lib/sfx";
import { BackgroundFX } from "./components/BackgroundFX";
import { StartScreen } from "./components/StartScreen";
import { PlayScreen, type AnswerRecord } from "./components/PlayScreen";
import { RoundSummary } from "./components/RoundSummary";
import { FinalScreen } from "./components/FinalScreen";
import type { PipState } from "./components/HUD";

export interface StoredRecord extends AnswerRecord {
  q: Question;
}

type Screen = "start" | "play" | "round" | "final";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Колода: в каждом раунде свой порядок вопросов, при рестарте перемешивается заново. */
function buildDeck(): Question[] {
  const deck: Question[] = [];
  for (let r = 1; r <= ROUND_COUNT; r++) deck.push(...shuffle(getRoundQuestions(r)));
  return deck;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("start");
  const [deck, setDeck] = useState<Question[]>(() => buildDeck());
  const [idx, setIdx] = useState(0);
  const [records, setRecords] = useState<StoredRecord[]>([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [muted, setMuted] = useState(false);

  const maxScore = TOTAL_QUESTIONS * POINTS_PER_QUESTION;
  const q = deck[idx];
  const roundNum = Math.floor(idx / QUESTIONS_PER_ROUND) + 1; // 1-based, текущий/завершённый раунд

  /* ── старт / рестарт ── */
  const start = () => {
    setDeck(buildDeck());
    setIdx(0);
    setRecords([]);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setScreen("play");
  };

  /* ── результат ответа (вызывается ровно один раз на вопрос) ── */
  const handleResult = (rec: AnswerRecord) => {
    const question = deck[idx];
    setRecords((prev) => [...prev, { ...rec, q: question }]);
    if (rec.correct) {
      const nextStreak = streak + 1;
      setScore((s) => s + POINTS_PER_QUESTION);
      setStreak(nextStreak);
      if (nextStreak > bestStreak) setBestStreak(nextStreak);
    } else {
      setStreak(0);
    }
  };

  /* ── переход дальше ── */
  const handleAdvance = () => {
    const next = idx + 1;
    if (next >= TOTAL_QUESTIONS) {
      setScreen("final");
      return;
    }
    if (next % QUESTIONS_PER_ROUND === 0) {
      sfx.round();
      setScreen("round");
      return;
    }
    setIdx(next);
  };

  const handleNextRound = () => {
    setIdx(idx + 1);
    setScreen("play");
  };

  const toggleMute = () => {
    setMuted((m) => {
      sfx.muted = !m;
      return !m;
    });
  };

  /* ── пипсы прогресса текущего раунда ── */
  const roundPips: PipState[] = Array.from({ length: QUESTIONS_PER_ROUND }, (_, i) => {
    const rec = records[(roundNum - 1) * QUESTIONS_PER_ROUND + i];
    if (!rec) return null;
    return rec.correct ? "correct" : "wrong";
  });

  return (
    <div className="font-body relative min-h-dvh">
      <BackgroundFX />

      {screen === "start" && <StartScreen onStart={start} />}

      {screen === "play" && q && (
        <PlayScreen
          key={q.id}
          q={q}
          globalIndex={idx}
          score={score}
          streak={streak}
          roundPips={roundPips}
          maxScore={maxScore}
          muted={muted}
          onToggleMute={toggleMute}
          onResult={handleResult}
          onAdvance={handleAdvance}
        />
      )}

      {screen === "round" && (
        <RoundSummary
          roundNum={roundNum}
          records={records.slice((roundNum - 1) * QUESTIONS_PER_ROUND, roundNum * QUESTIONS_PER_ROUND)}
          score={score}
          maxScore={maxScore}
          bestStreak={bestStreak}
          onNext={handleNextRound}
        />
      )}

      {screen === "final" && (
        <FinalScreen
          records={records}
          score={score}
          maxScore={maxScore}
          bestStreak={bestStreak}
          onRestart={start}
        />
      )}
    </div>
  );
}
