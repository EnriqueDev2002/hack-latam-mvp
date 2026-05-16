"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/analyze", label: "Analizar" },
  { href: "/demo", label: "Demo" },
  { href: "/enroll", label: "Registrar" },
  { href: "/incidents", label: "Alertas" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur-sm shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-dark shadow-brand group-hover:shadow-brand-lg transition-shadow duration-200">
            <Shield className="h-5 w-5 text-white" strokeWidth={2} />
          </div>
          <span className="text-xl font-bold tracking-tight text-neutral-900">
            Voice<span className="text-gradient-brand">Guard</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 overflow-x-auto">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "whitespace-nowrap rounded-[12px] px-4 py-2 text-base font-semibold transition-all duration-150",
                pathname === href
                  ? "bg-brand text-white shadow-brand"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
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
