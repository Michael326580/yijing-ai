from __future__ import annotations

import hashlib

from app.schemas import (
    ActivityType,
    AlbumCaptions,
    AlbumResult,
    GridRecommendation,
    ImageAnalysis,
    StorylineItem,
)


ACTIVITY_PROFILES: dict[ActivityType, dict[str, object]] = {
    "科研竞赛": {
        "title": "把想法做成答案的这一天",
        "tone": "项目答辩、团队协作、成果展示",
        "scenes": ["赛场签到区", "项目展台", "答辩现场", "团队合影", "路演走廊"],
        "emotions": ["专注", "笃定", "紧张又兴奋", "成就感", "并肩作战"],
        "objects": ["展板", "电脑", "路演材料", "奖状", "团队徽章"],
        "focus": ["主讲人和屏幕", "项目原型", "团队协作瞬间", "评委交流", "成果证书"],
    },
    "毕业纪念": {
        "title": "把青春留在校园的最后一页",
        "tone": "告别、成长、校园记忆",
        "scenes": ["校门前", "教学楼下", "操场边", "寝室楼前", "毕业合影区"],
        "emotions": ["不舍", "明亮", "温柔", "释然", "期待"],
        "objects": ["学士服", "花束", "毕业帽", "校园路牌", "纪念横幅"],
        "focus": ["人物笑脸", "校园地标", "抛帽瞬间", "并肩背影", "纪念道具"],
    },
    "实验室日常": {
        "title": "普通一天里的探索光芒",
        "tone": "探索、专注、实验记录",
        "scenes": ["实验台前", "白板旁", "仪器区", "数据讨论区", "工作站前"],
        "emotions": ["沉浸", "冷静", "好奇", "认真", "小小突破"],
        "objects": ["实验仪器", "试剂瓶", "白板公式", "数据图表", "电脑屏幕"],
        "focus": ["实验动作", "数据图表", "讨论手势", "仪器细节", "记录本"],
    },
    "社团活动": {
        "title": "热爱把我们聚到一起",
        "tone": "热爱、协作、青春氛围",
        "scenes": ["活动签到处", "社团摊位", "互动游戏区", "排练空间", "校园广场"],
        "emotions": ["松弛", "投入", "热烈", "快乐", "默契"],
        "objects": ["社团海报", "活动道具", "徽章", "手幅", "音响"],
        "focus": ["互动人群", "活动道具", "组织者", "参与者表情", "社团标识"],
    },
    "舞台演出": {
        "title": "灯光亮起时，青春正在发生",
        "tone": "灯光、舞台、情绪高点",
        "scenes": ["舞台中央", "后台准备区", "观众席", "谢幕瞬间", "灯光控制区"],
        "emotions": ["高燃", "紧张", "闪耀", "释放", "感动"],
        "objects": ["舞台灯", "麦克风", "服装", "幕布", "节目单"],
        "focus": ["表演者姿态", "舞台灯光", "观众反应", "谢幕队形", "服装细节"],
    },
    "朋友聚会": {
        "title": "和朋友在一起的普通好天气",
        "tone": "轻松、陪伴、生活感",
        "scenes": ["校园餐厅", "草坪旁", "咖啡角", "湖边小路", "宿舍楼下"],
        "emotions": ["轻松", "开心", "自在", "亲密", "治愈"],
        "objects": ["饮料", "小吃", "拍立得", "背包", "手机"],
        "focus": ["朋友合影", "餐桌细节", "自然笑容", "同行背影", "生活小物"],
    },
}

USES = ["封面主图", "场景图", "过程记录", "团队合影", "成果展示", "氛围花絮", "细节补充", "收束合影", "朋友圈备选"]

