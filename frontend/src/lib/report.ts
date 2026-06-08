import type { ActivityType, AlbumResult, CaptionKey, ImageAnalysis } from "../types";

export const captionLabels: Record<CaptionKey, string> = {
  concise: "简洁谦虚版",
  passionate: "热血奋斗版",
  literary: "文艺纪念版",
  official: "官方总结版",
};

export function buildMarkdownReport(activityType: ActivityType, album: AlbumResult, analyses: ImageAnalysis[]): string {
  const lines = [
    `# ${album.title}`,
    "",
    `- 活动类型：${activityType}`,
    `- 图片数量：${analyses.length}`,
    "- 说明：当前图片 URL 为本地演示服务地址，仅在后端运行期间可访问。",
    "",
    "## 活动简介",
    album.summary,
    "",
    "## 故事线",
    ...album.storyline.map((item) => `- ${item.step} ${item.title}：${item.description}`),
    "",
    "## P1-P9 九宫格推荐",
    ...album.grid_recommendations.map(
      (item) => `- ${item.position}：${item.suggested_use}。${item.reason} 本地演示链接：${item.url}`,
    ),
    "",
    "## 朋友圈文案",
    ...Object.entries(album.captions).map(([key, value]) => `### ${captionLabels[key as CaptionKey]}\n${value}`),
    "",
    "## 图片分析明细",
    ...analyses.map(
      (image, index) =>
        `### 图片 ${index + 1}\n- 场景：${image.scene}\n- 情绪：${image.emotion}\n- 视觉焦点：${image.visual_focus}\n- 用途：${image.suggested_use}\n- AI Caption：${image.caption}\n- 本地演示链接：${image.url}`,
    ),
    "",
  ];

  return lines.join("\n");
}

export function downloadTextFile(filename: string, content: string, mimeType = "text/markdown;charset=utf-8"): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
