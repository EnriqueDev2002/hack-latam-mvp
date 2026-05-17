"use client";

import { useState } from "react";
import { Pencil, Trash2, UserCheck, X, Check } from "lucide-react";
import { deleteContact, updateContact } from "@/lib/api";
import type { Contact } from "@/lib/types";

interface Props {
  contact: Contact;
  onUpdated?: (updated: Contact) => void;
  onDeleted?: (id: string) => void;
}

type Mode = "view" | "edit" | "confirm-delete";

export function ContactCard({ contact, onUpdated, onDeleted }: Props) {
  const [mode, setMode] = useState<Mode>("view");
  const [name, setName] = useState(contact.name);
  const [phone, setPhone] = useState(contact.phone ?? "");
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const enrolled = new Date(contact.enrolled_at).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const initials = contact.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  function cancelEdit() {
    setName(contact.name);
    setPhone(contact.phone ?? "");
    setErrorMsg("");
    setMode("view");
  }

  async function saveEdit() {
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    if (!trimmedName) {
      setErrorMsg("El nombre no puede quedar vacío.");
      return;
    }
    setBusy(true);
    setErrorMsg("");
    try {
      const updated = await updateContact(contact.id, {
        name: trimmedName,
        phone: trimmedPhone || null,
      });
      onUpdated?.(updated);
      setMode("view");
    } catch {
      setErrorMsg("No se pudo guardar los cambios.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    setBusy(true);
    setErrorMsg("");
    try {
      await deleteContact(contact.id);
      onDeleted?.(contact.id);
    } catch {
      setErrorMsg("No se pudo eliminar.");
      setBusy(false);
    }
  }

  if (mode === "edit") {
    return (
      <div className="card flex flex-col gap-3 p-5">
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white shadow-brand"
            style={{ background: "linear-gradient(135deg, #2563EB, #3B82F6)" }}
          >
            {initials || <UserCheck className="h-5 w-5" />}
          </div>
          <p className="text-sm font-semibold text-neutral-500">Editando contacto</p>
        </div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre"
          className="input-field"
          autoFocus
          disabled={busy}
        />
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+56912345678"
          className="input-field"
          inputMode="tel"
          disabled={busy}
        />
        {errorMsg && <p className="text-sm font-semibold text-red-700">{errorMsg}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={saveEdit}
            disabled={busy}
            className="btn-primary flex-1 justify-center"
          >
            <Check className="h-4 w-4" />
            Guardar
          </button>
          <button
            type="button"
            onClick={cancelEdit}
            disabled={busy}
            className="btn-secondary flex-1 justify-center"
          >
            <X className="h-4 w-4" />
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  if (mode === "confirm-delete") {
    return (
      <div className="card flex flex-col gap-3 border-red-200 p-5">
        <p className="text-sm font-semibold text-neutral-900">
          ¿Eliminar a <span className="text-red-700">{contact.name}</span>?
        </p>
        <p className="text-xs text-neutral-500">
          Se perderá la huella de voz registrada. Esta acción no se puede deshacer.
        </p>
        {errorMsg && <p className="text-sm font-semibold text-red-700">{errorMsg}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={confirmDelete}
            disabled={busy}
            className="flex-1 rounded-[14px] bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {busy ? "Eliminando…" : "Sí, eliminar"}
          </button>
          <button
            type="button"
            onClick={() => setMode("view")}
            disabled={busy}
            className="btn-secondary flex-1 justify-center"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card card-hover flex items-center gap-4 p-5">
      <div
        className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white shadow-brand"
        style={{ background: "linear-gradient(135deg, #2563EB, #3B82F6)" }}
        aria-hidden="true"
      >
        {initials || <UserCheck className="h-5 w-5" />}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-senior font-semibold text-neutral-900 truncate">{contact.name}</p>
        <p className="mt-0.5 text-sm font-medium text-neutral-500">
          {contact.phone ? <span className="font-mono">{contact.phone}</span> : "Sin teléfono"} · Registrado el {enrolled}
        </p>
      </div>

      <div className="flex flex-shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => setMode("edit")}
          aria-label={`Editar ${contact.name}`}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-500 hover:bg-neutral-100 hover:text-brand"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setMode("confirm-delete")}
          aria-label={`Eliminar ${contact.name}`}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-500 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
