"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FlaskConical, Mic, Square, Upload } from "lucide-react";
import { WaveformVisualizer } from "@/components/WaveformVisualizer";
import { AudioStreamer, WS_LAB_URL } from "@/lib/audio";
import { analyzeAudioLab } from "@/lib/api";
import type { LabAnalyzeResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

type Status = "idle" | "recording" | "analyzing" | "done" | "error";

function fmt(n: number | null | undefined, digits = 3): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return n.toFixed(digits);
}

function riskColor(level: string): string {
  if (level === "high") return "text-red-700 bg-red-50";
  if (level === "medium") return "text-amber-700 bg-amber-50";
  return "text-emerald-700 bg-emerald-50";
}

function ResultPanel({ result }: { result: LabAnalyzeResponse }) {
  const d = result.debug;
  return (
    <div className="flex flex-col gap-4 rounded-[14px] border border-neutral-200 bg-white p-5 text-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold text-neutral-900">Resultado</h3>
        <span className={cn("rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide", riskColor(result.risk_level))}>
          {result.risk_level} · {result.is_synthetic ? "IA" : "real"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 font-mono text-xs">
        <div><span className="text-neutral-500">final_score</span><div className="text-neutral-900">{fmt(result.confidence)}</div></div>
        <div><span className="text-neutral-500">synthetic_threshold</span><div className="text-neutral-900">{fmt(d.synthetic_threshold, 2)}</div></div>
        <div><span className="text-neutral-500">duration</span><div className="text-neutral-900">{fmt(d.duration_s, 1)}s</div></div>
        <div><span className="text-neutral-500">ensemble</span><div className="text-neutral-900 truncate" title={d.ensemble_reason}>{d.ensemble_reason || "—"}</div></div>
      </div>

      {/* Modelos */}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-[10px] bg-neutral-50 p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">HF model</div>
          <div className="mt-1 break-all font-mono text-[11px] text-neutral-700">{d.hf_model_id}</div>
          <div className="mt-2 font-mono text-sm text-neutral-900">fake_score: {fmt(d.hf_fake_score)}</div>
        </div>

        <div className="rounded-[10px] bg-neutral-50 p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Heurística</div>
          <div className="mt-1 font-mono text-[11px] text-neutral-700">rule-based (pitch, mfcc, sf, zcr)</div>
          <div className="mt-2 font-mono text-sm text-neutral-900">score: {fmt(d.heuristic_score)}</div>
        </div>

        <div className="rounded-[10px] bg-neutral-50 p-3 md:col-span-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Modelo secundario (comparar)</div>
          {d.secondary ? (
            <>
              <div className="mt-1 break-all font-mono text-[11px] text-neutral-700">{d.secondary.model_id}</div>
              {d.secondary.error ? (
                <div className="mt-2 font-mono text-sm text-red-700">error: {d.secondary.error}</div>
              ) : (
                <div className="mt-2 font-mono text-sm text-neutral-900">
                  fake_score: {fmt(d.secondary.fake_score)} · {d.secondary.is_synthetic ? "IA" : "real"}
                </div>
              )}
            </>
          ) : (
            <div className="mt-1 font-mono text-[11px] text-neutral-500">
              Pendiente. Settear COMPARE_DEEPFAKE_MODEL_ID en backend/.env para activar.
            </div>
          )}
        </div>
      </div>

      {/* Speaker match */}
      <div className="rounded-[10px] bg-neutral-50 p-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Speaker match</div>
        <div className="mt-2 grid grid-cols-3 gap-3 font-mono text-xs">
          <div><span className="text-neutral-500">match</span><div className="text-neutral-900">{result.speaker_match === null ? "—" : result.speaker_match ? "YES" : "no"}</div></div>
          <div><span className="text-neutral-500">score</span><div className="text-neutral-900">{fmt(result.speaker_match_score)}</div></div>
          <div><span className="text-neutral-500">threshold</span><div className="text-neutral-900">{fmt(result.speaker_match_threshold, 2)}</div></div>
        </div>
        {result.matched_contact && (
          <div className="mt-2 text-xs">contacto: <span className="font-mono">{result.matched_contact}</span></div>
        )}
      </div>

      {/* Features */}
      {d.features && (
        <details className="rounded-[10px] bg-neutral-50 p-3">
          <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-neutral-500">Features acústicos</summary>
          <div className="mt-2 grid grid-cols-2 gap-2 font-mono text-xs md:grid-cols-3">
            {Object.entries(d.features).map(([k, v]) => (
              <div key={k}><span className="text-neutral-500">{k}</span><div className="text-neutral-900">{fmt(v, 4)}</div></div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

export default function LabPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [liveScore, setLiveScore] = useState<LabAnalyzeResponse | null>(null);
  const [finalResult, setFinalResult] = useState<LabAnalyzeResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
  const streamerRef = useRef<AudioStreamer<LabAnalyzeResponse> | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (status === "recording") {
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
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

    const streamer = new AudioStreamer<LabAnalyzeResponse>(WS_LAB_URL);
    streamerRef.current = streamer;
    try {
      await streamer.start((score) => setLiveScore(score), () => {});
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
      setErrorMsg("No se pudo acceder al micrófono. Verifica permisos.");
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
      const result = await analyzeAudioLab(blob);
      setFinalResult(result);
      setStatus("done");
    } catch {
      setErrorMsg("Falló el análisis. Revisa el backend.");
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
      const result = await analyzeAudioLab(file);
      setFinalResult(result);
      setStatus("done");
    } catch {
      setErrorMsg("Falló el análisis. Revisa el backend.");
      setStatus("error");
    }
  }, []);

  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-neutral-900">
          <FlaskConical className="h-6 w-6 text-white" strokeWidth={2} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Lab</h1>
          <p className="text-sm text-neutral-500">Pruebas internas — scores crudos del detector.</p>
        </div>
      </div>

      <div className="mb-4 rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
        Página no listada en la nav principal. Usa esta vista para calibrar y experimentar con audio re-grabado / file upload.
      </div>

      {/* Inputs */}
      <section className="grid gap-4 md:grid-cols-2">
        {/* Mic */}
        <div className="card p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Micrófono (vivo)</h2>
          {status === "recording" ? (
            <div className="flex flex-col items-center gap-3">
              <div className="font-mono text-3xl tabular-nums text-neutral-900">{mins}:{secs}</div>
              {activeStream && (
                <div className="w-full">
                  <WaveformVisualizer stream={activeStream} risk={liveScore?.risk_level ?? null} />
                </div>
              )}
              {liveScore && (
                <div className="w-full rounded-[10px] bg-neutral-50 p-3 text-xs font-mono">
                  <div>live confidence: {fmt(liveScore.confidence)}</div>
                  <div>hf: {fmt(liveScore.debug.hf_fake_score)} · heur: {fmt(liveScore.debug.heuristic_score)}</div>
                  {liveScore.speaker_match_score !== null && (
                    <div>spk sim: {fmt(liveScore.speaker_match_score)} → {liveScore.speaker_match ? liveScore.matched_contact : "no match"}</div>
                  )}
                </div>
              )}
              <button
                type="button"
                onClick={stopAnalysis}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white"
              >
                <Square className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              disabled={status === "analyzing"}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-[12px] border border-dashed border-neutral-300 py-8 text-sm text-neutral-600 hover:bg-neutral-50"
            >
              <Mic className="h-6 w-6" />
              Grabar desde mic
            </button>
          )}
        </div>

        {/* Upload */}
        <div className="card p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Archivo</h2>
          <label className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-[12px] border border-dashed border-neutral-300 py-8 text-sm text-neutral-600 hover:bg-neutral-50">
            <Upload className="h-6 w-6" />
            Subir audio
            <input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </section>

      {/* Status */}
      {status === "analyzing" && (
        <div className="mt-6 rounded-[10px] bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
          Analizando…
        </div>
      )}

      {status === "error" && errorMsg && (
        <div className="mt-6 rounded-[10px] bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
          {errorMsg}
        </div>
      )}

      {/* Result */}
      {status === "done" && finalResult && (
        <section className="mt-6">
          <ResultPanel result={finalResult} />
          <button
            type="button"
            onClick={reset}
            className="mt-4 text-sm text-neutral-500 underline"
          >
            Nueva prueba
          </button>
        </section>
      )}
    </main>
  );
}
