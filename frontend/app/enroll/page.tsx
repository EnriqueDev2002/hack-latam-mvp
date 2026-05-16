"use client";

import { useEffect, useState } from "react";
import { AudioRecorder } from "@/components/AudioRecorder";
import { ContactCard } from "@/components/ContactCard";
import { enrollContact, listContacts } from "@/lib/api";
import type { Contact } from "@/lib/types";

type Step = "form" | "recording" | "done" | "error";

export default function EnrollPage() {
  const [name, setName] = useState("");
  const [step, setStep] = useState<Step>("form");
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
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
    setPendingBlob(blob);
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
    setPendingBlob(null);
    setStep("form");
    setErrorMsg("");
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900">Registrar contacto</h1>
      <p className="mt-2 text-senior text-gray-700">
        Graba la voz de un familiar para que VoiceGuard pueda verificar su identidad.
      </p>

      <section className="mt-10 rounded-2xl border bg-white p-8 shadow-sm">
        {step === "form" && (
          <form onSubmit={handleNameSubmit} className="flex flex-col gap-6">
            <label className="flex flex-col gap-2">
              <span className="text-senior font-semibold text-gray-800">
                Nombre del familiar
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Mamá, Abuelo Juan…"
                className="rounded-xl border-2 border-gray-200 px-5 py-4 text-senior text-gray-900 outline-none focus:border-blue-500"
                required
                autoFocus
              />
            </label>
            <button
              type="submit"
              className="rounded-2xl bg-brand px-8 py-5 text-senior font-extrabold text-white shadow-md transition hover:bg-brand-dark"
            >
              Continuar
            </button>
          </form>
        )}

        {step === "recording" && (
          <div className="flex flex-col gap-6">
            <p className="text-senior text-gray-700">
              Registrando voz de <strong>{name}</strong>. Presiona el botón y habla
              durante al menos 10 segundos, luego detén la grabación.
            </p>
            <AudioRecorder onRecorded={handleRecorded} disabled={submitting} />
            {submitting && (
              <p className="text-center text-senior text-gray-500">Registrando…</p>
            )}
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <span className="text-4xl">✓</span>
            </div>
            <p className="text-senior font-semibold text-gray-900">
              ¡Voz de <strong>{name}</strong> registrada!
            </p>
            <button
              onClick={reset}
              className="rounded-2xl bg-brand px-8 py-5 text-senior font-extrabold text-white shadow-md transition hover:bg-brand-dark"
            >
              Registrar otro contacto
            </button>
          </div>
        )}

        {step === "error" && (
          <div className="flex flex-col items-center gap-6 text-center">
            <p className="text-senior text-red-600">{errorMsg}</p>
            <button
              onClick={reset}
              className="rounded-2xl border-2 border-brand bg-white px-8 py-5 text-senior font-bold text-brand transition hover:bg-brand-light"
            >
              Intentar de nuevo
            </button>
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900">Contactos registrados</h2>
        <div className="mt-4 flex flex-col gap-3">
          {loadingContacts && (
            <p className="text-senior text-gray-500">Cargando contactos…</p>
          )}
          {!loadingContacts && contacts.length === 0 && (
            <p className="text-senior text-gray-500">Aún no hay contactos registrados.</p>
          )}
          {contacts.map((c) => (
            <ContactCard key={c.id} contact={c} />
          ))}
        </div>
      </section>
    </main>
  );
}
