import { Component, type ErrorInfo, type ReactNode } from "react";
import { demoActivityType, demoAlbum, demoAnalyses, demoPreferences } from "../lib/demoData";
import { clearAlbumDrafts } from "../lib/storage";
import { PrimaryButton } from "./PrimaryButton";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error("忆境 AI 前端渲染错误", error, info);
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-violet-50 px-4 py-10">
        <section className="w-full max-w-xl rounded-3xl border border-white/70 bg-white/85 p-8 text-center shadow-soft backdrop-blur">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-xl font-black text-white">忆</div>
          <h1 className="text-2xl font-bold text-ink">页面暂时无法显示</h1>
          <p className="mt-3 text-sm leading-7 text-muted">
            系统已拦截前端渲染异常。可以返回首页、加载演示项目，或清空本地草稿后继续演示。
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <PrimaryButton onClick={() => window.location.assign("/")}>返回首页</PrimaryButton>
            <PrimaryButton variant="secondary" onClick={loadDemoSnapshot}>
              加载演示项目
            </PrimaryButton>
            <PrimaryButton
              variant="ghost"
              onClick={() => {
                clearAlbumDrafts();
                clearSessionState();
                window.location.assign("/");
              }}
            >
              清空本地草稿
            </PrimaryButton>
          </div>
        </section>
      </main>
    );
  }
}

function loadDemoSnapshot() {
  try {
    localStorage.setItem("yijing.activityType", JSON.stringify(demoActivityType));
    localStorage.setItem("yijing.analyses", JSON.stringify(demoAnalyses));
    localStorage.setItem("yijing.album", JSON.stringify(demoAlbum));
    localStorage.setItem("yijing.preferences", JSON.stringify(demoPreferences));
    localStorage.setItem("yijing.selectedCoverUrl", JSON.stringify(demoAlbum.cover_image_url));
    localStorage.setItem("yijing.activeDraftId", JSON.stringify("demo-project"));
  } catch {
    // The route can still render the built-in demo from AppContext later.
  }
  window.location.assign("/demo");
}

function clearSessionState() {
  ["yijing.activityType", "yijing.analyses", "yijing.album", "yijing.preferences", "yijing.selectedCoverUrl", "yijing.activeDraftId"].forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore storage failures.
    }
  });
}
