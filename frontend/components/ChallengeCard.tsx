"use client";

import { useCallback, useEffect, useState } from "react";
import { Shield, RefreshCw, Sparkles } from "lucide-react";
import { getChallenge } from "@/lib/api";
import type { Challenge } from "@/lib/types";
import { cn } from "@/lib/utils";

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
    <div
      className="rounded-[20px] border p-6"
      style={{
        background: "linear-gradient(160deg, #EFF6FF 0%, #FFFFFF 50%)",
        borderColor: "#DBEAFE",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-light">
          <Shield className="h-5 w-5 text-brand" strokeWidth={2} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-neutral-900">Verificación adicional</h3>
          <p className="text-sm font-semibold text-brand">{kindLabel}</p>
        </div>
      </div>

      <p className="mt-4 text-base text-neutral-600">
        Antes de continuar, pídale al llamador:
      </p>

      {/* Challenge prompt */}
      <div className="mt-3 rounded-[14px] border border-neutral-200 bg-white p-5 shadow-card">
        <Sparkles className="mb-2 h-4 w-4 text-brand" />
        <p
          className={cn(
            "text-senior font-bold text-neutral-900",
            loading && "opacity-40",
          )}
        >
          {challenge?.prompt ?? "Cargando desafío…"}
        </p>
      </div>

      {challenge && (
        <p className="mt-3 text-sm text-neutral-500 leading-relaxed">
          {challenge.instructions}
        </p>
      )}

      {/* Refresh button */}
      <button
        type="button"
        onClick={refresh}
        disabled={loading}
        className="mt-4 inline-flex items-center gap-2 rounded-[12px] border-2 border-brand-light bg-white px-4 py-2.5 text-sm font-semibold text-brand transition-all duration-150 hover:bg-brand-50 active:scale-95 disabled:opacity-50"
      >
        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        Generar otra prueba
      </button>
    </div>
  );
}
