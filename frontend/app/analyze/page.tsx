"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square, Phone, Upload } from "lucide-react";
import { ChallengeCard } from "@/components/ChallengeCard";
import { RiskIndicator } from "@/components/RiskIndicator";
import { WaveformVisualizer } from "@/components/WaveformVisualizer";
import { AudioStreamer } from "@/lib/audio";
import { analyzeAudio } from "@/lib/api";
import type { AnalyzeResponse } from "@/lib/types";

type Status = "idle" | "recording" | "analyzing" | "done" | "error";

const LOADING_MESSAGES = [
  "Escuchando la voz…",
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
      {/* Sound wave animation */}
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

      {/* Cycling message — key prop re-mounts to retrigger animation */}
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
  const [liveScore, setLiveScore] = useState<AnalyzeResponse | null>(null);
  const [finalResult, setFinalResult] = useState<AnalyzeResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
  const streamerRef = useRef<AudioStreamer | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (status === "recording") {
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  const startRecording = useCallback(async () => {
    setStatus("recording");
    setLiveScore(null);
    setFinalResult(null);
    setErrorMsg("");
    chunksRef.current = [];

    const streamer = new AudioStreamer();
    streamerRef.current = streamer;
    try {
      await streamer.start(
        (score) => setLiveScore(score),
        () => {},
      );
    } catch {
      streamerRef.current = null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setActiveStream(stream);
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
    setActiveStream(null);
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

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setLiveScore(null);
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

  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");

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
          ¿Dudas de una llamada? Grábala y te decimos en segundos si es real.
        </p>
      </div>

      {/* Main card */}
      <section className="card p-8">
        {/* ── IDLE ── */}
        {(status === "idle" || status === "error") && (
          <div className="flex flex-col items-center gap-6">
            {status === "error" && (
              <div className="w-full rounded-[14px] bg-danger-bg px-5 py-4 text-center">
                <p className="text-base font-semibold text-red-800">{errorMsg}</p>
              </div>
            )}

            <p className="text-center text-senior font-medium text-neutral-600">
              Presione el botón mientras escucha la llamada
            </p>

            {/* Circular mic button */}
            <div className="relative flex items-center justify-center py-4">
              <button
                type="button"
                onClick={startRecording}
                className="flex h-[120px] w-[120px] items-center justify-center rounded-full shadow-brand-lg transition-all duration-200 hover:shadow-[0_12px_32px_rgba(37,99,235,0.3)] active:scale-95"
                style={{ background: "linear-gradient(135deg, #2563EB, #3B82F6)" }}
                aria-label="Analizar llamada"
              >
                <Mic className="h-12 w-12 text-white" strokeWidth={2} />
              </button>
            </div>

            <label className="btn-secondary w-full cursor-pointer text-senior">
              <Upload className="h-5 w-5" />
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

        {/* ── RECORDING ── */}
        {status === "recording" && (
          <div className="flex flex-col items-center gap-6">
            {/* Status pill */}
            <div className="flex items-center gap-2.5 rounded-full bg-danger-bg px-5 py-2.5">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-danger" />
              <span className="text-base font-semibold text-red-800">Grabando</span>
            </div>

            {/* Timer */}
            <div className="font-mono-display text-5xl font-semibold tabular-nums text-neutral-900">
              {mins}:{secs}
            </div>

            <p className="text-base font-medium text-neutral-500">
              Acerque el teléfono al micrófono
            </p>

            {/* Waveform */}
            {activeStream && (
              <div className="w-full">
                <WaveformVisualizer stream={activeStream} risk={liveScore?.risk_level ?? null} />
              </div>
            )}

            {/* Live score */}
            {liveScore && (
              <div className="w-full">
                <RiskIndicator result={liveScore} />
              </div>
            )}

            {liveScore && liveScore.risk_level !== "low" && (
              <div className="w-full">
                <ChallengeCard />
              </div>
            )}

            {/* Stop button */}
            <div className="relative flex items-center justify-center py-4">
              <span className="absolute inline-flex h-[160px] w-[160px] rounded-full bg-danger/20 animate-pulse-ring" />
              <span className="absolute inline-flex h-[145px] w-[145px] rounded-full bg-danger/10 animate-pulse-ring-2" />
              <button
                type="button"
                onClick={stopAnalysis}
                className="relative z-10 flex h-[120px] w-[120px] items-center justify-center rounded-full bg-danger shadow-danger transition-all duration-200 active:scale-95"
                aria-label="Detener y ver resultado"
              >
                <Square className="h-10 w-10 text-white" strokeWidth={2.5} />
              </button>
            </div>
            <p className="text-sm font-medium text-neutral-500">Detener y ver resultado</p>
          </div>
        )}

        {/* ── ANALYZING ── */}
        {status === "analyzing" && <CyclingLoader />}

        {/* ── DONE ── */}
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
            "Reciba la llamada del supuesto familiar.",
            'Presione el botón azul "Analizar llamada".',
            "Acerque el teléfono al micrófono.",
            'Presione "Detener" para ver el resultado.',
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
