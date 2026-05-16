import type { AnalyzeResponse, RiskLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  result: AnalyzeResponse;
}

const RISK_COPY: Record<
  RiskLevel,
  { emoji: string; title: string; subtitle: string; bg: string; border: string }
> = {
  low: {
    emoji: "✅",
    title: "Voz auténtica",
    subtitle: "Esta voz parece real.\nPuede continuar con la llamada.",
    bg: "bg-green-50",
    border: "border-green-500",
  },
  medium: {
    emoji: "⚠️",
    title: "Voz sospechosa",
    subtitle: "Hay dudas sobre esta voz.\nPida que le llamen de nuevo.",
    bg: "bg-amber-50",
    border: "border-amber-500",
  },
  high: {
    emoji: "🚨",
    title: "¡Posible fraude!",
    subtitle: "Esta voz parece falsa.\nNo comparta datos ni dinero.",
    bg: "bg-red-50",
    border: "border-red-600",
  },
};

const TEXT_COLOR: Record<RiskLevel, string> = {
  low: "text-green-800",
  medium: "text-amber-800",
  high: "text-red-800",
};

export function RiskIndicator({ result }: Props) {
  const { emoji, title, subtitle, bg, border } = RISK_COPY[result.risk_level];
  const textColor = TEXT_COLOR[result.risk_level];
  const pct = Math.round(result.confidence * 100);

  return (
    <div className={cn("rounded-2xl border-4 p-6 shadow-md", bg, border)}>
      <div className="flex items-center gap-4">
        <span className="text-5xl leading-none">{emoji}</span>
        <h2 className={cn("text-3xl font-extrabold leading-tight", textColor)}>{title}</h2>
      </div>
      <p className={cn("mt-4 whitespace-pre-line text-senior font-semibold", textColor)}>
        {subtitle}
      </p>
      <p className={cn("mt-3 text-base font-medium opacity-70", textColor)}>
        Confianza del análisis: {pct}%
      </p>
      {result.speaker_match === true && result.matched_contact && (
        result.is_synthetic ? (
          <p className={cn("mt-2 text-senior font-bold", textColor)}>
            ⚠️ Posible suplantación de {result.matched_contact}.
          </p>
        ) : (
          <p className={cn("mt-2 text-senior font-bold", textColor)}>
            ✓ Voz verificada: {result.matched_contact}.
          </p>
        )
      )}
      {result.speaker_match === false && result.matched_contact && (
        <p className={cn("mt-2 text-senior font-bold", textColor)}>
          ⚠ La voz no coincide con {result.matched_contact}.
        </p>
      )}
    </div>
  );
}
