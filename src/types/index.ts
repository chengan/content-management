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

// 采集源配置接口
export interface CollectSource {
  id: string
  name: string
  platform: string
  apiEndpoint?: string
  hashId?: string
  category: string
  description: string
  userCreated: boolean  // 是否用户自定义创建
  isActive: boolean
  config: Record<string, any>
  createdAt: string
}

// 数据库格式的采集源（snake_case）
export interface DatabaseCollectSource {
  id: string
  name: string
  platform: string
  api_endpoint: string | null
  hash_id: string | null
  category: string | null
  description: string | null
  user_created: boolean
  is_active: boolean
  config: Record<string, any>
  created_at: string
}

// 采集历史记录接口
export interface CollectHistory {
  id: string
  sourceId: string
  articlesCount: number
  successCount: number
  collectedAt: string
  source?: CollectSource  // 关联的采集源信息
}

// 数据库格式的采集历史（snake_case）
export interface DatabaseCollectHistory {
  id: string
  source_id: string
  articles_count: number
  success_count: number
  collected_at: string
}

// 采集统计数据
export interface CollectStats {
  totalSources: number
  activeSources: number
  totalCollects: number
  todayCollects: number
  totalArticles: number
  successRate: number
  lastCollectTime?: string
}

// 采集结果（临时存储）
export interface CollectResult {
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
  sourceId: string
  collectBatchId: string
  keyword: string        // 关键词采集时使用
  isSelected: boolean    // 是否被用户选中
  addedToMaterials: boolean // 是否已添加到素材库
  createdAt: string
  updatedAt: string
}

// 数据库格式的采集结果（snake_case）
export interface DatabaseCollectResult {
  id: string
  title: string
  content: string | null
  source: string
  source_url: string | null
  author: string | null
  publish_time: string | null
  collect_time: string
  tags: string[] | null
  category: string | null
  read_count: number
  like_count: number
  source_id: string
  collect_batch_id: string
  keyword: string | null
  is_selected: boolean
  added_to_materials: boolean
  created_at: string
  updated_at: string
}

// 采集批次
export interface CollectBatch {
  id: string
  name: string
  description: string
  collectType: 'keyword' | 'full'  // 采集方式：关键词采集 | 一键采集
  keyword: string        // 关键词（关键词采集时使用）
  sourceIds: string[]    // 采集的数据源ID列表
  totalCount: number     // 总采集数量
  successCount: number   // 成功数量
  errorCount: number     // 失败数量
  status: 'pending' | 'running' | 'completed' | 'failed'  // 批次状态
  startedAt: string | null   // 开始时间
  completedAt: string | null // 完成时间
  createdAt: string
}

// 数据库格式的采集批次（snake_case）
export interface DatabaseCollectBatch {
  id: string
  name: string
  description: string | null
  collect_type: 'keyword' | 'full'
  keyword: string | null
  source_ids: string[]
  total_count: number
  success_count: number
  error_count: number
  status: 'pending' | 'running' | 'completed' | 'failed'
  started_at: string | null
  completed_at: string | null
  created_at: string
}

// 采集操作结果（API响应）
export interface CollectOperationResult {
  success: boolean
  total: number
  collected: number
  duplicated: number
  failed: number
  batchId: string
  results: CollectResult[]
  errors?: string[]
}

// 今日热榜API响应格式
export interface TopHubNode {
  id: string
  name: string
  title: string
  link: string
  domain: string
  description: string
  keyword: string
}

export interface TopHubArticle {
  index: number
  title: string
  desc?: string
  pic?: string
  hot: number
  url: string
  mobileUrl?: string
}

export interface TopHubResponse {
  code: number
  message: string
  data: TopHubArticle[]
}

export interface AppState {
  materials: Article[]
  rewrites: RewriteRecord[]
  publications: PublicationRecord[]
  accounts: WeChatAccount[]
  config: AppConfig
  // 新增采集相关状态
  collectSources: CollectSource[]
  collectHistory: CollectHistory[]
  collectStats: CollectStats
  collectResults: CollectResult[]    // 采集结果（临时）
  collectBatches: CollectBatch[]     // 采集批次
}
