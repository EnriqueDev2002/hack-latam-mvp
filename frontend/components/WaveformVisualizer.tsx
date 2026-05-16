"use client";

import { useEffect, useRef } from "react";
import type { RiskLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  stream: MediaStream | null;
  risk: RiskLevel | null;
}

const COLORS: Record<RiskLevel, string> = {
  low: "#15803d",     // green
  medium: "#b45309",  // amber
  high: "#b91c1c",    // red
};

const BAR_COUNT = 48;

/**
 * Live waveform visualizer.
 * Reads frequency data from the mic stream via WebAudio AnalyserNode and
 * draws colored bars whose hue tracks the current risk level.
 */
export function WaveformVisualizer({ stream, risk }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const riskRef = useRef<RiskLevel | null>(risk);

  useEffect(() => {
    riskRef.current = risk;
  }, [risk]);

  useEffect(() => {
    if (!stream) return;

    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const audioCtx = new AudioCtx();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 128;
    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);

    ctxRef.current = audioCtx;
    analyserRef.current = analyser;
    sourceRef.current = source;

    const data = new Uint8Array(analyser.frequencyBinCount);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const c = canvas.getContext("2d");
    if (!c) return;

    const draw = () => {
      analyser.getByteFrequencyData(data);
      const w = canvas.width;
      const h = canvas.height;
      c.clearRect(0, 0, w, h);

      const color = COLORS[riskRef.current ?? "low"];
      c.fillStyle = color;
      c.shadowBlur = 8;
      c.shadowColor = color;

      const barWidth = w / BAR_COUNT;
      const step = Math.floor(data.length / BAR_COUNT);
      for (let i = 0; i < BAR_COUNT; i++) {
        const v = data[i * step] / 255;
        const barH = Math.max(4, v * h * 0.9);
        const x = i * barWidth + barWidth * 0.15;
        const y = h / 2 - barH / 2;
        c.fillRect(x, y, barWidth * 0.7, barH);
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      try {
        source.disconnect();
        analyser.disconnect();
      } catch {}
      audioCtx.close().catch(() => {});
      sourceRef.current = null;
      analyserRef.current = null;
      ctxRef.current = null;
    };
  }, [stream]);

  return (
    <div
      className={cn(
        "rounded-2xl border-2 p-4 transition-colors",
        risk === "high"
          ? "border-red-300 bg-red-50"
          : risk === "medium"
            ? "border-amber-300 bg-amber-50"
            : "border-green-300 bg-green-50",
      )}
    >
      <canvas ref={canvasRef} width={600} height={120} className="h-24 w-full" />
    </div>
  );
}
