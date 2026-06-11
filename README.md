# 忆境 AI

忆境 AI 是一个面向高校活动影像的 AI 电子相册与校园记忆生成系统。用户上传校园活动照片后，系统会完成本地视觉分析、相册故事线策划、朋友圈九宫格编排、多风格文案生成、Album Studio 编辑和多格式导出。

第一版使用 mock service 验证产品闭环，并已接入 DeepSeek OpenAI-compatible ChatCompletions 作为增强生成能力。未配置 Key、模型调用失败或返回格式异常时，后端会自动 fallback 到本地兜底服务，保证比赛现场流程不崩。

## 功能亮点

- 上传 1-12 张校园活动照片，支持 jpg / jpeg / png / webp，单张不超过 10 MB。
- 支持科研竞赛、毕业纪念、实验室日常、社团活动、舞台演出、朋友聚会六类活动。
- 本地视觉分析提取亮度、清晰度、色彩丰富度、构图方向、尺寸、文件大小和封面候选分。
- DeepSeek 增强生成相册标题、活动简介、四段故事线、P1-P9 九宫格和四类朋友圈文案。
- Album Studio 支持九宫格拖拽、封面选择、标题/故事线/文案局部重生成、本地草稿和质量评分。
- Showcase Mode 适合评委现场快速理解产品价值，并支持自动演示流程。
- 导出 Markdown、JSON、HTML 相册、朋友圈文案包、答辩讲稿和一页式项目汇报 HTML。
- ErrorBoundary、SafeImage、健康状态、localStorage schema 校验共同保证异常兜底。

## 技术栈

- Frontend：React + Vite + TypeScript + Tailwind CSS
- Backend：FastAPI + Pydantic + Python multipart upload
- AI Provider：DeepSeek V4 OpenAI-compatible ChatCompletions
- Local fallback：mock service + PIL 本地图片特征分析
- Draft：浏览器 localStorage，最多保留 20 个草稿

## 目录结构

```text
D:\Projects\yijing-ai
├─ backend
│  ├─ app
│  │  ├─ config.py
│  │  ├─ main.py
│  │  ├─ schemas.py
│  │  └─ services
│  │     ├─ deepseek_ai.py
│  │     ├─ image_features.py
│  │     └─ mock_ai.py
│  ├─ tests
│  │  └─ test_api.py
│  ├─ requirements.txt
│  └─ uploads
├─ frontend
│  ├─ src
│  │  ├─ components
│  │  ├─ context
│  │  ├─ lib
│  │  └─ pages
│  ├─ .env.example
│  └─ package.json
├─ .gitignore
└─ README.md
```

## 后端启动

Windows 免激活虚拟环境命令：

