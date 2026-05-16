"use client";

import { useCallback, useEffect, useState } from "react";
import { Shield, RefreshCw, Sparkles } from "lucide-react";
import { getChallenge } from "@/lib/api";
import type { Challenge } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Liveness challenge: when the detector flags suspicion, the elderly user
 * gets a random phrase they can ask the caller to repeat. A pre-recorded
 * AI clone can't improvise, so this is a defensive check that works even
 * if the voice model fails.
 */
export function ChallengeCard() {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const c = await getChallenge();
      setChallenge(c);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!challenge && !loading) return null;

  const kindLabel = challenge?.kind === "personal" ? "Pregunta personal" : "Frase improvisada";

  return (
    <div className="rounded-2xl border-4 border-blue-400 bg-blue-50 p-6 shadow-md">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-blue-700" />
        <div>
          <h3 className="text-xl font-extrabold text-blue-900">Verificación adicional</h3>
          <p className="text-sm font-semibold text-blue-700">{kindLabel}</p>
        </div>
      </div>

      <p className="mt-3 text-base text-blue-900">
        Antes de continuar, pídale al llamador:
      </p>

      <div className="mt-3 rounded-xl bg-white p-5 shadow-inner">
        <Sparkles className="mb-2 inline h-5 w-5 text-blue-600" />
        <p className={cn("text-senior font-extrabold text-blue-900", loading && "opacity-50")}>
          {challenge?.prompt ?? "Cargando…"}
        </p>
      </div>

      {challenge && (
        <p className="mt-3 text-sm text-blue-800">{challenge.instructions}</p>
      )}

      <button
        type="button"
        onClick={refresh}
        disabled={loading}
        className="mt-4 inline-flex items-center gap-2 rounded-xl border-2 border-blue-300 bg-white px-4 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
      >
        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        Generar otra prueba
      </button>
    </div>
  );
}
