"use client"

import React, { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  FileText,
  Zap,
  Copy,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Equal,
  Eye,
  Users,
  Clock,
  Award
} from "lucide-react"

export interface ComparisonData {
  originalTitle: string
  rewrittenTitle: string
  originalContent: string
  rewrittenContent: string
  style: string
  qualityScore?: number
  processingTime?: number
  statistics: {
    originalWordCount: number
    rewrittenWordCount: number
    changePercentage: number
    sentenceCount: {
      original: number
      rewritten: number
    }
    paragraphCount: {
      original: number
      rewritten: number
    }
  }
}

interface RewriteComparisonProps {
  data: ComparisonData
  showStatistics?: boolean
  onCopyOriginal?: () => void
  onCopyRewritten?: () => void
}

const getChangeIcon = (percentage: number) => {
  if (percentage > 10) return { icon: TrendingUp, color: "text-green-600" }
  if (percentage < -10) return { icon: TrendingDown, color: "text-red-600" }
  return { icon: Equal, color: "text-gray-600" }
}

const getChangeColor = (percentage: number) => {
  if (percentage > 0) return "text-green-600"
  if (percentage < 0) return "text-red-600"
  return "text-gray-600"
}

export default function RewriteComparison({
  data,
  showStatistics = true,
  onCopyOriginal,
  onCopyRewritten
}: RewriteComparisonProps) {
  const [viewMode, setViewMode] = useState<'side-by-side' | 'single'>('side-by-side')
  
  const stats = useMemo(() => {
    const wordCountChange = data.statistics.rewrittenWordCount - data.statistics.originalWordCount
    const wordCountPercentage = ((wordCountChange / data.statistics.originalWordCount) * 100)
    
    const sentenceChange = data.statistics.sentenceCount.rewritten - data.statistics.sentenceCount.original
    const sentencePercentage = ((sentenceChange / data.statistics.sentenceCount.original) * 100)
    
    const paragraphChange = data.statistics.paragraphCount.rewritten - data.statistics.paragraphCount.original
    const paragraphPercentage = paragraphChange === 0 ? 0 : ((paragraphChange / data.statistics.paragraphCount.original) * 100)
    
    return {
      wordCount: {
        change: wordCountChange,
        percentage: wordCountPercentage
      },
      sentence: {
        change: sentenceChange,
        percentage: sentencePercentage
      },
      paragraph: {
        change: paragraphChange,
        percentage: paragraphPercentage
      }
    }
  }, [data.statistics])

  const copyToClipboard = (text: string, type: 'original' | 'rewritten') => {
    navigator.clipboard.writeText(text)
    if (type === 'original') {
      onCopyOriginal?.()
    } else {
      onCopyRewritten?.()
    }
  }

  return (
    <div className="space-y-6">
      {/* 统计概览 */}
      {showStatistics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              改写对比统计
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* 字数统计 */}
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-600">字数变化</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {data.statistics.originalWordCount} → {data.statistics.rewrittenWordCount}
                </div>
                <div className={`text-sm flex items-center justify-center gap-1 ${getChangeColor(stats.wordCount.percentage)}`}>
                  {React.createElement(getChangeIcon(stats.wordCount.percentage).icon, { className: "h-3 w-3" })}
                  {stats.wordCount.change >= 0 ? '+' : ''}{Math.round(stats.wordCount.percentage)}%
                </div>
              </div>

              {/* 句子统计 */}
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Eye className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">句子数量</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {data.statistics.sentenceCount.original} → {data.statistics.sentenceCount.rewritten}
                </div>
                <div className={`text-sm flex items-center justify-center gap-1 ${getChangeColor(stats.sentence.percentage)}`}>
                  {React.createElement(getChangeIcon(stats.sentence.percentage).icon, { className: "h-3 w-3" })}
                  {stats.sentence.change >= 0 ? '+' : ''}{Math.round(stats.sentence.percentage)}%
                </div>
              </div>

              {/* 段落统计 */}
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-600">段落结构</span>
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  {data.statistics.paragraphCount.original} → {data.statistics.paragraphCount.rewritten}
                </div>
                <div className={`text-sm flex items-center justify-center gap-1 ${getChangeColor(stats.paragraph.percentage)}`}>
                  {React.createElement(getChangeIcon(stats.paragraph.percentage).icon, { className: "h-3 w-3" })}
                  {stats.paragraph.change === 0 ? '无变化' : `${stats.paragraph.change >= 0 ? '+' : ''}${Math.round(stats.paragraph.percentage)}%`}
                </div>
              </div>

              {/* 质量评分 */}
              {data.qualityScore && (
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Award className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-600">质量评分</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.round(data.qualityScore * 100)}
                  </div>
                  <div className="text-sm text-orange-600">分</div>
                </div>
              )}
            </div>

            {/* 改写信息 */}
            <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Zap className="h-4 w-4" />
                  <span>风格：{data.style}</span>
                </div>
                {data.processingTime && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>用时：{(data.processingTime / 1000).toFixed(1)}s</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 内容对比 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              内容对比
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'side-by-side' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('side-by-side')}
              >
                并排显示
              </Button>
              <Button
                variant={viewMode === 'single' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('single')}
              >
                标签切换
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {viewMode === 'side-by-side' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 原文内容 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-700">原文内容</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {data.statistics.originalWordCount} 字
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(data.originalContent, 'original')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-md">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {data.originalTitle}
                    </h4>
                  </div>
                  
                  <ScrollArea className="h-96">
                    <div className="p-4 bg-gray-50 rounded-md">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {data.originalContent}
                      </p>
                    </div>
                  </ScrollArea>
                </div>
              </div>

              {/* 改写内容 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-green-500" />
                    <span className="font-medium text-green-700">改写结果</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {data.statistics.rewrittenWordCount} 字
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(data.rewrittenContent, 'rewritten')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 rounded-md border border-green-200">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {data.rewrittenTitle}
                    </h4>
                  </div>
                  
                  <ScrollArea className="h-96">
                    <div className="p-4 bg-green-50 rounded-md border border-green-200">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {data.rewrittenContent}
                      </p>
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>
          ) : (
            <Tabs defaultValue="original" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="original" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  原文 ({data.statistics.originalWordCount} 字)
                </TabsTrigger>
                <TabsTrigger value="rewritten" className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  改写结果 ({data.statistics.rewrittenWordCount} 字)
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="original" className="mt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900">
                      {data.originalTitle}
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(data.originalContent, 'original')}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      复制原文
                    </Button>
                  </div>
                  
                  <ScrollArea className="h-96">
                    <div className="p-4 bg-gray-50 rounded-md">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {data.originalContent}
                      </p>
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>
              
              <TabsContent value="rewritten" className="mt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900">
                      {data.rewrittenTitle}
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(data.rewrittenContent, 'rewritten')}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      复制改写
                    </Button>
                  </div>
                  
                  <ScrollArea className="h-96">
                    <div className="p-4 bg-green-50 rounded-md border border-green-200">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {data.rewrittenContent}
                      </p>
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  )
}