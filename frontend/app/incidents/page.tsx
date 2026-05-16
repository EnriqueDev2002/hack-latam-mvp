"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, AlertTriangle, CheckCircle2, Bell, X } from "lucide-react";
import { listIncidents, sendAlert } from "@/lib/api";
import type { Incident, RiskLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

type Feedback = { kind: "success" | "error"; message: string };

const RISK_CONFIG: Record<
  RiskLevel,
  { label: string; badge: string; borderColor: string; Icon: typeof ShieldAlert }
> = {
  high: {
    label: "Alto riesgo",
    badge: "badge badge-danger",
    borderColor: "#FEE2E2",
    Icon: ShieldAlert,
  },
  medium: {
    label: "Sospechoso",
    badge: "badge badge-warning",
    borderColor: "#FEF3C7",
    Icon: AlertTriangle,
  },
  low: {
    label: "Seguro",
    badge: "badge badge-success",
    borderColor: "#DCFCE7",
    Icon: CheckCircle2,
  },
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
  const [phoneModalFor, setPhoneModalFor] = useState<Incident | null>(null);
  const [phoneInput, setPhoneInput] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    setLoading(true);
    const risk = filter === "all" ? undefined : filter;
    listIncidents(20, risk)
      .then(setIncidents)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  function openAlertModal(incident: Incident) {
    setPhoneInput("");
    setPhoneModalFor(incident);
  }

  function closeAlertModal() {
    setPhoneModalFor(null);
    setPhoneInput("");
  }

  async function confirmAlert(e: React.FormEvent) {
    e.preventDefault();
    const incident = phoneModalFor;
    const phone = phoneInput.trim();
    if (!incident || !phone) return;
    setAlerting(incident.id);
    closeAlertModal();
    try {
      await sendAlert(incident.id, phone);
      setIncidents((prev) =>
        prev.map((i) => (i.id === incident.id ? { ...i, alerted: true } : i)),
      );
      setFeedback({ kind: "success", message: "¡Alerta enviada por WhatsApp!" });
    } catch {
      setFeedback({ kind: "error", message: "No se pudo enviar la alerta." });
    } finally {
      setAlerting(null);
    }
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-neutral-900">Historial de alertas</h1>
        <p className="mt-2 text-senior text-neutral-600">
          Llamadas y audios analizados recientemente.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={cn(
              "rounded-[12px] border-2 px-5 py-2.5 text-base font-semibold transition-all duration-150",
              filter === value
                ? "border-brand bg-brand text-white shadow-brand"
                : "border-neutral-200 bg-white text-neutral-600 hover:border-brand-light hover:text-brand",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      <section className="mt-6 flex flex-col gap-4">
        {loading && (
          <>
            <div className="skeleton h-24 w-full" />
            <div className="skeleton h-24 w-full" />
            <div className="skeleton h-24 w-full" />
          </>
        )}

        {!loading && incidents.length === 0 && (
          <div className="card p-10 text-center">
            <p className="text-senior text-neutral-500">No hay incidentes en esta categoría.</p>
          </div>
        )}

        {incidents.map((incident, idx) => {
          const { label, badge, borderColor, Icon } = RISK_CONFIG[incident.risk_level];
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
              className="card p-6 animate-fade-up animate-fill-forwards"
              style={{
                animationDelay: `${idx * 60}ms`,
                borderLeft: `4px solid ${borderColor}`,
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div
                    className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: borderColor }}
                  >
                    <Icon className="h-5 w-5" style={{ color: RISK_CONFIG[incident.risk_level].badge.includes("danger") ? "#DC2626" : RISK_CONFIG[incident.risk_level].badge.includes("warning") ? "#D97706" : "#16A34A" }} />
                  </div>
                  <div>
                    <span className={badge}>{label}</span>
                    <p className="mt-1 text-sm text-neutral-500">{date}</p>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {incident.risk_level === "high" && !incident.alerted && (
                    <button
                      onClick={() => openAlertModal(incident)}
                      disabled={alerting === incident.id}
                      className="flex items-center gap-2 rounded-[12px] bg-danger px-4 py-2.5 text-sm font-semibold text-white shadow-danger transition-all duration-150 hover:bg-red-700 active:scale-95 disabled:opacity-50"
                    >
                      <Bell className="h-4 w-4" />
                      {alerting === incident.id ? "Enviando…" : "Alertar"}
                    </button>
                  )}
                  {incident.alerted && (
                    <span className="badge badge-neutral">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Alertado
                    </span>
                  )}
                </div>
              </div>

              {/* Meta row */}
              <div className="mt-4 flex items-center gap-4 text-sm text-neutral-500">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium">Confianza:</span>
                  <span className="font-bold text-neutral-700">{pct}%</span>
                </div>
                {incident.matched_contact && (
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium">Contacto:</span>
                    <span className="font-bold text-neutral-700">{incident.matched_contact}</span>
                  </div>
                )}
              </div>

              {/* Confidence mini-bar */}
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-100">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: incident.risk_level === "high" ? "#DC2626" : incident.risk_level === "medium" ? "#D97706" : "#16A34A",
                  }}
                />
              </div>
            </div>
          );
        })}
      </section>

      {/* Toast */}
      {feedback && (
        <div
          role="status"
          className={cn(
            "fixed inset-x-4 top-4 z-50 mx-auto flex max-w-md items-center justify-between gap-4 rounded-[16px] border px-5 py-4 shadow-card-hover animate-slide-up animate-fill-forwards",
            feedback.kind === "success"
              ? "border-success-bg bg-success-light text-green-800"
              : "border-danger-bg bg-danger-light text-red-800",
          )}
        >
          <span className="text-base font-semibold">{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            className="rounded-lg p-1.5 transition hover:bg-black/5"
            aria-label="Cerrar mensaje"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Alert modal */}
      {phoneModalFor && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="alert-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={closeAlertModal}
        >
          <form
            onSubmit={confirmAlert}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-[24px] bg-white p-8 shadow-[0_24px_48px_rgba(0,0,0,0.15)] animate-scale-in animate-fill-forwards"
          >
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-bg">
              <Bell className="h-7 w-7 text-danger" />
            </div>
            <h2 id="alert-modal-title" className="text-2xl font-bold text-neutral-900">
              Enviar alerta por WhatsApp
            </h2>
            <p className="mt-2 text-senior text-neutral-600">
              Escriba el número del familiar con código de país.
            </p>
            <input
              type="tel"
              inputMode="tel"
              autoFocus
              required
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="+521234567890"
              className="input-field mt-5"
            />
            <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
              <button type="submit" className="btn-primary flex-1 text-senior" style={{ background: "linear-gradient(135deg, #DC2626, #EF4444)" }}>
                Enviar alerta
              </button>
              <button
                type="button"
                onClick={closeAlertModal}
                className="btn-secondary flex-1 text-senior"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
