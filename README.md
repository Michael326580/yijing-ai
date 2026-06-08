# 忆境 AI

忆境 AI 是一个面向高校学生的 AI 智能相册与朋友圈叙事生成器 Demo。用户上传一组校园活动照片后，系统会模拟多模态 AI 分析图片内容，生成活动故事线、朋友圈九宫格排序方案、四种朋友圈文案，并输出适合比赛展示的电子相册页面。

第一版不调用真实 AI API，后端使用 mock AI 数据模拟分析结果，页面中的“AI 生成”表述代表 Demo 模拟流程；代码结构已按后续接入多模态大模型预留。

## 项目结构

```text
D:\Projects\yijing-ai
├─ backend
│  ├─ app
│  │  ├─ main.py
│  │  ├─ schemas.py
│  │  └─ services
│  │     └─ mock_ai.py
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

## 功能范围

- 首页、上传页、AI 分析页、相册生成页、最终 Demo 展示页。
- 支持选择活动类型：科研竞赛、毕业纪念、实验室日常、社团活动、舞台演出、朋友聚会。
- 支持本地上传多张图片并预览。
- 上传限制：最多 12 张，单张不超过 10 MB，仅支持 jpg、jpeg、png、webp。
- 图片分析字段：`scene`、`emotion`、`objects`、`quality`、`suggested_use`、`people_count`、`visual_focus`、`caption`。
- 自动生成相册标题、活动简介、故事线、P1-P9 九宫格推荐。
- 自动生成四种朋友圈文案：简洁谦虚版、热血奋斗版、文艺纪念版、官方总结版。
- 最终 Demo 页支持一键复制朋友圈文案、导出 Markdown 相册分析报告、重新上传照片、返回相册生成页。

## 后端启动

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

如需修改后端地址，复制环境变量示例：

```powershell
copy .env.example .env
```

默认内容：

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## API 说明

### GET /api/health

返回后端服务状态。

### POST /api/analyze

请求类型：`multipart/form-data`

字段：

- `activity_type`：活动类型。
- `files`：图片文件列表。

返回：

- `session_id`
- `activity_type`
- `analyses`

后端返回图片 URL 时会返回完整可访问地址，例如：

```text
http://127.0.0.1:8000/uploads/{session_id}/{filename}
```

### POST /api/generate-album

请求类型：`application/json`

字段：

- `activity_type`
- `analyses`

返回：

- 相册标题
- 活动简介
- 故事线
- P1-P9 九宫格推荐
- 四类朋友圈文案
- 最终电子相册展示数据

## 演示流程

1. 进入首页，点击“开始创建”。
2. 在上传页选择活动类型并上传 1-12 张图片。
3. 进入 AI 分析页，点击“开始 AI 分析”。
4. 进入相册生成页，点击“生成相册方案”。
5. 进入最终 Demo 页，复制文案或导出 Markdown 报告。
6. 比赛现场可点击“重新上传照片”重复演示。

## 后续接入真实 AI

当前 mock 逻辑集中在：

```text
backend/app/services/mock_ai.py
```

后续接入真实多模态大模型时，建议保留 `schemas.py` 中的请求和响应结构，只替换 service 层实现：

- `/api/analyze`：调用多模态模型分析图片。
- `/api/generate-album`：调用文本生成模型生成故事线、九宫格理由和文案。

## Windows 常见问题

### npm.ps1 执行策略问题

如果 PowerShell 报错 `npm.ps1 cannot be loaded because running scripts is disabled`，请使用：

```powershell
npm.cmd install
npm.cmd run dev
```

不要直接使用 `npm install` 或 `npm run dev`。

### uvicorn 找不到

如果直接运行 `uvicorn` 报错找不到命令，请使用虚拟环境里的 Python 模块方式启动：

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

### 前后端跨端口访问问题

前端默认运行在 `http://127.0.0.1:5173`，后端默认运行在 `http://127.0.0.1:8000`。后端已启用 CORS，允许 Vite 本地端口访问。

如果你修改了前端端口或后端地址，需要同步调整：

- `frontend/.env` 中的 `VITE_API_BASE_URL`
- `backend/app/main.py` 中的 CORS `allow_origins`

### 图片 URL 无法加载

请确认：

- 后端服务正在 `http://127.0.0.1:8000` 运行。
- `/api/analyze` 返回的图片 URL 是完整地址。
- 图片文件保存在 `backend/uploads/` 下。
- 浏览器可直接打开返回的图片 URL。

## 检查命令

前端：

```powershell
cd D:\Projects\yijing-ai\frontend
npm.cmd install
npm.cmd run typecheck
npm.cmd run build
```

后端：

```powershell
cd D:\Projects\yijing-ai\backend
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -c "from app.main import app; print(app.title)"
.\.venv\Scripts\python.exe -m compileall app
```
