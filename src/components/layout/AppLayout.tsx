"use client"

import type React from "react"
import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Home,
  Download,
  FolderOpen,
  Zap,
  ImageIcon,
  Send,
  Settings,
  Menu,
  X,
  Bell,
  Search,
  Moon,
  Sun,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
}

const navigation: NavigationItem[] = [
  { name: "仪表盘", href: "/", icon: Home },
  { name: "内容采集", href: "/collect", icon: Download },
  { name: "素材管理", href: "/materials", icon: FolderOpen },
  { name: "AI改写", href: "/rewrite", icon: Zap },
  { name: "智能配图", href: "/images", icon: ImageIcon },
  { name: "发布管理", href: "/publish", icon: Send },
  { name: "系统设置", href: "/settings", icon: Settings },
]

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const pathname = usePathname()

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle("dark")
  }

  return (
    <div className={cn("min-h-screen bg-background flex", darkMode && "dark")}>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar shadow-xl transform transition-all duration-300 ease-in-out lg:relative lg:transform-none lg:shadow-lg border-r border-sidebar-border",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-6 border-b border-sidebar-border bg-gradient-to-r from-primary/10 to-primary/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-accent to-accent/80 rounded-xl flex items-center justify-center shadow-lg">
                <Zap className="w-5 h-5 text-accent-foreground" />
              </div>
              <span className="text-lg font-bold text-sidebar-foreground bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                AI内容管理
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden hover:bg-sidebar-accent/10"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <nav className="flex-1 px-4 py-8 space-y-3">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                    isActive
                      ? "bg-gradient-to-r from-sidebar-accent to-sidebar-accent/80 text-sidebar-accent-foreground shadow-lg transform scale-[1.02]"
                      : "text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-gradient-to-r hover:from-sidebar-primary/20 hover:to-sidebar-primary/10 hover:shadow-md hover:transform hover:scale-[1.01]",
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className={cn("w-5 h-5 transition-transform duration-200", isActive && "scale-110")} />
                  {item.name}
                  {item.badge && (
                    <span className="ml-auto bg-destructive text-destructive-foreground text-xs px-2.5 py-1 rounded-full shadow-sm animate-pulse">
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-50" />
                  )}
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t border-sidebar-border bg-gradient-to-r from-muted/30 to-muted/10">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200">
              <Avatar className="w-10 h-10 ring-2 ring-primary/20 shadow-md">
                <AvatarImage src="/placeholder.svg?height=40&width=40" />
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold">
                  用户
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-sidebar-foreground truncate">内容创作者</p>
                <p className="text-xs text-muted-foreground truncate">creator@example.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-card shadow-lg border-b border-border backdrop-blur-sm bg-card/95">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center gap-4 flex-1">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden hover:bg-primary/10 hover:text-primary"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>

              <div className="hidden md:flex items-center gap-3 bg-muted/50 rounded-xl px-4 py-2.5 min-w-0 flex-1 max-w-md shadow-sm border border-border/50 hover:shadow-md hover:border-primary focus-within:ring-2 focus-within:ring-ring focus-within:border-primary transition-all duration-200">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="搜索内容、标签或作者..."
                  className="bg-transparent border-0 outline-none text-sm flex-1 min-w-0 placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleDarkMode}
                className="hidden md:flex hover:bg-primary/10 hover:text-primary rounded-xl"
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>

              <Button variant="ghost" size="sm" className="relative hover:bg-accent/10 hover:text-accent rounded-xl">
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-accent rounded-full shadow-sm animate-pulse"></span>
              </Button>

              <Avatar className="w-8 h-8 ring-2 ring-primary/20 shadow-md hover:ring-primary/40 transition-all duration-200">
                <AvatarImage src="/placeholder.svg?height=32&width=32" />
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-xs font-semibold">
                  用户
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-auto bg-gradient-to-br from-background to-muted/20">{children}</main>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border shadow-2xl lg:hidden">
        <div className="grid grid-cols-4 gap-1 p-3">
          {navigation.slice(0, 4).map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-3 rounded-xl text-xs font-medium transition-all duration-200",
                  isActive
                    ? "text-accent bg-accent/10 shadow-md transform scale-105"
                    : "text-muted-foreground hover:text-accent hover:bg-accent/5",
                )}
              >
                <Icon className={cn("w-5 h-5 transition-transform duration-200", isActive && "scale-110")} />
                <span className="truncate">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
