import type { Article } from "@/types"

// Mock network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const mockCollectContent = async (platform: string, keyword?: string): Promise<Article[]> => {
  await delay(2000)

  // Simulate collecting new articles
  const baseArticles = [
    {
      id: `collected-${Date.now()}-1`,
      title: `${platform}热门文章：${keyword || "最新内容"}分析`,
      content: `这是从${platform}采集到的关于${keyword || "热门话题"}的文章内容...`,
      source: platform,
      sourceUrl: `https://example.com/${platform.toLowerCase()}`,
      author: "内容创作者",
      publishTime: new Date().toISOString(),
      collectTime: new Date().toISOString(),
      tags: keyword ? [keyword, platform] : [platform],
      category: "科技",
      readCount: Math.floor(Math.random() * 10000),
      likeCount: Math.floor(Math.random() * 1000),
      status: "pending" as const,
    },
    {
      id: `collected-${Date.now()}-2`,
      title: `深度解析：${keyword || "行业趋势"}的未来发展`,
      content: `本文深入分析了${keyword || "当前热点"}的发展趋势和未来前景...`,
      source: platform,
      sourceUrl: `https://example.com/${platform.toLowerCase()}/2`,
      author: "行业专家",
      publishTime: new Date(Date.now() - 3600000).toISOString(),
      collectTime: new Date().toISOString(),
      tags: keyword ? [keyword, "趋势分析"] : ["趋势分析"],
      category: "分析",
      readCount: Math.floor(Math.random() * 8000),
      likeCount: Math.floor(Math.random() * 800),
      status: "pending" as const,
    },
  ]

  return baseArticles
}

export const mockRewriteContent = async (
  article: Article,
  style: string,
  customPrompt?: string,
): Promise<{ title: string; content: string }> => {
  await delay(3000)

  const stylePrompts = {
    general: "通用风格改写",
    professional: "专业风格改写",
    friendly: "亲民风格改写",
    marketing: "营销风格改写",
  }

  const selectedStyle = stylePrompts[style as keyof typeof stylePrompts] || style

  return {
    title: `${article.title} (${selectedStyle})`,
    content: `${article.content}\n\n[AI改写内容 - ${selectedStyle}]\n这是经过AI改写后的内容，保持了原文的核心观点，但采用了${selectedStyle}的表达方式，使内容更加适合目标读者群体。${customPrompt ? `\n\n根据自定义要求：${customPrompt}` : ""}`,
  }
}

export const mockGenerateImages = async (content: string): Promise<string[]> => {
  await delay(2000)

  // Return placeholder images
  return ["/ai-content-creation.png", "/placeholder-6ktbp.png", "/technology-innovation.png"]
}

export const mockPublishArticle = async (
  articleId: string,
  accountId: string,
  content: { title: string; content: string; images: string[] },
): Promise<{ success: boolean; publicationId?: string }> => {
  await delay(1500)

  // Simulate 90% success rate
  const success = Math.random() > 0.1

  if (success) {
    return {
      success: true,
      publicationId: `pub-${Date.now()}`,
    }
  } else {
    throw new Error("发布失败：网络连接异常")
  }
}
