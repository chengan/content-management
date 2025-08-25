"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import type { AppState, Article, RewriteRecord, PublicationRecord, WeChatAccount, AppConfig, CollectSource, CollectHistory, CollectStats } from "../types"
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

  // Rewrite operations
  addRewrite: (rewrite: RewriteRecord) => void

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
  const [materials, setMaterials] = useState<Article[]>([])
  const [rewrites, setRewrites] = useState<RewriteRecord[]>([])
  const [publications, setPublications] = useState<PublicationRecord[]>([])
  const [accounts, setAccounts] = useState<WeChatAccount[]>(mockAccounts)
  const [config, setConfig] = useState<AppConfig>(defaultConfig)
  
  // Loading and error states
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [collectLoading, setCollectLoading] = useState<boolean>(false)
  const [collectError, setCollectError] = useState<string | null>(null)

  // Collect states
  const [collectSources, setCollectSources] = useState<CollectSource[]>([])
  const [collectHistory, setCollectHistory] = useState<CollectHistory[]>([])
  const [collectStats, setCollectStats] = useState<CollectStats | null>(null)

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
    setLoading(true)
    setError(null)
    
    try {
      const response = await materialsApi.getList(params)
      const data = handleApiResponse(response)
      setMaterials(data)
    } catch (error) {
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
