"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, MessageCircle, Send } from "lucide-react";
import { listContacts, sendAlert } from "@/lib/api";
import type { AnalyzeResponse, Contact } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  result: AnalyzeResponse;
}

type Status = "idle" | "sending" | "sent" | "error";

export function AlertButton({ result }: Props) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [status, setStatus] = useState<Status>("idle");
  const [channel, setChannel] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    listContacts()
      .then((all) => {
        const withPhone = all.filter((c) => c.phone);
        setContacts(withPhone);
        if (withPhone.length > 0) setSelectedId(withPhone[0].id);
      })
      .catch(() => {});
  }, []);

  async function handleSend() {
    if (!selectedId) return;
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await sendAlert(result.analysis_id, selectedId);
      if (res.sent) {
        setChannel(res.channel);
        setStatus("sent");
      } else {
        setErrorMsg("Zavu no pudo enviar el mensaje. Revisa la consola del backend.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Falló la llamada al backend.");
      setStatus("error");
    }
  }

  if (contacts.length === 0) {
    return (
      <div className="rounded-[14px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Para avisar a un familiar, primero registra un contacto con teléfono en{" "}
        <a href="/enroll" className="font-semibold underline">Registrar contacto</a>.
      </div>
    );
  }

  if (status === "sent") {
    const selected = contacts.find((c) => c.id === selectedId);
    return (
      <div className="flex items-start gap-3 rounded-[14px] bg-success-bg px-4 py-4">
        <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-success" />
        <div className="text-sm">
          <p className="font-semibold text-emerald-900">
            Aviso encolado para {selected?.name} por {channel === "whatsapp" ? "WhatsApp" : "SMS"}. Puede tardar unos minutos en llegar.
          </p>
          <p className="mt-1 text-emerald-800">
            Le pedimos que verifique la identidad por otro medio antes de actuar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-[14px] border border-neutral-200 bg-white p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
        <MessageCircle className="h-4 w-4 text-brand" />
        Avisar a un familiar
      </div>

      {contacts.length === 1 ? (
        <p className="text-sm text-neutral-600">
          Le enviaremos un SMS a <span className="font-semibold">{contacts[0].name}</span>{" "}
          (<span className="font-mono text-xs">{contacts[0].phone}</span>).
        </p>
      ) : (
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-neutral-600">Elige el destinatario:</span>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="rounded-[10px] border border-neutral-300 px-3 py-2 text-sm"
          >
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.phone}
              </option>
            ))}
          </select>
        </label>
      )}

      <button
        type="button"
        onClick={handleSend}
        disabled={status === "sending"}
        className={cn(
          "btn-primary justify-center text-base py-3",
          status === "sending" && "opacity-75",
        )}
      >
        <Send className="h-4 w-4" />
        {status === "sending" ? "Enviando…" : "Enviar aviso"}
      </button>

      {status === "error" && errorMsg && (
        <p className="text-sm font-semibold text-red-700">{errorMsg}</p>
      )}
    </div>
  );
}
