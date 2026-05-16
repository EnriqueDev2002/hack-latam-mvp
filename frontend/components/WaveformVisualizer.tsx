"use client";

import { useEffect, useRef } from "react";
import type { RiskLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  stream: MediaStream | null;
  risk: RiskLevel | null;
}

const COLORS: Record<RiskLevel, { bar: string; glow: string; bg: string; border: string }> = {
  low: {
    bar: "#16A34A",
    glow: "rgba(22,163,74,0.4)",
    bg: "from-success-light to-white",
    border: "border-success-bg",
  },
  medium: {
    bar: "#D97706",
    glow: "rgba(217,119,6,0.4)",
    bg: "from-warning-light to-white",
    border: "border-warning-bg",
  },
  high: {
    bar: "#DC2626",
    glow: "rgba(220,38,38,0.4)",
    bg: "from-danger-light to-white",
    border: "border-danger-bg",
  },
};

const BAR_COUNT = 48;

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

      const level = riskRef.current ?? "low";
      const { bar, glow } = COLORS[level];

      const barWidth = w / BAR_COUNT;
      const step = Math.floor(data.length / BAR_COUNT);
      const radius = 3;

      for (let i = 0; i < BAR_COUNT; i++) {
        const v = data[i * step] / 255;
        const barH = Math.max(6, v * h * 0.88);
        const x = i * barWidth + barWidth * 0.2;
        const y = h / 2 - barH / 2;
        const bw = barWidth * 0.6;

        c.fillStyle = bar;
        c.shadowBlur = v > 0.3 ? 8 : 0;
        c.shadowColor = glow;

        c.beginPath();
        c.roundRect(x, y, bw, barH, radius);
        c.fill();
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

  const colors = COLORS[risk ?? "low"];

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[20px] border bg-gradient-to-b p-4 transition-all duration-500",
        colors.bg,
        colors.border,
      )}
    >
      <canvas
        ref={canvasRef}
        width={600}
        height={100}
        className="h-[80px] w-full"
      />
    </div>
  );
}
