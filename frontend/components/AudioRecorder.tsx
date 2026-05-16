"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onRecorded: (blob: Blob) => void;
  disabled?: boolean;
}

export function AudioRecorder({ onRecorded, disabled }: Props) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (recording) {
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [recording]);

  async function start() {
    chunksRef.current = [];
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      stream.getTracks().forEach((t) => t.stop());
      onRecorded(blob);
    };
    recorder.start();
    recorderRef.current = recorder;
    setRecording(true);
  }

  function stop() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Circular button with pulse rings */}
      <div className="relative flex items-center justify-center">
        {recording && (
          <>
            <span className="absolute inline-flex h-[160px] w-[160px] rounded-full bg-danger/20 animate-pulse-ring" />
            <span className="absolute inline-flex h-[145px] w-[145px] rounded-full bg-danger/15 animate-pulse-ring-2" />
            <span className="absolute inline-flex h-[130px] w-[130px] rounded-full bg-danger/10 animate-pulse-ring-3" />
          </>
        )}
        <button
          type="button"
          onClick={recording ? stop : start}
          disabled={disabled}
          className={cn(
            "relative z-10 flex h-[120px] w-[120px] items-center justify-center rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed",
            recording
              ? "bg-danger shadow-danger"
              : "shadow-brand-lg",
          )}
          style={
            !recording
              ? { background: "linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)" }
              : undefined
          }
          aria-label={recording ? "Detener grabación" : "Iniciar grabación"}
        >
          {recording ? (
            <Square className="h-10 w-10 text-white" strokeWidth={2.5} />
          ) : (
            <Mic className="h-12 w-12 text-white" strokeWidth={2} />
          )}
        </button>
      </div>

      {/* Timer */}
      {recording && (
        <div
          className="font-mono-display text-3xl font-semibold tabular-nums text-danger animate-fade-up"
        >
          {mins}:{secs}
        </div>
      )}

      {/* Label */}
      <p className="text-center text-base font-medium text-neutral-500">
        {disabled
          ? "Procesando…"
          : recording
          ? "Acerque el teléfono al micrófono"
          : "Presione para grabar la voz"}
      </p>
    </div>
  );
}
