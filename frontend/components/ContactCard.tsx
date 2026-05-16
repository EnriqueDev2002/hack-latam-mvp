import { UserCheck } from "lucide-react";
import type { Contact } from "@/lib/types";

interface Props {
  contact: Contact;
}

export function ContactCard({ contact }: Props) {
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

  return (
    <div className="card card-hover flex items-center gap-4 p-5">
      {/* Avatar with initials */}
      <div
        className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white shadow-brand"
        style={{ background: "linear-gradient(135deg, #2563EB, #3B82F6)" }}
        aria-hidden="true"
      >
        {initials || <UserCheck className="h-5 w-5" />}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-senior font-semibold text-neutral-900 truncate">{contact.name}</p>
        <p className="mt-0.5 text-sm font-medium text-neutral-500">Registrado el {enrolled}</p>
      </div>

      {/* Verified badge */}
      <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-xl bg-success-bg">
        <UserCheck className="h-4 w-4 text-success" />
      </div>
    </div>
  );
}
