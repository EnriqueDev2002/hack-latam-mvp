import { UserCheck, Trash2 } from "lucide-react";
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

  return (
    <div className="flex items-center gap-4 rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
        <UserCheck className="h-6 w-6 text-blue-600" />
      </div>
      <div className="flex-1">
        <p className="text-senior font-semibold text-gray-900">{contact.name}</p>
        <p className="text-sm text-gray-500">Registrado el {enrolled}</p>
      </div>
    </div>
  );
}
