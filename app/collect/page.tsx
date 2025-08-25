"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { 
  Download, Search, Play, RefreshCw, CheckCircle, Eye, Heart, Calendar, 
  User, Tag, AlertCircle, Loader2, X, History, TrendingUp, Plus, 
  Settings, Edit, Trash2, Database, Filter, ArrowRight
} from "lucide-react"
import { collectApi, handleApiResponse } from "@/lib/api"
import { toast } from "sonner"
import type { CollectSource, CollectResult, CollectBatch } from "@/src/types"

export default function CollectPage() {
  // 基础状态
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // 采集源管理
  const [collectSources, setCollectSources] = useState<CollectSource[]>([])
  const [selectedSources, setSelectedSources] = useState<string[]>([])
  const [showSourceDialog, setShowSourceDialog] = useState(false)
  const [editingSource, setEditingSource] = useState<CollectSource | null>(null)
  
  // 采集配置
  const [collectType, setCollectType] = useState<'keyword' | 'full'>('full')
  const [keyword, setKeyword] = useState("")
  const [collectName, setCollectName] = useState("")
  
  // 采集结果
  const [currentBatch, setCurrentBatch] = useState<CollectBatch | null>(null)
  const [collectResults, setCollectResults] = useState<CollectResult[]>([])
  const [selectedResults, setSelectedResults] = useState<string[]>([])
  
  // 标签页状态
  const [activeTab, setActiveTab] = useState<string>("config")
  
  // 新建/编辑采集源的表单状态
  const [sourceForm, setSourceForm] = useState({
    name: "",
    platform: "",
    hashId: "",
    category: "",
    description: ""
  })

  // 加载采集源列表
  const loadCollectSources = async () => {
    try {
      setLoading(true)
      const response = await collectApi.getSources({ isActive: true })
      const sources = handleApiResponse(response)
      setCollectSources(sources)
    } catch (error: any) {
      setError(error.message)
      toast.error("加载采集源失败: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  // 新建采集源
  const createCollectSource = async () => {
    try {
      if (!sourceForm.name || !sourceForm.platform || !sourceForm.hashId) {
        toast.error("请填写所有必需字段")
        return
      }

      setLoading(true)
      const response = await collectApi.createSource({
        name: sourceForm.name.trim(),
        platform: sourceForm.platform.trim(),
        hashId: sourceForm.hashId.trim(),
        category: sourceForm.category.trim() || "",
        description: sourceForm.description.trim() || "",
        userCreated: true,
        isActive: true,
        config: {}
      })
      
      handleApiResponse(response)
      toast.success("采集源创建成功")
      setShowSourceDialog(false)
      setSourceForm({ name: "", platform: "", hashId: "", category: "", description: "" })
      loadCollectSources()
      
    } catch (error: any) {
      toast.error("创建采集源失败: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  // 删除采集源
  const deleteCollectSource = async (source: CollectSource) => {
    console.log('🗑️ 删除采集源:', source)
    
    try {
      setLoading(true)
      
      // 先尝试普通删除，如果有关联数据会返回错误
      const response = await collectApi.deleteSource(source.id)
      
      const result = handleApiResponse(response)
      console.log('✅ 删除响应:', result)
      toast.success("采集源删除成功")
      
      // 重新加载采集源列表
      await loadCollectSources()
      
    } catch (error: any) {
      console.error('❌ 删除采集源失败:', error)
      console.log('错误详细信息:', {
        message: error.message,
        status: error.status,
        details: error.details,
        detailsCode: error.details?.code,
        hasRelatedData: error.details?.code === 'HAS_RELATED_DATA'
      })
      
      // 检查是否是有关联数据的错误 - 支持多种错误格式
      const isRelatedDataError = 
        error.details?.code === 'HAS_RELATED_DATA' ||
        (error.status === 409 && error.details?.details) ||
        error.message?.includes('关联数据')
      
      if (isRelatedDataError) {
        console.log('🔍 检测到关联数据错误，准备显示确认对话框')
        
        // 尝试从不同的路径获取详细信息
        const details = error.details?.details || error.details || {}
        
        // 构造详细的提示信息
        let message = `采集源"${source.name}"有关联数据，无法直接删除：\n\n`
        
        // 安全地访问计数信息
        const resultsCount = details.resultsCount || 0
        const batchesCount = details.batchesCount || 0
        
        if (resultsCount > 0) {
          message += `• 采集结果：${resultsCount} 条\n`
        }
        if (batchesCount > 0) {
          message += `• 采集批次：${batchesCount} 个\n`
        }
        
        // 如果没有具体数量信息，显示通用提示
        if (resultsCount === 0 && batchesCount === 0) {
          message += `• 存在关联的采集记录\n`
        }
        
        message += `\n删除此采集源将同时删除所有相关数据，此操作不可恢复。\n\n是否继续删除？`
        
        // 为系统预设采集源提供额外警告
        if (!source.userCreated) {
          message += `\n⚠️ 注意：这是系统预设的采集源，删除后需要手动重新添加。`
        }
        
        console.log('💬 显示确认对话框:', message)
        
        if (confirm(message)) {
          try {
            setLoading(true)
            console.log('🔄 用户确认，执行级联删除...')
            
            // 执行级联删除
            const cascadeResponse = await collectApi.deleteSource(source.id, { cascade: true })
            handleApiResponse(cascadeResponse)
            
            console.log('✅ 级联删除成功')
            toast.success("采集源及相关数据删除成功")
            
            // 重新加载采集源列表
            await loadCollectSources()
            
          } catch (cascadeError: any) {
            console.error('❌ 级联删除失败:', cascadeError)
            toast.error("删除失败: " + cascadeError.message)
          }
        } else {
          console.log('❌ 用户取消删除')
        }
      } else {
        // 其他类型的错误
        console.log('❌ 其他类型错误，显示通用错误信息')
        toast.error("删除采集源失败: " + error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  // 执行采集任务
  const executeCollect = async () => {
    if (selectedSources.length === 0) {
      toast.error("请选择至少一个采集源")
      return
    }
    
    if (collectType === 'keyword' && !keyword.trim()) {
      toast.error("关键词采集时必须输入关键词")
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const taskName = collectName.trim() || 
        `${collectType === 'keyword' ? '关键词' : '一键'}采集任务_${new Date().toLocaleString()}`
      
      const response = await collectApi.execute({
        sourceIds: selectedSources,
        collectType,
        keyword: collectType === 'keyword' ? keyword.trim() : undefined,
        name: taskName,
        description: collectType === 'keyword' ? `关键词：${keyword}` : '一键采集全部内容',
        limit: 20
      })
      
      const result = handleApiResponse(response)
      
      if (result.success) {
        toast.success(`采集完成！成功采集 ${result.collected} 篇文章`)
        setCurrentBatch({ 
          id: result.batchId,
          name: taskName,
          description: '',
          collectType,
          keyword: collectType === 'keyword' ? keyword : '',
          sourceIds: selectedSources,
          totalCount: result.total,
          successCount: result.collected,
          errorCount: result.failed,
          status: 'completed',
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        })
        setCollectResults(result.results)
        setActiveTab("results")
      } else {
        throw new Error("采集任务执行失败")
      }
      
    } catch (error: any) {
      setError(error.message)
      toast.error("采集任务失败: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  // 切换采集结果选中状态
  const toggleResultSelection = (resultId: string) => {
    setSelectedResults(prev => 
      prev.includes(resultId)
        ? prev.filter(id => id !== resultId)
        : [...prev, resultId]
    )
  }

  // 全选/取消全选采集结果
  const toggleSelectAll = () => {
    if (selectedResults.length === collectResults.length) {
      setSelectedResults([])
    } else {
      setSelectedResults(collectResults.map(r => r.id))
    }
  }

  // 添加到素材库
  const addToMaterials = async () => {
    if (selectedResults.length === 0) {
      toast.error("请选择要添加的采集结果")
      return
    }

    try {
      setLoading(true)
      const response = await collectApi.addToMaterials(selectedResults)
      const result = handleApiResponse(response)
      
      let message = `成功添加 ${result.added} 条到素材库`
      if (result.skipped > 0) {
        message += `，跳过 ${result.skipped} 条重复内容`
      }
      
      toast.success(message)
      setSelectedResults([])
      
      // 重新加载采集结果以更新状态
      if (currentBatch) {
        loadCollectResults(currentBatch.id)
      }
      
    } catch (error: any) {
      toast.error("添加到素材库失败: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  // 加载采集结果
  const loadCollectResults = async (batchId: string) => {
    try {
      setLoading(true)
      const response = await collectApi.getResults({ batchId, limit: 100 })
      const results = handleApiResponse(response)
      setCollectResults(results)
    } catch (error: any) {
      toast.error("加载采集结果失败: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  // 切换采集源选中状态
  const toggleSourceSelection = (sourceId: string) => {
    console.log('toggleSourceSelection called with:', sourceId)
    setSelectedSources(prev => {
      const newSelection = prev.includes(sourceId)
        ? prev.filter(id => id !== sourceId)
        : [...prev, sourceId]
      console.log('selectedSources updated:', newSelection)
      return newSelection
    })
  }

  // 初始加载
  useEffect(() => {
    loadCollectSources()
  }, [])

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">内容采集</h1>
          <p className="text-gray-600">配置采集来源，选择采集方式，一键获取热门内容素材</p>
        </div>

        {/* Error Alert */}
        {error && (
          <Card className="mb-6 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">操作失败</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setError(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-red-600 text-sm mt-2">{error}</p>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              配置采集
            </TabsTrigger>
            <TabsTrigger value="sources" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              管理采集源
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              采集结果
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              采集历史
            </TabsTrigger>
          </TabsList>

          {/* 配置采集 */}
          <TabsContent value="config" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 采集源选择 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    选择采集源
                  </CardTitle>
                  <CardDescription>勾选需要采集数据的来源</CardDescription>
                </CardHeader>
                <CardContent>
                  {collectSources.length > 0 ? (
                    <div className="space-y-3">
                      {collectSources.map((source) => (
                        <div
                          key={source.id}
                          className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => toggleSourceSelection(source.id)}
                        >
                          <Checkbox
                            checked={selectedSources.includes(source.id)}
                            onCheckedChange={() => {
                              // 不处理，让父容器的onClick处理
                            }}
                            onClick={(e) => {
                              // 阻止事件冒泡到父容器
                              e.stopPropagation()
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{source.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {source.platform}
                              </Badge>
                              {source.category && (
                                <Badge variant="secondary" className="text-xs">
                                  {source.category}
                                </Badge>
                              )}
                            </div>
                            {source.description && (
                              <p className="text-xs text-gray-500 line-clamp-1">
                                {source.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {selectedSources.length > 0 && (
                        <div className="pt-3 border-t">
                          <p className="text-sm text-blue-600 font-medium">
                            已选择 {selectedSources.length} 个采集源
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Database className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>暂无可用采集源</p>
                      <Button 
                        variant="link" 
                        className="mt-2"
                        onClick={() => setActiveTab("sources")}
                      >
                        去添加采集源
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 采集方式配置 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    采集方式
                  </CardTitle>
                  <CardDescription>选择采集模式和配置参数</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 采集方式选择 */}
                  <div>
                    <Label className="text-sm font-medium mb-3 block">采集模式</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          collectType === 'full'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setCollectType('full')}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-3 h-3 rounded-full ${
                            collectType === 'full' ? 'bg-blue-500' : 'bg-gray-300'
                          }`} />
                          <span className="font-medium text-sm">一键采集</span>
                        </div>
                        <p className="text-xs text-gray-500">
                          直接获取热榜全部内容
                        </p>
                      </div>
                      
                      <div
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          collectType === 'keyword'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setCollectType('keyword')}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-3 h-3 rounded-full ${
                            collectType === 'keyword' ? 'bg-blue-500' : 'bg-gray-300'
                          }`} />
                          <span className="font-medium text-sm">关键词采集</span>
                        </div>
                        <p className="text-xs text-gray-500">
                          根据关键词筛选内容
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 关键词输入 */}
                  {collectType === 'keyword' && (
                    <div>
                      <Label htmlFor="keyword" className="text-sm font-medium">
                        采集关键词
                      </Label>
                      <Input
                        id="keyword"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder="输入要搜索的关键词"
                        className="mt-2"
                      />
                    </div>
                  )}

                  {/* 任务名称 */}
                  <div>
                    <Label htmlFor="collectName" className="text-sm font-medium">
                      任务名称 <span className="text-gray-400">(可选)</span>
                    </Label>
                    <Input
                      id="collectName"
                      value={collectName}
                      onChange={(e) => setCollectName(e.target.value)}
                      placeholder="为这次采集任务命名"
                      className="mt-2"
                    />
                  </div>

                  {/* 开始采集按钮 */}
                  <div className="pt-4 border-t">
                    <Button
                      onClick={executeCollect}
                      disabled={loading || selectedSources.length === 0}
                      className="w-full"
                      size="lg"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          采集中...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          开始采集
                        </>
                      )}
                    </Button>
                    
                    {selectedSources.length === 0 && (
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        请先选择采集源
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 管理采集源 */}
          <TabsContent value="sources" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      采集源管理
                    </CardTitle>
                    <CardDescription>管理和配置内容采集源</CardDescription>
                  </div>
                  <Dialog open={showSourceDialog} onOpenChange={setShowSourceDialog}>
                    <DialogTrigger asChild>
                      <Button className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        添加采集源
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>添加新的采集源</DialogTitle>
                        <DialogDescription>
                          填写采集源的基本信息，HashId可在今日热榜官网获取
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="sourceName">名称*</Label>
                          <Input
                            id="sourceName"
                            value={sourceForm.name}
                            onChange={(e) => setSourceForm(prev => ({...prev, name: e.target.value}))}
                            placeholder="采集源名称"
                          />
                        </div>
                        <div>
                          <Label htmlFor="sourcePlatform">平台*</Label>
                          <Input
                            id="sourcePlatform"
                            value={sourceForm.platform}
                            onChange={(e) => setSourceForm(prev => ({...prev, platform: e.target.value}))}
                            placeholder="如：微信、知乎、微博"
                          />
                        </div>
                        <div>
                          <Label htmlFor="sourceHashId">HashId*</Label>
                          <Input
                            id="sourceHashId"
                            value={sourceForm.hashId}
                            onChange={(e) => setSourceForm(prev => ({...prev, hashId: e.target.value}))}
                            placeholder="10位字母数字组合"
                          />
                        </div>
                        <div>
                          <Label htmlFor="sourceCategory">分类</Label>
                          <Input
                            id="sourceCategory"
                            value={sourceForm.category}
                            onChange={(e) => setSourceForm(prev => ({...prev, category: e.target.value}))}
                            placeholder="如：社交媒体、知识社区"
                          />
                        </div>
                        <div>
                          <Label htmlFor="sourceDescription">描述</Label>
                          <Textarea
                            id="sourceDescription"
                            value={sourceForm.description}
                            onChange={(e) => setSourceForm(prev => ({...prev, description: e.target.value}))}
                            placeholder="采集源的详细描述"
                            rows={3}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSourceDialog(false)}>
                          取消
                        </Button>
                        <Button onClick={createCollectSource} disabled={loading}>
                          {loading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              创建中...
                            </>
                          ) : (
                            "创建采集源"
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {collectSources.length > 0 ? (
                  <div className="space-y-3">
                    {collectSources.map((source) => (
                      <div
                        key={source.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-900">{source.name}</h3>
                            <Badge variant="outline">{source.platform}</Badge>
                            {source.category && (
                              <Badge variant="secondary">{source.category}</Badge>
                            )}
                            {!source.userCreated && (
                              <Badge variant="default" className="bg-green-100 text-green-700">
                                系统预设
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            HashId: <code className="text-xs bg-gray-100 px-1 rounded">{source.hashId}</code>
                          </p>
                          {source.description && (
                            <p className="text-sm text-gray-500 line-clamp-1">
                              {source.description}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteCollectSource(source)}
                            disabled={loading}
                            className={`${
                              source.userCreated 
                                ? 'text-red-600 hover:text-red-700 hover:bg-red-50' 
                                : 'text-orange-600 hover:text-orange-700 hover:bg-orange-50'
                            }`}
                            title={source.userCreated ? '删除采集源' : '删除系统预设采集源'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          {!source.userCreated && (
                            <span className="text-xs text-orange-500 font-medium">系统预设</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Database className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">暂无采集源</h3>
                    <p className="text-gray-500 mb-4">点击右上角按钮添加第一个采集源</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 采集结果 */}
          <TabsContent value="results" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      采集结果
                    </CardTitle>
                    <CardDescription>
                      {collectResults.length > 0
                        ? `共采集到 ${collectResults.length} 条内容，已选择 ${selectedResults.length} 条`
                        : "暂无采集结果，请先执行采集任务"}
                    </CardDescription>
                  </div>
                  
                  {collectResults.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleSelectAll}
                      >
                        {selectedResults.length === collectResults.length ? "取消全选" : "全选"}
                      </Button>
                      {selectedResults.length > 0 && (
                        <Button
                          onClick={addToMaterials}
                          disabled={loading}
                          className="flex items-center gap-2"
                        >
                          {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                          添加到素材库 ({selectedResults.length})
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {/* 批次信息 */}
                {currentBatch && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-blue-900">{currentBatch.name}</h3>
                      <Badge variant="outline" className="bg-white">
                        {currentBatch.collectType === 'keyword' ? '关键词采集' : '一键采集'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{currentBatch.totalCount}</div>
                        <div className="text-sm text-blue-600">总计</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{currentBatch.successCount}</div>
                        <div className="text-sm text-green-600">成功</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{currentBatch.errorCount}</div>
                        <div className="text-sm text-red-600">失败</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 采集结果列表 */}
                {collectResults.length > 0 ? (
                  <div className="space-y-4">
                    {collectResults.map((result) => (
                      <div
                        key={result.id}
                        className={`border rounded-lg p-4 transition-all ${
                          selectedResults.includes(result.id)
                            ? "border-blue-200 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedResults.includes(result.id)}
                            onCheckedChange={() => toggleResultSelection(result.id)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1 pr-3">
                                {result.title}
                              </h3>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{result.source}</Badge>
                                {result.addedToMaterials && (
                                  <Badge className="bg-green-100 text-green-700">已添加</Badge>
                                )}
                              </div>
                            </div>

                            {result.content && (
                              <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                                {result.content}
                              </p>
                            )}

                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <div className="flex items-center gap-4">
                                {result.author && (
                                  <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {result.author}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(result.collectTime).toLocaleDateString()}
                                </span>
                                {result.keyword && (
                                  <span className="flex items-center gap-1">
                                    <Tag className="h-3 w-3" />
                                    {result.keyword}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  {(result.readCount || 0).toLocaleString()} 热度
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : currentBatch ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">采集结果为空</h3>
                    <p className="text-gray-500">本次采集任务未获取到有效内容</p>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Eye className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">暂无采集结果</h3>
                    <p className="text-gray-500 mb-4">请先执行采集任务</p>
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("config")}
                      className="flex items-center gap-2"
                    >
                      去配置采集
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 采集历史 */}
          <TabsContent value="history" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  采集历史
                </CardTitle>
                <CardDescription>查看历史采集记录和统计信息</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <History className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">功能开发中</h3>
                  <p className="text-gray-500">采集历史功能即将上线</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}