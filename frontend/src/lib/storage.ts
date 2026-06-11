import { activityTypes, type AlbumDraft, type ActivityType } from "../types";

const DRAFTS_KEY = "yijing.albumDrafts";
const MAX_DRAFTS = 20;

export function saveAlbumDraft(draft: AlbumDraft): AlbumDraft {
  const drafts = listAlbumDrafts();
  const now = new Date().toISOString();
  const existing = drafts.find((item) => item.id === draft.id);
  const nextDraft: AlbumDraft = {
    ...draft,
    id: draft.id || makeDraftId(),
    createdAt: existing?.createdAt ?? draft.createdAt ?? now,
    updatedAt: now,
  };
  const next = [nextDraft, ...drafts.filter((item) => item.id !== nextDraft.id)]
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    .slice(0, MAX_DRAFTS);
  safeWrite(next);
  return nextDraft;
}

export function loadAlbumDraft(id: string): AlbumDraft | null {
  return listAlbumDrafts().find((draft) => draft.id === id) ?? null;
}

export function getLatestDraft(): AlbumDraft | null {
  return listAlbumDrafts()[0] ?? null;
}

export function listAlbumDrafts(): AlbumDraft[] {
  const raw = safeReadRaw();
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const drafts = parsed.map((item) => sanitizeDraft(item)).filter((item): item is AlbumDraft => Boolean(item));
    const normalized = drafts.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, MAX_DRAFTS);
    if (normalized.length !== parsed.length) safeWrite(normalized);
    return normalized;
  } catch {
    return [];
  }
}

export function deleteAlbumDraft(id: string): void {
  safeWrite(listAlbumDrafts().filter((draft) => draft.id !== id));
}

export function clearAlbumDrafts(): void {
  try {
    localStorage.removeItem(DRAFTS_KEY);
  } catch {
    // Ignore storage access failures so the app can keep rendering.
  }
}

export function exportAllDrafts(): string {
  return JSON.stringify(
    {
      version: 1,
      exportedAt: new Date().toISOString(),
      drafts: listAlbumDrafts(),
    },
    null,
    2,
  );
}

export function importDrafts(jsonString: string): { imported: number; skipped: number } {
  try {
    const payload = JSON.parse(jsonString) as unknown;
    const rawDrafts = Array.isArray(payload)
      ? payload
      : typeof payload === "object" && payload !== null && Array.isArray((payload as { drafts?: unknown }).drafts)
        ? (payload as { drafts: unknown[] }).drafts
        : [];
    const imported = rawDrafts.map((item) => sanitizeDraft(item)).filter((item): item is AlbumDraft => Boolean(item));
    const existing = listAlbumDrafts();
    const byId = new Map<string, AlbumDraft>();
    [...imported, ...existing].forEach((draft) => byId.set(draft.id, draft));
    safeWrite(
      Array.from(byId.values())
        .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
        .slice(0, MAX_DRAFTS),
    );
    return { imported: imported.length, skipped: rawDrafts.length - imported.length };
  } catch {
    return { imported: 0, skipped: 1 };
  }
}

export function validateDraft(draft: unknown): draft is AlbumDraft {
  return sanitizeDraft(draft) !== null;
}

function sanitizeDraft(value: unknown): AlbumDraft | null {
  if (!value || typeof value !== "object") return null;
  const draft = value as Partial<AlbumDraft>;
  if (!draft.album || !draft.analyses || !Array.isArray(draft.analyses)) return null;
  if (!draft.album.title || !draft.album.captions || !Array.isArray(draft.album.grid_recommendations)) return null;
  if (!isActivityType(draft.activityType)) return null;
  const now = new Date().toISOString();
  return {
    id: typeof draft.id === "string" && draft.id ? draft.id : makeDraftId(),
    name: typeof draft.name === "string" && draft.name ? draft.name : draft.album.title,
    createdAt: typeof draft.createdAt === "string" ? draft.createdAt : now,
    updatedAt: typeof draft.updatedAt === "string" ? draft.updatedAt : now,
    activityType: draft.activityType,
    analyses: draft.analyses,
    album: draft.album,
    preferences: draft.preferences ?? {
      visual_style: "清新校园",
      caption_length: "中",
      emphasis: "情绪",
      output_scene: "朋友圈",
    },
    coverImageUrl: draft.coverImageUrl ?? draft.album.cover_image_url ?? null,
    providerStatus: draft.providerStatus,
  };
}

function safeReadRaw(): string | null {
  try {
    return localStorage.getItem(DRAFTS_KEY);
  } catch {
    return null;
  }
}

function safeWrite(drafts: AlbumDraft[]): void {
  try {
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts.slice(0, MAX_DRAFTS)));
  } catch {
    // Quota or privacy-mode failures should not break the demo flow.
  }
}

function isActivityType(value: unknown): value is ActivityType {
  return typeof value === "string" && activityTypes.includes(value as ActivityType);
}

function makeDraftId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `draft-${Date.now()}`;
}
