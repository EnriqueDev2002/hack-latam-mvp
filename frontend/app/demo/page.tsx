"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { Play, RotateCcw, Volume2 } from "lucide-react";
import { ChallengeCard } from "@/components/ChallengeCard";
import { RiskIndicator } from "@/components/RiskIndicator";
import { analyzeAudio } from "@/lib/api";
import type { AnalyzeResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

type Scenario = {
  id: string;
  title: string;
  description: string;
  expected: string;
  expectedColor: string;
  file: string;
};

const SCENARIOS: Scenario[] = [
  {
    id: "real",
    title: "Voz real de un familiar registrado",
    description:
      'Simula la voz de "Jorge G" llamando — un contacto previamente enrollado en VoiceGuard.',
    expected: "Debería detectarse como VOZ AUTÉNTICA + match con Jorge G",
    expectedColor: "text-green-700",
    file: "/demo/real-voice.webm",
  },
  {
    id: "ai",
    title: "Voz creada con inteligencia artificial",
    description:
      "Una voz sintética generada por IA, sin coincidir con ningún contacto registrado.",
    expected: "Debería detectarse como POSIBLE FRAUDE (sin match)",
    expectedColor: "text-red-700",
    file: "/demo/ai-voice.webm",
  },
  {
    id: "clone",
    title: "Intento de clonación de voz",
    description:
      "Una voz con IA que intenta hacerse pasar por un contacto enrollado (similitud parcial).",
    expected: "Debería detectarse como POSIBLE SUPLANTACIÓN de Jorge G",
    expectedColor: "text-red-700",
    file: "/demo/cloning-attempt.webm",
  },
];

type RunState = {
  status: "idle" | "playing" | "analyzing" | "done" | "error";
  result: AnalyzeResponse | null;
  error: string;
};

export default function DemoPage() {
  const [runs, setRuns] = useState<Record<string, RunState>>(() =>
    Object.fromEntries(SCENARIOS.map((s) => [s.id, { status: "idle", result: null, error: "" }])),
  );
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});

  const updateRun = (id: string, patch: Partial<RunState>) =>
    setRuns((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const runScenario = useCallback(async (scenario: Scenario) => {
    updateRun(scenario.id, { status: "playing", result: null, error: "" });

    try {
      // Fetch the audio file and start playback simultaneously with analysis
      const audio = audioRefs.current[scenario.id];
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }

      const response = await fetch(scenario.file);
      const blob = await response.blob();
      updateRun(scenario.id, { status: "analyzing" });

      const result = await analyzeAudio(blob);
      updateRun(scenario.id, { status: "done", result });
    } catch {
      updateRun(scenario.id, { status: "error", error: "No se pudo analizar el audio demo" });
    }
  }, []);

  const reset = useCallback((id: string) => {
    const audio = audioRefs.current[id];
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    updateRun(id, { status: "idle", result: null, error: "" });
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-brand">
          <Play className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-brand">Modo demo</h1>
        <p className="mx-auto mt-3 max-w-xl text-senior text-gray-700">
          Tres escenarios simulan distintos tipos de llamada para ver al detector en acción.
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Cada botón reproduce el audio y lo envía al detector simultáneamente.
        </p>
      </div>

      <section className="flex flex-col gap-6">
        {SCENARIOS.map((scenario) => {
          const run = runs[scenario.id];
          const isRunning = run.status === "playing" || run.status === "analyzing";
          return (
            <div
              key={scenario.id}
              className="rounded-3xl border-2 border-amber-100 bg-white p-6 shadow-md"
            >
              <h2 className="text-xl font-extrabold text-brand-dark">{scenario.title}</h2>
              <p className="mt-2 text-base text-gray-700">{scenario.description}</p>
              <p className={cn("mt-3 text-sm font-semibold", scenario.expectedColor)}>
                {scenario.expected}
              </p>

              <audio
                ref={(el) => {
                  audioRefs.current[scenario.id] = el;
                }}
                src={scenario.file}
                preload="metadata"
                className="mt-4 w-full"
                controls
              />

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => runScenario(scenario)}
                  disabled={isRunning}
                  className={cn(
                    "flex items-center gap-2 rounded-2xl px-6 py-3 text-base font-bold text-white shadow-sm transition active:scale-95 disabled:opacity-50",
                    isRunning ? "bg-brand-dark" : "bg-brand hover:bg-brand-dark",
                  )}
                >
                  {run.status === "playing" ? (
                    <>
                      <Volume2 className="h-5 w-5 animate-pulse" />
                      Reproduciendo…
                    </>
                  ) : run.status === "analyzing" ? (
                    <>
                      <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-white" />
                      Analizando…
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5" />
                      Reproducir y analizar
                    </>
                  )}
                </button>
                {run.status === "done" && (
                  <button
                    type="button"
                    onClick={() => reset(scenario.id)}
                    className="flex items-center gap-2 rounded-2xl border-2 border-brand bg-white px-6 py-3 text-base font-bold text-brand transition hover:bg-brand-light"
                  >
                    <RotateCcw className="h-5 w-5" />
                    Repetir
                  </button>
                )}
              </div>

              {run.error && (
                <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-800">
                  {run.error}
                </p>
              )}

              {run.result && (
                <div className="mt-5 flex flex-col gap-4">
                  <RiskIndicator result={run.result} />
                  {run.result.risk_level !== "low" && <ChallengeCard />}
                </div>
              )}
            </div>
          );
        })}
      </section>

      <div className="mt-10 rounded-3xl bg-brand-light p-6 text-center">
        <p className="text-senior text-brand-dark">
          ¿Quieres probar el detector con tu propia voz?
        </p>
        <Link
          href="/analyze"
          className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-brand px-6 py-3 text-base font-extrabold text-white shadow-md transition hover:bg-brand-dark"
        >
          Ir al analizador en vivo
        </Link>
      </div>
    </main>
  );
}
