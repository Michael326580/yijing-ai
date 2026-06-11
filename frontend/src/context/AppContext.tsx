import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { demoActivityType, demoAlbum, demoAnalyses, demoPreferences } from "../lib/demoData";
import { loadAlbumDraft, saveAlbumDraft } from "../lib/storage";
import type {
  ActivityType,
  AIProviderStatus,
  AlbumCaptions,
  AlbumDraft,
  AlbumGenerationPreferences,
  AlbumResult,
  GridRecommendation,
  ImageAnalysis,
  LocalImage,
  StorylineItem,
} from "../types";

interface AppContextValue {
  activityType: ActivityType;
  setActivityType: (value: ActivityType) => void;
  localImages: LocalImage[];
  setLocalImages: (images: LocalImage[]) => void;
  analyses: ImageAnalysis[];
  setAnalyses: (images: ImageAnalysis[]) => void;
  album: AlbumResult | null;
  setAlbum: (album: AlbumResult | null) => void;
  preferences: AlbumGenerationPreferences;
  setPreferences: (preferences: AlbumGenerationPreferences) => void;
  providerStatus: AIProviderStatus | null;
  setProviderStatus: (status: AIProviderStatus | null) => void;
  selectedCoverUrl: string | null;
  setSelectedCoverUrl: (url: string | null) => void;
  activeDraftId: string | null;
  setActiveDraftId: (id: string | null) => void;
  resetDemo: () => void;
  loadDemoProject: () => void;
  saveCurrentDraft: () => AlbumDraft | null;
  restoreDraft: (id: string) => AlbumDraft | null;
  updateAlbum: (partial: Partial<AlbumResult>) => void;
  updateGrid: (grid: GridRecommendation[]) => void;
  updateCaptions: (captions: AlbumCaptions) => void;
  updateStoryline: (storyline: StorylineItem[]) => void;
}

const defaultActivityType: ActivityType = "科研竞赛";
const storageKeys = {
  activityType: "yijing.activityType",
  analyses: "yijing.analyses",
  album: "yijing.album",
  preferences: "yijing.preferences",
  selectedCoverUrl: "yijing.selectedCoverUrl",
  activeDraftId: "yijing.activeDraftId",
};

