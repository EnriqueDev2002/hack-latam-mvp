import type { AnalyzeResponse } from "./types";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000/ws/analyze";
const CHUNK_INTERVAL_MS = 1000;
const WS_OPEN_TIMEOUT_MS = 3000;

export type ScoreCallback = (score: AnalyzeResponse) => void;
export type ErrorCallback = (err: Error) => void;

export class AudioStreamer {
  private ws: WebSocket | null = null;
  private recorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;

  async start(onScore: ScoreCallback, onError: ErrorCallback): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    this.ws = new WebSocket(WS_URL);

    try {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error("WebSocket connection timeout")),
          WS_OPEN_TIMEOUT_MS,
        );
        this.ws!.onopen = () => {
          clearTimeout(timeout);
          resolve();
        };
        this.ws!.onerror = () => {
          clearTimeout(timeout);
          reject(new Error("WebSocket connection failed"));
        };
      });
    } catch (err) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
      try {
        this.ws.close();
      } catch {
        // already closed
      }
      this.ws = null;
      throw err;
    }

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string);
        if (msg.type === "score") onScore(msg.data as AnalyzeResponse);
      } catch {
        // ignore malformed messages
      }
    };

    this.ws.onerror = () => onError(new Error("WebSocket error during streaming"));

    this.recorder = new MediaRecorder(this.stream);
    this.recorder.ondataavailable = (e) => {
      if (e.data.size > 0 && this.ws?.readyState === WebSocket.OPEN) {
        e.data.arrayBuffer().then((buf) => this.ws?.send(buf));
      }
    };

    this.recorder.start(CHUNK_INTERVAL_MS);
  }

  stop(): void {
    this.recorder?.stop();
    this.stream?.getTracks().forEach((t) => t.stop());
    this.ws?.close();
    this.recorder = null;
    this.stream = null;
    this.ws = null;
  }

  get isStreaming(): boolean {
    return this.recorder?.state === "recording";
  }
}
