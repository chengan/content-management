"use client"

import { useApp } from "@/src/contexts/AppContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Zap, ImageIcon, Send, Settings, BarChart3 } from "lucide-react"

export default function HomePage() {
  const { materials, rewrites, publications } = useApp()

  const stats = [
    {
      title: "素材总数",
      value: materials.length,
      description: "已采集的内容素材",
      icon: FileText,
      color: "text-blue-600",
    },
    {
      title: "已改写",
      value: rewrites.length,
      description: "AI改写完成的文章",
      icon: Zap,
      color: "text-green-600",
    },
    {
      title: "已发布",
      value: publications.length,
      description: "成功发布的文章",
      icon: Send,
      color: "text-purple-600",
    },
    {
      title: "待处理",
      value: materials.filter((m) => m.status === "pending").length,
      description: "等待处理的素材",
      icon: BarChart3,
      color: "text-orange-600",
    },
  ]

  const quickActions = [
    {
      title: "内容采集",
      description: "从各大平台采集热门内容",
      icon: FileText,
      href: "/collect",
      color: "bg-blue-50 hover:bg-blue-100 border-blue-200",
    },
    {
      title: "AI改写",
      description: "使用AI智能改写文章内容",
      icon: Zap,
      href: "/rewrite",
      color: "bg-green-50 hover:bg-green-100 border-green-200",
    },
    {
      title: "智能配图",
      description: "自动生成匹配的图片素材",
      icon: ImageIcon,
      href: "/images",
      color: "bg-purple-50 hover:bg-purple-100 border-purple-200",
    },
    {
      title: "一键发布",
      description: "发布内容到公众号平台",
      icon: Send,
      href: "/publish",
      color: "bg-orange-50 hover:bg-orange-100 border-orange-200",
    },
  ]

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">仪表盘</h1>
          <p className="text-gray-600">通过AI技术提升内容创作效率，实现内容采集、改写、配图和发布的全流程自动化</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title} className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                    </div>
                    <div className={`p-3 rounded-lg bg-gray-50 ${stat.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">快速操作</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Card key={action.title} className={`cursor-pointer transition-colors ${action.color}`}>
                  <CardContent className="p-6 text-center">
                    <div className="flex justify-center mb-3">
                      <Icon className="h-8 w-8 text-gray-700" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{action.title}</h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                最新素材
              </CardTitle>
              <CardDescription>最近采集的内容素材</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {materials.slice(0, 3).map((material) => (
                  <div key={material.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{material.title}</p>
                      <p className="text-xs text-gray-500">
                        {material.source} • {new Date(material.collectTime).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        material.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : material.status === "rewritten"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                      }`}
                    >
                      {material.status === "pending" ? "待处理" : material.status === "rewritten" ? "已改写" : "已发布"}
                    </span>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4 bg-transparent">
                查看全部素材
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                系统状态
              </CardTitle>
              <CardDescription>当前系统运行状态</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">AI服务状态</span>
                  <span className="flex items-center gap-2 text-sm text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    正常
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">内容采集</span>
                  <span className="flex items-center gap-2 text-sm text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    运行中
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">公众号连接</span>
                  <span className="flex items-center gap-2 text-sm text-blue-600">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    已连接 2 个账号
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">今日发布</span>
                  <span className="text-sm text-gray-900 font-medium">
                    {
                      publications.filter((p) => new Date(p.publishedAt).toDateString() === new Date().toDateString())
                        .length
                    }{" "}
                    篇
                  </span>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4 bg-transparent">
                系统设置
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
