"use client"

import { useState, useEffect, useCallback } from "react"
import { useApp } from "@/src/contexts/AppContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import {
  FileText,
  Zap,
  BarChart3,
  History,
  Settings,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  Users,
  Loader2
} from "lucide-react"

// 导入改写组件
import SegmentPreviewCard, { SegmentData } from "@/src/components/rewrite/SegmentPreviewCard"
import RewriteProgressBar, { ProgressData } from "@/src/components/rewrite/RewriteProgressBar"
import QualityScoreDisplay, { QualityScores } from "@/src/components/rewrite/QualityScoreDisplay"
import StyleSelector from "@/src/components/rewrite/StyleSelector"
import RewriteComparison, { ComparisonData } from "@/src/components/rewrite/RewriteComparison"

// 导入API
import { rewriteApi } from "@/lib/api"
import type { Article } from "@/src/types"
import type { RewriteStyle, SegmentStrategy } from "@/src/types/rewrite"

export default function RewritePage() {
  const { materials, loading: appLoading } = useApp()

  // 状态管理
  const [selectedMaterial, setSelectedMaterial] = useState<Article | null>(null)
  const [selectedStyle, setSelectedStyle] = useState<RewriteStyle>('lidan')
  const [customPrompt, setCustomPrompt] = useState("")
  const [styleIntensity, setStyleIntensity] = useState(70)
  const [segmentationModel, setSegmentationModel] = useState('openai/gpt-3.5-turbo')
  const [rewriteModel, setRewriteModel] = useState('openai/gpt-3.5-turbo')
  const [activeTab, setActiveTab] = useState("setup")

  // 改写流程状态
  const [segments, setSegments] = useState<SegmentData[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isRewriting, setIsRewriting] = useState(false)
  const [currentProgress, setCurrentProgress] = useState<ProgressData | null>(null)
  const [qualityScores, setQualityScores] = useState<QualityScores | null>(null)
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null)

  // 批量改写状态
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([])
  const [batchMode, setBatchMode] = useState(false)

  // 获取待改写素材
  const pendingMaterials = materials.filter((m) => m.status === "pending")

  // 自动选择第一个素材
  useEffect(() => {
    if (!selectedMaterial && pendingMaterials.length > 0 && !batchMode) {
      setSelectedMaterial(pendingMaterials[0])
    }
  }, [selectedMaterial, pendingMaterials, batchMode])

  // 文章分段分析
  const handleAnalyzeSegments = useCallback(async () => {
    if (!selectedMaterial) return

    setIsAnalyzing(true)
    setCurrentProgress({
      totalSegments: 0,
      completedSegments: 0,
      failedSegments: 0,
      estimatedTimeRemaining: 0,
      status: 'analyzing'
    })

    try {
      const response = await rewriteApi.analyzeSegments({
        articleId: selectedMaterial.id,
        content: selectedMaterial.content,
        segmentStrategy: 'ai' as SegmentStrategy,
        maxSegmentLength: 1500,
        minSegmentLength: 500,
        aiModel: segmentationModel
      })

      if (response.success) {
        const segmentData: SegmentData[] = response.data.segments.map((seg, index) => ({
          id: seg.id,
          order: index + 1,
          originalContent: seg.originalContent,
          wordCount: seg.wordCount,
          rewriteStatus: 'pending'
        }))

        setSegments(segmentData)
        setCurrentProgress(prev => ({
          ...prev!,
          totalSegments: segmentData.length,
          status: 'completed'
        }))
        setActiveTab('segments')
      }
    } catch (error) {
      console.error('分段分析失败:', error)
      setCurrentProgress(prev => prev ? { ...prev, status: 'failed' } : null)
    } finally {
      setIsAnalyzing(false)
    }
  }, [selectedMaterial, segmentationModel])

  // 开始改写
  const handleStartRewrite = useCallback(async () => {
    if (!selectedMaterial || segments.length === 0) return

    setIsRewriting(true)
    setCurrentProgress({
      totalSegments: segments.length,
      completedSegments: 0,
      failedSegments: 0,
      estimatedTimeRemaining: segments.length * 15, // 估计每段15秒
      status: 'rewriting',
      processingTime: 0
    })

    const startTime = Date.now()

    try {
      // 准备改写请求
      const segmentsToRewrite = segments.map(seg => ({
        id: seg.id,
        content: seg.originalContent,
        order: seg.order
      }))

      const response = await rewriteApi.rewriteSegments({
        articleId: selectedMaterial.id,
        segments: segmentsToRewrite,
        style: selectedStyle,
        customPrompt: customPrompt || undefined,
        batchSize: 3,
        aiModel: rewriteModel
      })

      if (response.success) {
        const rewrittenSegments: SegmentData[] = response.data.segments.map(seg => {
          const originalSeg = segments.find(s => s.id === seg.id)
          return {
            ...originalSeg!,
            rewrittenContent: seg.rewrittenContent,
            rewriteStatus: 'completed' as const,
            qualityScore: seg.qualityScore,
            processingTime: seg.processingTime
          }
        })

        setSegments(rewrittenSegments)
        setQualityScores(response.data.overallQuality)

        // 整合段落
        await handleIntegrateSegments(rewrittenSegments)
      }
    } catch (error) {
      console.error('改写失败:', error)
      setCurrentProgress(prev => prev ? { ...prev, status: 'failed' } : null)
    } finally {
      setIsRewriting(false)
      const processingTime = Date.now() - startTime
      setCurrentProgress(prev => prev ? { ...prev, processingTime } : null)
    }
  }, [selectedMaterial, segments, selectedStyle, customPrompt, rewriteModel])

  // 整合段落
  const handleIntegrateSegments = useCallback(async (rewrittenSegments: SegmentData[]) => {
    if (!selectedMaterial) return

    setCurrentProgress(prev => prev ? { ...prev, status: 'integrating' } : null)

    try {
      const response = await rewriteApi.integrateSegments({
        articleId: selectedMaterial.id,
        rewrittenSegments: rewrittenSegments.map(seg => ({
          id: seg.id,
          rewrittenContent: seg.rewrittenContent || seg.originalContent,
          order: seg.order
        })),
        optimizeTransitions: true
      })

      if (response.success && response.data) {
        console.log('✅ 段落整合成功，创建对比数据');
        console.log('整合后内容长度:', response.data.integratedContent.length);
        
        // 创建对比数据
        const comparison: ComparisonData = {
          originalTitle: selectedMaterial.title,
          rewrittenTitle: response.data.title || `${selectedMaterial.title}（改写版）`,
          originalContent: selectedMaterial.content,
          rewrittenContent: response.data.integratedContent,
          style: selectedStyle,
          qualityScore: response.data.qualityScore,
          statistics: {
            originalWordCount: selectedMaterial.content.length,
            rewrittenWordCount: response.data.integratedContent.length,
            changePercentage: ((response.data.integratedContent.length - selectedMaterial.content.length) / selectedMaterial.content.length) * 100,
            sentenceCount: {
              original: selectedMaterial.content.split(/[。！？]/).filter(s => s.trim().length > 0).length,
              rewritten: response.data.integratedContent.split(/[。！？]/).filter(s => s.trim().length > 0).length
            },
            paragraphCount: {
              original: selectedMaterial.content.split(/\n\s*\n/).filter(p => p.trim().length > 0).length,
              rewritten: response.data.integratedContent.split(/\n\s*\n/).filter(p => p.trim().length > 0).length
            }
          }
        }

        console.log('对比数据已创建:', comparison);
        setComparisonData(comparison)
        setCurrentProgress(prev => prev ? { ...prev, status: 'completed' } : null)
        setActiveTab('comparison')
      }
    } catch (error) {
      console.error('段落整合失败:', error)
      setCurrentProgress(prev => prev ? { ...prev, status: 'failed' } : null)
    }
  }, [selectedMaterial, selectedStyle])

  // 批量选择处理
  const handleSelectMaterial = (materialId: string) => {
    setSelectedMaterials(prev => 
      prev.includes(materialId) 
        ? prev.filter(id => id !== materialId)
        : [...prev, materialId]
    )
  }

  const handleSelectAll = () => {
    if (selectedMaterials.length === pendingMaterials.length) {
      setSelectedMaterials([])
    } else {
      setSelectedMaterials(pendingMaterials.map(m => m.id))
    }
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI智能改写</h1>
          <p className="text-gray-600">使用分段式AI改写，结合李诞风格，提升内容质量和表达效果</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* 素材选择侧边栏 */}
          <div className="xl:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  素材选择
                </CardTitle>
                <CardDescription>
                  {batchMode ? '批量改写模式' : '选择单篇文章改写'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* 模式切换 */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant={!batchMode ? "default" : "outline"}
                      size="sm"
                      onClick={() => {setBatchMode(false); setSelectedMaterials([])}}
                    >
                      单篇改写
                    </Button>
                    <Button
                      variant={batchMode ? "default" : "outline"}
                      size="sm"
                      onClick={() => setBatchMode(true)}
                    >
                      <Users className="h-4 w-4 mr-1" />
                      批量改写
                    </Button>
                  </div>

                  {batchMode && selectedMaterials.length > 0 && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">
                        已选择 {selectedMaterials.length} 篇文章
                      </p>
                      <Button size="sm" className="mt-2 w-full">
                        开始批量改写
                      </Button>
                    </div>
                  )}

                  {/* 全选按钮 */}
                  {batchMode && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="select-all"
                        checked={selectedMaterials.length === pendingMaterials.length}
                        onCheckedChange={handleSelectAll}
                      />
                      <label htmlFor="select-all" className="text-sm">
                        全选 ({pendingMaterials.length} 篇)
                      </label>
                    </div>
                  )}

                  {/* 素材列表 */}
                  <ScrollArea className="h-96">
                    <div className="space-y-2">
                      {pendingMaterials.length > 0 ? (
                        pendingMaterials.map((material) => (
                          <div
                            key={material.id}
                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                              batchMode 
                                ? selectedMaterials.includes(material.id)
                                  ? "border-blue-200 bg-blue-50"
                                  : "border-gray-200 hover:border-gray-300"
                                : selectedMaterial?.id === material.id
                                  ? "border-blue-200 bg-blue-50"
                                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                            onClick={() => {
                              if (batchMode) {
                                handleSelectMaterial(material.id)
                              } else {
                                setSelectedMaterial(material)
                                setActiveTab('setup') // 重置到设置页面
                                setSegments([]) // 清空之前的分段
                                setComparisonData(null) // 清空对比数据
                              }
                            }}
                          >
                            <div className="flex items-start gap-2">
                              {batchMode && (
                                <Checkbox
                                  checked={selectedMaterials.includes(material.id)}
                                  onChange={() => {}} // 由父组件的onClick处理
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-sm line-clamp-2 mb-2">
                                  {material.title}
                                </h3>
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                  <Badge variant="outline" className="text-xs">
                                    {material.source}
                                  </Badge>
                                  <span>{material.content.length} 字</span>
                                </div>
                              </div>
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
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 主要改写界面 */}
          <div className="xl:col-span-3">
            {selectedMaterial && !batchMode ? (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="setup" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    改写设置
                  </TabsTrigger>
                  <TabsTrigger value="segments" className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    分段改写
                  </TabsTrigger>
                  <TabsTrigger value="comparison" className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    对比预览
                  </TabsTrigger>
                  <TabsTrigger value="history" className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    改写历史
                  </TabsTrigger>
                </TabsList>

                {/* 改写设置 */}
                <TabsContent value="setup" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>当前素材</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-lg">{selectedMaterial.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                            <Badge variant="outline">{selectedMaterial.source}</Badge>
                            <span>•</span>
                            <span>{selectedMaterial.author}</span>
                            <span>•</span>
                            <span>{selectedMaterial.content.length} 字</span>
                          </div>
                        </div>
                        <ScrollArea className="h-32">
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {selectedMaterial.content.slice(0, 300)}
                            {selectedMaterial.content.length > 300 && '...'}
                          </p>
                        </ScrollArea>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 风格选择器 */}
                  <StyleSelector
                    selectedStyle={selectedStyle}
                    customPrompt={customPrompt}
                    styleIntensity={styleIntensity}
                    segmentationModel={segmentationModel}
                    rewriteModel={rewriteModel}
                    onStyleChange={setSelectedStyle}
                    onCustomPromptChange={setCustomPrompt}
                    onStyleIntensityChange={setStyleIntensity}
                    onSegmentationModelChange={setSegmentationModel}
                    onRewriteModelChange={setRewriteModel}
                    disabled={isAnalyzing || isRewriting}
                  />

                  {/* 开始分析按钮 */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold mb-2">准备开始改写</h3>
                          <p className="text-sm text-gray-600">
                            将使用 <strong>{selectedStyle === 'lidan' ? '李诞风格' : selectedStyle}</strong> 和 <strong>{rewriteModel}</strong> 进行AI智能改写
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            分段模型：{segmentationModel}
                          </p>
                        </div>
                        
                        <Button
                          size="lg"
                          onClick={handleAnalyzeSegments}
                          disabled={isAnalyzing || isRewriting}
                          className="w-full max-w-md"
                        >
                          {isAnalyzing ? (
                            <>
                              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                              AI智能分段中...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-5 w-5 mr-2" />
                              开始AI智能分段
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* 分段改写 */}
                <TabsContent value="segments" className="space-y-6">
                  {/* 进度显示 */}
                  {currentProgress && (
                    <RewriteProgressBar 
                      progress={currentProgress}
                      articleTitle={selectedMaterial.title}
                    />
                  )}

                  {/* 改写控制 */}
                  {segments.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>分段改写控制</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              共 {segments.length} 个段落
                            </Badge>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4">
                          <Button
                            onClick={handleStartRewrite}
                            disabled={isRewriting || segments.every(s => s.rewriteStatus === 'completed')}
                            className="flex items-center gap-2"
                          >
                            {isRewriting ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                改写中...
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4" />
                                开始改写
                              </>
                            )}
                          </Button>

                          <Button
                            variant="outline"
                            onClick={() => {
                              setSegments(segments.map(s => ({ ...s, rewriteStatus: 'pending' })))
                              setComparisonData(null)
                            }}
                            disabled={isRewriting}
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            重置
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* 段落列表 */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {segments.map((segment) => (
                      <SegmentPreviewCard
                        key={segment.id}
                        segment={segment}
                        showRewritten={true}
                        onRewrite={(id) => {
                          // 单独改写某个段落的逻辑
                          console.log('Rewrite segment:', id)
                        }}
                      />
                    ))}
                  </div>

                  {/* 质量评分 */}
                  {qualityScores && (
                    <QualityScoreDisplay scores={qualityScores} />
                  )}
                </TabsContent>

                {/* 对比预览 */}
                <TabsContent value="comparison" className="space-y-6">
                  {comparisonData ? (
                    <RewriteComparison data={comparisonData} />
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

                {/* 改写历史 */}
                <TabsContent value="history" className="space-y-6">
                  <Card>
                    <CardContent className="flex items-center justify-center h-64">
                      <div className="text-center">
                        <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">改写历史功能开发中</h3>
                        <p className="text-gray-500">即将支持查看历史改写记录和版本对比</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Zap className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {batchMode ? '准备批量改写' : '选择素材开始改写'}
                    </h3>
                    <p className="text-gray-500">
                      {batchMode 
                        ? `已选择 ${selectedMaterials.length} 篇文章，点击开始批量改写`
                        : '从左侧选择一个待改写的素材'
                      }
                    </p>
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