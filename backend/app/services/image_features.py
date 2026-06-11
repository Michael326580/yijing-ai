from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageStat

from app.schemas import ImageFeatureSummary


def extract_image_features(path: Path, file_size: int) -> ImageFeatureSummary:
    """Extract lightweight local image features without depending on CV models."""
    try:
        with Image.open(path) as image:
            rgb = image.convert("RGB")
            width, height = rgb.size
            brightness = _brightness_score(rgb)
            sharpness = _sharpness_score(rgb)
            colorfulness = _colorfulness_score(rgb)
            orientation = _orientation(width, height)
            aspect_ratio = round(width / height, 3) if height else 0
            orientation_score = {"landscape": 92, "square": 88, "portrait": 74}[orientation]
            brightness_balance = max(0, round(100 - abs(brightness - 58) * 1.35))
            cover_score = _clamp(
                round(
                    sharpness * 0.34
                    + colorfulness * 0.22
                    + brightness_balance * 0.24
                    + orientation_score * 0.2
                )
            )
            return ImageFeatureSummary(
                brightness_score=brightness,
                sharpness_score=sharpness,
                colorfulness_score=colorfulness,
                orientation=orientation,
                aspect_ratio=aspect_ratio,
                file_size_kb=max(1, round(file_size / 1024)),
                width=width,
                height=height,
                cover_score=cover_score,
            )
    except Exception:
        return ImageFeatureSummary(
            brightness_score=60,
            sharpness_score=68,
            colorfulness_score=62,
            orientation="landscape",
            aspect_ratio=1.333,
            file_size_kb=max(1, round(file_size / 1024)),
            width=0,
            height=0,
            cover_score=70,
        )


def _brightness_score(image: Image.Image) -> int:
    gray = image.convert("L")
    mean = ImageStat.Stat(gray).mean[0]
    return _clamp(round(mean / 255 * 100))


def _sharpness_score(image: Image.Image) -> int:
    gray = image.convert("L")
    gray.thumbnail((320, 320))
    width, height = gray.size
    if width < 2 or height < 2:
        return 50

    pixels = gray.load()
    total = 0
    count = 0
    for y in range(0, height - 1):
        for x in range(0, width - 1):
            total += abs(int(pixels[x, y]) - int(pixels[x + 1, y]))
            total += abs(int(pixels[x, y]) - int(pixels[x, y + 1]))
            count += 2

    mean_diff = total / max(1, count)
    return _clamp(round(mean_diff * 4.8))


def _colorfulness_score(image: Image.Image) -> int:
    stat = ImageStat.Stat(image)
    r, g, b = stat.mean
    sr, sg, sb = stat.stddev
    channel_spread = (abs(r - g) + abs(r - b) + abs(g - b)) / 3
    saturation_hint = (sr + sg + sb) / 3
    return _clamp(round(channel_spread * 0.7 + saturation_hint * 0.55))


def _orientation(width: int, height: int) -> str:
    if width <= 0 or height <= 0:
        return "landscape"
    ratio = width / height
    if 0.92 <= ratio <= 1.08:
        return "square"
    return "landscape" if ratio > 1 else "portrait"


def _clamp(value: int) -> int:
    return max(0, min(100, value))
