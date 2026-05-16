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
    <main className="mx-auto max-w-2xl px-6 py-12">
      {/* Hero */}
      <div className="mb-10 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
          <Phone className="h-10 w-10 text-blue-600" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">VoiceGuard</h1>
        <p className="mt-3 text-senior text-gray-600">
          ¿Recibes una llamada y no estás seguro si es tu familiar?
          <br />
          <strong>Graba la voz y te decimos si es real o falsa.</strong>
        </p>
      </div>

      {/* Main action card */}
      <section className="rounded-2xl border-2 border-gray-100 bg-white p-8 shadow-sm">
        {(status === "idle" || status === "error") && (
          <div className="flex flex-col gap-6">
            <p className="text-center text-senior text-gray-700">
              Presiona el botón y acerca el teléfono al micrófono mientras escuchas la llamada.
            </p>
            {status === "error" && (
              <p className="rounded-xl bg-red-50 p-4 text-center text-senior text-red-700">
                {errorMsg}
              </p>
            )}
            <button
              type="button"
              onClick={startRecording}
              className="flex w-full items-center justify-center gap-4 rounded-2xl bg-blue-600 px-8 py-7 text-2xl font-bold text-white shadow-lg transition hover:bg-blue-700 active:scale-95"
            >
              <Mic className="h-8 w-8" />
              Analizar llamada
            </button>
          </div>
        )}

        {status === "recording" && (
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="inline-block h-4 w-4 animate-pulse rounded-full bg-red-500" />
              <p className="text-senior font-semibold text-gray-800">Grabando…</p>
            </div>

            {liveScore && (
              <div className="w-full">
                <p className="mb-2 text-sm font-medium text-gray-500">Análisis en tiempo real:</p>
                <RiskIndicator result={liveScore} />
              </div>
            )}

            <button
              type="button"
              onClick={stopAnalysis}
              className="flex w-full items-center justify-center gap-4 rounded-2xl bg-red-600 px-8 py-7 text-2xl font-bold text-white shadow-lg transition hover:bg-red-700 active:scale-95"
            >
              <Square className="h-8 w-8" />
              Detener y analizar
            </button>
          </div>
        )}

        {status === "analyzing" && (
          <p className="py-8 text-center text-senior text-gray-500">Analizando la voz…</p>
        )}

        {status === "done" && finalResult && (
          <div className="flex flex-col gap-6">
            <RiskIndicator result={finalResult} />
            <button
              type="button"
              onClick={reset}
              className="rounded-2xl bg-gray-100 px-8 py-5 text-senior font-semibold text-gray-800 transition hover:bg-gray-200"
            >
              Analizar otra llamada
            </button>
          </div>
        )}
      </section>

      {/* How it works — for elderly UX */}
      <section className="mt-8 rounded-2xl bg-blue-50 p-6">
        <h2 className="text-xl font-bold text-blue-900">¿Cómo funciona?</h2>
        <ol className="mt-3 flex flex-col gap-3 text-senior text-blue-800">
          <li><span className="font-bold">1.</span> Recibe la llamada de quien dice ser tu familiar.</li>
          <li><span className="font-bold">2.</span> Abre VoiceGuard y presiona "Analizar llamada".</li>
          <li><span className="font-bold">3.</span> Acerca el teléfono al micrófono de tu computadora.</li>
          <li><span className="font-bold">4.</span> Presiona "Detener" y ve el resultado en segundos.</li>
        </ol>
      </section>
    </main>
  );
}
