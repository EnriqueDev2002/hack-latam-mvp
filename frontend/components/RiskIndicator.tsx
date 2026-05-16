import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import type { AnalyzeResponse, RiskLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  result: AnalyzeResponse;
}

const RISK_COPY: Record<RiskLevel, { title: string; bg: string; icon: typeof CheckCircle2 }> = {
  low: { title: "Voz auténtica", bg: "bg-risk-low", icon: CheckCircle2 },
  medium: { title: "Voz sospechosa", bg: "bg-risk-medium", icon: AlertTriangle },
  high: { title: "Voz probablemente clonada", bg: "bg-risk-high", icon: ShieldAlert },
};

export function RiskIndicator({ result }: Props) {
  const { title, bg, icon: Icon } = RISK_COPY[result.risk_level];
  const pct = Math.round(result.confidence * 100);

  return (
    <div className={cn("rounded-2xl p-6 text-white shadow-lg", bg)}>
      <div className="flex items-center gap-3">
        <Icon className="h-8 w-8" />
        <h2 className="text-2xl font-bold">{title}</h2>
      </div>
      <p className="mt-2 text-senior">Confianza: {pct}%</p>
      {result.speaker_match === false && result.matched_contact && (
        <p className="mt-2 text-senior">
          La voz no coincide con <strong>{result.matched_contact}</strong>.
        </p>
      )}
    </div>
  );
}
