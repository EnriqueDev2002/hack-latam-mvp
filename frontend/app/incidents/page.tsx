"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, AlertTriangle, CheckCircle2, Bell } from "lucide-react";
import { listIncidents, sendAlert } from "@/lib/api";
import type { Incident, RiskLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

const RISK_CONFIG: Record<RiskLevel, { label: string; color: string; Icon: typeof ShieldAlert }> = {
  high: { label: "Alto riesgo", color: "text-red-600 bg-red-50 border-red-200", Icon: ShieldAlert },
  medium: { label: "Sospechoso", color: "text-amber-600 bg-amber-50 border-amber-200", Icon: AlertTriangle },
  low: { label: "Seguro", color: "text-green-600 bg-green-50 border-green-200", Icon: CheckCircle2 },
};

const FILTER_OPTIONS: { value: RiskLevel | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "high", label: "Alto riesgo" },
  { value: "medium", label: "Sospechosos" },
  { value: "low", label: "Seguros" },
];

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filter, setFilter] = useState<RiskLevel | "all">("all");
  const [loading, setLoading] = useState(true);
  const [alerting, setAlerting] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const risk = filter === "all" ? undefined : filter;
    listIncidents(20, risk)
      .then(setIncidents)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  async function handleAlert(incident: Incident) {
    const phone = prompt("Número de WhatsApp del familiar (ej: +521234567890):");
    if (!phone) return;
    setAlerting(incident.id);
    try {
      await sendAlert(incident.id, phone);
      alert("¡Alerta enviada por WhatsApp!");
    } catch {
      alert("No se pudo enviar la alerta.");
    } finally {
      setAlerting(null);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900">Historial de alertas</h1>
      <p className="mt-2 text-senior text-gray-600">
        Llamadas y audios analizados recientemente.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        {FILTER_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={cn(
              "rounded-xl border-2 px-5 py-3 text-base font-semibold transition",
              filter === value
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-gray-200 bg-white text-gray-700 hover:border-blue-300",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <section className="mt-6 flex flex-col gap-4">
        {loading && (
          <p className="text-senior text-gray-500">Cargando incidentes…</p>
        )}

        {!loading && incidents.length === 0 && (
          <div className="rounded-2xl border bg-white p-8 text-center">
            <p className="text-senior text-gray-500">No hay incidentes en esta categoría.</p>
          </div>
        )}

        {incidents.map((incident) => {
          const { label, color, Icon } = RISK_CONFIG[incident.risk_level];
          const date = new Date(incident.created_at).toLocaleString("es-MX", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          });
          const pct = Math.round(incident.confidence * 100);

          return (
            <div
              key={incident.id}
              className={cn("rounded-2xl border-2 bg-white p-6 shadow-sm", color.split(" ")[2])}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Icon className={cn("h-7 w-7", color.split(" ")[0])} />
                  <div>
                    <p className={cn("text-senior font-bold", color.split(" ")[0])}>{label}</p>
                    <p className="text-sm text-gray-500">{date}</p>
                  </div>
                </div>
                {incident.risk_level === "high" && !incident.alerted && (
                  <button
                    onClick={() => handleAlert(incident)}
                    disabled={alerting === incident.id}
                    className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-base font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                  >
                    <Bell className="h-5 w-5" />
                    {alerting === incident.id ? "Enviando…" : "Alertar"}
                  </button>
                )}
                {incident.alerted && (
                  <span className="rounded-xl bg-gray-100 px-4 py-3 text-sm font-medium text-gray-500">
                    Alertado
                  </span>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
                <span>Confianza: <strong>{pct}%</strong></span>
                {incident.matched_contact && (
                  <span>Contacto: <strong>{incident.matched_contact}</strong></span>
                )}
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}
