"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import type { AppState, Article, RewriteRecord, PublicationRecord, WeChatAccount, AppConfig } from "@/types"
import { mockArticles, mockAccounts, defaultConfig } from "../data/mock-data"

interface AppContextType extends AppState {
  // Material operations
  addMaterials: (materials: Article[]) => void
  updateMaterial: (id: string, updates: Partial<Article>) => void
  deleteMaterial: (id: string) => void

  // Rewrite operations
  addRewrite: (rewrite: RewriteRecord) => void

  // Publication operations
  addPublication: (publication: PublicationRecord) => void

  // Account operations
  updateAccount: (id: string, updates: Partial<WeChatAccount>) => void

  // Config operations
  updateConfig: (updates: Partial<AppConfig>) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [materials, setMaterials] = useState<Article[]>(mockArticles)
  const [rewrites, setRewrites] = useState<RewriteRecord[]>([])
  const [publications, setPublications] = useState<PublicationRecord[]>([])
  const [accounts, setAccounts] = useState<WeChatAccount[]>(mockAccounts)
  const [config, setConfig] = useState<AppConfig>(defaultConfig)

  const addMaterials = (newMaterials: Article[]) => {
    setMaterials((prev) => [...prev, ...newMaterials])
  }

  const updateMaterial = (id: string, updates: Partial<Article>) => {
    setMaterials((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)))
  }

  const deleteMaterial = (id: string) => {
    setMaterials((prev) => prev.filter((item) => item.id !== id))
  }

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
    addMaterials,
    updateMaterial,
    deleteMaterial,
    addRewrite,
    addPublication,
    updateAccount,
    updateConfig,
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
