import type { AlbumResult, ImageAnalysis } from "../types";

export function calculateAverageQuality(analyses: ImageAnalysis[]): number {
  if (analyses.length === 0) return 0;
  return Math.round(analyses.reduce((sum, image) => sum + image.quality, 0) / analyses.length);
}

export function getTopImage(analyses: ImageAnalysis[]): ImageAnalysis | null {
  if (analyses.length === 0) return null;
  return [...analyses].sort((a, b) => b.quality - a.quality)[0];
}

export function getEmotionTags(analyses: ImageAnalysis[]): string[] {
  return unique(analyses.map((image) => image.emotion).filter(Boolean));
}

export function getSceneTags(analyses: ImageAnalysis[]): string[] {
  return unique(analyses.map((image) => image.scene).filter(Boolean));
}

export function buildInsightSummary(analyses: ImageAnalysis[]): string {
  if (analyses.length === 0) {
    return "完成 AI 分析后，这里会自动汇总整组照片的质量、情绪和叙事重点。";
  }
  const average = calculateAverageQuality(analyses);
  const emotions = getEmotionTags(analyses).slice(0, 3).join("、") || "自然";
  const scenes = getSceneTags(analyses).slice(0, 3).join("、") || "校园现场";
  const cover = analyses.find((image) => image.suggested_use === "封面主图") ?? getTopImage(analyses);
  return `本组照片平均质量分为 ${average}，主要场景集中在${scenes}，情绪标签以${emotions}为主。建议采用“${cover?.visual_focus ?? "人物状态"}”作为九宫格开场，并围绕“${cover?.suggested_use ?? "封面主图"}”建立相册第一视觉。`;
}

export function calculateAlbumMetrics(album: AlbumResult | null, analyses: ImageAnalysis[]) {
  const captionCount = album ? Object.keys(album.captions).length : 0;
  return {
    coverage: analyses.length > 0 && album ? Math.round((album.grid_recommendations.length / analyses.length) * 100) : 0,
    averageQuality: calculateAverageQuality(analyses),
    storylineCompleteness: album ? Math.round((album.storyline.length / 4) * 100) : 0,
    captionCount,
  };
}

export function totalPeople(analyses: ImageAnalysis[]): number {
  return analyses.reduce((sum, image) => sum + image.people_count, 0);
}

export function highestQuality(analyses: ImageAnalysis[]): number {
  return analyses.reduce((max, image) => Math.max(max, image.quality), 0);
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}
