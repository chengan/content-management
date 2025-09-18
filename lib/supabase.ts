import { createClient } from '@supabase/supabase-js'
import { 
  Article, 
  CollectSource, 
  CollectHistory, 
  CollectStats, 
  CollectResult,
  CollectBatch,
  DatabaseCollectSource, 
  DatabaseCollectHistory,
  DatabaseCollectResult,
  DatabaseCollectBatch
} from '../src/types'

// 导入改写相关类型
import {
  RewriteRecord,
  RewriteSegment,
  BatchRewriteTask,
  RewriteConfig,
  DatabaseRewriteRecord,
  DatabaseRewriteSegment,
  DatabaseBatchRewriteTask,
  DatabaseRewriteConfig
} from '../src/types/rewrite'

// 环境变量检查
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('缺少Supabase环境变量。请检查.env.local文件中的NEXT_PUBLIC_SUPABASE_URL和NEXT_PUBLIC_SUPABASE_ANON_KEY配置。')
}

// 创建Supabase客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 创建客户端函数（用于API路由）
export function getClient() {
  return supabase
}

// 数据库类型定义，对应articles表结构
export interface DatabaseArticle {
  id: string
  title: string
  content: string
  source: string
  source_url: string | null
  author: string | null
  publish_time: string | null
  collect_time: string
  tags: string[] | null
  category: string | null
  read_count: number
  like_count: number
  status: 'pending' | 'rewritten' | 'published'
  // 新增内容获取相关字段
  content_status?: 'pending' | 'fetching' | 'completed' | 'failed' | null
  fetch_attempts?: number | null
  last_fetch_attempt?: string | null
  created_at: string
  updated_at: string
}

// 数据转换函数：数据库格式 -> 前端格式
export function dbArticleToArticle(dbArticle: DatabaseArticle): Article {
  return {
    id: dbArticle.id,
    title: dbArticle.title,
    content: dbArticle.content,
    source: dbArticle.source,
    sourceUrl: dbArticle.source_url || '',
    author: dbArticle.author || '',
    publishTime: dbArticle.publish_time || '',
    collectTime: dbArticle.collect_time,
    tags: dbArticle.tags || [],
    category: dbArticle.category || '',
    readCount: dbArticle.read_count,
    likeCount: dbArticle.like_count,
    status: dbArticle.status,
    // 新增内容获取状态字段
    contentStatus: dbArticle.content_status || 'pending',
    fetchAttempts: dbArticle.fetch_attempts || 0,
    lastFetchAttempt: dbArticle.last_fetch_attempt || undefined,
    createdAt: dbArticle.created_at,
    updatedAt: dbArticle.updated_at
  }
}

// 数据转换函数：采集源数据库格式 -> 前端格式
export function dbCollectSourceToCollectSource(dbSource: DatabaseCollectSource): CollectSource {
  return {
    id: dbSource.id,
    name: dbSource.name,
    platform: dbSource.platform,
    apiEndpoint: dbSource.api_endpoint || '',
    hashId: dbSource.hash_id || '',
    category: dbSource.category || '',
    description: dbSource.description || '',
    userCreated: dbSource.user_created || false,
    isActive: dbSource.is_active,
    config: dbSource.config || {},
    createdAt: dbSource.created_at
  }
}

// 数据转换函数：采集源前端格式 -> 数据库格式
export function collectSourceToDbCollectSource(source: Partial<CollectSource>): Partial<DatabaseCollectSource> {
  return {
    name: source.name,
    platform: source.platform,
    api_endpoint: source.apiEndpoint || null,
    hash_id: source.hashId || null,
    category: source.category || null,
    description: source.description || null,
    user_created: source.userCreated,
    is_active: source.isActive,
    config: source.config || {}
  }
}

// 数据转换函数：采集历史数据库格式 -> 前端格式
export function dbCollectHistoryToCollectHistory(dbHistory: DatabaseCollectHistory & { collect_sources?: DatabaseCollectSource }): CollectHistory {
  return {
    id: dbHistory.id,
    sourceId: dbHistory.source_id,
    articlesCount: dbHistory.articles_count,
    successCount: dbHistory.success_count,
    collectedAt: dbHistory.collected_at,
    source: dbHistory.collect_sources ? dbCollectSourceToCollectSource(dbHistory.collect_sources) : undefined
  }
}

// 数据转换函数：采集历史前端格式 -> 数据库格式
export function collectHistoryToDbCollectHistory(history: Partial<CollectHistory>): Partial<DatabaseCollectHistory> {
  return {
    source_id: history.sourceId,
    articles_count: history.articlesCount || 0,
    success_count: history.successCount || 0
  }
}

// 数据转换函数：前端格式 -> 数据库格式
export function articleToDbArticle(article: Partial<Article>): Partial<DatabaseArticle> {
  return {
    title: article.title,
    content: article.content,
    source: article.source,
    source_url: article.sourceUrl || null,
    author: article.author || null,
    publish_time: article.publishTime || null,
    tags: article.tags || null,
    category: article.category || null,
    read_count: article.readCount,
    like_count: article.likeCount,
    status: article.status,
    // 新增内容获取状态字段
    content_status: article.contentStatus || null,
    fetch_attempts: article.fetchAttempts || null,
    last_fetch_attempt: article.lastFetchAttempt || null,
    updated_at: new Date().toISOString()
  }
}

