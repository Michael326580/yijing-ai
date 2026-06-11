import type { ActivityType, AlbumGenerationPreferences, AlbumResult, ImageAnalysis } from "../types";

const demoUrls = [
  "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1515169067865-5387ec356754?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=900&q=80",
];

export const demoPreferences: AlbumGenerationPreferences = {
  visual_style: "科技路演",
  caption_length: "中",
  emphasis: "成果",
  output_scene: "比赛汇报",
  title_style: "有记忆点",
  audience: "评委和同学",
  narrative_order: "开场—过程—高光—收束",
  must_include_image_ids: ["demo-01", "demo-04", "demo-05"],
  excluded_image_ids: [],
  custom_instruction: "突出校园创新团队的协作和成果展示。",
};

export const demoActivityType: ActivityType = "科研竞赛";

export const demoAnalyses: ImageAnalysis[] = demoUrls.map((url, index) => {
  const uses = ["封面主图", "场景图", "过程记录", "团队合影", "成果展示", "氛围花絮", "细节补充", "收束合影", "朋友圈备选"];
  const scenes = ["项目路演现场", "校园报告厅", "团队讨论区", "展台合影", "成果展示区", "会后交流区", "实验楼走廊", "校园广场", "工作台前"];
  const emotions = ["笃定", "专注", "投入", "成就感", "振奋", "轻松", "认真", "温暖", "期待"];
  return {
    id: `demo-${String(index + 1).padStart(2, "0")}`,
    filename: `demo-campus-${index + 1}.jpg`,
    url,
    scene: scenes[index],
    emotion: emotions[index],
    objects: ["展板", "电脑", "队服"].slice(0, 2 + (index % 2)),
    quality: 82 + ((index * 3) % 15),
    suggested_use: uses[index],
    people_count: 2 + (index % 6),
    visual_focus: uses[index] === "团队合影" ? "团队成员笑脸" : uses[index],
    caption: `${uses[index]}：画面呈现${scenes[index]}，情绪偏${emotions[index]}，适合用于相册的${uses[index]}。`,
    features: {
      brightness_score: 62 + ((index * 5) % 22),
      sharpness_score: 68 + ((index * 4) % 20),
      colorfulness_score: 54 + ((index * 7) % 26),
      orientation: index % 5 === 1 ? "portrait" : index % 4 === 2 ? "square" : "landscape",
      aspect_ratio: index % 5 === 1 ? 0.75 : index % 4 === 2 ? 1 : 1.5,
      file_size_kb: 480 + index * 86,
      width: index % 5 === 1 ? 900 : 1200,
      height: index % 5 === 1 ? 1200 : index % 4 === 2 ? 1200 : 800,
      cover_score: 76 + ((index * 3) % 18),
    },
  };
});

export const demoAlbum: AlbumResult = {
  title: "把项目做成校园里的答案",
  summary: "这是一组围绕科研竞赛展开的校园活动相册，从路演开场、团队协作到成果展示，完整呈现了同学们把想法落地为作品的过程。",
  storyline: [
    { step: "01", title: "开场：进入路演现场", description: "用报告厅和项目展台建立背景，让观众快速理解活动语境。" },
    { step: "02", title: "过程：看见团队协作", description: "通过讨论、操作和交流画面，展示项目推进中的真实投入。" },
    { step: "03", title: "高光：成果被看见", description: "把成果展示与答辩瞬间作为情绪峰值，强化创新竞赛的记忆点。" },
    { step: "04", title: "收束：留下共同记忆", description: "以团队合影和会后交流收束，让相册从成果回到同行的人。" },
  ],
  grid_recommendations: demoAnalyses.slice(0, 9).map((image, index) => ({
    position: `P${index + 1}`,
    image_id: image.id,
    url: image.url,
    reason: `作为${image.suggested_use}，画面重点为“${image.visual_focus}”，适合放在九宫格第 ${index + 1} 位。`,
    suggested_use: image.suggested_use,
  })),
  captions: {
    concise: "把想法做成作品，把努力留在现场。科研竞赛记录完成。",
    passionate: "从方案到路演，从讨论到展示，每一次并肩都让项目更接近答案。",
    literary: "灯光落在展板上，也落在每个认真讲述的人身上。我们把这一天收进相册，留给未来继续翻阅。",
    official: "本次科研竞赛活动充分展现了同学们的创新意识、实践能力与团队协作精神，形成了具有展示价值的校园影像记录。",
  },
  cover_image_url: demoAnalyses[0].url,
  gallery: demoAnalyses,
};
