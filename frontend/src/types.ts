export const activityTypes = [
  "科研竞赛",
  "毕业纪念",
  "实验室日常",
  "社团活动",
  "舞台演出",
  "朋友聚会",
] as const;

export type ActivityType = (typeof activityTypes)[number];

export type CaptionKey = "concise" | "passionate" | "literary" | "official";

export interface LocalImage {
  id: string;
  file: File;
  previewUrl: string;
}

export interface ImageAnalysis {
  id: string;
  filename: string;
  url: string;
  scene: string;
  emotion: string;
  objects: string[];
  quality: number;
  suggested_use: string;
  people_count: number;
  visual_focus: string;
  caption: string;
}

export interface AnalyzeResponse {
  session_id: string;
  activity_type: ActivityType;
  analyses: ImageAnalysis[];
}

export interface StorylineItem {
  step: string;
  title: string;
  description: string;
}

export interface GridRecommendation {
  position: string;
  image_id: string;
  url: string;
  reason: string;
  suggested_use: string;
}

export interface AlbumCaptions {
  concise: string;
  passionate: string;
  literary: string;
  official: string;
}

export interface AlbumResult {
  title: string;
  summary: string;
  storyline: StorylineItem[];
  grid_recommendations: GridRecommendation[];
  captions: AlbumCaptions;
  cover_image_url: string | null;
  gallery: ImageAnalysis[];
}

export interface GenerateAlbumResponse {
  activity_type: ActivityType;
  album: AlbumResult;
}
