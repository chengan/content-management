export interface Article {
  id: string
  title: string
  content: string
  source: string
  sourceUrl: string
  author: string
  publishTime: string
  collectTime: string
  tags: string[]
  category: string
  readCount: number
  likeCount: number
  status: "pending" | "rewritten" | "published"
  createdAt: string
  updatedAt: string
}

export interface RewriteStyle {
  name: string
  prompt: string
}

export interface RewriteRecord {
  id: string
  articleId: string
  originalTitle: string
  rewrittenTitle: string
  originalContent: string
  rewrittenContent: string
  style: string
  customPrompt?: string
  createdAt: string
}

export interface PublicationRecord {
  id: string
  articleId: string
  accountId: string
  title: string
  content: string
  images: string[]
  publishedAt: string
  status: "success" | "failed" | "pending"
  stats?: {
    views: number
    likes: number
    shares: number
  }
}

export interface WeChatAccount {
  id: string
  name: string
  avatar: string
  isConnected: boolean
  lastSync: string
}

export interface AppConfig {
  aiApiKey: string
  aiModel: string
  collectFrequency: number
  autoRewrite: boolean
  autoPublish: boolean
}

export interface AppState {
  materials: Article[]
  rewrites: RewriteRecord[]
  publications: PublicationRecord[]
  accounts: WeChatAccount[]
  config: AppConfig
}
