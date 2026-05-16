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
