from __future__ import annotations

import re
import uuid
import logging
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.schemas import ActivityType, AnalyzeResponse, GenerateAlbumRequest, GenerateAlbumResponse, HealthResponse
from app.schemas import (
    EvaluateAlbumRequest,
    EvaluateAlbumResponse,
    RegenerateCaptionRequest,
    RegenerateCaptionResponse,
    RegenerateStorylineRequest,
    RegenerateStorylineResponse,
    RegenerateTitleRequest,
    RegenerateTitleResponse,
)
from app.services.deepseek_ai import (
    DeepSeekAIError,
    enhance_analyses_with_deepseek,
    evaluate_album_with_deepseek,
    generate_album_with_deepseek,
    is_deepseek_available,
    regenerate_caption_with_deepseek,
    regenerate_storyline_with_deepseek,
    regenerate_title_with_deepseek,
)
from app.services.mock_ai import analyze_images, evaluate_album as evaluate_mock_album, generate_album as generate_mock_album
from app.services.mock_ai import regenerate_caption as regenerate_mock_caption
from app.services.mock_ai import regenerate_storyline as regenerate_mock_storyline
from app.services.mock_ai import regenerate_title as regenerate_mock_title
from app.services.image_features import extract_image_features


BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

MAX_FILES = 12
MAX_FILE_SIZE = 10 * 1024 * 1024
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
logger = logging.getLogger(__name__)

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


@app.get("/api/health", response_model=HealthResponse)
def health() -> HealthResponse:
    settings = get_settings()
    available = is_deepseek_available()
    provider = settings.ai_provider if settings.ai_provider in {"mock", "deepseek"} else "mock"
    return HealthResponse(
        status="ok",
        service="忆境 AI Backend",
        ai_provider=provider,
        deepseek_model=settings.deepseek_model if provider == "deepseek" else None,
        deepseek_available=available,
        fallback="mock" if not available else "mock-ready",
        last_checked_at=datetime.now(timezone.utc).isoformat(),
    )


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

        features = extract_image_features(file_path, size)

        image_records.append(
            {
                "id": f"img-{index + 1:02d}",
                "filename": upload.filename or stored_name,
                "url": f"{_base_url(request)}/uploads/{session_id}/{stored_name}",
                "features": features,
            }
        )

    try:
        analyses = analyze_images(activity_type, image_records)
        if is_deepseek_available():
            analyses = enhance_analyses_with_deepseek(activity_type, analyses)
    except Exception as exc:
        logger.exception("Image analysis failed.")
        raise HTTPException(status_code=500, detail="图片分析失败，请稍后重试。") from exc

    return AnalyzeResponse(session_id=session_id, activity_type=activity_type, analyses=analyses)


@app.post("/api/generate-album", response_model=GenerateAlbumResponse)
def create_album(payload: GenerateAlbumRequest) -> GenerateAlbumResponse:
    if not payload.analyses:
        raise HTTPException(status_code=400, detail="缺少图片分析结果，无法生成相册。")

    if is_deepseek_available():
        try:
            album = generate_album_with_deepseek(payload.activity_type, payload.analyses, payload.preferences)
            return GenerateAlbumResponse(activity_type=payload.activity_type, album=album)
        except DeepSeekAIError:
            logger.exception("DeepSeek album generation unavailable; falling back to mock service.")
        except Exception:
            logger.exception("Unexpected DeepSeek error; falling back to mock service.")

    try:
        album = generate_mock_album(payload.activity_type, payload.analyses, payload.preferences)
    except Exception as exc:
        logger.exception("Mock album generation failed.")
        raise HTTPException(status_code=500, detail="相册生成失败，请稍后重试。") from exc

    return GenerateAlbumResponse(activity_type=payload.activity_type, album=album)


@app.post("/api/regenerate-caption", response_model=RegenerateCaptionResponse)
def regenerate_caption_endpoint(payload: RegenerateCaptionRequest) -> RegenerateCaptionResponse:
    if is_deepseek_available():
        try:
            caption = regenerate_caption_with_deepseek(
                payload.activity_type,
                payload.analyses,
                payload.album,
                payload.caption_key,
                payload.preferences,
                payload.instruction,
            )
            return RegenerateCaptionResponse(caption_key=payload.caption_key, caption=caption, provider="deepseek", fallback=False)
        except Exception:
            logger.exception("DeepSeek caption regeneration unavailable; falling back to mock service.")

    caption = regenerate_mock_caption(
        payload.activity_type,
        payload.analyses,
        payload.album,
        payload.caption_key,
        payload.preferences,
        payload.instruction,
    )
    return RegenerateCaptionResponse(caption_key=payload.caption_key, caption=caption, provider="mock", fallback=True)


@app.post("/api/regenerate-title", response_model=RegenerateTitleResponse)
def regenerate_title_endpoint(payload: RegenerateTitleRequest) -> RegenerateTitleResponse:
    if is_deepseek_available():
        try:
            title, summary = regenerate_title_with_deepseek(
                payload.activity_type,
                payload.analyses,
                payload.album,
                payload.preferences,
                payload.instruction,
            )
            return RegenerateTitleResponse(title=title, summary=summary, provider="deepseek", fallback=False)
        except Exception:
            logger.exception("DeepSeek title regeneration unavailable; falling back to mock service.")

    title, summary = regenerate_mock_title(payload.activity_type, payload.analyses, payload.album, payload.preferences, payload.instruction)
    return RegenerateTitleResponse(title=title, summary=summary, provider="mock", fallback=True)


@app.post("/api/regenerate-storyline", response_model=RegenerateStorylineResponse)
def regenerate_storyline_endpoint(payload: RegenerateStorylineRequest) -> RegenerateStorylineResponse:
    if is_deepseek_available():
        try:
            storyline = regenerate_storyline_with_deepseek(
                payload.activity_type,
                payload.analyses,
                payload.album,
                payload.preferences,
                payload.instruction,
            )
            return RegenerateStorylineResponse(storyline=storyline, provider="deepseek", fallback=False)
        except Exception:
            logger.exception("DeepSeek storyline regeneration unavailable; falling back to mock service.")

    storyline = regenerate_mock_storyline(payload.activity_type, payload.analyses, payload.album, payload.preferences, payload.instruction)
    return RegenerateStorylineResponse(storyline=storyline, provider="mock", fallback=True)


@app.post("/api/evaluate-album", response_model=EvaluateAlbumResponse)
def evaluate_album_endpoint(payload: EvaluateAlbumRequest) -> EvaluateAlbumResponse:
    if is_deepseek_available():
        try:
            return evaluate_album_with_deepseek(payload.activity_type, payload.analyses, payload.album)
        except DeepSeekAIError:
            logger.exception("DeepSeek album evaluation unavailable; falling back to mock service.")
        except Exception:
            logger.exception("Unexpected DeepSeek evaluation error; falling back to mock service.")

    result = evaluate_mock_album(payload.activity_type, payload.analyses, payload.album)
    return EvaluateAlbumResponse(
        score=result.score,
        dimensions=result.dimensions,
        suggestions=result.suggestions,
        provider="mock",
        fallback=True,
    )


def _safe_filename(filename: str) -> str:
    name = Path(filename).name
    name = re.sub(r"[^A-Za-z0-9._-]+", "-", name).strip("-")
    return name or "image.jpg"


def _base_url(request: Request) -> str:
    return str(request.base_url).rstrip("/")
