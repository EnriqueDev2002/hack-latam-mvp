import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import type { AnalyzeResponse, RiskLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  result: AnalyzeResponse;
}

const RISK_COPY: Record<
  RiskLevel,
  { title: string; subtitle: string; bg: string; icon: typeof CheckCircle2 }
> = {
  low: {
    title: "Voz auténtica",
    subtitle: "Esta voz parece real. Puede continuar con la llamada.",
    bg: "bg-risk-low",
    icon: CheckCircle2,
  },
  medium: {
    title: "Voz sospechosa",
    subtitle: "Hay dudas sobre esta voz. Pida que le llamen de nuevo.",
    bg: "bg-risk-medium",
    icon: AlertTriangle,
  },
  high: {
    title: "¡Posible fraude!",
    subtitle: "Esta voz parece generada por computadora. No comparta datos ni dinero.",
    bg: "bg-risk-high",
    icon: ShieldAlert,
  },
};

export function RiskIndicator({ result }: Props) {
  const { title, subtitle, bg, icon: Icon } = RISK_COPY[result.risk_level];
  const pct = Math.round(result.confidence * 100);

  return (
    <div className={cn("rounded-2xl p-6 text-white shadow-lg", bg)}>
      <div className="flex items-center gap-3">
        <Icon className="h-9 w-9 flex-shrink-0" />
        <h2 className="text-2xl font-bold leading-tight">{title}</h2>
      </div>
      <p className="mt-3 text-senior font-medium leading-snug">{subtitle}</p>
      <p className="mt-2 text-base opacity-90">Confianza del análisis: {pct}%</p>
      {result.speaker_match === false && result.matched_contact && (
        <p className="mt-2 text-senior font-semibold">
          La voz no coincide con <strong>{result.matched_contact}</strong>.
        </p>
      )}
    </div>
  );
}
