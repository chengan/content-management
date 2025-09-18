"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Zap,
  FileText,
  BarChart3,
  Loader2
} from "lucide-react"

export interface ProgressData {
  totalSegments: number
  completedSegments: number
  failedSegments: number
  currentSegment?: string
  estimatedTimeRemaining: number // 秒
  status: 'analyzing' | 'rewriting' | 'integrating' | 'evaluating' | 'completed' | 'failed'
  processingTime?: number // 已用时间（毫秒）
  averageTimePerSegment?: number // 每段平均用时（毫秒）
}

interface RewriteProgressBarProps {
  progress: ProgressData
  articleTitle?: string
  showDetails?: boolean
}

const statusConfig = {
  analyzing: {
    label: "文章分析中",
    description: "正在分析文章结构并进行智能分段...",
    color: "bg-blue-100 text-blue-600",
    icon: FileText,
  },
  rewriting: {
    label: "AI改写中",
    description: "正在逐段进行李诞风格改写...",
    color: "bg-purple-100 text-purple-600",
    icon: Zap,
  },
  integrating: {
    label: "段落整合中",
    description: "正在优化段落衔接和整体结构...",
    color: "bg-orange-100 text-orange-600",
    icon: BarChart3,
  },
  evaluating: {
    label: "质量评估中",
    description: "正在评估改写质量和风格一致性...",
    color: "bg-indigo-100 text-indigo-600",
    icon: CheckCircle,
  },
  completed: {
    label: "改写完成",
    description: "所有段落改写完成，质量评估通过",
    color: "bg-green-100 text-green-600",
    icon: CheckCircle,
  },
  failed: {
    label: "改写失败",
    description: "改写过程中出现错误，请重试",
    color: "bg-red-100 text-red-600",
    icon: AlertCircle,
  },
}

export default function RewriteProgressBar({
  progress,
  articleTitle,
  showDetails = true
}: RewriteProgressBarProps) {
  const statusInfo = statusConfig[progress.status]
  const StatusIcon = statusInfo.icon
  
  // 计算总体进度百分比
  const totalProgress = progress.status === 'completed' 
    ? 100 
    : progress.status === 'failed'
    ? 0
    : Math.round((progress.completedSegments / progress.totalSegments) * 85) // 改写阶段占85%

  // 格式化时间
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}秒`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}分${remainingSeconds}秒`
  }

  const formatProcessingTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    return formatTime(seconds)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <StatusIcon className={`h-5 w-5 ${
            progress.status === 'rewriting' || progress.status === 'analyzing' 
              ? 'animate-spin' 
              : ''
          }`} />
          {statusInfo.label}
          {progress.status === 'rewriting' && progress.currentSegment && (
            <Badge variant="outline" className="ml-2">
              段落 {progress.currentSegment}
            </Badge>
          )}
        </CardTitle>
        {articleTitle && (
          <p className="text-sm text-gray-600 font-medium">
            {articleTitle}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 主进度条 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{statusInfo.description}</span>
            <span className="font-medium">{totalProgress}%</span>
          </div>
          <Progress value={totalProgress} className="h-3" />
        </div>

        {/* 详细统计信息 */}
        {showDetails && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">
                {progress.totalSegments}
              </div>
              <div className="text-xs text-blue-600">总段落数</div>
            </div>
            
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">
                {progress.completedSegments}
              </div>
              <div className="text-xs text-green-600">已完成</div>
            </div>
            
            {progress.failedSegments > 0 && (
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="text-lg font-bold text-red-600">
                  {progress.failedSegments}
                </div>
                <div className="text-xs text-red-600">失败段落</div>
              </div>
            )}
            
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="text-lg font-bold text-purple-600">
                {progress.totalSegments - progress.completedSegments - progress.failedSegments}
              </div>
              <div className="text-xs text-purple-600">待处理</div>
            </div>
          </div>
        )}

        {/* 时间信息 */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            {progress.processingTime && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">
                  已用时：{formatProcessingTime(progress.processingTime)}
                </span>
              </div>
            )}
            
            {progress.estimatedTimeRemaining > 0 && progress.status !== 'completed' && (
              <div className="flex items-center gap-1">
                <Loader2 className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">
                  预计剩余：{formatTime(progress.estimatedTimeRemaining)}
                </span>
              </div>
            )}
          </div>

          {progress.averageTimePerSegment && (
            <div className="text-xs text-gray-500">
              平均每段：{formatProcessingTime(progress.averageTimePerSegment)}
            </div>
          )}
        </div>

        {/* 当前处理信息 */}
        {progress.status === 'rewriting' && progress.currentSegment && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-gray-700">
                正在改写第 {progress.currentSegment} 段落...
              </span>
            </div>
          </div>
        )}

        {/* 完成状态 */}
        {progress.status === 'completed' && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">
                改写任务已完成！共处理 {progress.totalSegments} 个段落
              </span>
            </div>
          </div>
        )}

        {/* 失败状态 */}
        {progress.status === 'failed' && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-700">
                改写失败：{progress.failedSegments} 个段落处理失败，请检查后重试
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}