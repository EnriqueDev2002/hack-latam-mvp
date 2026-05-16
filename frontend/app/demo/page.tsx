"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { Play, RotateCcw, Volume2, Mic } from "lucide-react";
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
  badge: string;
  badgeColor: string;
  file: string;
};

const SCENARIOS: Scenario[] = [
  {
    id: "real",
    title: "Voz real de un familiar registrado",
    description:
      'Simula la voz de "Jorge G" llamando — un contacto previamente registrado en VoiceGuard.',
    expected: "Debería detectarse como VOZ AUTÉNTICA + match con Jorge G",
    badge: "Voz real",
    badgeColor: "badge-success",
    file: "/demo/real-voice.webm",
  },
  {
    id: "ai",
    title: "Voz creada con inteligencia artificial",
    description:
      "Una voz sintética generada por IA, sin coincidir con ningún contacto registrado.",
    expected: "Debería detectarse como POSIBLE FRAUDE (sin match)",
    badge: "Voz IA",
    badgeColor: "badge-danger",
    file: "/demo/ai-voice.webm",
  },
  {
    id: "clone",
    title: "Intento de clonación de voz",
    description:
      "Una voz con IA que intenta hacerse pasar por un contacto registrado (similitud parcial).",
    expected: "Debería detectarse como POSIBLE SUPLANTACIÓN de Jorge G",
    badge: "Clonación",
    badgeColor: "badge-danger",
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
    Object.fromEntries(
      SCENARIOS.map((s) => [s.id, { status: "idle", result: null, error: "" }]),
    ),
  );
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});

  const updateRun = (id: string, patch: Partial<RunState>) =>
    setRuns((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const runScenario = useCallback(async (scenario: Scenario) => {
    updateRun(scenario.id, { status: "playing", result: null, error: "" });

    try {
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
    <main className="mx-auto max-w-2xl px-6 py-10">
      {/* Header */}
      <div className="mb-10 text-center">
        <div
          className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[22px] shadow-brand"
          style={{ background: "linear-gradient(135deg, #2563EB, #3B82F6)" }}
        >
          <Play className="h-10 w-10 text-white" strokeWidth={2} />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-neutral-900">Modo demo</h1>
        <p className="mx-auto mt-3 max-w-lg text-senior text-neutral-600">
          Tres escenarios simulan distintos tipos de llamada para ver el detector en acción.
        </p>
      </div>

      {/* Scenario cards */}
      <section className="flex flex-col gap-6">
        {SCENARIOS.map((scenario, idx) => {
          const run = runs[scenario.id];
          const isRunning = run.status === "playing" || run.status === "analyzing";

          return (
            <div
              key={scenario.id}
              className="card p-6 animate-fade-up animate-fill-forwards"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              {/* Badge + title */}
              <div className="mb-3 flex items-start justify-between gap-4">
                <h2 className="text-xl font-bold text-neutral-900">{scenario.title}</h2>
                <span className={cn("badge flex-shrink-0", scenario.badgeColor)}>
                  {scenario.badge}
                </span>
              </div>

              <p className="text-base text-neutral-600">{scenario.description}</p>
              <p className="mt-2 text-sm font-semibold text-neutral-400">{scenario.expected}</p>

              {/* Audio player */}
              <audio
                ref={(el) => {
                  audioRefs.current[scenario.id] = el;
                }}
                src={scenario.file}
                preload="metadata"
                className="mt-4 w-full"
                controls
              />

              {/* Actions */}
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => runScenario(scenario)}
                  disabled={isRunning}
                  className={cn(
                    "btn-primary text-base px-6 py-3",
                    isRunning && "opacity-75",
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
                    className="btn-secondary text-base px-6 py-3"
                  >
                    <RotateCcw className="h-5 w-5" />
                    Repetir
                  </button>
                )}
              </div>

              {/* Error */}
              {run.error && (
                <div className="mt-4 rounded-[14px] bg-danger-bg px-4 py-3">
                  <p className="text-sm font-semibold text-red-800">{run.error}</p>
                </div>
              )}

              {/* Result */}
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

      {/* CTA */}
      <div
        className="mt-10 rounded-[20px] p-6 text-center"
        style={{ background: "linear-gradient(160deg, #EFF6FF 0%, #F8FAFC 100%)", border: "1px solid #DBEAFE" }}
      >
        <p className="text-senior font-semibold text-brand-dark">
          ¿Quieres probar el detector con tu propia voz?
        </p>
        <Link
          href="/analyze"
          className="btn-primary mt-4 inline-flex text-base px-6 py-3"
        >
          <Mic className="h-5 w-5" />
          Ir al analizador en vivo
        </Link>
      </div>
    </main>
  );
}
