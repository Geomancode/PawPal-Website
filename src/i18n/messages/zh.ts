import type { WebsiteMessages } from "./en";

export const zhMessages = {
  homeGlobeRegionLabel: "显示 PawPal 公开社区帖的互动地球",
  homeGlobeLoadingPreviewLabel: "视觉预览 · 正在载入实时帖子",
  homeGlobeStaticPreviewLabel: "静态预览 · 此浏览器无法显示实时地球",
  homeGlobeEmptyLabel: "暂无可展示的热门公开帖",
  homeGlobeErrorLabel: "实时社区标记暂不可用",
  homeGlobePostLinkLabel: "打开来自以下地点的社区帖子：",
  homeGlobeLikesLabel: "点赞",
  homeGlobeCommentsLabel: "评论",
  homeGlobeSnippetFallback: "社区动态",
} satisfies Partial<WebsiteMessages>;
