import type {
  AlertResponse,
  AnalyzeResponse,
  Challenge,
  Contact,
  EnrollResponse,
  Incident,
  RiskLevel,
  Stats,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function postForm<T>(path: string, formData: FormData): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { method: "POST", body: formData });
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function analyzeAudio(blob: Blob): Promise<AnalyzeResponse> {
  const fd = new FormData();
  fd.append("audio", blob, "recording.webm");
  return postForm<AnalyzeResponse>("/api/analyze", fd);
}

export async function enrollContact(blob: Blob, name: string): Promise<EnrollResponse> {
  const fd = new FormData();
  fd.append("audio", blob, "enroll.webm");
  fd.append("name", name);
  return postForm<EnrollResponse>("/api/enroll", fd);
}

export async function listContacts(): Promise<Contact[]> {
  const data = await getJson<{ contacts: Contact[] }>("/api/contacts");
  return data.contacts;
}

export async function listIncidents(limit = 20, risk?: RiskLevel): Promise<Incident[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (risk) params.set("risk", risk);
  const data = await getJson<{ incidents: Incident[] }>(`/api/incidents?${params}`);
  return data.incidents;
}

export function getStats(): Promise<Stats> {
  return getJson<Stats>("/api/stats");
}

export function getChallenge(): Promise<Challenge> {
  return getJson<Challenge>("/api/challenge");
}

export async function sendAlert(incidentId: string, contactPhone: string): Promise<AlertResponse> {
  const res = await fetch(`${API_URL}/api/alert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ incident_id: incidentId, contact_phone: contactPhone }),
  });
  if (!res.ok) throw new Error(`alert failed: ${res.status}`);
  return res.json() as Promise<AlertResponse>;
}
