import type { ActivityType, AlbumResult, ImageAnalysis } from "../types";

export interface LocalAlbumEvaluation {
  score: number;
  dimensions: {
    visualCoverage: number;
    storylineCompleteness: number;
    emotionConsistency: number;
    captionCompleteness: number;
    shareReadiness: number;
  };
  suggestions: string[];
}

export function evaluateAlbumLocally(_activityType: ActivityType, album: AlbumResult | null, analyses: ImageAnalysis[]): LocalAlbumEvaluation {
  if (!album) {
    return {
      score: 0,
      dimensions: { visualCoverage: 0, storylineCompleteness: 0, emotionConsistency: 0, captionCompleteness: 0, shareReadiness: 0 },
      suggestions: ["先生成相册方案，再查看质量评分。"],
    };
  }
  const targetGrid = Math.min(9, Math.max(1, analyses.length));
  const visualCoverage = Math.round((album.grid_recommendations.length / targetGrid) * 100);
  const storylineCompleteness = Math.min(100, Math.round((album.storyline.length / 4) * 100));
  const emotions = analyses.map((image) => image.emotion);
  const dominant = Math.max(0, ...Array.from(new Set(emotions)).map((emotion) => emotions.filter((item) => item === emotion).length));
  const emotionConsistency = Math.round((dominant / Math.max(1, emotions.length)) * 100);
  const captionCompleteness = Math.round((Object.values(album.captions).filter((value) => value.trim()).length / 4) * 100);
  const shareReadiness = Math.round(
    ([album.title, album.summary, album.cover_image_url, album.grid_recommendations.length > 0, captionCompleteness === 100].filter(Boolean).length / 5) * 100,
  );
  const dimensions = { visualCoverage, storylineCompleteness, emotionConsistency, captionCompleteness, shareReadiness };
  const score = Math.round(Object.values(dimensions).reduce((sum, value) => sum + value, 0) / 5);
  const suggestions = [
    visualCoverage < 90 ? "九宫格还可以补入更多关键图片，提高视觉覆盖率。" : "九宫格覆盖较完整，可进入展示页。",
    storylineCompleteness < 100 ? "故事线不足四步，建议重生成故事线。" : "故事线结构完整。",
    shareReadiness < 100 ? "建议确认封面、标题和四类文案后再导出。" : "分享准备度较高，适合导出和路演。",
  ];
  return { score, dimensions, suggestions };
}
