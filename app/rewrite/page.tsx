"use client"

import { useState, useEffect } from "react"
import { useApp } from "@/src/contexts/AppContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Zap,
  FileText,
  Wand2,
  Copy,
  RefreshCw,
  CheckCircle,
  BarChart3,
  History,
  Settings,
  Sparkles,
} from "lucide-react"
import { mockRewriteContent } from "@/src/utils/mock-api"
import { rewriteStyles } from "@/src/data/mock-data"
import type { Article, RewriteRecord } from "@/src/types"

export default function RewritePage() {
  const { materials, rewrites, addRewrite, updateMaterial } = useApp()
  const [selectedMaterial, setSelectedMaterial] = useState<Article | null>(null)
  const [selectedStyle, setSelectedStyle] = useState("general")
  const [customPrompt, setCustomPrompt] = useState("")
  const [isRewriting, setIsRewriting] = useState(false)
  const [rewriteResult, setRewriteResult] = useState<{ title: string; content: string } | null>(null)
  const [activeTab, setActiveTab] = useState("rewrite")

  // Get pending materials for rewriting
  const pendingMaterials = materials.filter((m) => m.status === "pending")

  // Get rewrite history for selected material
  const materialRewrites = selectedMaterial ? rewrites.filter((r) => r.articleId === selectedMaterial.id) : []

  // Auto-select first pending material if none selected
  useEffect(() => {
    if (!selectedMaterial && pendingMaterials.length > 0) {
      setSelectedMaterial(pendingMaterials[0])
    }
  }, [selectedMaterial, pendingMaterials])

  const handleRewrite = async () => {
    if (!selectedMaterial) return

    setIsRewriting(true)
    setRewriteResult(null)

    try {
      const result = await mockRewriteContent(selectedMaterial, selectedStyle, customPrompt || undefined)

      setRewriteResult(result)

      // Save rewrite record
      const rewriteRecord: RewriteRecord = {
        id: `rewrite-${crypto.randomUUID()}`,
        articleId: selectedMaterial.id,
        originalTitle: selectedMaterial.title,
        rewrittenTitle: result.title,
        originalContent: selectedMaterial.content,
        rewrittenContent: result.content,
        style: selectedStyle,
        customPrompt: customPrompt || undefined,
        createdAt: new Date().toISOString(),
      }

      addRewrite(rewriteRecord)
    } catch (error) {
      console.error("Rewrite failed:", error)
    } finally {
      setIsRewriting(false)
    }
  }

  const handleSaveRewrite = () => {
    if (!selectedMaterial || !rewriteResult) return

    // Update material with rewritten content
    updateMaterial(selectedMaterial.id, {
      title: rewriteResult.title,
      content: rewriteResult.content,
      status: "rewritten",
    })

    // Clear current rewrite
    setRewriteResult(null)
    setSelectedMaterial(null)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getWordCount = (text: string) => {
    return text.length
  }

  const getStyleDescription = (styleKey: string) => {
    return rewriteStyles[styleKey as keyof typeof rewriteStyles]?.prompt || ""
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI改写</h1>
          <p className="text-gray-600">使用AI智能改写文章内容，提升内容质量和表达效果</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Material Selection Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  待改写素材
                </CardTitle>
                <CardDescription>选择需要改写的内容</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-96">
                  <div className="p-4 space-y-2">
                    {pendingMaterials.length > 0 ? (
                      pendingMaterials.map((material) => (
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
                            <span>{getWordCount(material.content)} 字</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">暂无待改写素材</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Rewrite History */}
            {selectedMaterial && materialRewrites.length > 0 && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    改写历史
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-48">
                    <div className="p-4 space-y-2">
                      {materialRewrites.map((rewrite) => (
                        <div key={rewrite.id} className="p-2 rounded border border-gray-200">
                          <div className="flex items-center justify-between mb-1">
                            <Badge variant="secondary" className="text-xs">
                              {rewriteStyles[rewrite.style as keyof typeof rewriteStyles]?.name || rewrite.style}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(rewrite.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-2">{rewrite.rewrittenTitle}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Rewrite Interface */}
          <div className="lg:col-span-3">
            {selectedMaterial ? (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="rewrite">AI改写</TabsTrigger>
                  <TabsTrigger value="compare">对比预览</TabsTrigger>
                </TabsList>

                <TabsContent value="rewrite" className="space-y-6">
                  {/* Rewrite Controls */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        改写设置
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium mb-2 block">改写风格</Label>
                          <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(rewriteStyles).map(([key, style]) => (
                                <SelectItem key={key} value={key}>
                                  {style.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-gray-500 mt-1">{getStyleDescription(selectedStyle)}</p>
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-2 block">自定义要求</Label>
                          <Textarea
                            placeholder="输入特殊改写要求（可选）"
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            className="min-h-[80px]"
                          />
                        </div>
                      </div>

                      <Button onClick={handleRewrite} disabled={isRewriting} className="w-full" size="lg">
                        {isRewriting ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            AI改写中...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            开始改写
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Original and Rewritten Content */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Original Content */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            原文内容
                          </span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{getWordCount(selectedMaterial.content)} 字</Badge>
                            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(selectedMaterial.content)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-2">{selectedMaterial.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                              <Badge variant="outline">{selectedMaterial.source}</Badge>
                              <span>•</span>
                              <span>{selectedMaterial.author}</span>
                              <span>•</span>
                              <span>{new Date(selectedMaterial.publishTime).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <ScrollArea className="h-96">
                            <div className="pr-4">
                              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                {selectedMaterial.content}
                              </p>
                            </div>
                          </ScrollArea>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Rewritten Content */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Zap className="h-5 w-5" />
                            改写结果
                          </span>
                          {rewriteResult && (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{getWordCount(rewriteResult.content)} 字</Badge>
                              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(rewriteResult.content)}>
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {rewriteResult ? (
                          <div className="space-y-4">
                            <div>
                              <h3 className="font-semibold text-gray-900 mb-2">{rewriteResult.title}</h3>
                              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                                <Badge className="bg-green-100 text-green-800">
                                  {rewriteStyles[selectedStyle as keyof typeof rewriteStyles]?.name}
                                </Badge>
                                <span>•</span>
                                <span>刚刚改写</span>
                              </div>
                            </div>
                            <ScrollArea className="h-96">
                              <div className="pr-4">
                                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                  {rewriteResult.content}
                                </p>
                              </div>
                            </ScrollArea>
                            <div className="flex gap-2 pt-4 border-t">
                              <Button onClick={handleSaveRewrite} className="flex-1">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                保存改写结果
                              </Button>
                              <Button variant="outline" onClick={handleRewrite}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                重新改写
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-96">
                            <div className="text-center">
                              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Wand2 className="h-8 w-8 text-gray-400" />
                              </div>
                              <h3 className="text-lg font-medium text-gray-900 mb-2">等待改写</h3>
                              <p className="text-gray-500">点击"开始改写"按钮生成AI改写内容</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="compare" className="space-y-6">
                  {rewriteResult ? (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5" />
                          改写对比分析
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">
                              {getWordCount(selectedMaterial.content)}
                            </div>
                            <div className="text-sm text-blue-600">原文字数</div>
                          </div>
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">
                              {getWordCount(rewriteResult.content)}
                            </div>
                            <div className="text-sm text-green-600">改写字数</div>
                          </div>
                          <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">
                              {Math.round(
                                ((getWordCount(rewriteResult.content) - getWordCount(selectedMaterial.content)) /
                                  getWordCount(selectedMaterial.content)) *
                                  100,
                              )}
                              %
                            </div>
                            <div className="text-sm text-purple-600">变化幅度</div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">标题对比</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="p-3 bg-gray-50 rounded-lg">
                                <div className="text-xs text-gray-500 mb-1">原标题</div>
                                <div className="text-sm">{selectedMaterial.title}</div>
                              </div>
                              <div className="p-3 bg-green-50 rounded-lg">
                                <div className="text-xs text-green-600 mb-1">改写标题</div>
                                <div className="text-sm">{rewriteResult.title}</div>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">内容预览对比</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="p-3 bg-gray-50 rounded-lg">
                                <div className="text-xs text-gray-500 mb-1">原文内容</div>
                                <div className="text-sm line-clamp-4">{selectedMaterial.content}</div>
                              </div>
                              <div className="p-3 bg-green-50 rounded-lg">
                                <div className="text-xs text-green-600 mb-1">改写内容</div>
                                <div className="text-sm line-clamp-4">{rewriteResult.content}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="flex items-center justify-center h-64">
                        <div className="text-center">
                          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无对比数据</h3>
                          <p className="text-gray-500">完成改写后可查看详细对比分析</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Zap className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">选择素材开始改写</h3>
                    <p className="text-gray-500">从左侧选择一个待改写的素材</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
