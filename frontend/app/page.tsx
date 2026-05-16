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
  TrendingUp,
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
      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-light to-cream px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-brand shadow-xl">
            <ShieldCheck className="h-16 w-16 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-brand sm:text-6xl">
            VoiceGuard
          </h1>
          <p className="mt-4 text-2xl font-bold text-brand-dark sm:text-3xl">
            Protege a tu familia del fraude de voz clonada
          </p>
          <p className="mx-auto mt-6 max-w-2xl text-senior text-gray-700">
            Una herramienta para detectar en segundos si una llamada usa una voz creada por
            inteligencia artificial. Pensada para adultos mayores y sus familias.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/demo"
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-brand px-10 py-5 text-xl font-extrabold text-white shadow-lg transition hover:bg-brand-dark active:scale-95 sm:w-auto"
            >
              ▶ Ver demo en vivo
            </Link>
            <Link
              href="/analyze"
              className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-brand bg-white px-10 py-5 text-xl font-bold text-brand transition hover:bg-brand-light sm:w-auto"
            >
              <Mic className="h-6 w-6" />
              Probar con tu voz
            </Link>
          </div>
        </div>
      </section>

      {/* Problem statement */}
      <section className="bg-white px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-3xl border-2 border-red-100 bg-red-50 p-8">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-10 w-10 flex-shrink-0 text-red-600" />
              <div>
                <h2 className="text-2xl font-extrabold text-red-900 sm:text-3xl">
                  El fraude por voz clonada creció <span className="text-red-600">800%</span> en
                  Latinoamérica
                </h2>
                <p className="mt-3 text-senior text-red-900">
                  Estafadores usan inteligencia artificial para imitar la voz de un familiar
                  y pedir dinero. Una llamada de 3 segundos basta para crear una réplica
                  convincente.
                </p>
                <p className="mt-3 text-senior font-semibold text-red-900">
                  VoiceGuard analiza la llamada en vivo y te avisa si la voz es real o falsa,
                  y si suplanta a un familiar registrado.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-cream px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-extrabold text-brand">
            VoiceGuard en acción
          </h2>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard
              icon={<Phone className="h-8 w-8" />}
              label="Llamadas analizadas"
              value={stats?.total_analyses ?? "—"}
            />
            <StatCard
              icon={<AlertTriangle className="h-8 w-8" />}
              label="Fraudes detectados"
              value={stats?.fraud_detected ?? "—"}
              accent="red"
            />
            <StatCard
              icon={<UserCheck className="h-8 w-8" />}
              label="Personas protegidas"
              value={stats?.contacts_protected ?? "—"}
              accent="green"
            />
            <StatCard
              icon={<Bell className="h-8 w-8" />}
              label="Alertas enviadas"
              value={stats?.alerts_sent ?? "—"}
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-extrabold text-brand">¿Cómo funciona?</h2>
          <ol className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              {
                n: 1,
                title: "Registra voces de confianza",
                body: "Graba la voz de tu familiar una sola vez. VoiceGuard crea una huella única y privada.",
              },
              {
                n: 2,
                title: "Analiza la llamada sospechosa",
                body: "Cuando recibas una llamada extraña, acerca el teléfono y presiona el botón.",
              },
              {
                n: 3,
                title: "Recibe un veredicto en segundos",
                body: "VoiceGuard te dice si es la voz real, una voz desconocida o una suplantación con IA.",
              },
            ].map(({ n, title, body }) => (
              <li
                key={n}
                className="rounded-2xl border-2 border-amber-100 bg-cream p-6 shadow-sm"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand text-lg font-extrabold text-white">
                  {n}
                </div>
                <h3 className="text-xl font-extrabold text-brand-dark">{title}</h3>
                <p className="mt-2 text-base text-gray-700">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Tech */}
      <section className="bg-brand px-6 py-16 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <TrendingUp className="mx-auto h-12 w-12" />
          <h2 className="mt-4 text-3xl font-extrabold">Tecnología detrás de VoiceGuard</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 text-left sm:grid-cols-2">
            <div className="rounded-2xl bg-brand-dark p-6">
              <h3 className="text-xl font-bold">Detector con IA pre-entrenada</h3>
              <p className="mt-2 text-base text-white/90">
                Modelo wav2vec2 fine-tuned en miles de muestras de voz real y sintética.
              </p>
            </div>
            <div className="rounded-2xl bg-brand-dark p-6">
              <h3 className="text-xl font-bold">Verificación de identidad</h3>
              <p className="mt-2 text-base text-white/90">
                Comparación con voces registradas usando embeddings de resemblyzer.
              </p>
            </div>
            <div className="rounded-2xl bg-brand-dark p-6">
              <h3 className="text-xl font-bold">Análisis en tiempo real</h3>
              <p className="mt-2 text-base text-white/90">
                WebSocket streaming devuelve un score cada 2 segundos durante la llamada.
              </p>
            </div>
            <div className="rounded-2xl bg-brand-dark p-6">
              <h3 className="text-xl font-bold">Alerta a la familia</h3>
              <p className="mt-2 text-base text-white/90">
                Notificación inmediata por WhatsApp/SMS cuando se detecta una suplantación.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-cream px-6 py-16">
        <div className="mx-auto max-w-3xl rounded-3xl border-2 border-amber-100 bg-white p-10 text-center shadow-md">
          <h2 className="text-3xl font-extrabold text-brand">Empieza ahora — toma 2 minutos</h2>
          <p className="mx-auto mt-3 max-w-xl text-senior text-gray-700">
            Registra la voz de tu familiar y prueba el detector. Cuando llegue una llamada
            sospechosa, estarás listo.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/enroll"
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-brand px-10 py-5 text-xl font-extrabold text-white shadow-lg transition hover:bg-brand-dark sm:w-auto"
            >
              <UserCheck className="h-6 w-6" />
              Registrar primer contacto
            </Link>
            <Link
              href="/analyze"
              className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-brand bg-white px-10 py-5 text-xl font-bold text-brand transition hover:bg-brand-light sm:w-auto"
            >
              <Mic className="h-6 w-6" />
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
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  accent?: "red" | "green";
}) {
  const accentClass =
    accent === "red"
      ? "text-red-600"
      : accent === "green"
        ? "text-green-700"
        : "text-brand";
  return (
    <div className="rounded-2xl border-2 border-amber-100 bg-white p-6 text-center shadow-sm">
      <div className={`mx-auto flex h-12 w-12 items-center justify-center ${accentClass}`}>
        {icon}
      </div>
      <p className={`mt-3 text-4xl font-extrabold ${accentClass}`}>{value}</p>
      <p className="mt-2 text-sm font-semibold text-gray-600">{label}</p>
    </div>
  );
}
