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

export interface AIProviderStatus {
  status: string;
  service: string;
  ai_provider?: "mock" | "deepseek" | string;
  deepseek_model?: string | null;
  deepseek_available?: boolean;
  fallback?: string;
  last_checked_at?: string;
}

export interface AlbumGenerationPreferences {
  visual_style: string;
  caption_length: string;
  emphasis: string;
  output_scene: string;
  title_style?: string;
  audience?: string;
  narrative_order?: string;
  must_include_image_ids?: string[];
  excluded_image_ids?: string[];
  custom_instruction?: string;
}

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
  features?: ImageFeatureSummary | null;
}

export interface ImageFeatureSummary {
  brightness_score: number;
  sharpness_score: number;
  colorfulness_score: number;
  orientation: "landscape" | "portrait" | "square";
  aspect_ratio: number;
  file_size_kb: number;
  width: number;
  height: number;
  cover_score: number;
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

export interface AlbumDraft {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  activityType: ActivityType;
  analyses: ImageAnalysis[];
  album: AlbumResult;
  preferences: AlbumGenerationPreferences;
  coverImageUrl: string | null;
  providerStatus?: AIProviderStatus;
}

export interface RegenerateCaptionResponse {
  caption_key: CaptionKey;
  caption: string;
  provider: string;
  fallback: boolean;
}

export interface RegenerateTitleResponse {
  title: string;
  summary: string;
  provider: string;
  fallback: boolean;
}

export interface RegenerateStorylineResponse {
  storyline: StorylineItem[];
  provider: string;
  fallback: boolean;
}

export interface AlbumEvaluationDimensions {
  visual_coverage: number;
  storyline_completeness: number;
  emotion_consistency: number;
  caption_quality: number;
  share_readiness: number;
}

export interface EvaluateAlbumResponse {
  score: number;
  dimensions: AlbumEvaluationDimensions;
  suggestions: string[];
  provider: string;
  fallback: boolean;
}
