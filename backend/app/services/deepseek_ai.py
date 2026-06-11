from __future__ import annotations

import json
import logging
from typing import Any

from app.config import get_settings
from app.schemas import (
    ActivityType,
    AlbumGenerationPreferences,
    AlbumCaptions,
    AlbumEvaluationDimensions,
    AlbumResult,
    CaptionKey,
    EvaluateAlbumResponse,
    GridRecommendation,
    ImageAnalysis,
    StorylineItem,
)
from app.services.mock_ai import generate_album as generate_mock_album
from app.services.mock_ai import (
    evaluate_album as evaluate_mock_album,
    regenerate_caption as regenerate_mock_caption,
    regenerate_storyline as regenerate_mock_storyline,
    regenerate_title as regenerate_mock_title,
)

try:
    from openai import OpenAI
except ImportError:  # pragma: no cover - handled at runtime for mock-only setups
    OpenAI = None  # type: ignore[assignment]


logger = logging.getLogger(__name__)


class DeepSeekAIError(RuntimeError):
    """Raised when DeepSeek cannot produce a valid structured album result."""


GENERATE_SYSTEM_PROMPT = """
你是“忆境 AI”的校园活动相册策划助手。
你不仅生成文案，还要像相册导演一样做视觉叙事规划。
你必须基于图片分析结果和用户偏好，生成可直接用于前端展示、朋友圈、汇报或纪念册的结构化 JSON。
你擅长校园活动、科研竞赛、毕业纪念、实验室日常、社团活动、舞台演出、朋友聚会等场景。
输出中文。
风格：真实、克制、有校园记忆感，不要空泛鸡汤，不要过度夸张。
严格输出 JSON，不要 Markdown，不要解释。
不得引用不存在的 image_id。

JSON schema 必须为：
{
  "title": "string",
  "summary": "string",
  "storyline": [
    {"step": "01", "title": "string", "description": "string"},
    {"step": "02", "title": "string", "description": "string"},
    {"step": "03", "title": "string", "description": "string"},
    {"step": "04", "title": "string", "description": "string"}
  ],
  "grid_recommendations": [
    {
      "position": "P1",
      "image_id": "必须来自输入 analyses 的 id",
      "url": "必须来自对应图片的 url",
      "reason": "string",
      "suggested_use": "string"
    }
  ],
  "captions": {
    "concise": "string",
    "passionate": "string",
    "literary": "string",
    "official": "string"
  },
  "cover_image_url": "string or null"
}

注意：
- grid_recommendations 最多 9 条。
- 不要生成输入中不存在的图片。
- position 必须从 P1 开始连续编号。
- caption.concise 适合朋友圈短文案。
- caption.passionate 稍微热烈，但不要油腻。
- caption.literary 有文学感，但不要晦涩。
- caption.official 适合公众号/新闻稿。
- summary 需要说明这组照片的叙事主线。
- storyline 要形成“开场—过程—高光—收束”的结构。
""".strip()


ENHANCE_SYSTEM_PROMPT = """
你是“忆境 AI”的校园活动照片文字润色助手。
你不能直接看图片，只能基于输入的已有图片分析、活动类型和文件名进行文字优化。
只允许润色 caption、suggested_use、visual_focus、emotion。
必须保持 id、filename、url 不变。
严格输出 JSON，不要 Markdown，不要解释。
JSON schema:
{
  "analyses": [
    {
      "id": "string",
      "caption": "string",
      "suggested_use": "string",
      "visual_focus": "string",
      "emotion": "string"
    }
  ]
}
""".strip()


def is_deepseek_available() -> bool:
    settings = get_settings()
    return settings.ai_provider == "deepseek" and bool(settings.deepseek_api_key)