CAPTION_ROLES = ["封面主图", "场景图", "过程记录", "团队合影", "成果展示", "氛围花絮"]
CAPTION_TEMPLATES = [
    "{role}：以{scene}作为第一视觉，{visual_focus}清晰突出，适合承载整组相册的开场记忆。",
    "{role}：画面交代了{scene}的校园环境，{objects}让活动背景更完整。",
    "{role}：镜头捕捉到{visual_focus}，呈现出{emotion}的真实推进感。",
    "{role}：人物关系和现场情绪集中在画面里，适合作为团队记忆的核心节点。",
    "{role}：以{objects}强化活动结果，适合放在故事线的高光位置。",
    "{role}：保留{scene}中的轻松瞬间，让整组照片更有呼吸感和现场感。",
]


def stable_int(seed: str, minimum: int, maximum: int) -> int:
    digest = hashlib.sha256(seed.encode("utf-8")).hexdigest()
    value = int(digest[:8], 16)
    return minimum + value % (maximum - minimum + 1)


def pick(items: list[str], index: int, seed: str) -> str:
    return items[(index + stable_int(seed, 0, len(items) - 1)) % len(items)]


def analyze_images(activity_type: ActivityType, image_records: list[dict[str, str]]) -> list[ImageAnalysis]:
    profile = ACTIVITY_PROFILES[activity_type]
    scenes = profile["scenes"]  # type: ignore[assignment]
    emotions = profile["emotions"]  # type: ignore[assignment]
    objects = profile["objects"]  # type: ignore[assignment]
    focus_points = profile["focus"]  # type: ignore[assignment]

    analyses: list[ImageAnalysis] = []
    for index, record in enumerate(image_records):
        seed = f"{activity_type}-{record['filename']}-{index}"
        scene = pick(scenes, index, seed)  # type: ignore[arg-type]
        emotion = pick(emotions, index + 1, seed)  # type: ignore[arg-type]
        visual_focus = pick(focus_points, index + 2, seed)  # type: ignore[arg-type]
        object_count = stable_int(seed + "-objects", 2, min(4, len(objects)))  # type: ignore[arg-type]
        selected_objects = [objects[(index + i) % len(objects)] for i in range(object_count)]  # type: ignore[index]
        quality = stable_int(seed + "-quality", 76, 96)
        people_count = stable_int(seed + "-people", 1, 8)
        suggested_use = USES[index] if index < len(USES) else f"补充视角 {index + 1}"
        caption = build_caption(
            index=index,
            role=suggested_use,
            scene=scene,
            emotion=emotion,
            objects="、".join(selected_objects[:2]),
            visual_focus=visual_focus,
        )

        analyses.append(
            ImageAnalysis(
                id=record["id"],
                filename=record["filename"],
                url=record["url"],
                scene=scene,
                emotion=emotion,
                objects=selected_objects,
                quality=quality,
                suggested_use=suggested_use,
                people_count=people_count,
                visual_focus=visual_focus,
                caption=caption,
            )
        )
    return analyses


def build_caption(index: int, role: str, scene: str, emotion: str, objects: str, visual_focus: str) -> str:
    if index < len(CAPTION_TEMPLATES):
        return CAPTION_TEMPLATES[index].format(
            role=role,
            scene=scene,
            emotion=emotion,
            objects=objects,
            visual_focus=visual_focus,
        )

    return f"{role}：从{visual_focus}延展出新的观察角度，补充了{scene}里偏{emotion}的现场细节。"


