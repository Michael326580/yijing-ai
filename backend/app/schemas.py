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


class AnalyzeResponse(BaseModel):
    session_id: str
    activity_type: ActivityType
    analyses: list[ImageAnalysis]


class GenerateAlbumRequest(BaseModel):
    activity_type: ActivityType
    analyses: list[ImageAnalysis]


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
