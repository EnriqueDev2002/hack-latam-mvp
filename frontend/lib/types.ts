export type RiskLevel = "low" | "medium" | "high";

export interface AnalyzeResponse {
  is_synthetic: boolean;
  confidence: number;
  risk_level: RiskLevel;
  speaker_match: boolean | null;
  matched_contact: string | null;
  analysis_id: string;
}

export interface EnrollResponse {
  contact_id: string;
  embedding_quality: number;
}

export interface Contact {
  id: string;
  name: string;
  enrolled_at: string;
}

export interface Incident {
  id: string;
  created_at: string;
  risk_level: RiskLevel;
  confidence: number;
  matched_contact: string | null;
  alerted: boolean;
}

export interface AlertResponse {
  sent: boolean;
  channel: "whatsapp" | "sms";
}

export interface Stats {
  total_analyses: number;
  fraud_detected: number;
  high_risk: number;
  medium_risk: number;
  low_risk: number;
  contacts_protected: number;
  alerts_sent: number;
  last_7_days_analyses: number;
}

export interface Challenge {
  id: string;
  kind: "filler" | "personal";
  prompt: string;
  instructions: string;
  expires_at: string;
}

export interface LabSecondary {
  model_id: string;
  fake_score?: number;
  is_synthetic?: boolean;
  error?: string;
}

export interface LabDebug {
  hf_model_id: string;
  hf_fake_score: number | null;
  heuristic_score: number | null;
  ensemble_reason: string;
  features: Record<string, number> | null;
  duration_s: number | null;
  synthetic_threshold: number;
  secondary: LabSecondary | null;
}

export interface LabAnalyzeResponse {
  is_synthetic: boolean;
  confidence: number;
  risk_level: RiskLevel;
  speaker_match: boolean | null;
  speaker_match_score: number | null;
  speaker_match_threshold: number;
  matched_contact: string | null;
  analysis_id: string;
  debug: LabDebug;
}