// Supabase操作封装类
export class SupabaseService {
  
  /**
   * 获取文章列表（支持分页、筛选、搜索）
   */
  static async getArticles(options: {
    page?: number
    limit?: number
    status?: 'pending' | 'rewritten' | 'published'
    search?: string
    sortBy?: 'collect_time' | 'read_count' | 'like_count'
    order?: 'asc' | 'desc'
  } = {}): Promise<{ articles: Article[], total: number }> {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        search,
        sortBy = 'collect_time',
        order = 'desc'
      } = options

      let query = supabase
        .from('articles')
        .select('*', { count: 'exact' })

      // 状态筛选
      if (status) {
        query = query.eq('status', status)
      }

      // 搜索功能（在标题和内容中搜索）
      if (search && search.trim()) {
        query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%,author.ilike.%${search}%`)
      }

      // 排序
      query = query.order(sortBy, { ascending: order === 'asc' })

      // 分页
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) {
        console.error('获取文章列表失败:', error)
        throw new Error(`数据库查询失败: ${error.message}`)
      }

      const articles = data ? data.map(dbArticleToArticle) : []
      return { articles, total: count || 0 }

    } catch (error) {
      console.error('getArticles error:', error)
      throw error
    }
  }

  /**
   * 根据ID获取单个文章
   */
  static async getArticleById(id: string): Promise<Article | null> {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // 没有找到记录
          return null
        }
        console.error('获取文章详情失败:', error)
        throw new Error(`获取文章失败: ${error.message}`)
      }

      return data ? dbArticleToArticle(data) : null

    } catch (error) {
      console.error('getArticleById error:', error)
      throw error
    }
  }

  /**
   * 创建新文章
   */
  static async createArticle(article: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>): Promise<Article> {
    try {
      const dbArticle = articleToDbArticle(article)
      
      const { data, error } = await supabase
        .from('articles')
        .insert(dbArticle)
        .select()
        .single()

      if (error) {
        console.error('创建文章失败:', error)
        throw new Error(`创建文章失败: ${error.message}`)
      }

      return dbArticleToArticle(data)

    } catch (error) {
      console.error('createArticle error:', error)
      throw error
    }
  }

  /**
   * 更新文章
   */
  static async updateArticle(id: string, updates: Partial<Article>): Promise<Article> {
    try {
      const dbUpdates = articleToDbArticle(updates)
      
      const { data, error } = await supabase
        .from('articles')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('更新文章失败:', error)
        throw new Error(`更新文章失败: ${error.message}`)
      }

      return dbArticleToArticle(data)

    } catch (error) {
      console.error('updateArticle error:', error)
      throw error
    }
  }

  /**
   * 删除文章
   */
  static async deleteArticle(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('删除文章失败:', error)
        throw new Error(`删除文章失败: ${error.message}`)
      }

      return true

    } catch (error) {
      console.error('deleteArticle error:', error)
      throw error
    }
  }

  /**
   * 批量删除文章
   */
  static async batchDeleteArticles(ids: string[]): Promise<number> {
    try {
      const { error, count } = await supabase
        .from('articles')
        .delete()
        .in('id', ids)

      if (error) {
        console.error('批量删除文章失败:', error)
        throw new Error(`批量删除失败: ${error.message}`)
      }

      return count || 0

    } catch (error) {
      console.error('batchDeleteArticles error:', error)
      throw error
    }
  }

  /**
   * 批量更新文章状态
   */
  static async batchUpdateStatus(ids: string[], status: 'pending' | 'rewritten' | 'published'): Promise<number> {
    try {
      const { error, count } = await supabase
        .from('articles')
        .update({ status, updated_at: new Date().toISOString() })
        .in('id', ids)

      if (error) {
        console.error('批量更新状态失败:', error)
        throw new Error(`批量更新失败: ${error.message}`)
      }

      return count || 0

    } catch (error) {
      console.error('batchUpdateStatus error:', error)
      throw error
    }
  }

  /**
   * 测试数据库连接
   */
  static async testConnection(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('articles')
        .select('count')
        .limit(1)

      if (error) {
        console.error('数据库连接测试失败:', error)
        return false
      }

      return true

    } catch (error) {
      console.error('testConnection error:', error)
      return false
    }
  }

  // ==================== 采集源管理方法 ====================

  /**
   * 获取采集源列表
   */
  static async getCollectSources(options: {
    platform?: string
    isActive?: boolean
  } = {}): Promise<CollectSource[]> {
    try {
      let query = supabase
        .from('collect_sources')
        .select('*')
        .order('created_at', { ascending: false })

      // 平台筛选
      if (options.platform) {
        query = query.eq('platform', options.platform)
      }

      // 状态筛选
      if (options.isActive !== undefined) {
        query = query.eq('is_active', options.isActive)
      }

      const { data, error } = await query

      if (error) {
        console.error('获取采集源列表失败:', error)
        throw new Error(`获取采集源失败: ${error.message}`)
      }

      return data ? data.map(dbCollectSourceToCollectSource) : []

    } catch (error) {
      console.error('getCollectSources error:', error)
      throw error
    }
  }

  /**
   * 根据ID获取单个采集源
   */
  static async getCollectSourceById(id: string): Promise<CollectSource | null> {
    try {
      const { data, error } = await supabase
        .from('collect_sources')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        console.error('获取采集源详情失败:', error)
        throw new Error(`获取采集源失败: ${error.message}`)
      }

      return data ? dbCollectSourceToCollectSource(data) : null

    } catch (error) {
      console.error('getCollectSourceById error:', error)
      throw error
    }
  }

  /**
   * 创建新采集源
   */
  static async createCollectSource(source: Omit<CollectSource, 'id' | 'createdAt'>): Promise<CollectSource> {
    try {
      const dbSource = collectSourceToDbCollectSource(source)
      
      const { data, error } = await supabase
        .from('collect_sources')
        .insert(dbSource)
        .select()
        .single()

      if (error) {
        console.error('创建采集源失败:', error)
        throw new Error(`创建采集源失败: ${error.message}`)
      }

      return dbCollectSourceToCollectSource(data)

    } catch (error) {
      console.error('createCollectSource error:', error)
      throw error
    }
  }

  /**
   * 更新采集源
   */
  static async updateCollectSource(id: string, updates: Partial<CollectSource>): Promise<CollectSource> {
    try {
      const dbUpdates = collectSourceToDbCollectSource(updates)
      
      const { data, error } = await supabase
        .from('collect_sources')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('更新采集源失败:', error)
        throw new Error(`更新采集源失败: ${error.message}`)
      }

      return dbCollectSourceToCollectSource(data)

    } catch (error) {
      console.error('updateCollectSource error:', error)
      throw error
    }
  }

  /**
   * 检查采集源的关联数据
   */
  static async checkCollectSourceUsage(id: string): Promise<{
    hasResults: boolean
    resultsCount: number
    hasBatches: boolean
    batchesCount: number
  }> {
    try {
      // 检查采集结果
      const { count: resultsCount, error: resultsError } = await supabase
        .from('collect_results')
        .select('*', { count: 'exact', head: true })
        .eq('source_id', id)

      if (resultsError) {
        console.error('检查采集结果失败:', resultsError)
        throw new Error(`检查采集结果失败: ${resultsError.message}`)
      }

      // 检查采集批次（通过source_ids数组）
      const { count: batchesCount, error: batchesError } = await supabase
        .from('collect_batches')
        .select('*', { count: 'exact', head: true })
        .contains('source_ids', [id])

      if (batchesError) {
        console.error('检查采集批次失败:', batchesError)
        throw new Error(`检查采集批次失败: ${batchesError.message}`)
      }

      return {
        hasResults: (resultsCount || 0) > 0,
        resultsCount: resultsCount || 0,
        hasBatches: (batchesCount || 0) > 0,
        batchesCount: batchesCount || 0
      }
    } catch (error) {
      console.error('checkCollectSourceUsage error:', error)
      throw error
    }
  }

  /**
   * 删除采集源（支持级联删除选项）
   */
  static async deleteCollectSource(id: string, options: {
    cascadeDelete?: boolean
  } = {}): Promise<boolean> {
    try {
      const { cascadeDelete = false } = options

      // 如果选择级联删除，先删除关联数据
      if (cascadeDelete) {
        // 删除相关的采集结果
        const { error: resultsError } = await supabase
          .from('collect_results')
          .delete()
          .eq('source_id', id)

        if (resultsError) {
          console.error('删除相关采集结果失败:', resultsError)
          throw new Error(`删除相关采集结果失败: ${resultsError.message}`)
        }

        // 更新采集批次，从source_ids数组中移除这个采集源
        const { data: batches, error: getBatchesError } = await supabase
          .from('collect_batches')
          .select('id, source_ids')
          .contains('source_ids', [id])

        if (getBatchesError) {
          console.error('获取相关采集批次失败:', getBatchesError)
          throw new Error(`获取相关采集批次失败: ${getBatchesError.message}`)
        }

        if (batches && batches.length > 0) {
          for (const batch of batches) {
            const updatedSourceIds = (batch.source_ids as string[]).filter(sourceId => sourceId !== id)
            const { error: updateBatchError } = await supabase
              .from('collect_batches')
              .update({ source_ids: updatedSourceIds })
              .eq('id', batch.id)

            if (updateBatchError) {
              console.error('更新采集批次失败:', updateBatchError)
              throw new Error(`更新采集批次失败: ${updateBatchError.message}`)
            }
          }
        }
      }

      // 删除采集源本身
      const { error } = await supabase
        .from('collect_sources')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('删除采集源失败:', error)
        throw new Error(`删除采集源失败: ${error.message}`)
      }

      return true

    } catch (error) {
      console.error('deleteCollectSource error:', error)
      throw error
    }
  }

  // ==================== 采集历史管理方法 ====================

  /**
   * 获取采集历史列表
   */
  static async getCollectHistory(options: {
    page?: number
    limit?: number
    sourceId?: string
    startDate?: string
    endDate?: string
  } = {}): Promise<{ history: CollectHistory[], total: number }> {
    try {
      const {
        page = 1,
        limit = 20,
        sourceId,
        startDate,
        endDate
      } = options

      let query = supabase
        .from('collect_history')
        .select(`
          *,
          collect_sources (
            id,
            name,
            platform,
            api_endpoint,
            hash_id,
            is_active,
            config,
            created_at
          )
        `, { count: 'exact' })

      // 采集源筛选
      if (sourceId) {
        query = query.eq('source_id', sourceId)
      }

      // 时间范围筛选
      if (startDate) {
        query = query.gte('collected_at', startDate)
      }
      if (endDate) {
        query = query.lte('collected_at', endDate)
      }

      // 排序和分页
      query = query
        .order('collected_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1)

      const { data, error, count } = await query

      if (error) {
        console.error('获取采集历史失败:', error)
        throw new Error(`获取采集历史失败: ${error.message}`)
      }

      const history = data ? data.map(dbCollectHistoryToCollectHistory) : []
      return { history, total: count || 0 }

    } catch (error) {
      console.error('getCollectHistory error:', error)
      throw error
    }
  }

  /**
   * 创建采集历史记录
   */
  static async createCollectHistory(history: Omit<CollectHistory, 'id' | 'source'>): Promise<CollectHistory> {
    try {
      const dbHistory = collectHistoryToDbCollectHistory(history)
      
      const { data, error } = await supabase
        .from('collect_history')
        .insert(dbHistory)
        .select(`
          *,
          collect_sources (
            id,
            name,
            platform,
            api_endpoint,
            hash_id,
            is_active,
            config,
            created_at
          )
        `)
        .single()

      if (error) {
        console.error('创建采集历史失败:', error)
        throw new Error(`创建采集历史失败: ${error.message}`)
      }

      return dbCollectHistoryToCollectHistory(data)

    } catch (error) {
      console.error('createCollectHistory error:', error)
      throw error
    }
  }

  /**
   * 获取采集统计数据
   */
  static async getCollectStats(): Promise<CollectStats> {
    try {
      // 获取采集源统计
      const { data: sourcesData, error: sourcesError } = await supabase
        .from('collect_sources')
        .select('is_active')

      if (sourcesError) {
        console.error('获取采集源统计失败:', sourcesError)
        throw new Error(`获取统计数据失败: ${sourcesError.message}`)
      }

      // 获取采集历史统计
      const { data: historyData, error: historyError } = await supabase
        .from('collect_history')
        .select('articles_count, success_count, collected_at')

      if (historyError) {
        console.error('获取采集历史统计失败:', historyError)
        throw new Error(`获取统计数据失败: ${historyError.message}`)
      }

      // 计算统计数据
      const totalSources = sourcesData?.length || 0
      const activeSources = sourcesData?.filter(s => s.is_active).length || 0
      const totalCollects = historyData?.length || 0
      
      // 计算今日采集数量
      const today = new Date().toISOString().split('T')[0]
      const todayCollects = historyData?.filter(h => h.collected_at.startsWith(today)).length || 0
      
      // 计算总文章数和成功率
      const totalArticles = historyData?.reduce((sum, h) => sum + h.articles_count, 0) || 0
      const totalSuccess = historyData?.reduce((sum, h) => sum + h.success_count, 0) || 0
      const successRate = totalArticles > 0 ? (totalSuccess / totalArticles) * 100 : 0
      
      // 最后采集时间
      const lastCollectTime = historyData && historyData.length > 0 
        ? historyData.sort((a, b) => new Date(b.collected_at).getTime() - new Date(a.collected_at).getTime())[0].collected_at
        : undefined

      return {
        totalSources,
        activeSources,
        totalCollects,
        todayCollects,
        totalArticles,
        successRate,
        lastCollectTime
      }

    } catch (error) {
      console.error('getCollectStats error:', error)
      throw error
    }
  }

  /**
   * 检查文章是否已存在（去重）
   */
  static async checkArticleExists(title: string, sourceUrl?: string): Promise<boolean> {
    try {
      let query = supabase
        .from('articles')
        .select('id')
        .eq('title', title)

      if (sourceUrl) {
        query = query.eq('source_url', sourceUrl)
      }

      const { data, error } = await query.limit(1)

      if (error) {
        console.error('检查文章重复失败:', error)
        // 检查失败时，为了安全起见，返回false（不存在）
        return false
      }

      return data && data.length > 0

    } catch (error) {
      console.error('checkArticleExists error:', error)
      return false
    }
  }

  /**
   * 批量创建文章（用于采集）
   */
  static async batchCreateArticles(articles: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<Article[]> {
    try {
      const dbArticles = articles.map(articleToDbArticle)
      
      const { data, error } = await supabase
        .from('articles')
        .insert(dbArticles)
        .select()

      if (error) {
        console.error('批量创建文章失败:', error)
        throw new Error(`批量创建文章失败: ${error.message}`)
      }

      return data ? data.map(dbArticleToArticle) : []

    } catch (error) {
      console.error('batchCreateArticles error:', error)
      throw error
    }
  }

  // ==================== 内容获取方法 ====================
  
  /**
   * 获取需要获取内容的文章列表
   * @param limit 限制数量，默认10条
   */
  static async getArticlesNeedingContent(limit: number = 10): Promise<Article[]> {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .or('content_status.is.null,content_status.eq.pending,content_status.eq.failed')
        .not('source_url', 'is', null)
        .neq('source_url', '')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('获取需要内容获取的文章失败:', error)
        throw new Error(`获取需要内容获取的文章失败: ${error.message}`)
      }

      return data ? data.map(dbArticleToArticle) : []

    } catch (error) {
      console.error('getArticlesNeedingContent error:', error)
      throw error
    }
  }

  /**
   * 更新文章内容获取状态
   */
  static async updateArticleContentStatus(
    id: string, 
    status: 'pending' | 'fetching' | 'completed' | 'failed',
    content?: string,
    incrementAttempts: boolean = false
  ): Promise<Article> {
    try {
      const updates: any = {
        content_status: status,
        last_fetch_attempt: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      if (content) {
        updates.content = content
      }

      if (incrementAttempts) {
        // 先获取当前尝试次数
        const { data: current } = await supabase
          .from('articles')
          .select('fetch_attempts')
          .eq('id', id)
          .single()

        updates.fetch_attempts = (current?.fetch_attempts || 0) + 1
      }

      const { data, error } = await supabase
        .from('articles')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('更新文章内容状态失败:', error)
        throw new Error(`更新文章内容状态失败: ${error.message}`)
      }

      return dbArticleToArticle(data)

    } catch (error) {
      console.error('updateArticleContentStatus error:', error)
      throw error
    }
  }

  /**
   * 批量更新文章内容状态为"需要获取内容"
   * @param articleIds 文章ID数组
   */
  static async markArticlesForContentFetch(articleIds: string[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('articles')
        .update({
          content_status: 'pending',
          fetch_attempts: 0,
          last_fetch_attempt: null,
          updated_at: new Date().toISOString()
        })
        .in('id', articleIds)

      if (error) {
        console.error('标记文章需要获取内容失败:', error)
        throw new Error(`标记文章需要获取内容失败: ${error.message}`)
      }

      console.log(`✅ 已标记 ${articleIds.length} 篇文章需要获取内容`)

    } catch (error) {
      console.error('markArticlesForContentFetch error:', error)
      throw error
    }
  }

  /**
   * 获取内容获取统计信息
   */
  static async getContentFetchStats(): Promise<{
    pending: number;
    fetching: number;
    completed: number;
    failed: number;
    total: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('content_status')
        .not('source_url', 'is', null)
        .neq('source_url', '')

      if (error) {
        console.error('获取内容获取统计失败:', error)
        throw new Error(`获取内容获取统计失败: ${error.message}`)
      }

      const stats = {
        pending: 0,
        fetching: 0,
        completed: 0,
        failed: 0,
        total: data?.length || 0
      }

      data?.forEach(item => {
        const status = item.content_status || 'pending'
        stats[status as keyof typeof stats]++
      })

      return stats

    } catch (error) {
      console.error('getContentFetchStats error:', error)
      throw error
    }
  }

  /**
   * 触发自动内容获取服务
   * 异步启动批量内容获取处理
   */
  static async triggerAutoContentFetch(): Promise<void> {
    try {
      // 发送请求到批量处理API，处理所有文章
      const response = await fetch('http://localhost:3000/api/content/batch-process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          limit: 5,              // 每批处理5篇文章
          maxAttempts: 3,        // 最大尝试3次
          delayBetweenRequests: 4000,  // 4秒间隔（稍长以提高成功率）
          processAll: true       // 处理所有待获取的文章
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`🚀 自动内容获取已触发: ${result.data?.processed || 0} 篇文章开始处理`);
        console.log(`📊 处理结果: 成功 ${result.data?.successful || 0} 篇，失败 ${result.data?.failed || 0} 篇`);
      } else {
        console.error('触发自动内容获取失败:', response.statusText);
      }

    } catch (error) {
      console.error('triggerAutoContentFetch error:', error);
      throw error;
    }
  }

  // ==================== 采集批次管理方法 ====================

  /**
   * 创建采集批次
   */
  static async createCollectBatch(batch: Omit<CollectBatch, 'id' | 'createdAt'>): Promise<CollectBatch> {
    try {
      const dbBatch = {
        name: batch.name,
        description: batch.description || null,
        collect_type: batch.collectType,
        keyword: batch.keyword || null,
        source_ids: batch.sourceIds || [],
        total_count: batch.totalCount || 0,
        success_count: batch.successCount || 0,
        error_count: batch.errorCount || 0,
        status: batch.status || 'pending',
        started_at: batch.startedAt || null,
        completed_at: batch.completedAt || null
      }
      
      const { data, error } = await supabase
        .from('collect_batches')
        .insert(dbBatch)
        .select()
        .single()

      if (error) {
        console.error('创建采集批次失败:', error)
        throw new Error(`创建采集批次失败: ${error.message}`)
      }

      return {
        id: data.id,
        name: data.name,
        description: data.description || '',
        collectType: data.collect_type,
        keyword: data.keyword || '',
        sourceIds: data.source_ids || [],
        totalCount: data.total_count,
        successCount: data.success_count,
        errorCount: data.error_count,
        status: data.status,
        startedAt: data.started_at,
        completedAt: data.completed_at,
        createdAt: data.created_at
      }

    } catch (error) {
      console.error('createCollectBatch error:', error)
      throw error
    }
  }

  /**
   * 更新采集批次
   */
  static async updateCollectBatch(id: string, updates: Partial<CollectBatch>): Promise<CollectBatch> {
    try {
      const dbUpdates: any = {}
      
      if (updates.name !== undefined) dbUpdates.name = updates.name
      if (updates.description !== undefined) dbUpdates.description = updates.description
      if (updates.totalCount !== undefined) dbUpdates.total_count = updates.totalCount
      if (updates.successCount !== undefined) dbUpdates.success_count = updates.successCount
      if (updates.errorCount !== undefined) dbUpdates.error_count = updates.errorCount
      if (updates.status !== undefined) dbUpdates.status = updates.status
      if (updates.startedAt !== undefined) dbUpdates.started_at = updates.startedAt
      if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt
      
      const { data, error } = await supabase
        .from('collect_batches')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('更新采集批次失败:', error)
        throw new Error(`更新采集批次失败: ${error.message}`)
      }

      return {
        id: data.id,
        name: data.name,
        description: data.description || '',
        collectType: data.collect_type,
        keyword: data.keyword || '',
        sourceIds: data.source_ids || [],
        totalCount: data.total_count,
        successCount: data.success_count,
        errorCount: data.error_count,
        status: data.status,
        startedAt: data.started_at,
        completedAt: data.completed_at,
        createdAt: data.created_at
      }

    } catch (error) {
      console.error('updateCollectBatch error:', error)
      throw error
    }
  }

  /**
   * 获取采集批次列表
   */
  static async getCollectBatches(options: {
    page?: number
    limit?: number
    status?: string
  } = {}): Promise<{ batches: CollectBatch[], total: number }> {
    try {
      const { page = 1, limit = 20, status } = options

      let query = supabase
        .from('collect_batches')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      if (status) {
        query = query.eq('status', status)
      }

      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) {
        console.error('获取采集批次列表失败:', error)
        throw new Error(`获取采集批次列表失败: ${error.message}`)
      }

      const batches = data ? data.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        collectType: item.collect_type,
        keyword: item.keyword || '',
        sourceIds: item.source_ids || [],
        totalCount: item.total_count,
        successCount: item.success_count,
        errorCount: item.error_count,
        status: item.status,
        startedAt: item.started_at,
        completedAt: item.completed_at,
        createdAt: item.created_at
      })) : []

      return { batches, total: count || 0 }

    } catch (error) {
      console.error('getCollectBatches error:', error)
      throw error
    }
  }

  // ==================== 采集结果管理方法 ====================

  /**
   * 批量创建采集结果
   */
  static async batchCreateCollectResults(results: Omit<CollectResult, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<CollectResult[]> {
    try {
      const dbResults = results.map(result => ({
        title: result.title,
        content: result.content || null,
        source: result.source,
        source_url: result.sourceUrl || null,
        author: result.author || null,
        publish_time: result.publishTime || null,
        collect_time: result.collectTime || new Date().toISOString(),
        tags: result.tags || [],
        category: result.category || null,
        read_count: result.readCount || 0,
        like_count: result.likeCount || 0,
        source_id: result.sourceId,
        collect_batch_id: result.collectBatchId,
        keyword: result.keyword || null,
        is_selected: result.isSelected || false,
        added_to_materials: result.addedToMaterials || false
      }))
      
      const { data, error } = await supabase
        .from('collect_results')
        .insert(dbResults)
        .select()

      if (error) {
        console.error('批量创建采集结果失败:', error)
        throw new Error(`批量创建采集结果失败: ${error.message}`)
      }

      return data ? data.map(item => ({
        id: item.id,
        title: item.title,
        content: item.content || '',
        source: item.source,
        sourceUrl: item.source_url || '',
        author: item.author || '',
        publishTime: item.publish_time || '',
        collectTime: item.collect_time,
        tags: item.tags || [],
        category: item.category || '',
        readCount: item.read_count,
        likeCount: item.like_count,
        sourceId: item.source_id,
        collectBatchId: item.collect_batch_id,
        keyword: item.keyword || '',
        isSelected: item.is_selected,
        addedToMaterials: item.added_to_materials,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      })) : []

    } catch (error) {
      console.error('batchCreateCollectResults error:', error)
      throw error
    }
  }

  /**
   * 获取采集结果列表
   */
  static async getCollectResults(options: {
    batchId?: string
    page?: number
    limit?: number
    onlySelected?: boolean
  } = {}): Promise<{ results: CollectResult[], total: number }> {
    try {
      const { batchId, page = 1, limit = 50, onlySelected } = options

      let query = supabase
        .from('collect_results')
        .select('*', { count: 'exact' })
        .order('collect_time', { ascending: false })

      if (batchId) {
        query = query.eq('collect_batch_id', batchId)
      }

      if (onlySelected) {
        query = query.eq('is_selected', true)
      }

      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) {
        console.error('获取采集结果列表失败:', error)
        throw new Error(`获取采集结果列表失败: ${error.message}`)
      }

      const results = data ? data.map(item => ({
        id: item.id,
        title: item.title,
        content: item.content || '',
        source: item.source,
        sourceUrl: item.source_url || '',
        author: item.author || '',
        publishTime: item.publish_time || '',
        collectTime: item.collect_time,
        tags: item.tags || [],
        category: item.category || '',
        readCount: item.read_count,
        likeCount: item.like_count,
        sourceId: item.source_id,
        collectBatchId: item.collect_batch_id,
        keyword: item.keyword || '',
        isSelected: item.is_selected,
        addedToMaterials: item.added_to_materials,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      })) : []

      return { results, total: count || 0 }

    } catch (error) {
      console.error('getCollectResults error:', error)
      throw error
    }
  }

  /**
   * 更新采集结果选中状态
   */
  static async updateCollectResultSelection(ids: string[], isSelected: boolean): Promise<number> {
    try {
      const { error, count } = await supabase
        .from('collect_results')
        .update({ 
          is_selected: isSelected,
          updated_at: new Date().toISOString()
        })
        .in('id', ids)

      if (error) {
        console.error('更新采集结果选中状态失败:', error)
        throw new Error(`更新选中状态失败: ${error.message}`)
      }

      return count || 0

    } catch (error) {
      console.error('updateCollectResultSelection error:', error)
      throw error
    }
  }

  /**
   * 将采集结果添加到素材库
   */
  static async addCollectResultsToMaterials(resultIds: string[]): Promise<{ added: number, skipped: number }> {
    try {
      // 首先获取选中的采集结果
      const { data: results, error: fetchError } = await supabase
        .from('collect_results')
        .select('*')
        .in('id', resultIds)
        .eq('added_to_materials', false) // 只获取未添加的

      if (fetchError) {
        console.error('获取采集结果失败:', fetchError)
        throw new Error(`获取采集结果失败: ${fetchError.message}`)
      }

      if (!results || results.length === 0) {
        return { added: 0, skipped: resultIds.length }
      }

      // 转换为文章格式并插入到articles表
      const articles = results.map(result => {
        const hasUrl = result.source_url && result.source_url.trim() !== '';
        const hasMinimalContent = result.content && result.content.length > 50;
        
        return {
          title: result.title,
          content: result.content || '',
          source: result.source,
          source_url: result.source_url,
          author: result.author,
          publish_time: result.publish_time,
          collect_time: result.collect_time,
          tags: result.tags,
          category: result.category,
          read_count: result.read_count,
          like_count: result.like_count,
          status: 'pending' as const,
          // 新增：自动设置内容获取状态
          content_status: (hasUrl && !hasMinimalContent) ? 'pending' : 'completed',
          fetch_attempts: 0,
          last_fetch_attempt: null
        }
      })

      const { data: insertedArticles, error: insertError } = await supabase
        .from('articles')
        .insert(articles)
        .select()

      if (insertError) {
        console.error('插入文章到素材库失败:', insertError)
        throw new Error(`添加到素材库失败: ${insertError.message}`)
      }

      // 标记采集结果为已添加
      const { error: updateError } = await supabase
        .from('collect_results')
        .update({ 
          added_to_materials: true,
          updated_at: new Date().toISOString()
        })
        .in('id', resultIds)

      if (updateError) {
        console.error('更新采集结果状态失败:', updateError)
        // 这里不抛出错误，因为文章已经添加成功了
      }

      // 统计需要获取内容的文章数量
      const articlesNeedingContent = articles.filter(article => article.content_status === 'pending').length;
      
      if (articlesNeedingContent > 0) {
        console.log(`📥 已添加 ${articlesNeedingContent} 篇文章需要获取内容，将启动自动处理...`);
        
        // 异步启动自动内容获取服务（不等待结果）
        this.triggerAutoContentFetch().catch(error => {
          console.error('启动自动内容获取失败:', error);
        });
      }

      return { 
        added: insertedArticles?.length || 0, 
        skipped: resultIds.length - results.length 
      }

    } catch (error) {
      console.error('addCollectResultsToMaterials error:', error)
      throw error
    }
  }

  /**
   * 删除采集结果
   */
  static async deleteCollectResults(ids: string[]): Promise<number> {
    try {
      const { error, count } = await supabase
        .from('collect_results')
        .delete()
        .in('id', ids)

      if (error) {
        console.error('删除采集结果失败:', error)
        throw new Error(`删除采集结果失败: ${error.message}`)
      }

      return count || 0

    } catch (error) {
      console.error('deleteCollectResults error:', error)
      throw error
    }
  }
}

// ==================== 改写相关数据转换函数 ====================

// 改写记录：数据库格式 -> 前端格式
export function dbRewriteRecordToRewriteRecord(dbRecord: DatabaseRewriteRecord): RewriteRecord {
  return {
    id: dbRecord.id,
    articleId: dbRecord.article_id,
    originalTitle: dbRecord.original_title,
    rewrittenTitle: dbRecord.rewritten_title,
    originalContent: dbRecord.original_content,
    rewrittenContent: dbRecord.rewritten_content,
    style: dbRecord.style as any,
    customPrompt: dbRecord.custom_prompt,
    segments: dbRecord.segments || [],
    segmentStrategy: (dbRecord.segment_strategy as any) || 'semantic',
    rewriteMethod: (dbRecord.rewrite_method as any) || 'segmented',
    qualityScore: dbRecord.quality_score,
    styleConsistency: dbRecord.style_consistency,
    contentCompleteness: dbRecord.content_completeness,
    readability: dbRecord.readability,
    aiModel: dbRecord.ai_model,
    processingTime: dbRecord.processing_time,
    createdAt: dbRecord.created_at,
    updatedAt: dbRecord.updated_at
  }
}

// 改写记录：前端格式 -> 数据库格式
export function rewriteRecordToDbRewriteRecord(record: Partial<RewriteRecord>): Partial<DatabaseRewriteRecord> {
  return {
    article_id: record.articleId,
    original_title: record.originalTitle,
    rewritten_title: record.rewrittenTitle,
    original_content: record.originalContent,
    rewritten_content: record.rewrittenContent,
    style: record.style,
    custom_prompt: record.customPrompt,
    segments: record.segments ? JSON.stringify(record.segments) : undefined,
    segment_strategy: record.segmentStrategy,
    rewrite_method: record.rewriteMethod,
    quality_score: record.qualityScore,
    style_consistency: record.styleConsistency,
    content_completeness: record.contentCompleteness,
    readability: record.readability,
    ai_model: record.aiModel,
    processing_time: record.processingTime,
    updated_at: new Date().toISOString()
  }
}

// 改写段落：数据库格式 -> 前端格式
export function dbRewriteSegmentToRewriteSegment(dbSegment: DatabaseRewriteSegment): RewriteSegment {
  return {
    id: dbSegment.id,
    rewriteRecordId: dbSegment.rewrite_record_id,
    segmentOrder: dbSegment.segment_order,
    originalContent: dbSegment.original_content,
    rewrittenContent: dbSegment.rewritten_content,
    segmentType: (dbSegment.segment_type as any) || 'paragraph',
    qualityScore: dbSegment.quality_score,
    processingTime: dbSegment.processing_time,
    retryCount: dbSegment.retry_count || 0,
    metadata: dbSegment.metadata || {},
    createdAt: dbSegment.created_at
  }
}

// 改写段落：前端格式 -> 数据库格式
export function rewriteSegmentToDbRewriteSegment(segment: Partial<RewriteSegment>): Partial<DatabaseRewriteSegment> {
  return {
    rewrite_record_id: segment.rewriteRecordId,
    segment_order: segment.segmentOrder,
    original_content: segment.originalContent,
    rewritten_content: segment.rewrittenContent,
    segment_type: segment.segmentType,
    quality_score: segment.qualityScore,
    processing_time: segment.processingTime,
    retry_count: segment.retryCount,
    metadata: segment.metadata || {}
  }
}

// 批量任务：数据库格式 -> 前端格式
export function dbBatchRewriteTaskToBatchRewriteTask(dbTask: DatabaseBatchRewriteTask): BatchRewriteTask {
  return {
    id: dbTask.id,
    name: dbTask.name,
    articleIds: dbTask.article_ids || [],
    style: dbTask.style as any,
    customPrompt: dbTask.custom_prompt,
    status: dbTask.status as any,
    totalArticles: dbTask.total_articles,
    completedArticles: dbTask.completed_articles,
    failedArticles: dbTask.failed_articles,
    config: dbTask.config || {},
    startedAt: dbTask.started_at || undefined,
    completedAt: dbTask.completed_at || undefined,
    createdAt: dbTask.created_at,
    errorMessage: dbTask.error_message
  }
}

// 批量任务：前端格式 -> 数据库格式
export function batchRewriteTaskToDbBatchRewriteTask(task: Partial<BatchRewriteTask>): Partial<DatabaseBatchRewriteTask> {
  return {
    name: task.name,
    article_ids: task.articleIds || [],
    style: task.style,
    custom_prompt: task.customPrompt,
    status: task.status,
    total_articles: task.totalArticles,
    completed_articles: task.completedArticles,
    failed_articles: task.failedArticles,
    config: task.config || {},
    started_at: task.startedAt,
    completed_at: task.completedAt,
    error_message: task.errorMessage
  }
}

// 改写配置：数据库格式 -> 前端格式
export function dbRewriteConfigToRewriteConfig(dbConfig: DatabaseRewriteConfig): RewriteConfig {
  return {
    id: dbConfig.id,
    configKey: dbConfig.config_key,
    configValue: dbConfig.config_value,
    description: dbConfig.description,
    isActive: dbConfig.is_active,
    createdAt: dbConfig.created_at,
    updatedAt: dbConfig.updated_at
  }
}

// 改写配置：前端格式 -> 数据库格式
export function rewriteConfigToDbRewriteConfig(config: Partial<RewriteConfig>): Partial<DatabaseRewriteConfig> {
  return {
    config_key: config.configKey,
    config_value: config.configValue,
    description: config.description,
    is_active: config.isActive,
    updated_at: new Date().toISOString()
  }
}

export default SupabaseService