// Frontend client for the backend Gemini wrapper.
// The backend lives in /backend and must be deployed separately.
// Configure VITE_BACKEND_URL to point at the deployed server.

export type AdFormat = "square" | "portrait" | "landscape";

export interface GenerateAdInput {
  companyName: string;
  agentName: string;
  agentPhone: string;
  propertyType: string;
  listingType: string;
  price: string;
  location: string;
  size: string;
  bedrooms: string;
  bathrooms: string;
  highlights: string[];
  description: string;
  format: AdFormat;
  style?: string;
  photos: string[]; // data URLs
}

export interface GenerateAdResponse {
  image: string;
  mimeType: string;
}

const BACKEND_URL =
  (import.meta.env.VITE_BACKEND_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:8787";

export async function generateAd(input: GenerateAdInput): Promise<GenerateAdResponse> {
  const resp = await fetch(`${BACKEND_URL}/api/generate-ad`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!resp.ok) {
    let msg = `Request failed (${resp.status})`;
    try {
      const j = await resp.json();
      if (j?.error) msg = j.error;
    } catch {}
    throw new Error(msg);
  }
  return resp.json();
}

export interface RegenerateAdInput {
  input: GenerateAdInput;
  refinement: string;
  previousImage?: string | null;
}

export async function regenerateAd(payload: RegenerateAdInput): Promise<GenerateAdResponse> {
  const resp = await fetch(`${BACKEND_URL}/api/regenerate-ad`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    let msg = `Request failed (${resp.status})`;
    try {
      const j = await resp.json();
      if (j?.error) msg = j.error;
    } catch {}
    throw new Error(msg);
  }
  return resp.json();
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}
