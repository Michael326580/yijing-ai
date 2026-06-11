import type { ActivityType, AIProviderStatus, AlbumResult, CaptionKey, ImageAnalysis } from "../types";
import type { LocalAlbumEvaluation } from "./evaluation";

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

export function buildJsonReport(activityType: ActivityType, album: AlbumResult, analyses: ImageAnalysis[], metrics?: LocalAlbumEvaluation): string {
  return JSON.stringify(
    {
      activity_type: activityType,
      exportedAt: new Date().toISOString(),
      album,
      analyses,
      metrics,
      note: "当前图片 URL 为本地演示服务地址，仅在后端运行期间可访问。",
    },
    null,
    2,
  );
}

export function buildMomentsPackage(activityType: ActivityType, album: AlbumResult, analyses: ImageAnalysis[]): string {
  return [
    `# ${album.title}`,
    "",
    `活动类型：${activityType}`,
    "",
    "## 九宫格顺序",
    ...album.grid_recommendations.map((item) => `${item.position} ${item.suggested_use}：${item.reason}`),
    "",
    "## 简洁文案",
    album.captions.concise,
    "",
    "## 文艺文案",
    album.captions.literary,
    "",
    `素材数量：${analyses.length}`,
  ].join("\n");
}

export function buildPresentationScript(activityType: ActivityType, album: AlbumResult, analyses: ImageAnalysis[], metrics?: LocalAlbumEvaluation): string {
  const score = metrics ? `${metrics.score} 分` : "已完成";
  return [
    "# 忆境 AI 答辩讲解稿",
    "",
    "## 30 秒版本",
    `忆境 AI 面向高校活动照片，输入 ${analyses.length} 张${activityType}素材后，自动完成 AI 分析、九宫格编排、故事线生成、朋友圈文案和电子相册展示。当前相册质量评分为 ${score}，并支持 Markdown、JSON、HTML 和朋友圈文案包导出。`,
    "",
    "## 1 分钟版本",
    `我们的产品不是普通相册，而是校园 AI 相册创作工作台。第一步导入活动照片，系统提取场景、情绪、人物数量、视觉焦点和质量分；第二步根据用户偏好生成标题、摘要、四段故事线和 P1-P9 九宫格；第三步支持编辑、局部重生成、草稿保存和多格式导出。以这组${activityType}为例，系统生成的标题是《${album.title}》，并形成了可直接展示的电子相册。`,
    "",
    "## 3 分钟版本",
    `忆境 AI 解决的是高校活动影像“拍了很多、整理很少、传播很散”的问题。产品流程分为输入、分析、生成、展示、导出五步。输入阶段支持多图素材管理；分析阶段把照片转化为结构化数据；生成阶段结合 DeepSeek 或 fallback 逻辑完成相册策划；展示阶段提供封面、九宫格、故事线、文案和汇报视图；导出阶段支持 Markdown、JSON、HTML、朋友圈文案包和答辩讲解稿。这个闭环让校园照片从简单存储变成可编辑、可追溯、可路演展示的 AI 电子相册。`,
  ].join("\n");
}

