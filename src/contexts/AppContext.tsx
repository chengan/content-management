"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import type { AppState, Article, RewriteRecord, PublicationRecord, WeChatAccount, AppConfig, CollectSource, CollectHistory, CollectStats } from "../types"
// 导入改写相关类型
import type { 
  RewriteRecord as NewRewriteRecord, 
  BatchRewriteTask, 
  RewriteConfig, 
  RewriteStats, 
  RewriteProgress 
} from "../types/rewrite"
import { mockAccounts, defaultConfig } from "../data/mock-data"
import { materialsApi, collectApi, handleApiResponse, ApiError } from "../../lib/api"
import type { MaterialsQueryParams, CollectQueryParams, CollectHistoryQueryParams } from "../../lib/api-types"

interface AppContextType extends AppState {
  // Loading and error states
  loading: boolean
  error: string | null
  collectLoading: boolean
  collectError: string | null

  // Collect states
  collectSources: CollectSource[]
  collectHistory: CollectHistory[]
  collectStats: CollectStats | null

  // Material operations
  fetchMaterials: (params?: MaterialsQueryParams) => Promise<void>
  addMaterials: (materials: Article[]) => void
  updateMaterial: (id: string, updates: Partial<Article>) => Promise<void>
  deleteMaterial: (id: string) => Promise<void>
  batchDeleteMaterials: (ids: string[]) => Promise<void>
  batchUpdateMaterialsStatus: (ids: string[], status: Article['status']) => Promise<void>

  // Collect operations
  fetchCollectSources: () => Promise<void>
  fetchCollectHotlist: (params?: CollectQueryParams) => Promise<Article[]>
  collectArticles: (articles: any[], options?: { skipDuplicates?: boolean; platform?: string }) => Promise<any>
  fetchCollectHistory: (params?: CollectHistoryQueryParams) => Promise<void>
  fetchCollectStats: () => Promise<void>

  // Rewrite states
  rewriteLoading: boolean
  rewriteError: string | null
  rewriteRecords: NewRewriteRecord[]
  batchRewriteTasks: BatchRewriteTask[]
  rewriteConfigs: RewriteConfig[]
  rewriteStats: RewriteStats | null
  currentRewriteProgress: RewriteProgress | null

  // Rewrite operations
  addRewrite: (rewrite: RewriteRecord) => void
  
