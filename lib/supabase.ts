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
      const articles = results.map(result => ({
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
        status: 'pending' as const
      }))

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

export default SupabaseService