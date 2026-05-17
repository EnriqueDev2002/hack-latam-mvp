"use client";

import { useCallback, useEffect, useState } from "react";
import { Phone, Upload } from "lucide-react";
import { ChallengeCard } from "@/components/ChallengeCard";
import { RiskIndicator } from "@/components/RiskIndicator";
import { analyzeAudio } from "@/lib/api";
import type { AnalyzeResponse } from "@/lib/types";

type Status = "idle" | "analyzing" | "done" | "error";

const LOADING_MESSAGES = [
  "Procesando el audio…",
  "Analizando patrones acústicos…",
  "Detectando síntesis artificial…",
  "Casi listo…",
];

function CyclingLoader() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % LOADING_MESSAGES.length), 1600);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col items-center gap-8 py-10">
      <div className="flex h-16 items-end gap-1.5">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="w-2 rounded-full bg-brand animate-wave-bar"
            style={{
              height: "100%",
              transformOrigin: "bottom",
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>

      <p
        key={idx}
        className="text-xl font-semibold text-neutral-700 animate-fade-up animate-fill-forwards"
      >
        {LOADING_MESSAGES[idx]}
      </p>
    </div>
  );
}

export default function AnalyzePage() {
  const [status, setStatus] = useState<Status>("idle");
  const [finalResult, setFinalResult] = useState<AnalyzeResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const reset = useCallback(() => {
    setStatus("idle");
    setFinalResult(null);
    setErrorMsg("");
  }, []);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setFinalResult(null);
    setErrorMsg("");
    setStatus("analyzing");
    try {
      const result = await analyzeAudio(file);
      setFinalResult(result);
      setStatus("done");
    } catch {
      setErrorMsg("No se pudo analizar el audio. Intenta de nuevo.");
      setStatus("error");
    }
  }, []);

  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      {/* Header */}
      <div className="mb-8 text-center">
        <div
          className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[22px] shadow-brand"
          style={{ background: "linear-gradient(135deg, #2563EB, #3B82F6)" }}
        >
          <Phone className="h-10 w-10 text-white" strokeWidth={1.75} />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-neutral-900">Analizar llamada</h1>
        <p className="mt-3 text-senior text-neutral-600">
          Sube la grabación de la llamada y te decimos en segundos si la voz es real.
        </p>
      </div>

      {/* Main card */}
      <section className="card p-8">
        {(status === "idle" || status === "error") && (
          <div className="flex flex-col items-center gap-6">
            {status === "error" && (
              <div className="w-full rounded-[14px] bg-danger-bg px-5 py-4 text-center">
                <p className="text-base font-semibold text-red-800">{errorMsg}</p>
              </div>
            )}

            <p className="text-center text-senior font-medium text-neutral-600">
              Sube el audio guardado (WhatsApp, nota de voz, llamada grabada)
            </p>

            <label className="btn-primary w-full cursor-pointer text-senior justify-center py-5">
              <Upload className="h-6 w-6" />
              Subir archivo de audio
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        )}

        {status === "analyzing" && <CyclingLoader />}

        {status === "done" && finalResult && (
          <div className="flex flex-col gap-6">
            <RiskIndicator result={finalResult} />
            {finalResult.risk_level !== "low" && <ChallengeCard />}
            <button
              type="button"
              onClick={reset}
              className="btn-secondary w-full text-senior"
            >
              Analizar otra llamada
            </button>
          </div>
        )}
      </section>

      {/* Instructions */}
      <section
        className="mt-8 rounded-[20px] p-6"
        style={{ background: "linear-gradient(160deg, #EFF6FF 0%, #F8FAFC 100%)", border: "1px solid #DBEAFE" }}
      >
        <h2 className="text-xl font-bold text-brand">¿Cómo se usa?</h2>
        <ol className="mt-4 flex flex-col gap-4">
          {[
            "Guarda la grabación de la llamada sospechosa (WhatsApp, nota de voz).",
            'Presiona "Subir archivo de audio".',
            "Selecciona el audio desde tu dispositivo.",
            "Revisa el resultado y la sugerencia de qué hacer.",
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-4">
              <span
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-base font-bold text-white shadow-brand"
                style={{ background: "linear-gradient(135deg, #2563EB, #3B82F6)" }}
              >
                {i + 1}
              </span>
              <span className="pt-1 text-senior font-medium text-neutral-700">{step}</span>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
