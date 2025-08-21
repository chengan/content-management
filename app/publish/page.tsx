"use client"

import { useState, useEffect } from "react"
import { useApp } from "@/src/contexts/AppContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Send,
  FileText,
  Eye,
  Calendar,
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  Settings,
  Smartphone,
} from "lucide-react"
import { mockPublishArticle } from "@/src/utils/mock-api"
import type { Article, PublicationRecord } from "@/src/types"

export default function PublishPage() {
  const { materials, accounts, publications, addPublication, updateMaterial } = useApp()
  const [selectedMaterial, setSelectedMaterial] = useState<Article | null>(null)
  const [selectedAccount, setSelectedAccount] = useState<string>("")
  const [isPublishing, setIsPublishing] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [activeTab, setActiveTab] = useState("publish")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Get materials ready for publishing (rewritten status)
  const readyMaterials = materials.filter((m) => m.status === "rewritten")

  // Get connected accounts
  const connectedAccounts = accounts.filter((acc) => acc.isConnected)

  // Auto-select first ready material and connected account
  useEffect(() => {
    if (!selectedMaterial && readyMaterials.length > 0) {
      setSelectedMaterial(readyMaterials[0])
    }
    if (!selectedAccount && connectedAccounts.length > 0) {
      setSelectedAccount(connectedAccounts[0].id)
    }
  }, [selectedMaterial, readyMaterials, selectedAccount, connectedAccounts])

  // Filter publications based on search and status
  const filteredPublications = publications.filter((pub) => {
    const matchesSearch =
      pub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      accounts
        .find((acc) => acc.id === pub.accountId)
        ?.name.toLowerCase()
        .includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || pub.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handlePublish = async () => {
    if (!selectedMaterial || !selectedAccount) return

    setIsPublishing(true)

    try {
      const content = {
        title: selectedMaterial.title,
        content: selectedMaterial.content,
        images: ["/placeholder.svg?height=400&width=600&text=Article+Image"], // Mock images
      }

      const result = await mockPublishArticle(selectedMaterial.id, selectedAccount, content)

      if (result.success && result.publicationId) {
        // Create publication record
        const publicationRecord: PublicationRecord = {
          id: result.publicationId,
          articleId: selectedMaterial.id,
          accountId: selectedAccount,
          title: content.title,
          content: content.content,
          images: content.images,
          publishedAt: new Date().toISOString(),
          status: "success",
          stats: {
            views: 528,
            likes: 42,
            shares: 18,
          },
        }

        addPublication(publicationRecord)
        updateMaterial(selectedMaterial.id, { status: "published" })

        // Reset selection
        setSelectedMaterial(null)
        setSelectedAccount(connectedAccounts[0]?.id || "")
      }
    } catch (error) {
      console.error("Publishing failed:", error)
      // Handle error - could add error state here
    } finally {
      setIsPublishing(false)
    }
  }

  const getStatusIcon = (status: PublicationRecord["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: PublicationRecord["status"]) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800"
      case "failed":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const PreviewDialog = () => {
    if (!selectedMaterial) return null

    return (
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              发布预览
            </DialogTitle>
            <DialogDescription>预览文章在微信公众号中的显示效果</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Mock WeChat Article Preview */}
            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-3 leading-tight">{selectedMaterial.title}</h2>

                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                  <Avatar className="w-6 h-6">
                    <AvatarImage
                      src={accounts.find((acc) => acc.id === selectedAccount)?.avatar || "/placeholder.svg"}
                    />
                    <AvatarFallback>账号</AvatarFallback>
                  </Avatar>
                  <span>{accounts.find((acc) => acc.id === selectedAccount)?.name}</span>
                  <span>•</span>
                  <span>{new Date().toLocaleDateString()}</span>
                </div>

                {/* Mock article image */}
                <div className="mb-4">
                  <img
                    src="/placeholder.svg?height=200&width=350&text=Article+Cover"
                    alt="Article cover"
                    className="w-full rounded-lg"
                  />
                </div>

                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap line-clamp-6">
                    {selectedMaterial.content}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>阅读 528</span>
                    <span>在看 42</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="text-xs">
                      点赞
                    </Button>
                    <Button variant="ghost" size="sm" className="text-xs">
                      在看
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handlePublish} disabled={isPublishing} className="flex-1">
                {isPublishing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    发布中...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    确认发布
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                取消
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">发布管理</h1>
          <p className="text-gray-600">管理文章发布到微信公众号，跟踪发布状态和数据表现</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="publish">文章发布</TabsTrigger>
            <TabsTrigger value="history">发布历史</TabsTrigger>
          </TabsList>

          <TabsContent value="publish" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Article Selection */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      待发布文章
                    </CardTitle>
                    <CardDescription>选择已改写的文章进行发布</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-96">
                      <div className="p-4 space-y-2">
                        {readyMaterials.length > 0 ? (
                          readyMaterials.map((material) => (
                            <div
                              key={material.id}
                              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                selectedMaterial?.id === material.id
                                  ? "border-blue-200 bg-blue-50"
                                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                              }`}
                              onClick={() => setSelectedMaterial(material)}
                            >
                              <h3 className="font-medium text-sm line-clamp-2 mb-2">{material.title}</h3>
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <Badge variant="outline" className="text-xs">
                                  {material.source}
                                </Badge>
                                <Badge className="bg-blue-100 text-blue-800 text-xs">已改写</Badge>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">暂无待发布文章</p>
                            <p className="text-xs text-gray-400 mt-1">请先完成文章改写</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Publishing Interface */}
              <div className="lg:col-span-3">
                {selectedMaterial ? (
                  <div className="space-y-6">
                    {/* Publishing Settings */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Settings className="h-5 w-5" />
                          发布设置
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium mb-2 block">选择公众号账号</Label>
                          <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                            <SelectTrigger>
                              <SelectValue placeholder="选择要发布的公众号账号" />
                            </SelectTrigger>
                            <SelectContent>
                              {connectedAccounts.map((account) => (
                                <SelectItem key={account.id} value={account.id}>
                                  <div className="flex items-center gap-2">
                                    <Avatar className="w-6 h-6">
                                      <AvatarImage src={account.avatar || "/placeholder.svg"} />
                                      <AvatarFallback>账号</AvatarFallback>
                                    </Avatar>
                                    <span>{account.name}</span>
                                    <Badge variant="secondary" className="text-xs">
                                      已连接
                                    </Badge>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {connectedAccounts.length === 0 && (
                            <p className="text-sm text-red-500 mt-1">请先在系统设置中连接公众号账号</p>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => setShowPreview(true)}
                            disabled={!selectedAccount}
                            variant="outline"
                            className="flex-1"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            预览效果
                          </Button>
                          <Button
                            onClick={handlePublish}
                            disabled={!selectedAccount || isPublishing}
                            className="flex-1"
                          >
                            {isPublishing ? (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                发布中...
                              </>
                            ) : (
                              <>
                                <Send className="h-4 w-4 mr-2" />
                                立即发布
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Article Preview */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          文章内容
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedMaterial.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                              <Badge variant="outline">{selectedMaterial.source}</Badge>
                              <span>•</span>
                              <span>{selectedMaterial.author}</span>
                              <span>•</span>
                              <span>{selectedMaterial.content.length} 字</span>
                            </div>
                          </div>
                          <ScrollArea className="h-64">
                            <div className="pr-4">
                              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                {selectedMaterial.content}
                              </p>
                            </div>
                          </ScrollArea>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex items-center justify-center h-96">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Send className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">选择文章开始发布</h3>
                        <p className="text-gray-500">从左侧选择一篇已改写的文章进行发布</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            {/* Search and Filter */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="搜索已发布文章..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部状态</SelectItem>
                      <SelectItem value="success">发布成功</SelectItem>
                      <SelectItem value="failed">发布失败</SelectItem>
                      <SelectItem value="pending">发布中</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Publishing History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  发布历史
                </CardTitle>
                <CardDescription>共 {filteredPublications.length} 条发布记录</CardDescription>
              </CardHeader>
              <CardContent>
                {filteredPublications.length > 0 ? (
                  <div className="space-y-4">
                    {filteredPublications.map((publication) => {
                      const account = accounts.find((acc) => acc.id === publication.accountId)
                      return (
                        <div key={publication.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2">{publication.title}</h3>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-2">
                                  <Avatar className="w-5 h-5">
                                    <AvatarImage src={account?.avatar || "/placeholder.svg"} />
                                    <AvatarFallback>账号</AvatarFallback>
                                  </Avatar>
                                  <span>{account?.name}</span>
                                </div>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(publication.publishedAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div
                                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(publication.status)}`}
                              >
                                {getStatusIcon(publication.status)}
                                {publication.status === "success"
                                  ? "发布成功"
                                  : publication.status === "failed"
                                    ? "发布失败"
                                    : "发布中"}
                              </div>
                            </div>
                          </div>

                          {publication.stats && publication.status === "success" && (
                            <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-100">
                              <div className="text-center">
                                <div className="text-lg font-semibold text-gray-900">{publication.stats.views}</div>
                                <div className="text-xs text-gray-500">阅读量</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-semibold text-gray-900">{publication.stats.likes}</div>
                                <div className="text-xs text-gray-500">点赞数</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-semibold text-gray-900">{publication.stats.shares}</div>
                                <div className="text-xs text-gray-500">分享数</div>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BarChart3 className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">暂无发布记录</h3>
                    <p className="text-gray-500 mb-4">开始发布文章或调整筛选条件</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <PreviewDialog />
      </div>
    </div>
  )
}
