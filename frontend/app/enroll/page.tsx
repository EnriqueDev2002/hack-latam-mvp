"use client";

import { useEffect, useState } from "react";
import { UserCheck, CheckCircle2, AlertCircle, Users } from "lucide-react";
import { AudioRecorder } from "@/components/AudioRecorder";
import { ContactCard } from "@/components/ContactCard";
import { enrollContact, listContacts } from "@/lib/api";
import type { Contact } from "@/lib/types";

type Step = "form" | "recording" | "done" | "error";

export default function EnrollPage() {
  const [name, setName] = useState("");
  const [step, setStep] = useState<Step>("form");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    listContacts()
      .then(setContacts)
      .catch(() => {})
      .finally(() => setLoadingContacts(false));
  }, []);

  function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim()) setStep("recording");
  }

  async function handleRecorded(blob: Blob) {
    setSubmitting(true);
    try {
      await enrollContact(blob, name.trim());
      const updated = await listContacts();
      setContacts(updated);
      setStep("done");
    } catch {
      setErrorMsg("No se pudo registrar la voz. Intenta de nuevo.");
      setStep("error");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setName("");
    setStep("form");
    setErrorMsg("");
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      {/* Header */}
      <div className="mb-8 text-center">
        <div
          className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[22px] shadow-brand"
          style={{ background: "linear-gradient(135deg, #2563EB, #3B82F6)" }}
        >
          <UserCheck className="h-10 w-10 text-white" strokeWidth={1.75} />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-neutral-900">Registrar contacto</h1>
        <p className="mt-3 text-senior text-neutral-600">
          Graba la voz de un familiar para que VoiceGuard pueda verificar su identidad.
        </p>
      </div>

      {/* Step card */}
      <section className="card p-8">
        {/* Step indicator */}
        <div className="mb-8 flex items-center gap-3">
          {(["form", "recording", "done"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold transition-all duration-300"
                style={{
                  background:
                    step === s || (step === "error" && s === "recording")
                      ? "linear-gradient(135deg, #2563EB, #3B82F6)"
                      : step === "done" || (i < ["form", "recording", "done"].indexOf(step))
                      ? "#DCFCE7"
                      : "#F1F5F9",
                  color:
                    step === s || (step === "error" && s === "recording")
                      ? "#fff"
                      : step === "done"
                      ? "#16A34A"
                      : "#94A3B8",
                }}
              >
                {i + 1}
              </div>
              {i < 2 && <div className="h-px flex-1 bg-neutral-200" />}
            </div>
          ))}
        </div>

        {/* ── FORM ── */}
        {step === "form" && (
          <form onSubmit={handleNameSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-base font-semibold text-neutral-700">
                Nombre del familiar
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Mamá, Abuelo Juan…"
                className="input-field"
                required
                autoFocus
              />
              <p className="text-sm text-neutral-500">
                Este nombre se mostrará en el resultado del análisis.
              </p>
            </div>
            <button type="submit" className="btn-primary w-full text-senior">
              Continuar
            </button>
          </form>
        )}

        {/* ── RECORDING ── */}
        {step === "recording" && (
          <div className="flex flex-col gap-6">
            <div
              className="rounded-[14px] px-4 py-3"
              style={{ backgroundColor: "#EFF6FF", border: "1px solid #DBEAFE" }}
            >
              <p className="text-base font-medium text-brand-dark">
                Registrando voz de{" "}
                <span className="font-bold">{name}</span>. Habla durante al menos 10 segundos.
              </p>
            </div>
            <AudioRecorder onRecorded={handleRecorded} disabled={submitting} />
            {submitting && (
              <p className="text-center text-base text-neutral-500 animate-pulse">
                Guardando huella de voz…
              </p>
            )}
          </div>
        )}

        {/* ── DONE ── */}
        {step === "done" && (
          <div className="flex flex-col items-center gap-6 py-4 text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-success-bg animate-scale-in animate-fill-forwards">
              <CheckCircle2 className="h-12 w-12 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">¡Registro exitoso!</p>
              <p className="mt-1 text-senior text-neutral-600">
                La voz de <strong>{name}</strong> ya está protegida.
              </p>
            </div>
            <button onClick={reset} className="btn-primary w-full text-senior">
              Registrar otro contacto
            </button>
          </div>
        )}

        {/* ── ERROR ── */}
        {step === "error" && (
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-danger-bg">
              <AlertCircle className="h-10 w-10 text-danger" />
            </div>
            <p className="text-senior text-danger font-semibold">{errorMsg}</p>
            <button onClick={reset} className="btn-secondary w-full text-senior">
              Intentar de nuevo
            </button>
          </div>
        )}
      </section>

      {/* Contacts list */}
      <section className="mt-10">
        <div className="mb-4 flex items-center gap-3">
          <Users className="h-5 w-5 text-neutral-400" />
          <h2 className="text-xl font-bold text-neutral-900">Contactos registrados</h2>
        </div>

        <div className="flex flex-col gap-3">
          {loadingContacts && (
            <>
              <div className="skeleton h-[72px] w-full" />
              <div className="skeleton h-[72px] w-full" />
            </>
          )}
          {!loadingContacts && contacts.length === 0 && (
            <div className="card p-8 text-center">
              <p className="text-base text-neutral-500">Aún no hay contactos registrados.</p>
              <p className="mt-1 text-sm text-neutral-400">
                Registra la primera voz usando el formulario de arriba.
              </p>
            </div>
          )}
          {contacts.map((c) => (
            <ContactCard key={c.id} contact={c} />
          ))}
        </div>
      </section>
    </main>
  );
}
