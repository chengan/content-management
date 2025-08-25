import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { AppProvider } from "../src/contexts/AppContext"
import { AppLayout } from "../src/components/layout/AppLayout"
import { Toaster } from "sonner"

export const metadata: Metadata = {
  title: "AI公众号内容管理系统",
  description: "基于AI的公众号内容管理系统，提供内容采集、AI改写、智能配图和一键发布功能",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
        <AppProvider>
          <AppLayout>{children}</AppLayout>
          <Toaster />
        </AppProvider>
      </body>
    </html>
  )
}