export function buildProjectOnePager(
  activityType: ActivityType,
  album: AlbumResult,
  analyses: ImageAnalysis[],
  metrics?: LocalAlbumEvaluation,
  providerStatus?: AIProviderStatus | null,
): string {
  const exportedAt = new Date().toLocaleString("zh-CN");
  const averageQuality = analyses.length ? Math.round(analyses.reduce((sum, image) => sum + image.quality, 0) / analyses.length) : 0;
  const featureCount = analyses.filter((image) => image.features).length;
  const provider = providerStatus?.ai_provider === "deepseek" && providerStatus.deepseek_available ? "DeepSeek 增强生成" : "本地兜底服务";
  const grid = album.grid_recommendations
    .slice(0, 9)
    .map((item) => `<figure><img src="${escapeHtml(item.url)}" alt="${escapeHtml(item.position)}" /><figcaption>${escapeHtml(item.position)} · ${escapeHtml(item.suggested_use)}</figcaption></figure>`)
    .join("");
  const story = album.storyline
    .map((item) => `<li><strong>${escapeHtml(item.step)} ${escapeHtml(item.title)}</strong><span>${escapeHtml(item.description)}</span></li>`)
    .join("");
  const captions = Object.entries(album.captions)
    .map(([key, value]) => `<article><h3>${escapeHtml(captionLabels[key as CaptionKey])}</h3><p>${escapeHtml(value)}</p></article>`)
    .join("");
  const score = metrics?.score ?? Math.round((averageQuality + album.grid_recommendations.length * 10 + album.storyline.length * 20) / 3);

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>忆境 AI 项目汇报</title>
  <style>
    *{box-sizing:border-box} body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif;background:#f6f9ff;color:#162033}
    main{max-width:1180px;margin:0 auto;padding:38px 22px 60px}
    .hero{display:grid;grid-template-columns:1.05fr .95fr;gap:24px;align-items:center;border-radius:28px;background:linear-gradient(135deg,#fff,#eef5ff);padding:26px;box-shadow:0 28px 80px rgba(37,99,235,.12)}
    .cover{width:100%;height:360px;object-fit:cover;border-radius:22px;background:#dbeafe}
    .eyebrow{display:inline-flex;border:1px solid #bfdbfe;background:#eff6ff;color:#1d4ed8;border-radius:999px;padding:8px 12px;font-weight:800;font-size:13px}
    h1{font-size:44px;line-height:1.08;margin:18px 0 14px} h2{font-size:24px;margin:0 0 14px} h3{margin:0 0 8px;font-size:16px}
    p{line-height:1.75;color:#526173}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:20px}.stat{border:1px solid #e2e8f0;background:white;border-radius:18px;padding:16px}.stat b{display:block;font-size:24px}
    .section{margin-top:22px;border:1px solid #e8eef8;background:rgba(255,255,255,.86);border-radius:24px;padding:24px;box-shadow:0 18px 44px rgba(30,41,59,.06)}
    .cards{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.card{border-radius:18px;background:#f8fbff;border:1px solid #e2e8f0;padding:16px}.card strong{display:block;margin-bottom:8px;color:#1e40af}
    .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.grid figure{margin:0;position:relative;overflow:hidden;border-radius:16px;background:#e2e8f0}.grid img{width:100%;aspect-ratio:1/1;object-fit:cover}.grid figcaption{position:absolute;left:8px;bottom:8px;border-radius:999px;background:rgba(15,23,42,.78);color:white;padding:6px 10px;font-size:12px;font-weight:800}
    ol{padding-left:22px} li{margin:12px 0;line-height:1.7} li span{display:block;color:#526173}
    .captions{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}.captions article{background:#f8fafc;border-radius:18px;padding:16px}
    .footer{margin-top:24px;text-align:center;color:#64748b;font-size:13px}
    @media(max-width:860px){.hero,.cards,.captions{grid-template-columns:1fr}.stats{grid-template-columns:repeat(2,1fr)}h1{font-size:34px}.cover{height:280px}}
    @media print{body{background:white}.section,.hero{box-shadow:none}.grid figcaption{position:static;background:#f1f5f9;color:#334155;border-radius:0}}
  </style>
</head>
<body>
  <main>
    <section class="hero">
      <div>
        <span class="eyebrow">忆境 AI · 校园照片 → AI 叙事相册</span>
        <h1>${escapeHtml(album.title)}</h1>
        <p>${escapeHtml(album.summary)}</p>
        <div class="stats">
          <div class="stat"><span>活动类型</span><b>${escapeHtml(activityType)}</b></div>
          <div class="stat"><span>输入图片</span><b>${analyses.length}</b></div>
          <div class="stat"><span>平均质量</span><b>${averageQuality}</b></div>
          <div class="stat"><span>相册评分</span><b>${score}</b></div>
        </div>
      </div>
      ${album.cover_image_url ? `<img class="cover" src="${escapeHtml(album.cover_image_url)}" alt="${escapeHtml(album.title)}" />` : `<div class="cover"></div>`}
    </section>

    <section class="section">
      <h2>项目定位</h2>
      <p>忆境 AI 面向校园活动、科研竞赛、毕业纪念与社团演出，把分散照片整理为可编辑、可重生成、可导出的 AI 电子相册。</p>
    </section>

    <section class="section">
      <h2>AI 能力与可靠性</h2>
      <div class="cards">
        <div class="card"><strong>本地视觉分析</strong>已提取 ${featureCount}/${analyses.length} 张图片的亮度、清晰度、色彩、构图和封面候选分。</div>
        <div class="card"><strong>AI 策划</strong>${escapeHtml(provider)} 用于标题、摘要、故事线和多风格文案生成。</div>
        <div class="card"><strong>fallback 兜底</strong>无 Key、调用失败或后端离线时，示例项目与本地草稿仍可展示。</div>
        <div class="card"><strong>Album Studio</strong>支持拖拽九宫格、封面选择、局部重生成和草稿保存。</div>
      </div>
    </section>

    <section class="section"><h2>输出成果：九宫格</h2><div class="grid">${grid}</div></section>
    <section class="section"><h2>故事线</h2><ol>${story}</ol></section>
    <section class="section"><h2>多风格文案</h2><div class="captions">${captions}</div></section>
    <section class="section">
      <h2>技术架构</h2>
      <div class="cards">
        <div class="card"><strong>Frontend</strong>React + TypeScript + Vite + Tailwind CSS</div>
        <div class="card"><strong>Backend</strong>FastAPI + Python 文件上传与静态图片服务</div>
        <div class="card"><strong>AI Provider</strong>DeepSeek OpenAI-compatible API，后端安全读取环境变量</div>
        <div class="card"><strong>Local</strong>localStorage draft + 本地兜底服务 + 多格式导出</div>
      </div>
    </section>
    <div class="footer">生成时间：${escapeHtml(exportedAt)} · 当前图片链接为演示服务地址，仅在对应服务可访问时有效。</div>
  </main>
</body>
</html>`;
}

export function buildHtmlAlbum(activityType: ActivityType, album: AlbumResult, analyses: ImageAnalysis[], metrics?: LocalAlbumEvaluation): string {
  const grid = album.grid_recommendations
    .map(
      (item) => `
        <figure>
          <img src="${escapeHtml(item.url)}" alt="${escapeHtml(item.position)}" />
          <figcaption>${escapeHtml(item.position)} · ${escapeHtml(item.suggested_use)}</figcaption>
        </figure>`,
    )
    .join("");
  const storyline = album.storyline
    .map((item) => `<li><strong>${escapeHtml(item.step)} ${escapeHtml(item.title)}</strong><span>${escapeHtml(item.description)}</span></li>`)
    .join("");
  const captions = Object.entries(album.captions)
    .map(([key, value]) => `<section><h3>${escapeHtml(captionLabels[key as CaptionKey])}</h3><p>${escapeHtml(value)}</p></section>`)
    .join("");
  const details = analyses
    .map(
      (image, index) =>
        `<tr><td>图片 ${index + 1}</td><td>${escapeHtml(image.scene)}</td><td>${escapeHtml(image.emotion)}</td><td>${escapeHtml(image.visual_focus)}</td><td>${escapeHtml(image.suggested_use)}</td></tr>`,
    )
    .join("");
  const exportedAt = new Date().toLocaleString("zh-CN");
  const score = metrics ? `<div class="score">相册评分：${metrics.score}</div>` : "";

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(album.title)}</title>
  <style>
    body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif;background:radial-gradient(circle at 20% 10%,#dbeafe,transparent 30rem),#eef4ff;color:#172033}
    main{max-width:1080px;margin:0 auto;padding:40px 20px}
    .hero{display:grid;grid-template-columns:1.1fr .9fr;gap:24px;align-items:center;background:white;border-radius:24px;overflow:hidden;box-shadow:0 24px 70px rgba(59,85,160,.14)}
    .hero img{width:100%;height:420px;object-fit:cover}
    .hero div{padding:32px}
    h1{font-size:42px;line-height:1.1;margin:0 0 16px}
    p{line-height:1.8;color:#526173}
    .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:24px}
    figure{margin:0;background:white;border-radius:16px;overflow:hidden}
    figure img{width:100%;aspect-ratio:1/1;object-fit:cover}
    figcaption{padding:10px;font-weight:700}
    .card{margin-top:24px;background:rgba(255,255,255,.9);border-radius:20px;padding:24px;box-shadow:0 16px 40px rgba(30,41,59,.08)}
    .score{display:inline-flex;margin-top:16px;border-radius:999px;background:#eff6ff;color:#1d4ed8;font-weight:800;padding:8px 14px}
    li{margin:12px 0;line-height:1.7}
    li span{display:block;color:#526173}
    table{width:100%;border-collapse:collapse}
    td,th{border-bottom:1px solid #e2e8f0;padding:10px;text-align:left}
    @media(max-width:760px){.hero{grid-template-columns:1fr}.hero img{height:280px}.grid{grid-template-columns:repeat(2,1fr)}h1{font-size:32px}}
  </style>
</head>
<body>
  <main>
    <section class="hero">
      ${album.cover_image_url ? `<img src="${escapeHtml(album.cover_image_url)}" alt="${escapeHtml(album.title)}" />` : ""}
      <div><small>${escapeHtml(activityType)} · 生成时间 ${escapeHtml(exportedAt)}</small><h1>${escapeHtml(album.title)}</h1><p>${escapeHtml(album.summary)}</p>${score}</div>
    </section>
    <section class="card"><h2>朋友圈九宫格</h2><div class="grid">${grid}</div></section>
    <section class="card"><h2>故事线</h2><ol>${storyline}</ol></section>
    <section class="card"><h2>朋友圈文案</h2>${captions}</section>
    <section class="card"><h2>AI 分析摘要</h2><p>本相册共使用 ${analyses.length} 张图片，九宫格收录 ${album.grid_recommendations.length} 张，故事线 ${album.storyline.length} 步，文案 ${Object.keys(album.captions).length} 种。</p></section>
    <section class="card"><h2>图片分析明细</h2><table><tbody>${details}</tbody></table></section>
  </main>
</body>
</html>`;
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