def generate_album_with_deepseek(
    activity_type: ActivityType,
    analyses: list[ImageAnalysis],
    preferences: AlbumGenerationPreferences | None = None,
) -> AlbumResult:
    if not analyses:
        raise DeepSeekAIError("缺少图片分析结果。")

    try:
        content = _chat_completion(
            system_prompt=GENERATE_SYSTEM_PROMPT,
            user_prompt=_build_generate_user_prompt(activity_type, analyses, _normalize_preferences(preferences)),
        )
        raw_payload = extract_json_payload(content)
        return _normalize_album_result(activity_type, analyses, raw_payload, _normalize_preferences(preferences))
    except DeepSeekAIError:
        raise
    except Exception as exc:  # noqa: BLE001 - fallback caller needs a single custom error
        logger.exception("DeepSeek album generation failed.")
        raise DeepSeekAIError("DeepSeek 生成结果不可用。") from exc


def enhance_analyses_with_deepseek(activity_type: ActivityType, analyses: list[ImageAnalysis]) -> list[ImageAnalysis]:
    if not analyses or not is_deepseek_available():
        return analyses

    try:
        content = _chat_completion(
            system_prompt=ENHANCE_SYSTEM_PROMPT,
            user_prompt=_build_enhance_user_prompt(activity_type, analyses),
        )
        raw_payload = extract_json_payload(content)
        return _normalize_enhanced_analyses(analyses, raw_payload)
    except Exception:
        logger.exception("DeepSeek analysis enhancement failed; using original analyses.")
        return analyses


def regenerate_caption_with_deepseek(
    activity_type: ActivityType,
    analyses: list[ImageAnalysis],
    album: AlbumResult,
    caption_key: CaptionKey,
    preferences: AlbumGenerationPreferences | None = None,
    instruction: str = "",
) -> str:
    preferences = _normalize_preferences(preferences)
    fallback = regenerate_mock_caption(activity_type, analyses, album, caption_key, preferences, instruction)
    try:
        content = _chat_completion(
            system_prompt=_json_only_prompt("你是忆境 AI 的朋友圈文案编辑，只重生成用户指定风格的一条中文文案。"),
            user_prompt=_build_partial_user_prompt(activity_type, analyses, album, preferences, instruction, {"caption_key": caption_key}),
        )
        payload = extract_json_payload(content)
        return _as_str(payload.get("caption"), fallback)
    except Exception as exc:  # noqa: BLE001
        logger.exception("DeepSeek caption regeneration failed.")
        raise DeepSeekAIError("DeepSeek 文案重生成不可用。") from exc


def regenerate_title_with_deepseek(
    activity_type: ActivityType,
    analyses: list[ImageAnalysis],
    album: AlbumResult,
    preferences: AlbumGenerationPreferences | None = None,
    instruction: str = "",
) -> tuple[str, str]:
    preferences = _normalize_preferences(preferences)
    fallback_title, fallback_summary = regenerate_mock_title(activity_type, analyses, album, preferences, instruction)
    try:
        content = _chat_completion(
            system_prompt=_json_only_prompt("你是忆境 AI 的相册标题策划，只重生成 title 和 summary。"),
            user_prompt=_build_partial_user_prompt(activity_type, analyses, album, preferences, instruction, {"target": "title_summary"}),
        )
        payload = extract_json_payload(content)
        return _as_str(payload.get("title"), fallback_title), _as_str(payload.get("summary"), fallback_summary)
    except Exception as exc:  # noqa: BLE001
        logger.exception("DeepSeek title regeneration failed.")
        raise DeepSeekAIError("DeepSeek 标题重生成不可用。") from exc


def regenerate_storyline_with_deepseek(
    activity_type: ActivityType,
    analyses: list[ImageAnalysis],
    album: AlbumResult,
    preferences: AlbumGenerationPreferences | None = None,
    instruction: str = "",
) -> list[StorylineItem]:
    preferences = _normalize_preferences(preferences)
    fallback = regenerate_mock_storyline(activity_type, analyses, album, preferences, instruction)
    try:
        content = _chat_completion(
            system_prompt=_json_only_prompt("你是忆境 AI 的相册故事线导演，只重生成四步 storyline。"),
            user_prompt=_build_partial_user_prompt(activity_type, analyses, album, preferences, instruction, {"target": "storyline"}),
        )
        payload = extract_json_payload(content)
        return _normalize_storyline(payload.get("storyline"), fallback)
    except Exception as exc:  # noqa: BLE001
        logger.exception("DeepSeek storyline regeneration failed.")
        raise DeepSeekAIError("DeepSeek 故事线重生成不可用。") from exc


