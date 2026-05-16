"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Analizar" },
  { href: "/enroll", label: "Registrar voz" },
  { href: "/incidents", label: "Alertas" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="border-b-2 border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
        <span className="text-2xl font-bold tracking-tight text-blue-700">VoiceGuard</span>
        <nav className="flex gap-2">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "rounded-xl px-5 py-3 text-base font-semibold transition-colors",
                pathname === href
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
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
