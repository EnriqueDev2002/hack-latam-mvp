"use client";

import { useCallback, useRef, useState } from "react";
import { Mic, Square, Phone } from "lucide-react";
import { RiskIndicator } from "@/components/RiskIndicator";
import { AudioStreamer } from "@/lib/audio";
import { analyzeAudio } from "@/lib/api";
import type { AnalyzeResponse } from "@/lib/types";

type Status = "idle" | "recording" | "analyzing" | "done" | "error";

export default function Home() {
  const [status, setStatus] = useState<Status>("idle");
  const [liveScore, setLiveScore] = useState<AnalyzeResponse | null>(null);
  const [finalResult, setFinalResult] = useState<AnalyzeResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const streamerRef = useRef<AudioStreamer | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recorderRef = useRef<MediaRecorder | null>(null);

  const startRecording = useCallback(async () => {
    setStatus("recording");
    setLiveScore(null);
    setFinalResult(null);
    setErrorMsg("");
    chunksRef.current = [];

    // Try WebSocket streaming for live scores
    const streamer = new AudioStreamer();
    streamerRef.current = streamer;
    try {
      await streamer.start(
        (score) => setLiveScore(score),
        () => { /* WS error mid-stream, REST fallback handles final result */ },
      );
    } catch {
      // WS unavailable — REST-only mode, that's fine
      streamerRef.current = null;
    }

    // Always capture full blob for REST fallback
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start(500);
      recorderRef.current = recorder;
    } catch {
      streamerRef.current?.stop();
      setErrorMsg("No se pudo acceder al micrófono. Verifica los permisos.");
      setStatus("error");
    }
  }, []);

  const stopAnalysis = useCallback(async () => {
    streamerRef.current?.stop();

    const recorder = recorderRef.current;
    if (!recorder) return;

    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      recorder.stop();
      recorder.stream.getTracks().forEach((t) => t.stop());
    });
    recorderRef.current = null;
    setStatus("analyzing");

    try {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const result = await analyzeAudio(blob);
      setFinalResult(result);
      setStatus("done");
    } catch {
      setErrorMsg("No se pudo analizar el audio. Intenta de nuevo.");
      setStatus("error");
    }
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setLiveScore(null);
    setFinalResult(null);
    setErrorMsg("");
    chunksRef.current = [];
  }, []);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      {/* Hero */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-brand-light">
          <Phone className="h-12 w-12 text-brand" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-brand">VoiceGuard</h1>
        <p className="mt-3 text-senior font-semibold text-gray-800">
          ¿No sabes si la voz en la llamada es real?
        </p>
        <p className="text-senior text-gray-700">Grábala y te decimos en segundos.</p>
      </div>

      {/* Main action card */}
      <section className="rounded-3xl border-2 border-amber-100 bg-white p-8 shadow-md">
        {(status === "idle" || status === "error") && (
          <div className="flex flex-col gap-6">
            {status === "error" ? (
              <p className="rounded-2xl bg-red-50 p-5 text-center text-senior font-semibold text-red-800">
                {errorMsg}
              </p>
            ) : (
              <p className="text-center text-senior font-medium text-gray-700">
                Presione el botón mientras escucha la llamada
              </p>
            )}
            <button
              type="button"
              onClick={startRecording}
              className="flex w-full items-center justify-center gap-4 rounded-2xl bg-brand px-8 py-8 text-2xl font-extrabold text-white shadow-lg transition hover:bg-brand-dark active:scale-95"
            >
              <Mic className="h-9 w-9" />
              Analizar llamada
            </button>
          </div>
        )}

        {status === "recording" && (
          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <span className="inline-block h-6 w-6 animate-pulse rounded-full bg-red-500" />
              <p className="text-2xl font-extrabold text-gray-900">Grabando…</p>
              <p className="text-senior text-gray-600">Acerque el teléfono al micrófono</p>
            </div>

            {liveScore && (
              <div className="w-full">
                <RiskIndicator result={liveScore} />
              </div>
            )}

            <button
              type="button"
              onClick={stopAnalysis}
              className="flex w-full items-center justify-center gap-4 rounded-2xl bg-red-600 px-8 py-8 text-2xl font-extrabold text-white shadow-lg transition hover:bg-red-700 active:scale-95"
            >
              <Square className="h-9 w-9" />
              Detener y ver resultado
            </button>
          </div>
        )}

        {status === "analyzing" && (
          <div className="flex flex-col items-center gap-4 py-6">
            <span className="text-5xl">🔍</span>
            <p className="text-2xl font-bold text-gray-800">Analizando la voz…</p>
            <p className="text-senior text-gray-600">Espere un momento</p>
          </div>
        )}

        {status === "done" && finalResult && (
          <div className="flex flex-col gap-6">
            <RiskIndicator result={finalResult} />
            <button
              type="button"
              onClick={reset}
              className="rounded-2xl border-2 border-brand bg-white px-8 py-5 text-senior font-bold text-brand transition hover:bg-brand-light"
            >
              Analizar otra llamada
            </button>
          </div>
        )}
      </section>

      {/* Steps */}
      <section className="mt-8 rounded-3xl bg-brand-light p-6">
        <h2 className="text-xl font-extrabold text-brand">¿Cómo se usa?</h2>
        <ol className="mt-4 flex flex-col gap-4">
          {[
            "Reciba la llamada del supuesto familiar.",
            'Presione el botón grande "Analizar llamada".',
            "Acerque el teléfono al micrófono.",
            'Presione "Detener" y vea el resultado.',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-4">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand text-base font-extrabold text-white">
                {i + 1}
              </span>
              <span className="text-senior font-semibold text-brand-dark">{step}</span>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
