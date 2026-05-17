import type {
  AlertResponse,
  AnalyzeResponse,
  Challenge,
  Contact,
  EnrollResponse,
  Incident,
  LabAnalyzeResponse,
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

export async function analyzeAudioLab(blob: Blob): Promise<LabAnalyzeResponse> {
  const fd = new FormData();
  fd.append("audio", blob, "recording.webm");
  return postForm<LabAnalyzeResponse>("/api/lab/analyze", fd);
}

export async function enrollContact(
  blob: Blob,
  name: string,
  phone?: string,
): Promise<EnrollResponse> {
  const fd = new FormData();
  fd.append("audio", blob, "enroll.webm");
  fd.append("name", name);
  if (phone) fd.append("phone", phone);
  return postForm<EnrollResponse>("/api/enroll", fd);
}

export async function listContacts(): Promise<Contact[]> {
  const data = await getJson<{ contacts: Contact[] }>("/api/contacts");
  return data.contacts;
}

export async function updateContact(
  id: string,
  patch: { name?: string; phone?: string | null },
): Promise<Contact> {
  const res = await fetch(`${API_URL}/api/contacts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`update contact failed: ${res.status}`);
  return res.json() as Promise<Contact>;
}

export async function deleteContact(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/contacts/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw new Error(`delete contact failed: ${res.status}`);
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

export async function sendAlert(incidentId: string, contactId: string): Promise<AlertResponse> {
  const res = await fetch(`${API_URL}/api/alert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ incident_id: incidentId, contact_id: contactId }),
  });
  if (!res.ok) throw new Error(`alert failed: ${res.status}`);
  return res.json() as Promise<AlertResponse>;
}
