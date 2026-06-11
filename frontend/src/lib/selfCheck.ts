import { demoActivityType, demoAlbum, demoAnalyses } from "./demoData";
import { evaluateAlbumLocally } from "./evaluation";
import { buildHtmlAlbum, buildJsonReport, buildMarkdownReport, buildProjectOnePager } from "./report";
import { exportAllDrafts, validateDraft } from "./storage";

export function runSelfCheck(): void {
  if (!import.meta.env.DEV) return;
  try {
    const metrics = evaluateAlbumLocally(demoActivityType, demoAlbum, demoAnalyses);
    const checks = [
      ["demoData", demoAnalyses.length > 0 && Boolean(demoAlbum.title)],
      ["markdownReport", buildMarkdownReport(demoActivityType, demoAlbum, demoAnalyses).includes(demoAlbum.title)],
      ["jsonReport", buildJsonReport(demoActivityType, demoAlbum, demoAnalyses, metrics).includes("activity_type")],
      ["htmlAlbum", buildHtmlAlbum(demoActivityType, demoAlbum, demoAnalyses, metrics).includes("<html")],
      ["onePager", buildProjectOnePager(demoActivityType, demoAlbum, demoAnalyses, metrics, null).includes("忆境 AI")],
      ["storageExport", exportAllDrafts().includes("drafts")],
      ["draftValidator", validateDraft({}) === false],
    ] as const;
    const failed = checks.filter(([, ok]) => !ok).map(([name]) => name);
    if (failed.length) {
      console.warn("[忆境 AI self-check] failed:", failed);
    } else {
      console.info("[忆境 AI self-check] passed");
    }
  } catch (error) {
    console.warn("[忆境 AI self-check] error:", error);
  }
}
