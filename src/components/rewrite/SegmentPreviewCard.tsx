"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Edit,
  Check,
  X,
  Clock,
  RefreshCw,
  Zap,
  FileText,
  Loader2
} from "lucide-react"

export interface SegmentData {
  id: string
  order: number
  originalContent: string
  rewrittenContent?: string
  wordCount: number
  rewriteStatus: 'pending' | 'rewriting' | 'completed' | 'failed'
  qualityScore?: number
  processingTime?: number
}

interface SegmentPreviewCardProps {
  segment: SegmentData
  onEdit?: (id: string, content: string) => void
  onRewrite?: (id: string) => void
  onSave?: (id: string, content: string) => void
  onCancel?: (id: string) => void
  showRewritten?: boolean
}

const statusConfig = {
  pending: { 
    label: "待改写", 
    color: "bg-gray-100 text-gray-600", 
    icon: Clock 
  },
  rewriting: { 
    label: "改写中", 
    color: "bg-blue-100 text-blue-600", 
    icon: RefreshCw 
  },
  completed: { 
    label: "已完成", 
    color: "bg-green-100 text-green-600", 
    icon: Check 
  },
  failed: { 
    label: "改写失败", 
    color: "bg-red-100 text-red-600", 
    icon: X 
  },
}

export default function SegmentPreviewCard({
  segment,
  onEdit,
  onRewrite,
  onSave,
  onCancel,
  showRewritten = false
}: SegmentPreviewCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(segment.originalContent)

  const statusInfo = statusConfig[segment.rewriteStatus]
  const StatusIcon = statusInfo.icon

  const handleStartEdit = () => {
    setIsEditing(true)
    setEditContent(segment.originalContent)
  }

  const handleSaveEdit = () => {
    onSave?.(segment.id, editContent)
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditContent(segment.originalContent)
    setIsEditing(false)
    onCancel?.(segment.id)
  }

  const handleRewrite = () => {
    onRewrite?.(segment.id)
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              段落 {segment.order}
            </Badge>
            <span className="text-xs text-gray-500">
              {segment.wordCount} 字
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
              <StatusIcon className={`h-3 w-3 ${segment.rewriteStatus === 'rewriting' ? 'animate-spin' : ''}`} />
              {statusInfo.label}
            </div>
            {segment.rewriteStatus === 'completed' && segment.qualityScore && (
              <Badge variant="secondary" className="text-xs">
                质量分：{Math.round(segment.qualityScore * 100)}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 原始内容区域 */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">原文内容</span>
          </div>
          
          {isEditing ? (
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[120px] text-sm"
              placeholder="编辑段落内容..."
            />
          ) : (
            <ScrollArea className="h-32">
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {segment.originalContent}
                </p>
              </div>
            </ScrollArea>
          )}
        </div>

        {/* 改写内容区域 */}
        {showRewritten && segment.rewrittenContent && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-green-700">改写结果</span>
              {segment.processingTime && (
                <span className="text-xs text-gray-500">
                  用时 {(segment.processingTime / 1000).toFixed(1)}s
                </span>
              )}
            </div>
            
            <ScrollArea className="h-32">
              <div className="p-3 bg-green-50 rounded-md border border-green-200">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {segment.rewrittenContent}
                </p>
              </div>
            </ScrollArea>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex items-center gap-2 pt-2 border-t">
          {isEditing ? (
            <>
              <Button size="sm" onClick={handleSaveEdit}>
                <Check className="h-4 w-4 mr-1" />
                保存
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                <X className="h-4 w-4 mr-1" />
                取消
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={handleStartEdit}>
                <Edit className="h-4 w-4 mr-1" />
                编辑
              </Button>
              
              {segment.rewriteStatus === 'pending' && (
                <Button size="sm" onClick={handleRewrite}>
                  <Zap className="h-4 w-4 mr-1" />
                  开始改写
                </Button>
              )}
              
              {segment.rewriteStatus === 'rewriting' && (
                <Button size="sm" disabled>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  改写中...
                </Button>
              )}
              
              {segment.rewriteStatus === 'failed' && (
                <Button size="sm" variant="destructive" onClick={handleRewrite}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  重试改写
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}