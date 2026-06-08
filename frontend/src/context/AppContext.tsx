import { createContext, useContext, useMemo, useState } from "react";
import type { ActivityType, AlbumResult, ImageAnalysis, LocalImage } from "../types";

interface AppContextValue {
  activityType: ActivityType;
  setActivityType: (value: ActivityType) => void;
  localImages: LocalImage[];
  setLocalImages: (images: LocalImage[]) => void;
  analyses: ImageAnalysis[];
  setAnalyses: (images: ImageAnalysis[]) => void;
  album: AlbumResult | null;
  setAlbum: (album: AlbumResult | null) => void;
  resetDemo: () => void;
}

const defaultActivityType: ActivityType = "科研竞赛";
const storageKeys = {
  activityType: "yijing.activityType",
  analyses: "yijing.analyses",
  album: "yijing.album",
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [activityType, setActivityTypeState] = useState<ActivityType>(() =>
    readStorage<ActivityType>(storageKeys.activityType, defaultActivityType),
  );
  const [localImages, setLocalImages] = useState<LocalImage[]>([]);
  const [analyses, setAnalysesState] = useState<ImageAnalysis[]>(() => readStorage<ImageAnalysis[]>(storageKeys.analyses, []));
  const [album, setAlbumState] = useState<AlbumResult | null>(() => readStorage<AlbumResult | null>(storageKeys.album, null));

  const setActivityType = (value: ActivityType) => {
    setActivityTypeState(value);
    localStorage.setItem(storageKeys.activityType, JSON.stringify(value));
  };

  const setAnalyses = (images: ImageAnalysis[]) => {
    setAnalysesState(images);
    localStorage.setItem(storageKeys.analyses, JSON.stringify(images));
  };

  const setAlbum = (nextAlbum: AlbumResult | null) => {
    setAlbumState(nextAlbum);
    if (nextAlbum) {
      localStorage.setItem(storageKeys.album, JSON.stringify(nextAlbum));
    } else {
      localStorage.removeItem(storageKeys.album);
    }
  };

  const resetDemo = () => {
    localImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    setLocalImages([]);
    setAnalysesState([]);
    setAlbumState(null);
    localStorage.removeItem(storageKeys.analyses);
    localStorage.removeItem(storageKeys.album);
  };

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
      resetDemo,
    }),
    [activityType, localImages, analyses, album],
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