def evaluate_album_with_deepseek(activity_type: ActivityType, analyses: list[ImageAnalysis], album: AlbumResult) -> EvaluateAlbumResponse:
    fallback = evaluate_mock_album(activity_type, analyses, album)
    try:
        content = _chat_completion(
            system_prompt=_json_only_prompt("你是忆境 AI 的相册质量评估助手，输出相册评分 JSON。"),
            user_prompt=json.dumps(
                {
                    "activity_type": activity_type,
                    "analyses": [image.model_dump() for image in analyses],
                    "album": album.model_dump(),
                    "required_schema": {
                        "score": "0-100",
                        "dimensions": {
                            "visual_coverage": "0-100",
                            "storyline_completeness": "0-100",
                            "emotion_consistency": "0-100",
                            "caption_quality": "0-100",
                            "share_readiness": "0-100",
                        },
                        "suggestions": ["string", "string", "string"],
                    },
                },
                ensure_ascii=False,
            ),
        )
        payload = extract_json_payload(content)
        dimensions_raw = payload.get("dimensions") if isinstance(payload.get("dimensions"), dict) else {}
        dimensions = AlbumEvaluationDimensions(
            visual_coverage=_as_int(dimensions_raw.get("visual_coverage"), fallback.dimensions.visual_coverage),
            storyline_completeness=_as_int(dimensions_raw.get("storyline_completeness"), fallback.dimensions.storyline_completeness),
            emotion_consistency=_as_int(dimensions_raw.get("emotion_consistency"), fallback.dimensions.emotion_consistency),
            caption_quality=_as_int(dimensions_raw.get("caption_quality"), fallback.dimensions.caption_quality),
            share_readiness=_as_int(dimensions_raw.get("share_readiness"), fallback.dimensions.share_readiness),
        )
        suggestions_raw = payload.get("suggestions")
        suggestions = [str(item).strip() for item in suggestions_raw if str(item).strip()] if isinstance(suggestions_raw, list) else fallback.suggestions
        return EvaluateAlbumResponse(
            score=_as_int(payload.get("score"), fallback.score),
            dimensions=dimensions,
            suggestions=suggestions[:3] or fallback.suggestions,
            provider="deepseek",
            fallback=False,
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("DeepSeek album evaluation failed.")
        raise DeepSeekAIError("DeepSeek 相册评分不可用。") from exc


def extract_json_payload(text: str) -> dict[str, Any]:
    if not text or not text.strip():
        raise DeepSeekAIError("模型返回为空。")

    stripped = _strip_code_fence(text.strip())
    decoder = json.JSONDecoder()
    for index, char in enumerate(stripped):
        if char != "{":
            continue
        try:
            payload, _ = decoder.raw_decode(stripped[index:])
        except json.JSONDecodeError:
            continue
        if isinstance(payload, dict):
            return payload

    raise DeepSeekAIError("无法解析模型返回 JSON。")


def _strip_code_fence(text: str) -> str:
    if not text.startswith("```"):
        return text
    lines = text.splitlines()
    if len(lines) >= 3 and lines[0].startswith("```") and lines[-1].strip() == "```":
        return "\n".join(lines[1:-1]).strip()
    return text


def _chat_completion(system_prompt: str, user_prompt: str) -> str:
    if not is_deepseek_available():
        raise DeepSeekAIError("DeepSeek 未启用。")
    if OpenAI is None:
        raise DeepSeekAIError("OpenAI SDK 未安装。")

    settings = get_settings()
    client = OpenAI(
        api_key=settings.deepseek_api_key,
        base_url=settings.deepseek_base_url,
        timeout=settings.deepseek_timeout,
    )
    response = client.chat.completions.create(
        model=settings.deepseek_model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        extra_body={"thinking": {"type": "disabled"}},
    )
    content = response.choices[0].message.content
    if not content:
        raise DeepSeekAIError("模型没有返回内容。")
    return content


def _build_generate_user_prompt(
    activity_type: ActivityType,
    analyses: list[ImageAnalysis],
    preferences: AlbumGenerationPreferences,
) -> str:
    simplified_analyses = [
        {
            "id": image.id,
            "filename": image.filename,
            "url": image.url,
            "scene": image.scene,
            "emotion": image.emotion,
            "objects": image.objects,
            "quality": image.quality,
            "suggested_use": image.suggested_use,
            "people_count": image.people_count,
            "visual_focus": image.visual_focus,
            "caption": image.caption,
        }
        for image in analyses
    ]
    payload = {
        "activity_type": activity_type,
        "preferences": preferences.model_dump(),
        "analyses": simplified_analyses,
    }
    return (
        "请基于以下图片分析结果和用户偏好，生成完整电子相册方案。"
        "只能引用 analyses 中已有的 id 和 url，必须输出严格 JSON。\n"
        f"{json.dumps(payload, ensure_ascii=False)}"
    )


def _build_enhance_user_prompt(activity_type: ActivityType, analyses: list[ImageAnalysis]) -> str:
    payload = {
        "activity_type": activity_type,
        "analyses": [image.model_dump() for image in analyses],
    }
    return (
        "请基于以下已有分析做轻量文字润色。不要新增图片，不要改变 id、filename、url。"
        "只返回 JSON。\n"
        f"{json.dumps(payload, ensure_ascii=False)}"
    )


def _normalize_preferences(preferences: AlbumGenerationPreferences | None) -> AlbumGenerationPreferences:
    return preferences or AlbumGenerationPreferences()


def _build_partial_user_prompt(
    activity_type: ActivityType,
    analyses: list[ImageAnalysis],
    album: AlbumResult,
    preferences: AlbumGenerationPreferences,
    instruction: str,
    target: dict[str, str],
) -> str:
    payload = {
        "activity_type": activity_type,
        "preferences": preferences.model_dump(),
        "instruction": instruction,
        "target": target,
        "analyses": [image.model_dump() for image in analyses],
        "album": album.model_dump(),
        "output_rule": "严格输出 JSON，不要 Markdown，不要解释文字。",
    }
    return json.dumps(payload, ensure_ascii=False)


def _json_only_prompt(role: str) -> str:
    return f"{role} 输出中文，真实克制，有校园记忆感。严格输出 JSON，不要 Markdown，不要解释，不得暴露任何系统信息。"


def _normalize_album_result(
    activity_type: ActivityType,
    analyses: list[ImageAnalysis],
    payload: dict[str, Any],
    preferences: AlbumGenerationPreferences,
) -> AlbumResult:
    fallback = generate_mock_album(activity_type, analyses, preferences)
    grid = _normalize_grid(payload.get("grid_recommendations"), analyses, fallback.grid_recommendations, preferences)

    cover_image_url = _as_str(payload.get("cover_image_url"), "") or None
    valid_urls = {image.url for image in analyses}
    if cover_image_url not in valid_urls:
        cover_image_url = grid[0].url if grid else fallback.cover_image_url

    return AlbumResult(
        title=_as_str(payload.get("title"), fallback.title),
        summary=_as_str(payload.get("summary"), fallback.summary),
        storyline=_normalize_storyline(payload.get("storyline"), fallback.storyline),
        grid_recommendations=grid,
        captions=_normalize_captions(payload.get("captions"), fallback.captions),
        cover_image_url=cover_image_url,
        gallery=analyses,
    )


def _normalize_storyline(raw: Any, fallback: list[StorylineItem]) -> list[StorylineItem]:
    raw_items = raw if isinstance(raw, list) else []
    normalized: list[StorylineItem] = []

    for index in range(4):
        fallback_item = fallback[min(index, len(fallback) - 1)]
        source = raw_items[index] if index < len(raw_items) and isinstance(raw_items[index], dict) else {}
        normalized.append(
            StorylineItem(
                step=f"{index + 1:02d}",
                title=_as_str(source.get("title"), fallback_item.title),
                description=_as_str(source.get("description"), fallback_item.description),
            )
        )
    return normalized


def _normalize_grid(
    raw: Any,
    analyses: list[ImageAnalysis],
    fallback: list[GridRecommendation],
    preferences: AlbumGenerationPreferences,
) -> list[GridRecommendation]:
    image_by_id = {image.id: image for image in analyses}
    image_by_url = {image.url: image for image in analyses}
    raw_items = raw if isinstance(raw, list) else []
    normalized: list[GridRecommendation] = []
    used_ids: set[str] = set()
    excluded_ids = set(preferences.excluded_image_ids)

    must_items = [
        GridRecommendation(
            position="",
            image_id=image.id,
            url=image.url,
            reason=f"用户偏好要求优先包含该图片，画面重点为“{image.visual_focus}”。",
            suggested_use=image.suggested_use,
        )
        for image_id in preferences.must_include_image_ids
        if (image := image_by_id.get(image_id)) is not None and image.id not in excluded_ids
    ]

    for item in [item.model_dump() for item in must_items] + raw_items:
        if not isinstance(item, dict) or len(normalized) >= 9:
            continue

        image = image_by_id.get(_as_str(item.get("image_id"), ""))
        if image is None:
            image = image_by_url.get(_as_str(item.get("url"), ""))
        if image is None or image.id in used_ids or image.id in excluded_ids:
            continue

        used_ids.add(image.id)
        normalized.append(
            GridRecommendation(
                position=f"P{len(normalized) + 1}",
                image_id=image.id,
                url=image.url,
                reason=_as_str(item.get("reason"), f"适合作为{image.suggested_use}，画面重点为“{image.visual_focus}”。"),
                suggested_use=_as_str(item.get("suggested_use"), image.suggested_use),
            )
        )

    for item in fallback:
        if len(normalized) >= 9:
            break
        if item.image_id in used_ids or item.image_id in excluded_ids:
            continue
        used_ids.add(item.image_id)
        normalized.append(
            GridRecommendation(
                position=f"P{len(normalized) + 1}",
                image_id=item.image_id,
                url=item.url,
                reason=item.reason,
                suggested_use=item.suggested_use,
            )
        )

    return normalized


def _normalize_captions(raw: Any, fallback: AlbumCaptions) -> AlbumCaptions:
    source = raw if isinstance(raw, dict) else {}
    return AlbumCaptions(
        concise=_as_str(source.get("concise"), fallback.concise),
        passionate=_as_str(source.get("passionate"), fallback.passionate),
        literary=_as_str(source.get("literary"), fallback.literary),
        official=_as_str(source.get("official"), fallback.official),
    )


def _normalize_enhanced_analyses(analyses: list[ImageAnalysis], payload: dict[str, Any]) -> list[ImageAnalysis]:
    raw_items = payload.get("analyses")
    if not isinstance(raw_items, list):
        return analyses

    enhanced_by_id = {item.get("id"): item for item in raw_items if isinstance(item, dict)}
    normalized: list[ImageAnalysis] = []
    for image in analyses:
        raw = enhanced_by_id.get(image.id)
        if not isinstance(raw, dict):
            normalized.append(image)
            continue
        normalized.append(
            ImageAnalysis(
                id=image.id,
                filename=image.filename,
                url=image.url,
                scene=image.scene,
                emotion=_as_str(raw.get("emotion"), image.emotion),
                objects=image.objects,
                quality=image.quality,
                suggested_use=_as_str(raw.get("suggested_use"), image.suggested_use),
                people_count=image.people_count,
                visual_focus=_as_str(raw.get("visual_focus"), image.visual_focus),
                caption=_as_str(raw.get("caption"), image.caption),
                features=image.features,
            )
        )
    return normalized


def _as_str(value: Any, fallback: str) -> str:
    if isinstance(value, str) and value.strip():
        return value.strip()
    return fallback


def _as_int(value: Any, fallback: int) -> int:
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return fallback
    return max(0, min(100, parsed))
