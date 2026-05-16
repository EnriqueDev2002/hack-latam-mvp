"use client";

import { motion } from "framer-motion";
import { ShieldCheck, ShieldAlert, ShieldX, UserCheck, AlertTriangle } from "lucide-react";
import type { AnalyzeResponse, RiskLevel } from "@/lib/types";

interface RiskConfig {
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  subtitle: string;
  gradientFrom: string;
  iconBg: string;
  iconColor: string;
  titleColor: string;
  textColor: string;
  barColor: string;
  extraClass: string;
}

const RISK_CONFIG: Record<RiskLevel, RiskConfig> = {
  low: {
    Icon: ShieldCheck,
    title: "Voz auténtica",
    subtitle: "Esta voz parece real. Puede continuar con la llamada.",
    gradientFrom: "#F0FDF4",
    iconBg: "#DCFCE7",
    iconColor: "#16A34A",
    titleColor: "#14532D",
    textColor: "#166534",
    barColor: "#16A34A",
    extraClass: "animate-success-pulse",
  },
  medium: {
    Icon: ShieldAlert,
    title: "Voz sospechosa",
    subtitle: "Hay dudas sobre esta voz. Pida que le llamen de nuevo.",
    gradientFrom: "#FFFBEB",
    iconBg: "#FEF3C7",
    iconColor: "#D97706",
    titleColor: "#78350F",
    textColor: "#92400E",
    barColor: "#D97706",
    extraClass: "",
  },
  high: {
    Icon: ShieldX,
    title: "¡Posible fraude!",
    subtitle: "Esta voz parece falsa. No comparta datos ni dinero.",
    gradientFrom: "#FEF2F2",
    iconBg: "#FEE2E2",
    iconColor: "#DC2626",
    titleColor: "#7F1D1D",
    textColor: "#991B1B",
    barColor: "#DC2626",
    extraClass: "animate-shake",
  },
};

interface Props {
  result: AnalyzeResponse;
}

export function RiskIndicator({ result }: Props) {
  const config = RISK_CONFIG[result.risk_level];
  const { Icon } = config;
  const pct = Math.round(result.confidence * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`overflow-hidden rounded-[20px] border border-neutral-200 bg-white shadow-card ${config.extraClass}`}
      style={{
        background: `linear-gradient(160deg, ${config.gradientFrom} 0%, #FFFFFF 45%)`,
      }}
    >
      <div className="p-6 sm:p-8">
        {/* Icon + Title row */}
        <div className="flex items-start gap-4">
          <motion.div
            initial={{ scale: 0.4, rotate: -12, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1, type: "spring", stiffness: 220, damping: 14 }}
            className="flex h-[72px] w-[72px] flex-shrink-0 items-center justify-center rounded-2xl"
            style={{ backgroundColor: config.iconBg }}
          >
            <Icon className="h-9 w-9" style={{ color: config.iconColor }} />
          </motion.div>

          <div className="flex-1 pt-1">
            <motion.h2
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: 0.2 }}
              className="text-2xl font-bold leading-tight"
              style={{ color: config.titleColor }}
            >
              {config.title}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35, delay: 0.3 }}
              className="mt-1.5 text-senior font-medium leading-snug"
              style={{ color: config.textColor }}
            >
              {config.subtitle}
            </motion.p>
          </div>
        </div>

        {/* Confidence bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-sm font-semibold text-neutral-500 uppercase tracking-wide">
              Confianza del análisis
            </span>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-xl font-bold font-mono-display"
              style={{ color: config.iconColor }}
            >
              {pct}%
            </motion.span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-neutral-100">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{
                duration: 1.4,
                delay: 0.5,
                ease: [0.25, 1, 0.5, 1],
              }}
              className="h-full rounded-full"
              style={{ backgroundColor: config.barColor }}
            />
          </div>
        </motion.div>

        {/* Speaker match info */}
        {result.speaker_match === true && result.matched_contact && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-4 flex items-center gap-3 rounded-[14px] px-4 py-3"
            style={{
              backgroundColor: result.is_synthetic ? "#FEE2E2" : "#DCFCE7",
            }}
          >
            {result.is_synthetic ? (
              <AlertTriangle
                className="h-5 w-5 flex-shrink-0"
                style={{ color: "#DC2626" }}
              />
            ) : (
              <UserCheck
                className="h-5 w-5 flex-shrink-0"
                style={{ color: "#16A34A" }}
              />
            )}
            <span
              className="text-base font-semibold"
              style={{ color: result.is_synthetic ? "#991B1B" : "#166534" }}
            >
              {result.is_synthetic
                ? `Posible suplantación de ${result.matched_contact}`
                : `Voz verificada: ${result.matched_contact}`}
            </span>
          </motion.div>
        )}

        {result.speaker_match === false && result.matched_contact && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-4 flex items-center gap-3 rounded-[14px] bg-warning-bg px-4 py-3"
          >
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-warning" />
            <span className="text-base font-semibold text-amber-900">
              La voz no coincide con {result.matched_contact}
            </span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