const defaultPreferences: AlbumGenerationPreferences = {
  visual_style: "清新校园",
  caption_length: "中",
  emphasis: "情绪",
  output_scene: "朋友圈",
  title_style: "有记忆点",
  audience: "同学朋友",
  narrative_order: "开场—过程—高光—收束",
  must_include_image_ids: [],
  excluded_image_ids: [],
  custom_instruction: "",
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [activityType, setActivityTypeState] = useState<ActivityType>(() =>
    readStorage<ActivityType>(storageKeys.activityType, defaultActivityType),
  );
  const [localImages, setLocalImages] = useState<LocalImage[]>([]);
  const [analyses, setAnalysesState] = useState<ImageAnalysis[]>(() => readStorage<ImageAnalysis[]>(storageKeys.analyses, []));
  const [album, setAlbumState] = useState<AlbumResult | null>(() => readStorage<AlbumResult | null>(storageKeys.album, null));
  const [preferences, setPreferencesState] = useState<AlbumGenerationPreferences>(() =>
    readStorage<AlbumGenerationPreferences>(storageKeys.preferences, defaultPreferences),
  );
  const [providerStatus, setProviderStatus] = useState<AIProviderStatus | null>(null);
  const [selectedCoverUrl, setSelectedCoverUrlState] = useState<string | null>(() => readStorage<string | null>(storageKeys.selectedCoverUrl, null));
  const [activeDraftId, setActiveDraftIdState] = useState<string | null>(() => readStorage<string | null>(storageKeys.activeDraftId, null));

  const setActivityType = (value: ActivityType) => {
    setActivityTypeState(value);
    safeStorageSet(storageKeys.activityType, value);
  };

  const setAnalyses = (images: ImageAnalysis[]) => {
    setAnalysesState(images);
    safeStorageSet(storageKeys.analyses, images);
  };

  const setAlbum = (nextAlbum: AlbumResult | null) => {
    setAlbumState(nextAlbum);
    if (nextAlbum) {
      safeStorageSet(storageKeys.album, nextAlbum);
    } else {
      safeStorageRemove(storageKeys.album);
    }
  };

  const setPreferences = (nextPreferences: AlbumGenerationPreferences) => {
    setPreferencesState(nextPreferences);
    safeStorageSet(storageKeys.preferences, nextPreferences);
  };

  const setSelectedCoverUrl = (url: string | null) => {
    setSelectedCoverUrlState(url);
    if (url) safeStorageSet(storageKeys.selectedCoverUrl, url);
    else safeStorageRemove(storageKeys.selectedCoverUrl);
  };

  const setActiveDraftId = (id: string | null) => {
    setActiveDraftIdState(id);
    if (id) safeStorageSet(storageKeys.activeDraftId, id);
    else safeStorageRemove(storageKeys.activeDraftId);
  };

  const resetDemo = () => {
    localImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    setLocalImages([]);
    setAnalysesState([]);
    setAlbumState(null);
    setSelectedCoverUrlState(null);
    setActiveDraftId(null);
    safeStorageRemove(storageKeys.analyses);
    safeStorageRemove(storageKeys.album);
    safeStorageRemove(storageKeys.selectedCoverUrl);
  };

  const loadDemoProject = () => {
    localImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    setLocalImages([]);
    setActivityType(demoActivityType);
    setPreferences(demoPreferences);
    setAnalyses(demoAnalyses);
    setAlbum(demoAlbum);
    setSelectedCoverUrl(demoAlbum.cover_image_url);
    setActiveDraftId("demo-project");
  };

  const saveCurrentDraft = (): AlbumDraft | null => {
    if (!album || analyses.length === 0) return null;
    const now = new Date().toISOString();
    const draft = saveAlbumDraft({
      id: activeDraftId && activeDraftId !== "demo-project" ? activeDraftId : crypto.randomUUID(),
      name: album.title || "未命名相册",
      createdAt: now,
      updatedAt: now,
      activityType,
      analyses,
      album,
      preferences,
      coverImageUrl: selectedCoverUrl ?? album.cover_image_url,
      providerStatus: providerStatus ?? undefined,
    });
    setActiveDraftId(draft.id);
    return draft;
  };

  const restoreDraft = (id: string): AlbumDraft | null => {
    const draft = loadAlbumDraft(id);
    if (!draft) return null;
    localImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    setLocalImages([]);
    setActivityType(draft.activityType);
    setPreferences(draft.preferences);
    setAnalyses(draft.analyses);
    setAlbum(draft.album);
    setSelectedCoverUrl(draft.coverImageUrl ?? draft.album.cover_image_url);
    setProviderStatus(draft.providerStatus ?? null);
    setActiveDraftId(draft.id);
    return draft;
  };

  const updateAlbum = (partial: Partial<AlbumResult>) => {
    if (!album) return;
    setAlbum({ ...album, ...partial });
  };

  const updateGrid = (grid: GridRecommendation[]) => {
    if (!album) return;
    setAlbum({
      ...album,
      grid_recommendations: grid.map((item, index) => ({ ...item, position: `P${index + 1}` })),
    });
  };

  const updateCaptions = (captions: AlbumCaptions) => {
    if (!album) return;
    setAlbum({ ...album, captions });
  };

  const updateStoryline = (storyline: StorylineItem[]) => {
    if (!album) return;
    setAlbum({ ...album, storyline });
  };

  useEffect(() => {
    if (!album || analyses.length === 0) return;
    const timer = window.setTimeout(() => {
      saveCurrentDraft();
    }, 800);
    return () => window.clearTimeout(timer);
  }, [album, analyses, activityType, preferences, selectedCoverUrl, providerStatus]);

  const value = useMemo(
    () => ({
      activityType,
      setActivityType,
      localImages,
      setLocalImages,
      analyses,
      setAnalyses,
      album,
      setAlbum,
      preferences,
      setPreferences,
      providerStatus,
      setProviderStatus,
      selectedCoverUrl,
      setSelectedCoverUrl,
      activeDraftId,
      setActiveDraftId,
      resetDemo,
      loadDemoProject,
      saveCurrentDraft,
      restoreDraft,
      updateAlbum,
      updateGrid,
      updateCaptions,
      updateStoryline,
    }),
    [activityType, localImages, analyses, album, preferences, providerStatus, selectedCoverUrl, activeDraftId],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppState must be used inside AppProvider");
  }
  return context;
}

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeStorageSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage failures should not break the live demo.
  }
}

function safeStorageRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Storage failures should not break the live demo.
  }
}
