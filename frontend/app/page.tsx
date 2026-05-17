"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Mic,
  ShieldCheck,
  Phone,
  AlertTriangle,
  UserCheck,
  Bell,
  Zap,
  Brain,
  Fingerprint,
  MessageSquare,
} from "lucide-react";
import { getStats } from "@/lib/api";
import type { Stats } from "@/lib/types";

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    getStats().then(setStats).catch(() => {});
  }, []);

  return (
    <main>
      {/* ── Hero ── */}
      <section
        className="px-6 py-20 sm:py-28"
        style={{
          background: "linear-gradient(160deg, #EFF6FF 0%, #F8FAFC 55%, #F0FDF4 100%)",
        }}
      >
        <div className="mx-auto max-w-2xl text-center">
          {/* Icon */}
          <div
            className="mx-auto mb-8 flex h-28 w-28 items-center justify-center rounded-[28px] shadow-brand-lg"
            style={{ background: "linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)" }}
          >
            <ShieldCheck className="h-16 w-16 text-white" strokeWidth={1.75} />
          </div>

          <h1 className="text-5xl font-bold tracking-tight text-neutral-900 sm:text-6xl">
            Voice<span className="text-gradient-brand">Guard</span>
          </h1>

          <p className="mt-5 text-2xl font-semibold text-neutral-700 sm:text-3xl" style={{ letterSpacing: "-0.01em" }}>
            Protege a tu familia del fraude de voz clonada
          </p>

          <p className="mx-auto mt-5 max-w-xl text-senior text-neutral-600">
            Detecta en segundos si una llamada usa una voz creada por inteligencia artificial.
            Diseñado para adultos mayores y sus familias.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/demo" className="btn-primary w-full sm:w-auto text-lg px-10 py-5">
              ▶ Ver demo en vivo
            </Link>
            <Link href="/analyze" className="btn-secondary w-full sm:w-auto text-lg px-10 py-5">
              <Mic className="h-5 w-5" />
              Probar con tu propio audio
            </Link>
          </div>
        </div>
      </section>

      {/* ── Problem statement ── */}
      <section className="bg-white px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <div
            className="rounded-[20px] border border-danger-bg p-8"
            style={{ background: "linear-gradient(160deg, #FEF2F2 0%, #FFFFFF 50%)" }}
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-danger-bg">
                <AlertTriangle className="h-6 w-6 text-danger" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-red-900">
                  El fraude por voz clonada creció{" "}
                  <span className="text-danger">800%</span> en Latinoamérica
                </h2>
                <p className="mt-3 text-senior text-red-800">
                  Estafadores usan IA para imitar la voz de un familiar y pedir dinero.
                  Una llamada de 3 segundos basta para crear una réplica convincente.
                </p>
                <p className="mt-3 text-senior font-semibold text-red-900">
                  VoiceGuard analiza la llamada en vivo y te avisa si la voz es real o falsa.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-neutral-50 px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <p className="mb-2 text-center text-sm font-semibold uppercase tracking-widest text-brand">
            Impacto real
          </p>
          <h2 className="text-center text-3xl font-bold text-neutral-900">
            VoiceGuard en acción
          </h2>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard
              icon={<Phone className="h-7 w-7" />}
              label="Llamadas analizadas"
              value={stats?.total_analyses ?? "—"}
              color="brand"
            />
            <StatCard
              icon={<AlertTriangle className="h-7 w-7" />}
              label="Fraudes detectados"
              value={stats?.fraud_detected ?? "—"}
              color="danger"
            />
            <StatCard
              icon={<UserCheck className="h-7 w-7" />}
              label="Personas protegidas"
              value={stats?.contacts_protected ?? "—"}
              color="success"
            />
            <StatCard
              icon={<Bell className="h-7 w-7" />}
              label="Alertas enviadas"
              value={stats?.alerts_sent ?? "—"}
              color="brand"
            />
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-white px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <p className="mb-2 text-center text-sm font-semibold uppercase tracking-widest text-brand">
            Proceso
          </p>
          <h2 className="text-center text-3xl font-bold text-neutral-900">¿Cómo funciona?</h2>
          <ol className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {[
              {
                n: 1,
                title: "Registra voces de confianza",
                body: "Graba la voz de tu familiar una sola vez. VoiceGuard crea una huella única y privada.",
              },
              {
                n: 2,
                title: "Analiza la llamada",
                body: "Cuando recibas una llamada extraña, acerca el teléfono y presiona el botón.",
              },
              {
                n: 3,
                title: "Recibe el veredicto",
                body: "VoiceGuard te dice en segundos si es la voz real, desconocida o una suplantación con IA.",
              },
            ].map(({ n, title, body }, i) => (
              <li
                key={n}
                className="card p-6"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl text-base font-bold text-white shadow-brand"
                  style={{ background: "linear-gradient(135deg, #2563EB, #3B82F6)" }}
                >
                  {n}
                </div>
                <h3 className="text-lg font-bold text-neutral-900">{title}</h3>
                <p className="mt-2 text-base text-neutral-600 leading-relaxed">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Tech ── */}
      <section className="px-6 py-16" style={{ background: "linear-gradient(135deg, #1E40AF 0%, #1d4ed8 100%)" }}>
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-blue-200">
            Tecnología
          </p>
          <h2 className="text-3xl font-bold text-white">La ciencia detrás de VoiceGuard</h2>
          <div className="mt-10 grid grid-cols-1 gap-4 text-left sm:grid-cols-2">
            {[
              {
                Icon: Brain,
                title: "Detector con IA pre-entrenada",
                body: "Modelo wav2vec2 fine-tuned en miles de muestras de voz real y sintética.",
              },
              {
                Icon: Fingerprint,
                title: "Verificación de identidad",
                body: "Comparación con voces registradas usando embeddings de resemblyzer.",
              },
              {
                Icon: Zap,
                title: "Análisis en tiempo real",
                body: "WebSocket streaming devuelve un score cada 2 segundos durante la llamada.",
              },
              {
                Icon: MessageSquare,
                title: "Alerta a la familia",
                body: "Notificación inmediata por WhatsApp cuando se detecta una suplantación.",
              },
            ].map(({ Icon, title, body }) => (
              <div
                key={title}
                className="rounded-[20px] p-6 transition-all duration-200 hover:bg-white/10"
                style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
              >
                <Icon className="mb-3 h-6 w-6 text-blue-200" strokeWidth={1.75} />
                <h3 className="text-lg font-bold text-white">{title}</h3>
                <p className="mt-2 text-base text-blue-100 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="bg-neutral-50 px-6 py-16">
        <div
          className="mx-auto max-w-2xl rounded-[24px] p-10 text-center"
          style={{ background: "linear-gradient(160deg, #EFF6FF 0%, #FFFFFF 60%)", border: "1px solid #DBEAFE" }}
        >
          <h2 className="text-3xl font-bold text-neutral-900">
            Empieza ahora — toma 2 minutos
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-senior text-neutral-600">
            Registra la voz de tu familiar y prueba el detector. Cuando llegue una llamada
            sospechosa, estarás listo.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/enroll" className="btn-primary w-full sm:w-auto text-lg px-10 py-5">
              <UserCheck className="h-5 w-5" />
              Registrar primer contacto
            </Link>
            <Link href="/analyze" className="btn-secondary w-full sm:w-auto text-lg px-10 py-5">
              <Mic className="h-5 w-5" />
              Probar el detector
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: "brand" | "danger" | "success";
}) {
  const colorMap = {
    brand: { icon: "#2563EB", value: "#2563EB", bg: "#EFF6FF" },
    danger: { icon: "#DC2626", value: "#DC2626", bg: "#FEF2F2" },
    success: { icon: "#16A34A", value: "#16A34A", bg: "#F0FDF4" },
  };
  const c = colorMap[color];

  return (
    <div className="card card-hover p-6 text-center">
      <div
        className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl"
        style={{ backgroundColor: c.bg, color: c.icon }}
      >
        {icon}
      </div>
      <p className="text-4xl font-bold" style={{ color: c.value }}>{value}</p>
      <p className="mt-2 text-sm font-semibold text-neutral-500 leading-tight">{label}</p>
    </div>
  );
}
