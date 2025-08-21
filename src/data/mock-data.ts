import type { Article, WeChatAccount, AppConfig } from "@/types"

export const mockArticles: Article[] = [
  {
    id: "1",
    title: "人工智能如何改变内容创作行业",
    content:
      "随着AI技术的快速发展，内容创作行业正在经历前所未有的变革。从自动化写作到智能编辑，AI正在重新定义创作者的工作方式...",
    source: "微信公众号",
    sourceUrl: "https://example.com/article1",
    author: "科技观察者",
    publishTime: "2024-01-15T10:30:00Z",
    collectTime: "2024-01-16T08:00:00Z",
    tags: ["AI", "内容创作", "科技"],
    category: "科技",
    readCount: 5240,
    likeCount: 328,
    status: "pending",
  },
  {
    id: "2",
    title: "2024年社交媒体营销趋势分析",
    content: "社交媒体营销在2024年呈现出新的发展趋势，短视频内容、直播带货、私域流量运营成为关键词...",
    source: "知乎",
    sourceUrl: "https://example.com/article2",
    author: "营销专家",
    publishTime: "2024-01-14T15:20:00Z",
    collectTime: "2024-01-16T09:15:00Z",
    tags: ["营销", "社交媒体", "趋势"],
    category: "营销",
    readCount: 3890,
    likeCount: 256,
    status: "pending",
  },
  {
    id: "3",
    title: "微信小程序开发最佳实践指南",
    content: "本文总结了微信小程序开发中的最佳实践，包括性能优化、用户体验设计、数据管理等方面的经验...",
    source: "微博",
    sourceUrl: "https://example.com/article3",
    author: "前端开发者",
    publishTime: "2024-01-13T11:45:00Z",
    collectTime: "2024-01-16T10:30:00Z",
    tags: ["小程序", "开发", "微信"],
    category: "技术",
    readCount: 2156,
    likeCount: 189,
    status: "rewritten",
  },
  {
    id: "4",
    title: "内容电商的未来发展方向",
    content: "内容电商作为新兴的商业模式，正在改变传统的购物体验。通过优质内容吸引用户，实现商品销售...",
    source: "百度热搜",
    sourceUrl: "https://example.com/article4",
    author: "电商分析师",
    publishTime: "2024-01-12T14:20:00Z",
    collectTime: "2024-01-16T11:45:00Z",
    tags: ["电商", "内容营销", "趋势"],
    category: "商业",
    readCount: 4567,
    likeCount: 312,
    status: "published",
  },
]

export const mockAccounts: WeChatAccount[] = [
  {
    id: "acc1",
    name: "科技前沿观察",
    avatar: "/placeholder.svg?height=40&width=40",
    isConnected: true,
    lastSync: "2024-01-16T12:00:00Z",
  },
  {
    id: "acc2",
    name: "创业者日记",
    avatar: "/placeholder.svg?height=40&width=40",
    isConnected: true,
    lastSync: "2024-01-16T11:30:00Z",
  },
]

export const defaultConfig: AppConfig = {
  aiApiKey: "",
  aiModel: "gpt-4",
  collectFrequency: 60,
  autoRewrite: false,
  autoPublish: false,
}

export const rewriteStyles = {
  general: {
    name: "通用风格",
    prompt: "请保持原文核心观点，优化语言表达，使内容更加流畅易读",
  },
  professional: {
    name: "专业风格",
    prompt: "请使用专业术语改写，增加权威性和专业性",
  },
  friendly: {
    name: "亲民风格",
    prompt: "请用通俗易懂的语言改写，贴近普通读者",
  },
  marketing: {
    name: "营销风格",
    prompt: "请增强感染力和说服力，适合营销推广",
  },
}
