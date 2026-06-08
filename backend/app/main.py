from __future__ import annotations

import re
import uuid
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.schemas import ActivityType, AnalyzeResponse, GenerateAlbumRequest, GenerateAlbumResponse
from app.services.mock_ai import analyze_images, generate_album


BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

MAX_FILES = 12
MAX_FILE_SIZE = 10 * 1024 * 1024
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}

app = FastAPI(title="忆境 AI Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5173",
        "http://localhost:5173",
        "http://127.0.0.1:5174",
        "http://localhost:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "忆境 AI Backend"}


@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze(
    request: Request,
    activity_type: ActivityType = Form(...),
    files: list[UploadFile] = File(...),
) -> AnalyzeResponse:
    if not files:
        raise HTTPException(status_code=400, detail="请至少上传 1 张图片。")
    if len(files) > MAX_FILES:
        raise HTTPException(status_code=400, detail=f"最多支持上传 {MAX_FILES} 张图片。")

    session_id = uuid.uuid4().hex[:12]
    session_dir = UPLOAD_DIR / session_id
    session_dir.mkdir(parents=True, exist_ok=True)

    image_records: list[dict[str, str]] = []
    for index, upload in enumerate(files):
        suffix = Path(upload.filename or "").suffix.lower()
        if suffix not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail="仅支持 jpg、jpeg、png、webp 图片。")
        if upload.content_type not in ALLOWED_CONTENT_TYPES:
            raise HTTPException(status_code=400, detail="文件类型不正确，请上传图片文件。")

        safe_name = _safe_filename(upload.filename or f"image-{index}{suffix}")
        stored_name = f"{index + 1:02d}-{uuid.uuid4().hex[:8]}-{safe_name}"
        file_path = session_dir / stored_name

        size = 0
        with file_path.open("wb") as buffer:
            while chunk := await upload.read(1024 * 1024):
                size += len(chunk)
                if size > MAX_FILE_SIZE:
                    file_path.unlink(missing_ok=True)
                    raise HTTPException(status_code=400, detail="单张图片不能超过 10 MB。")
                buffer.write(chunk)

        image_records.append(
            {
                "id": f"img-{index + 1:02d}",
                "filename": upload.filename or stored_name,
                "url": f"{_base_url(request)}/uploads/{session_id}/{stored_name}",
            }
        )

    analyses = analyze_images(activity_type, image_records)
    return AnalyzeResponse(session_id=session_id, activity_type=activity_type, analyses=analyses)


@app.post("/api/generate-album", response_model=GenerateAlbumResponse)
def create_album(payload: GenerateAlbumRequest) -> GenerateAlbumResponse:
    if not payload.analyses:
        raise HTTPException(status_code=400, detail="缺少图片分析结果，无法生成相册。")
    album = generate_album(payload.activity_type, payload.analyses)
    return GenerateAlbumResponse(activity_type=payload.activity_type, album=album)


def _safe_filename(filename: str) -> str:
    name = Path(filename).name
    name = re.sub(r"[^A-Za-z0-9._-]+", "-", name).strip("-")
    return name or "image.jpg"


def _base_url(request: Request) -> str:
    return str(request.base_url).rstrip("/")