```powershell
cd D:\Projects\yijing-ai\backend
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

健康检查：

```text
http://127.0.0.1:8000/api/health
```

接口文档：

```text
http://127.0.0.1:8000/docs
```

## 前端启动

```powershell
cd D:\Projects\yijing-ai\frontend
npm.cmd install
npm.cmd run dev
```

浏览器访问：

```text
http://127.0.0.1:5173
```

前端后端地址配置：

```powershell
cd D:\Projects\yijing-ai\frontend
copy .env.example .env
```

`.env.example` 默认内容：

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## DeepSeek 配置

API Key 只允许放在后端环境变量或 `backend/.env`，不要写入前端。

默认本地兜底：

```powershell
$env:AI_PROVIDER="mock"
```

启用 DeepSeek：

```env
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=your_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash
DEEPSEEK_TIMEOUT=60
```

可将 `DEEPSEEK_MODEL` 改为 `deepseek-v4-pro`。后端调用时会要求模型只输出 JSON，并关闭 thinking mode 以提高结构化返回稳定性。

## Fallback 说明

以下场景都会自动回到本地兜底服务：

- 没有设置 `DEEPSEEK_API_KEY`
- `AI_PROVIDER` 不是 `deepseek`
- DeepSeek 请求超时或接口异常
- 模型返回内容无法解析为 JSON
- 模型返回的九宫格图片 ID 不存在

前端仍会收到兼容的 `AnalyzeResponse`、`GenerateAlbumResponse`、`ImageAnalysis` 和 `AlbumResult` 结构。页面状态会显示 Local Fallback，不暴露技术堆栈。

## API 说明

### GET /api/health

返回后端服务状态、AI provider、DeepSeek 模型、可用性、fallback 状态和检查时间。

### POST /api/analyze

请求类型：`multipart/form-data`

- `activity_type`：活动类型
- `files`：图片文件列表

返回每张图片的结构化分析结果，包括原有字段和可选 `features`：

- `brightness_score`
- `sharpness_score`
- `colorfulness_score`
- `orientation`
- `aspect_ratio`
- `file_size_kb`
- `width`
- `height`
- `cover_score`

图片 URL 使用完整地址，例如：

```text
http://127.0.0.1:8000/uploads/{session_id}/{filename}
```

### POST /api/generate-album

根据图片分析结果和生成偏好输出相册标题、简介、四段故事线、P1-P9 九宫格、四类文案、封面和 gallery。

### 局部重生成与评分

- `POST /api/regenerate-caption`
- `POST /api/regenerate-title`
- `POST /api/regenerate-storyline`
- `POST /api/evaluate-album`

这些接口均支持 DeepSeek 增强与本地兜底。

## 一键演示项目

首页、上传页、生成页、展示页和 Showcase Mode 都提供“加载演示项目”或“一键进入演示”入口。该项目不依赖后端上传流程，适合在后端离线或网络不稳定时继续展示产品闭环。

## Album Studio 使用说明

1. 上传图片并完成 AI 分析。
2. 进入 Album Studio 点击“智能生成”。
3. 左侧素材池可筛选图片、加入九宫格、设为封面。
4. 中间九宫格支持拖拽排序、移除图片和编辑用途。
5. 右侧可编辑标题、摘要、故事线，并局部重生成。
6. 底部文案面板支持编辑、复制、恢复和按要求重生成。
7. 草稿自动保存到 localStorage，也可手动保存。

## Showcase Mode 使用说明

访问：

```text
http://127.0.0.1:5173/showcase
```

可执行：

- 查看产品定位和完整流程
- 开始自动演示，依次高亮上传、分析、策划、编辑、导出
- 一键进入最终展示页
- 一键进入 Album Studio
- 导出一页式项目汇报 HTML
- 展示系统可靠性：DeepSeek 可用、无 Key、本地兜底、后端离线

## 导出功能

- Markdown：适合提交相册分析报告
- JSON：适合保留结构化结果
- HTML 相册：适合离线打开展示成品相册
- 朋友圈文案包：适合快速复制发布
- 答辩讲稿：提供 30 秒、1 分钟、3 分钟讲解结构
- 一页式项目汇报 HTML：适合比赛材料提交和现场快速说明

## localStorage 草稿

- 草稿 key：`yijing.albumDrafts`
- 最多保留 20 个，超过后自动删除最旧草稿
- JSON parse 失败会自动忽略坏数据
- 草稿缺字段会被跳过，不影响页面渲染
- 首页显示最近 3 个草稿，支持恢复、删除、清空
- `storage.ts` 提供 `exportAllDrafts()`、`importDrafts()`、`validateDraft()`、`getLatestDraft()`

## 比赛演示建议路径

1. 打开 `/showcase`，用 Hero 和流程图介绍项目定位。
2. 点击“开始自动演示”，让评委看到完整闭环。
3. 点击“一键进入演示”，展示最终电子相册。
4. 切到 `/generate`，展示 Album Studio。
5. 拖拽九宫格，设封面，局部重生成文案。
6. 导出 HTML 相册和一页式项目汇报。
7. 打开 HealthBadge，说明 DeepSeek 增强和 Local Fallback 机制。

## 常见问题

### 后端未启动

HealthBadge 会显示 Backend Offline。此时上传分析和生成接口不可用，但一键演示项目、本地草稿恢复和 Showcase 页面仍可使用。

### DeepSeek 无 Key

后端会返回 Local Fallback 状态，生成、局部重生成和评分会走本地兜底服务，页面不会弹出技术错误。

### 端口占用

如果 8000 或 5173 被占用，可改端口启动。前端后端端口变化时要同步更新：

- `frontend/.env` 的 `VITE_API_BASE_URL`
- `backend/app/main.py` 的 CORS `allow_origins`

### npm.ps1 执行策略

如果 PowerShell 报 `npm.ps1 cannot be loaded`，使用：

```powershell
npm.cmd install
npm.cmd run dev
```

### uvicorn 找不到

使用虚拟环境 Python 模块方式：

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

### 前端 build 失败

先确认依赖安装完整：

```powershell
cd D:\Projects\yijing-ai\frontend
npm.cmd install
npm.cmd run typecheck
npm.cmd run build
```

### localStorage 草稿异常

页面会自动忽略坏数据。也可以在首页“最近项目”中清空历史，或在 ErrorBoundary 兜底页点击“清空本地草稿”。

### 图片 URL 无法加载

上传图片 URL 是本地后端服务地址，仅后端运行期间可访问。SafeImage 会显示“图片暂不可用”占位，页面不会崩溃。

## 测试与检查

后端：

```powershell
cd D:\Projects\yijing-ai\backend
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m compileall app
.\.venv\Scripts\python.exe -m pytest tests
```

前端：

```powershell
cd D:\Projects\yijing-ai\frontend
npm.cmd run typecheck
npm.cmd run build
```