def generate_album(activity_type: ActivityType, analyses: list[ImageAnalysis]) -> AlbumResult:
    profile = ACTIVITY_PROFILES[activity_type]
    title = str(profile["title"])
    tone = str(profile["tone"])
    grid_images = _rank_for_grid(analyses)
    cover = grid_images[0].url if grid_images else None

    summary = (
        f"这组照片围绕“{activity_type}”展开，系统识别出{len(analyses)}个关键画面，"
        f"整体叙事重点为{tone}。从环境氛围到人物状态，再到高光瞬间，适合整理为一组校园记忆相册。"
    )

    storyline = [
        StorylineItem(step="01", title="抵达现场", description=f"用{_safe_scene(analyses, 0)}建立活动背景，让观众快速进入校园场景。"),
        StorylineItem(step="02", title="进入状态", description=f"突出{_safe_focus(analyses, 1)}，呈现活动过程中真实的投入感。"),
        StorylineItem(step="03", title="高光时刻", description=f"选择质量最高的画面作为情绪峰值，强化{activity_type}的记忆点。"),
        StorylineItem(step="04", title="留下纪念", description=f"以人物和环境的组合收束，形成适合朋友圈分享的完整故事。"),
    ]

    grid = [
        GridRecommendation(
            position=f"P{index + 1}",
            image_id=image.id,
            url=image.url,
            reason=_grid_reason(index, image),
            suggested_use=image.suggested_use,
        )
        for index, image in enumerate(grid_images[:9])
    ]

    captions = AlbumCaptions(
        concise=f"{activity_type}记录完成。谢谢每一次并肩，也谢谢今天认真发光的我们。",
        passionate=f"把热爱放进现场，把努力交给时间。{activity_type}不是终点，是下一次出发前最好的证明。",
        literary=f"风从校园经过，我们把这一天折进相册。关于{activity_type}，关于同行的人，也关于会被想起的青春。",
        official=f"本次{activity_type}顺利完成。活动展现了同学们积极参与、协作实践与持续探索的精神风貌，留下了具有纪念意义的校园影像资料。",
    )

    return AlbumResult(
        title=title,
        summary=summary,
        storyline=storyline,
        grid_recommendations=grid,
        captions=captions,
        cover_image_url=cover,
        gallery=analyses,
    )


def _safe_scene(analyses: list[ImageAnalysis], index: int) -> str:
    if not analyses:
        return "校园现场"
    return analyses[min(index, len(analyses) - 1)].scene


def _safe_focus(analyses: list[ImageAnalysis], index: int) -> str:
    if not analyses:
        return "人物状态"
    return analyses[min(index, len(analyses) - 1)].visual_focus


def _rank_for_grid(analyses: list[ImageAnalysis]) -> list[ImageAnalysis]:
    if len(analyses) <= 1:
        return analyses

    p1 = _select_p1(analyses)
    ordered: list[ImageAnalysis] = [p1]
    remaining = [item for item in analyses if item.id != p1.id]
    use_order = {
        "场景图": 0,
        "过程记录": 1,
        "团队合影": 2,
        "成果展示": 3,
        "氛围花絮": 4,
        "细节补充": 5,
        "收束合影": 6,
        "朋友圈备选": 7,
    }
    ordered.extend(
        sorted(
            remaining,
            key=lambda item: (use_order.get(item.suggested_use, 99), -item.quality),
        )
    )
    return ordered


def _select_p1(analyses: list[ImageAnalysis]) -> ImageAnalysis:
    for preferred_use in ("封面主图", "团队合影", "成果展示"):
        candidates = [item for item in analyses if item.suggested_use == preferred_use]
        if candidates:
            return max(candidates, key=lambda item: item.quality)
    return max(analyses, key=lambda item: item.quality)


def _grid_reason(index: int, image: ImageAnalysis) -> str:
    use_reasons = {
        "封面主图": "作为九宫格第一视觉，优先承担封面和开场记忆点。",
        "场景图": "用于交代现场环境，帮助建立故事背景。",
        "过程记录": "呈现活动推进过程，让叙事更连贯。",
        "团队合影": "人物关系集中，适合突出团队和同行感。",
        "成果展示": "突出成果或亮点，适合放在故事高光位置。",
        "氛围花絮": "补充现场情绪，让九宫格更有呼吸感。",
        "细节补充": "细节信息丰富，增强真实感。",
        "收束合影": "适合放在后段，形成温暖收束。",
        "朋友圈备选": "作为补充画面，让九宫格更完整。",
    }
    reason = use_reasons.get(image.suggested_use, "补充不同观察角度，让九宫格信息更完整。")
    if index == 0 and image.suggested_use != "封面主图":
        reason = f"当前没有封面主图时，优先选择“{image.suggested_use}”作为 P1，保证第一张有明确展示重点。"
    return f"{reason} AI 判断画面重点为“{image.visual_focus}”。"
