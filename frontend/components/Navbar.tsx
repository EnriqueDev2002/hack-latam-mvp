"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/analyze", label: "Analizar" },
  { href: "/demo", label: "Demo" },
  { href: "/enroll", label: "Registrar voz" },
  { href: "/incidents", label: "Alertas" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="border-b-2 border-amber-100 bg-cream shadow-sm">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
        <span className="text-2xl font-extrabold tracking-tight text-brand">VoiceGuard</span>
        <nav className="flex gap-2">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "rounded-xl px-5 py-3 text-base font-bold transition-colors",
                pathname === href
                  ? "bg-brand text-white"
                  : "text-brand hover:bg-brand-light",
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
