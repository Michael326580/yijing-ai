import type { ActivityType, AnalyzeResponse, GenerateAlbumResponse, ImageAnalysis } from "../types";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export async function healthCheck(): Promise<{ status: string; service: string }> {
  const response = await fetch(`${API_BASE_URL}/api/health`);
  return parseResponse(response);
}

export async function analyzeImages(activityType: ActivityType, files: File[]): Promise<AnalyzeResponse> {
  const formData = new FormData();
  formData.append("activity_type", activityType);
  files.forEach((file) => formData.append("files", file));

  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: "POST",
    body: formData,
  });
  return parseResponse(response);
}

export async function generateAlbum(
  activityType: ActivityType,
  analyses: ImageAnalysis[],
): Promise<GenerateAlbumResponse> {
  const response = await fetch(`${API_BASE_URL}/api/generate-album`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ activity_type: activityType, analyses }),
  });
  return parseResponse(response);
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    return response.json() as Promise<T>;
  }

  let message = "请求失败，请稍后重试。";
  try {
    const payload = (await response.json()) as { detail?: string };
    if (payload.detail) {
      message = payload.detail;
    }
  } catch {
    message = response.statusText || message;
  }
  throw new Error(message);
}