  // 新改写系统方法（为后续开发预留）
  fetchRewriteRecords: (params?: any) => Promise<void>
  createRewriteRecord: (record: Omit<NewRewriteRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<NewRewriteRecord>
  updateRewriteRecord: (id: string, updates: Partial<NewRewriteRecord>) => Promise<void>
  deleteRewriteRecord: (id: string) => Promise<void>
  
  // 批量改写任务管理
  fetchBatchRewriteTasks: () => Promise<void>
  createBatchRewriteTask: (task: Omit<BatchRewriteTask, 'id' | 'createdAt'>) => Promise<BatchRewriteTask>
  updateBatchRewriteTask: (id: string, updates: Partial<BatchRewriteTask>) => Promise<void>
  cancelBatchRewriteTask: (id: string) => Promise<void>
  
  // 配置管理
  fetchRewriteConfigs: () => Promise<void>
  updateRewriteConfig: (key: string, value: any) => Promise<void>
  
  // 统计信息
  fetchRewriteStats: () => Promise<void>
  
  // 实时进度
  setRewriteProgress: (progress: RewriteProgress | null) => void
  
  // 错误处理
  clearRewriteError: () => void

  // Publication operations
  addPublication: (publication: PublicationRecord) => void

  // Account operations
  updateAccount: (id: string, updates: Partial<WeChatAccount>) => void

  // Config operations
  updateConfig: (updates: Partial<AppConfig>) => void

  // Utility methods
  clearError: () => void
  clearCollectError: () => void
  refreshMaterials: () => Promise<void>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  console.log('🚀 AppProvider 初始化开始')
  
  const [materials, setMaterials] = useState<Article[]>([])
  const [rewrites, setRewrites] = useState<RewriteRecord[]>([])
  const [publications, setPublications] = useState<PublicationRecord[]>([])
  const [accounts, setAccounts] = useState<WeChatAccount[]>(mockAccounts)
  const [config, setConfig] = useState<AppConfig>(defaultConfig)
  
  console.log('📊 初始状态:', {
    materials: materials.length,
    rewrites: rewrites.length,
    publications: publications.length,
    accounts: accounts.length,
    config: config ? 'loaded' : 'empty'
  })
  
  // Loading and error states
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [collectLoading, setCollectLoading] = useState<boolean>(false)
  const [collectError, setCollectError] = useState<string | null>(null)

  // Collect states
  const [collectSources, setCollectSources] = useState<CollectSource[]>([])
  const [collectHistory, setCollectHistory] = useState<CollectHistory[]>([])
  const [collectStats, setCollectStats] = useState<CollectStats | null>(null)

  // 新改写系统状态
  const [rewriteLoading, setRewriteLoading] = useState<boolean>(false)
  const [rewriteError, setRewriteError] = useState<string | null>(null)
  const [rewriteRecords, setRewriteRecords] = useState<NewRewriteRecord[]>([])
  const [batchRewriteTasks, setBatchRewriteTasks] = useState<BatchRewriteTask[]>([])
  const [rewriteConfigs, setRewriteConfigs] = useState<RewriteConfig[]>([])
  const [rewriteStats, setRewriteStats] = useState<RewriteStats | null>(null)
  const [currentRewriteProgress, setCurrentRewriteProgress] = useState<RewriteProgress | null>(null)

  // Helper function to handle API errors
  const handleError = useCallback((error: any) => {
    console.error('API Error:', error)
    if (error instanceof ApiError) {
      setError(error.message)
    } else if (error instanceof Error) {
      setError(error.message)
    } else {
      setError('发生未知错误')
    }
  }, [])

  // Helper function to handle collect API errors
  const handleCollectError = useCallback((error: any) => {
    console.error('Collect API Error:', error)
    if (error instanceof ApiError) {
      setCollectError(error.message)
    } else if (error instanceof Error) {
      setCollectError(error.message)
    } else {
      setCollectError('采集操作发生未知错误')
    }
  }, [])

  // Clear error state
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Clear collect error state
  const clearCollectError = useCallback(() => {
    setCollectError(null)
  }, [])

  // Fetch materials from API
  const fetchMaterials = useCallback(async (params?: MaterialsQueryParams) => {
    console.log('📥 开始获取素材数据...', params)
    setLoading(true)
    setError(null)
    
    try {
      const response = await materialsApi.getList(params)
      const data = handleApiResponse(response)
      console.log('✅ 素材数据获取成功:', data.length, '条')
      setMaterials(data)
    } catch (error) {
      console.error('❌ 素材数据获取失败:', error)
      handleError(error)
    } finally {
      setLoading(false)
    }
  }, [handleError])

  // Refresh materials (convenience method)
  const refreshMaterials = useCallback(async () => {
    await fetchMaterials()
  }, [fetchMaterials])

  // Add materials (for local state updates)
  const addMaterials = useCallback((newMaterials: Article[]) => {
    setMaterials((prev) => [...prev, ...newMaterials])
  }, [])

  // Update material
  const updateMaterial = useCallback(async (id: string, updates: Partial<Article>) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await materialsApi.update(id, updates)
      const updatedMaterial = handleApiResponse(response)
      
      // Update local state optimistically
      setMaterials((prev) => 
        prev.map((item) => (item.id === id ? updatedMaterial : item))
      )
    } catch (error) {
      handleError(error)
      // Refresh materials to ensure consistency
      await fetchMaterials()
    } finally {
      setLoading(false)
    }
  }, [handleError, fetchMaterials])

  // Delete material
  const deleteMaterial = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    
    try {
      await materialsApi.delete(id)
      
      // Update local state optimistically
      setMaterials((prev) => prev.filter((item) => item.id !== id))
    } catch (error) {
      handleError(error)
      // Refresh materials to ensure consistency
      await fetchMaterials()
    } finally {
      setLoading(false)
    }
  }, [handleError, fetchMaterials])

  // Batch delete materials
  const batchDeleteMaterials = useCallback(async (ids: string[]) => {
    setLoading(true)
    setError(null)
    
    try {
      await materialsApi.batchDelete(ids)
      
      // Update local state optimistically
      setMaterials((prev) => prev.filter((item) => !ids.includes(item.id)))
    } catch (error) {
      handleError(error)
      // Refresh materials to ensure consistency
      await fetchMaterials()
    } finally {
      setLoading(false)
    }
  }, [handleError, fetchMaterials])

  // Batch update materials status
  const batchUpdateMaterialsStatus = useCallback(async (ids: string[], status: Article['status']) => {
    setLoading(true)
    setError(null)
    
    try {
      await materialsApi.batchUpdateStatus(ids, status)
      
      // Update local state optimistically
      setMaterials((prev) => 
        prev.map((item) => 
          ids.includes(item.id) ? { ...item, status, updatedAt: new Date().toISOString() } : item
        )
      )
    } catch (error) {
      handleError(error)
      // Refresh materials to ensure consistency
      await fetchMaterials()
    } finally {
      setLoading(false)
    }
  }, [handleError, fetchMaterials])

  // === Collect Operations ===

  // Fetch collect sources
  const fetchCollectSources = useCallback(async () => {
    setCollectLoading(true)
    setCollectError(null)
    
    try {
      const response = await collectApi.getSources()
      const data = handleApiResponse(response)
      setCollectSources(data)
    } catch (error) {
      handleCollectError(error)
    } finally {
      setCollectLoading(false)
    }
  }, [handleCollectError])

  // Fetch hotlist content
  const fetchCollectHotlist = useCallback(async (params?: CollectQueryParams): Promise<Article[]> => {
    setCollectLoading(true)
    setCollectError(null)
    
    try {
      const response = await collectApi.getHotlist(params)
      const data = handleApiResponse(response)
      return data
    } catch (error) {
      handleCollectError(error)
      return []
    } finally {
      setCollectLoading(false)
    }
  }, [handleCollectError])

  // Collect articles to materials library
  const collectArticles = useCallback(async (articles: any[], options?: { skipDuplicates?: boolean; platform?: string }) => {
    setCollectLoading(true)
    setCollectError(null)
    
    try {
      const response = await collectApi.collectArticles(articles, options)
      const data = handleApiResponse(response)
      
      // Refresh materials to show newly collected articles
      if (data.collected > 0) {
        await fetchMaterials()
      }
      
      return data
    } catch (error) {
      handleCollectError(error)
      throw error
    } finally {
      setCollectLoading(false)
    }
  }, [handleCollectError, fetchMaterials])

  // Fetch collect history
  const fetchCollectHistory = useCallback(async (params?: CollectHistoryQueryParams) => {
    setCollectLoading(true)
    setCollectError(null)
    
    try {
      const response = await collectApi.getHistory(params)
      const data = handleApiResponse(response)
      setCollectHistory(data.history || [])
      if (data.stats) {
        setCollectStats(data.stats)
      }
    } catch (error) {
      handleCollectError(error)
    } finally {
      setCollectLoading(false)
    }
  }, [handleCollectError])

  // Fetch collect stats
  const fetchCollectStats = useCallback(async () => {
    setCollectLoading(true)
    setCollectError(null)
    
    try {
      const response = await collectApi.getStats()
      const data = handleApiResponse(response)
      if (data.stats) {
        setCollectStats(data.stats)
      }
    } catch (error) {
      handleCollectError(error)
    } finally {
      setCollectLoading(false)
    }
  }, [handleCollectError])

  // Load materials and collect sources on component mount
  useEffect(() => {
    fetchMaterials()
    fetchCollectSources()
  }, [fetchMaterials, fetchCollectSources])

  const addRewrite = (rewrite: RewriteRecord) => {
    setRewrites((prev) => [...prev, rewrite])
  }

  // ==================== 新改写系统方法（为后续开发预留） ====================
  
  // 改写记录管理
  const fetchRewriteRecords = useCallback(async (params?: any) => {
    setRewriteLoading(true)
    setRewriteError(null)
    try {
      // TODO: 在第二阶段实现API调用
      console.log('fetchRewriteRecords called with params:', params)
      setRewriteRecords([])
    } catch (error: any) {
      setRewriteError(error.message || '获取改写记录失败')
    } finally {
      setRewriteLoading(false)
    }
  }, [])

  const createRewriteRecord = useCallback(async (record: Omit<NewRewriteRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    setRewriteLoading(true)
    setRewriteError(null)
    try {
      // TODO: 在第二阶段实现API调用
      console.log('createRewriteRecord called with record:', record)
      const newRecord = { ...record, id: Date.now().toString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as NewRewriteRecord
      setRewriteRecords(prev => [newRecord, ...prev])
      return newRecord
    } catch (error: any) {
      setRewriteError(error.message || '创建改写记录失败')
      throw error
    } finally {
      setRewriteLoading(false)
    }
  }, [])

  const updateRewriteRecord = useCallback(async (id: string, updates: Partial<NewRewriteRecord>) => {
    setRewriteLoading(true)
    setRewriteError(null)
    try {
      // TODO: 在第二阶段实现API调用
      console.log('updateRewriteRecord called with id:', id, 'updates:', updates)
      setRewriteRecords(prev => prev.map(record => 
        record.id === id ? { ...record, ...updates, updatedAt: new Date().toISOString() } : record
      ))
    } catch (error: any) {
      setRewriteError(error.message || '更新改写记录失败')
    } finally {
      setRewriteLoading(false)
    }
  }, [])

  const deleteRewriteRecord = useCallback(async (id: string) => {
    setRewriteLoading(true)
    setRewriteError(null)
    try {
      // TODO: 在第二阶段实现API调用
      console.log('deleteRewriteRecord called with id:', id)
      setRewriteRecords(prev => prev.filter(record => record.id !== id))
    } catch (error: any) {
      setRewriteError(error.message || '删除改写记录失败')
    } finally {
      setRewriteLoading(false)
    }
  }, [])

  // 批量任务管理
  const fetchBatchRewriteTasks = useCallback(async () => {
    setRewriteLoading(true)
    setRewriteError(null)
    try {
      // TODO: 在第二阶段实现API调用
      console.log('fetchBatchRewriteTasks called')
      setBatchRewriteTasks([])
    } catch (error: any) {
      setRewriteError(error.message || '获取批量任务失败')
    } finally {
      setRewriteLoading(false)
    }
  }, [])

  const createBatchRewriteTask = useCallback(async (task: Omit<BatchRewriteTask, 'id' | 'createdAt'>) => {
    setRewriteLoading(true)
    setRewriteError(null)
    try {
      // TODO: 在第二阶段实现API调用
      console.log('createBatchRewriteTask called with task:', task)
      const newTask = { ...task, id: Date.now().toString(), createdAt: new Date().toISOString() } as BatchRewriteTask
      setBatchRewriteTasks(prev => [newTask, ...prev])
      return newTask
    } catch (error: any) {
      setRewriteError(error.message || '创建批量任务失败')
      throw error
    } finally {
      setRewriteLoading(false)
    }
  }, [])

  const updateBatchRewriteTask = useCallback(async (id: string, updates: Partial<BatchRewriteTask>) => {
    setRewriteLoading(true)
    setRewriteError(null)
    try {
      // TODO: 在第二阶段实现API调用
      console.log('updateBatchRewriteTask called with id:', id, 'updates:', updates)
      setBatchRewriteTasks(prev => prev.map(task => 
        task.id === id ? { ...task, ...updates } : task
      ))
    } catch (error: any) {
      setRewriteError(error.message || '更新批量任务失败')
    } finally {
      setRewriteLoading(false)
    }
  }, [])

  const cancelBatchRewriteTask = useCallback(async (id: string) => {
    setRewriteLoading(true)
    setRewriteError(null)
    try {
      // TODO: 在第二阶段实现API调用
      console.log('cancelBatchRewriteTask called with id:', id)
      setBatchRewriteTasks(prev => prev.map(task => 
        task.id === id ? { ...task, status: 'cancelled' as any } : task
      ))
    } catch (error: any) {
      setRewriteError(error.message || '取消批量任务失败')
    } finally {
      setRewriteLoading(false)
    }
  }, [])

  // 配置管理
  const fetchRewriteConfigs = useCallback(async () => {
    setRewriteLoading(true)
    setRewriteError(null)
    try {
      // TODO: 在第二阶段实现API调用
      console.log('fetchRewriteConfigs called')
      setRewriteConfigs([])
    } catch (error: any) {
      setRewriteError(error.message || '获取改写配置失败')
    } finally {
      setRewriteLoading(false)
    }
  }, [])

  const updateRewriteConfig = useCallback(async (key: string, value: any) => {
    setRewriteLoading(true)
    setRewriteError(null)
    try {
      // TODO: 在第二阶段实现API调用
      console.log('updateRewriteConfig called with key:', key, 'value:', value)
      setRewriteConfigs(prev => prev.map(config => 
        config.configKey === key ? { ...config, configValue: value, updatedAt: new Date().toISOString() } : config
      ))
    } catch (error: any) {
      setRewriteError(error.message || '更新配置失败')
    } finally {
      setRewriteLoading(false)
    }
  }, [])

  // 统计信息
  const fetchRewriteStats = useCallback(async () => {
    setRewriteLoading(true)
    setRewriteError(null)
    try {
      // TODO: 在第二阶段实现API调用
      console.log('fetchRewriteStats called')
      setRewriteStats(null)
    } catch (error: any) {
      setRewriteError(error.message || '获取统计信息失败')
    } finally {
      setRewriteLoading(false)
    }
  }, [])

  // 实时进度管理
  const setRewriteProgress = useCallback((progress: RewriteProgress | null) => {
    setCurrentRewriteProgress(progress)
  }, [])

  // 错误处理
  const clearRewriteError = useCallback(() => {
    setRewriteError(null)
  }, [])

  const addPublication = (publication: PublicationRecord) => {
    setPublications((prev) => [...prev, publication])
  }

  const updateAccount = (id: string, updates: Partial<WeChatAccount>) => {
    setAccounts((prev) => prev.map((account) => (account.id === id ? { ...account, ...updates } : account)))
  }

  const updateConfig = (updates: Partial<AppConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }))
  }

  const value: AppContextType = {
    materials,
    rewrites,
    publications,
    accounts,
    config,
    loading,
    error,
    collectLoading,
    collectError,
    collectSources,
    collectHistory,
    collectStats,
    
    // 新改写系统状态
    rewriteLoading,
    rewriteError,
    rewriteRecords,
    batchRewriteTasks,
    rewriteConfigs,
    rewriteStats,
    currentRewriteProgress,
    
    fetchMaterials,
    addMaterials,
    updateMaterial,
    deleteMaterial,
    batchDeleteMaterials,
    batchUpdateMaterialsStatus,
    fetchCollectSources,
    fetchCollectHotlist,
    collectArticles,
    fetchCollectHistory,
    fetchCollectStats,
    addRewrite,
    
    // 新改写系统方法
    fetchRewriteRecords,
    createRewriteRecord,
    updateRewriteRecord,
    deleteRewriteRecord,
    fetchBatchRewriteTasks,
    createBatchRewriteTask,
    updateBatchRewriteTask,
    cancelBatchRewriteTask,
    fetchRewriteConfigs,
    updateRewriteConfig,
    fetchRewriteStats,
    setRewriteProgress,
    clearRewriteError,
    
    addPublication,
    updateAccount,
    updateConfig,
    clearError,
    clearCollectError,
    refreshMaterials,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}
