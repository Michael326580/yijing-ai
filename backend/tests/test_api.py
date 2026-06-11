from __future__ import annotations

import io
import os

from PIL import Image
from fastapi.testclient import TestClient

os.environ["AI_PROVIDER"] = "mock"

from app.config import get_settings  # noqa: E402
from app.main import app  # noqa: E402


get_settings.cache_clear()

client = TestClient(app)


def test_health_fallback_available() -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["ai_provider"] == "mock"
    assert payload["fallback"] == "mock"


def test_full_album_flow_with_uploaded_png() -> None:
    analyze_response = client.post(
        "/api/analyze",
        data={"activity_type": "科研竞赛"},
        files=[
            ("files", ("campus-1.png", make_png((80, 130, 220)), "image/png")),
            ("files", ("campus-2.png", make_png((230, 210, 80)), "image/png")),
            ("files", ("campus-3.png", make_png((120, 210, 160)), "image/png")),
        ],
    )
    assert analyze_response.status_code == 200
    analyze_payload = analyze_response.json()
    analyses = analyze_payload["analyses"]
    assert len(analyses) == 3
    assert analyses[0]["url"].startswith("http://testserver/uploads/")
    assert analyses[0]["features"]["brightness_score"] >= 0
    assert analyses[0]["features"]["cover_score"] >= 0

    generate_payload = {"activity_type": "科研竞赛", "analyses": analyses}
    generate_response = client.post("/api/generate-album", json=generate_payload)
    assert generate_response.status_code == 200
    album = generate_response.json()["album"]
    assert album["title"]
    assert len(album["storyline"]) == 4
    assert len(album["grid_recommendations"]) <= 9

    for path, payload in [
        ("/api/regenerate-caption", {**generate_payload, "album": album, "caption_key": "concise"}),
        ("/api/regenerate-title", {**generate_payload, "album": album}),
        ("/api/regenerate-storyline", {**generate_payload, "album": album}),
        ("/api/evaluate-album", {**generate_payload, "album": album}),
    ]:
        response = client.post(path, json=payload)
        assert response.status_code == 200
        assert response.json()["provider"] == "mock"


def make_png(color: tuple[int, int, int]) -> bytes:
    buffer = io.BytesIO()
    image = Image.new("RGB", (64, 48), color=color)
    image.save(buffer, format="PNG")
    return buffer.getvalue()
