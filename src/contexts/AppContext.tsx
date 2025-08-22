"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import type { AppState, Article, RewriteRecord, PublicationRecord, WeChatAccount, AppConfig } from "../types"
import { mockAccounts, defaultConfig } from "../data/mock-data"
import { materialsApi, handleApiResponse, ApiError } from "../../lib/api"
import type { MaterialsQueryParams } from "../../lib/api-types"

interface AppContextType extends AppState {
  // Loading and error states
  loading: boolean
  error: string | null

  // Material operations
  fetchMaterials: (params?: MaterialsQueryParams) => Promise<void>
  addMaterials: (materials: Article[]) => void
  updateMaterial: (id: string, updates: Partial<Article>) => Promise<void>
  deleteMaterial: (id: string) => Promise<void>
  batchDeleteMaterials: (ids: string[]) => Promise<void>
  batchUpdateMaterialsStatus: (ids: string[], status: Article['status']) => Promise<void>

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

  // Clear error state
  const clearError = useCallback(() => {
    setError(null)
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

  // Load materials on component mount
  useEffect(() => {
    fetchMaterials()
  }, [fetchMaterials])

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
    fetchMaterials,
    addMaterials,
    updateMaterial,
    deleteMaterial,
    batchDeleteMaterials,
    batchUpdateMaterialsStatus,
    addRewrite,
    addPublication,
    updateAccount,
    updateConfig,
    clearError,
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
