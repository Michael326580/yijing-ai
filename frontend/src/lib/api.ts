import type {
  ActivityType,
  AIProviderStatus,
  AlbumGenerationPreferences,
  AlbumResult,
  AnalyzeResponse,
  CaptionKey,
  EvaluateAlbumResponse,
  GenerateAlbumResponse,
  ImageAnalysis,
  RegenerateCaptionResponse,
  RegenerateStorylineResponse,
  RegenerateTitleResponse,
} from "../types";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export async function healthCheck(): Promise<AIProviderStatus> {
  const checkedAt = new Date().toISOString();
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/health`, { timeoutMs: 3000 });
    const payload = await parseResponse<AIProviderStatus>(response);
    return { ...payload, last_checked_at: payload.last_checked_at ?? checkedAt };
  } catch {
    return {
      status: "offline",
      service: "后端未连接",
      ai_provider: "offline",
      deepseek_model: null,
      deepseek_available: false,
      fallback: "local",
      last_checked_at: checkedAt,
    };
  }
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
  preferences?: AlbumGenerationPreferences,
): Promise<GenerateAlbumResponse> {
  const response = await fetch(`${API_BASE_URL}/api/generate-album`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ activity_type: activityType, analyses, preferences }),
  });
  return parseResponse(response);
}

export async function regenerateCaption(
  activityType: ActivityType,
  analyses: ImageAnalysis[],
  album: AlbumResult,
  captionKey: CaptionKey,
  preferences?: AlbumGenerationPreferences,
  instruction = "",
): Promise<RegenerateCaptionResponse> {
  const response = await fetch(`${API_BASE_URL}/api/regenerate-caption`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ activity_type: activityType, analyses, album, caption_key: captionKey, preferences, instruction }),
  });
  return parseResponse(response);
}

export async function regenerateTitle(
  activityType: ActivityType,
  analyses: ImageAnalysis[],
  album: AlbumResult,
  preferences?: AlbumGenerationPreferences,
  instruction = "",
): Promise<RegenerateTitleResponse> {
  const response = await fetch(`${API_BASE_URL}/api/regenerate-title`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ activity_type: activityType, analyses, album, preferences, instruction }),
  });
  return parseResponse(response);
}

export async function regenerateStoryline(
  activityType: ActivityType,
  analyses: ImageAnalysis[],
  album: AlbumResult,
  preferences?: AlbumGenerationPreferences,
  instruction = "",
): Promise<RegenerateStorylineResponse> {
  const response = await fetch(`${API_BASE_URL}/api/regenerate-storyline`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ activity_type: activityType, analyses, album, preferences, instruction }),
  });
  return parseResponse(response);
}

export async function evaluateAlbum(activityType: ActivityType, analyses: ImageAnalysis[], album: AlbumResult): Promise<EvaluateAlbumResponse> {
  const response = await fetch(`${API_BASE_URL}/api/evaluate-album`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ activity_type: activityType, analyses, album }),
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

async function fetchWithTimeout(url: string, options: RequestInit & { timeoutMs?: number } = {}): Promise<Response> {
  const { timeoutMs = 12000, ...fetchOptions } = options;
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...fetchOptions, signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
}
