"use client";

import { useState } from "react";
import { AudioRecorder } from "@/components/AudioRecorder";
import { RiskIndicator } from "@/components/RiskIndicator";
import type { AnalyzeResponse } from "@/lib/types";
import { analyzeAudio } from "@/lib/api";

export default function Home() {
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRecording(blob: Blob) {
    setLoading(true);
    try {
      const res = await analyzeAudio(blob);
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-4xl font-bold tracking-tight">VoiceGuard</h1>
      <p className="mt-2 text-senior text-gray-600">
        Protege a tu familia de estafas con voz clonada por IA.
      </p>

      <section className="mt-12">
        <AudioRecorder onRecorded={handleRecording} disabled={loading} />
      </section>

      <section className="mt-12">
        {loading && <p className="text-senior">Analizando voz...</p>}
        {result && <RiskIndicator result={result} />}
      </section>
    </main>
  );
}
