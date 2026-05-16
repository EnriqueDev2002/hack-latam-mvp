"use client";

import { useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onRecorded: (blob: Blob) => void;
  disabled?: boolean;
}

export function AudioRecorder({ onRecorded, disabled }: Props) {
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

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

  return (
    <button
      type="button"
      onClick={recording ? stop : start}
      disabled={disabled}
      className={cn(
        "flex w-full items-center justify-center gap-3 rounded-2xl px-8 py-7 text-senior font-extrabold text-white shadow-md transition disabled:opacity-50",
        recording ? "bg-red-600 hover:bg-red-700" : "bg-brand hover:bg-brand-dark",
      )}
    >
      {recording ? <Square className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
      {recording ? "Detener" : "Analizar llamada"}
    </button>
  );
}
