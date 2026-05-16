import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VoiceGuard",
  description: "Detecta voces clonadas por IA y protege a tu familia",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
