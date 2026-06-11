from typing import Literal

from pydantic import BaseModel, Field


ActivityType = Literal[
    "科研竞赛",
    "毕业纪念",
    "实验室日常",
    "社团活动",
    "舞台演出",
    "朋友聚会",
]

CaptionKey = Literal["concise", "passionate", "literary", "official"]


class ImageFeatureSummary(BaseModel):
    brightness_score: int = Field(ge=0, le=100)
    sharpness_score: int = Field(ge=0, le=100)
    colorfulness_score: int = Field(ge=0, le=100)
    orientation: Literal["landscape", "portrait", "square"]
    aspect_ratio: float
    file_size_kb: int = Field(ge=0)
    width: int = Field(ge=0)
    height: int = Field(ge=0)
    cover_score: int = Field(ge=0, le=100)


class ImageAnalysis(BaseModel):
    id: str
    filename: str
    url: str
    scene: str
    emotion: str
    objects: list[str]
    quality: int = Field(ge=0, le=100)
    suggested_use: str
    people_count: int = Field(ge=0)
    visual_focus: str
    caption: str
    features: ImageFeatureSummary | None = None


class AnalyzeResponse(BaseModel):
    session_id: str
    activity_type: ActivityType
    analyses: list[ImageAnalysis]


class AlbumGenerationPreferences(BaseModel):
    visual_style: str = "清新校园"
    caption_length: str = "中"
    emphasis: str = "情绪"
    output_scene: str = "朋友圈"
    title_style: str = "有记忆点"
    audience: str = "同学朋友"
    narrative_order: str = "开场—过程—高光—收束"
    must_include_image_ids: list[str] = Field(default_factory=list)
    excluded_image_ids: list[str] = Field(default_factory=list)
    custom_instruction: str = ""


class GenerateAlbumRequest(BaseModel):
    activity_type: ActivityType
    analyses: list[ImageAnalysis]
    preferences: AlbumGenerationPreferences | None = None


class StorylineItem(BaseModel):
    step: str
    title: str
    description: str


class GridRecommendation(BaseModel):
    position: str
    image_id: str
    url: str
    reason: str
    suggested_use: str


class AlbumCaptions(BaseModel):
    concise: str
    passionate: str
    literary: str
    official: str


class AlbumResult(BaseModel):
    title: str
    summary: str
    storyline: list[StorylineItem]
    grid_recommendations: list[GridRecommendation]
    captions: AlbumCaptions
    cover_image_url: str | None = None
    gallery: list[ImageAnalysis]


class GenerateAlbumResponse(BaseModel):
    activity_type: ActivityType
    album: AlbumResult


class HealthResponse(BaseModel):
    status: str
    service: str
    ai_provider: str
    deepseek_model: str | None = None
    deepseek_available: bool = False
    fallback: str
    last_checked_at: str | None = None


class RegenerateCaptionRequest(BaseModel):
    activity_type: ActivityType
    analyses: list[ImageAnalysis]
    album: AlbumResult
    caption_key: CaptionKey
    preferences: AlbumGenerationPreferences | None = None
    instruction: str = ""


class RegenerateCaptionResponse(BaseModel):
    caption_key: CaptionKey
    caption: str
    provider: str
    fallback: bool


class RegenerateTitleRequest(BaseModel):
    activity_type: ActivityType
    analyses: list[ImageAnalysis]
    album: AlbumResult
    preferences: AlbumGenerationPreferences | None = None
    instruction: str = ""


class RegenerateTitleResponse(BaseModel):
    title: str
    summary: str
    provider: str
    fallback: bool


class RegenerateStorylineRequest(BaseModel):
    activity_type: ActivityType
    analyses: list[ImageAnalysis]
    album: AlbumResult
    preferences: AlbumGenerationPreferences | None = None
    instruction: str = ""


class RegenerateStorylineResponse(BaseModel):
    storyline: list[StorylineItem]
    provider: str
    fallback: bool


class EvaluateAlbumRequest(BaseModel):
    activity_type: ActivityType
    analyses: list[ImageAnalysis]
    album: AlbumResult


class AlbumEvaluationDimensions(BaseModel):
    visual_coverage: int = Field(ge=0, le=100)
    storyline_completeness: int = Field(ge=0, le=100)
    emotion_consistency: int = Field(ge=0, le=100)
    caption_quality: int = Field(ge=0, le=100)
    share_readiness: int = Field(ge=0, le=100)


class EvaluateAlbumResponse(BaseModel):
    score: int = Field(ge=0, le=100)
    dimensions: AlbumEvaluationDimensions
    suggestions: list[str]
    provider: str
    fallback: bool
