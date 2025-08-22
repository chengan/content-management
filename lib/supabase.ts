import { createClient } from '@supabase/supabase-js'
import { Article } from '../src/types'

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
}

export default SupabaseService