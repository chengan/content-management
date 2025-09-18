"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Star,
  Award,
  BookOpen,
  Palette,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  Target
} from "lucide-react"

export interface QualityScores {
  overallScore: number // 0-1
  styleConsistency: number // 0-1 风格一致性
  contentCompleteness: number // 0-1 内容完整性
  readability: number // 0-1 可读性
  suggestions?: Array<{
    type: 'improvement' | 'warning' | 'success'
    message: string
    position?: number
  }>
}

interface QualityScoreDisplayProps {
  scores: QualityScores
  showSuggestions?: boolean
  onRefresh?: () => void
  isLoading?: boolean
}

const getScoreColor = (score: number) => {
  if (score >= 0.9) return "text-green-600"
  if (score >= 0.8) return "text-blue-600"
  if (score >= 0.7) return "text-yellow-600"
  if (score >= 0.6) return "text-orange-600"
  return "text-red-600"
}

const getScoreLevel = (score: number) => {
  if (score >= 0.9) return { label: "优秀", color: "bg-green-100 text-green-800" }
  if (score >= 0.8) return { label: "良好", color: "bg-blue-100 text-blue-800" }
  if (score >= 0.7) return { label: "一般", color: "bg-yellow-100 text-yellow-800" }
  if (score >= 0.6) return { label: "及格", color: "bg-orange-100 text-orange-800" }
  return { label: "待改进", color: "bg-red-100 text-red-800" }
}

const getProgressColor = (score: number) => {
  if (score >= 0.9) return "bg-green-500"
  if (score >= 0.8) return "bg-blue-500"
  if (score >= 0.7) return "bg-yellow-500"
  if (score >= 0.6) return "bg-orange-500"
  return "bg-red-500"
}

export default function QualityScoreDisplay({
  scores,
  showSuggestions = true,
  onRefresh,
  isLoading = false
}: QualityScoreDisplayProps) {
  const overallLevel = getScoreLevel(scores.overallScore)

  const scoreItems = [
    {
      key: 'styleConsistency',
      label: '风格一致性',
      description: '李诞风格特征的保持度',
      score: scores.styleConsistency,
      icon: Palette,
    },
    {
      key: 'contentCompleteness',
      label: '内容完整性',
      description: '原文信息的完整保留度',
      score: scores.contentCompleteness,
      icon: BookOpen,
    },
    {
      key: 'readability',
      label: '可读性',
      description: '文章的流畅度和易读性',
      score: scores.readability,
      icon: Target,
    }
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            改写质量评估
          </CardTitle>
          
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1" />
              )}
              重新评估
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 总体评分 */}
        <div className="text-center">
          <div className="inline-flex flex-col items-center gap-2">
            <div className="relative">
              <div className={`text-4xl font-bold ${getScoreColor(scores.overallScore)}`}>
                {Math.round(scores.overallScore * 100)}
              </div>
              <div className="text-sm text-gray-500">分</div>
            </div>
            <Badge className={overallLevel.color}>
              {overallLevel.label}
            </Badge>
          </div>
        </div>

        {/* 详细评分 */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            详细评分
          </h4>
          
          {scoreItems.map((item) => {
            const ItemIcon = item.icon
            const score = Math.round(item.score * 100)
            
            return (
              <div key={item.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ItemIcon className="h-4 w-4 text-gray-500" />
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        {item.label}
                      </span>
                      <p className="text-xs text-gray-500">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${getScoreColor(item.score)}`}>
                      {score}分
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <Progress 
                    value={score} 
                    className="h-2"
                  />
                  <div 
                    className={`absolute top-0 left-0 h-2 rounded-full transition-all ${getProgressColor(item.score)}`}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* 评分说明 */}
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
          <div className="flex items-start gap-2">
            <Star className="h-3 w-3 mt-0.5" />
            <div className="space-y-1">
              <p><strong>评分标准：</strong></p>
              <p>• 90-100分：优秀 - 完美体现李诞风格，内容完整流畅</p>
              <p>• 80-89分：良好 - 风格明显，稍有改进空间</p>
              <p>• 70-79分：一般 - 基本达标，需要优化</p>
              <p>• 60-69分：及格 - 存在明显问题，建议重写</p>
              <p>• 60分以下：待改进 - 质量较差，需要重新改写</p>
            </div>
          </div>
        </div>

        {/* 改进建议 */}
        {showSuggestions && scores.suggestions && scores.suggestions.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              改进建议
            </h4>
            
            <div className="space-y-2">
              {scores.suggestions.map((suggestion, index) => {
                const SuggestionIcon = suggestion.type === 'success' 
                  ? CheckCircle 
                  : suggestion.type === 'warning' 
                  ? AlertCircle 
                  : RefreshCw

                const suggestionColor = suggestion.type === 'success'
                  ? "text-green-600 bg-green-50 border-green-200"
                  : suggestion.type === 'warning'
                  ? "text-yellow-600 bg-yellow-50 border-yellow-200"
                  : "text-blue-600 bg-blue-50 border-blue-200"

                return (
                  <div key={index} className={`flex items-start gap-2 p-3 rounded-md border ${suggestionColor}`}>
                    <SuggestionIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm">
                        {suggestion.message}
                        {suggestion.position && (
                          <span className="ml-2 text-xs opacity-75">
                            (第{suggestion.position}段)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}