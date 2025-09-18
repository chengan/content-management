"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "../../../components/ui/slider"
import {
  Palette,
  Sparkles,
  BookOpen,
  Briefcase,
  GraduationCap,
  Smile,
  Settings,
  Info,
  Brain,
  Layers
} from "lucide-react"
import type { RewriteStyle, SegmentStrategy } from "@/src/types/rewrite"
import { DEFAULT_SEGMENTATION_MODEL, DEFAULT_REWRITE_MODEL } from "@/lib/openrouter-models"
import ModelSelector from "./ModelSelector"

interface StyleOption {
  key: RewriteStyle
  name: string
  description: string
  features: string[]
  icon: any
  color: string
  example: string
  isPopular?: boolean
  isRecommended?: boolean
}

const styleOptions: StyleOption[] = [
  {
    key: 'lidan',
    name: '李诞风格',
    description: '幽默犀利，语言简洁有力，充满个人魅力的表达方式',
    features: ['幽默犀利', '简洁有力', '个人魅力', '接地气'],
    icon: Smile,
    color: 'border-purple-200 bg-purple-50',
    example: '这件事说起来复杂，但本质上就是人性的贪婪在作怪。',
    isPopular: true,
    isRecommended: true
  },
  {
    key: 'professional',
    name: '专业正式',
    description: '用词准确，逻辑清晰，适合商务和正式场合',
    features: ['用词准确', '逻辑清晰', '结构严谨', '权威可信'],
    icon: Briefcase,
    color: 'border-blue-200 bg-blue-50',
    example: '通过深入分析市场数据，我们可以得出以下结论。'
  },
  {
    key: 'casual',
    name: '轻松随意',
    description: '语言活泼轻松，贴近生活，容易引起共鸣',
    features: ['语言活泼', '贴近生活', '容易理解', '引起共鸣'],
    icon: Sparkles,
    color: 'border-green-200 bg-green-50',
    example: '说真的，这个问题困扰了我很久，终于找到答案了！'
  },
  {
    key: 'academic',
    name: '学术严谨',
    description: '措辞精准，论述严谨，适合学术研究和深度分析',
    features: ['措辞精准', '论述严谨', '逻辑性强', '引用规范'],
    icon: GraduationCap,
    color: 'border-indigo-200 bg-indigo-50',
    example: '基于现有研究成果，本文提出以下假设并进行验证。'
  }
]

interface StyleSelectorProps {
  selectedStyle: RewriteStyle
  customPrompt: string
  styleIntensity: number // 0-100
  segmentationModel: string
  rewriteModel: string
  onStyleChange: (style: RewriteStyle) => void
  onCustomPromptChange: (prompt: string) => void
  onStyleIntensityChange: (intensity: number) => void
  onSegmentationModelChange: (model: string) => void
  onRewriteModelChange: (model: string) => void
  disabled?: boolean
}

export default function StyleSelector({
  selectedStyle,
  customPrompt,
  styleIntensity,
  segmentationModel,
  rewriteModel,
  onStyleChange,
  onCustomPromptChange,
  onStyleIntensityChange,
  onSegmentationModelChange,
  onRewriteModelChange,
  disabled = false
}: StyleSelectorProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  const selectedOption = styleOptions.find(option => option.key === selectedStyle)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          改写配置
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="style" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="style" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              风格设置
            </TabsTrigger>
            <TabsTrigger value="segment-model" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              分段模型
            </TabsTrigger>
            <TabsTrigger value="rewrite-model" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              改写模型
            </TabsTrigger>
          </TabsList>

          {/* 风格设置页面 */}
          <TabsContent value="style" className="space-y-6">
            {/* 风格选择 */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">选择改写风格</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {styleOptions.map((option) => {
                  const OptionIcon = option.icon
                  const isSelected = selectedStyle === option.key
                  
                  return (
                    <button
                      key={option.key}
                      onClick={() => !disabled && onStyleChange(option.key)}
                      disabled={disabled}
                      className={`relative p-4 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                        isSelected 
                          ? `${option.color} border-current shadow-md` 
                          : 'border-gray-200 hover:border-gray-300'
                      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <OptionIcon className="h-5 w-5" />
                          <span className="font-semibold">{option.name}</span>
                        </div>
                        <div className="flex gap-1">
                          {option.isRecommended && (
                            <Badge variant="secondary" className="text-xs">推荐</Badge>
                          )}
                          {option.isPopular && (
                            <Badge variant="outline" className="text-xs">热门</Badge>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">
                        {option.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-1 mb-3">
                        {option.features.map((feature) => (
                          <Badge key={feature} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="text-xs text-gray-500 italic">
                        示例：{option.example}
                      </div>
                      
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 风格强度控制 */}
            {selectedOption && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">风格强度</Label>
                  <span className="text-sm text-gray-500">{styleIntensity}%</span>
                </div>
                <Slider
                  value={[styleIntensity]}
                  onValueChange={(values) => !disabled && onStyleIntensityChange(values[0])}
                  max={100}
                  min={30}
                  step={10}
                  disabled={disabled}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>轻微</span>
                  <span>适中</span>
                  <span>明显</span>
                  <span>强烈</span>
                </div>
                <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                  <Info className="h-3 w-3 inline mr-1" />
                  风格强度决定了改写时对原文的修改程度，强度越高，风格特征越明显
                </div>
              </div>
            )}

            {/* 高级设置 */}
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                disabled={disabled}
                className="flex items-center gap-2 p-0 h-auto font-normal text-gray-600"
              >
                <Settings className="h-4 w-4" />
                高级设置
                {showAdvanced ? '▼' : '▶'}
              </Button>
              
              {showAdvanced && (
                <div className="mt-3 space-y-3">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      自定义改写要求
                    </Label>
                    <Textarea
                      value={customPrompt}
                      onChange={(e) => !disabled && onCustomPromptChange(e.target.value)}
                      disabled={disabled}
                      placeholder={`在${selectedOption?.name}的基础上，你可以添加特殊要求，比如：
• 增加更多数据引用
• 使用更多比喻手法
• 调整语言风格的某个方面
• 针对特定读者群体优化`}
                      className="min-h-[100px] text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      自定义要求将与选中的风格结合使用，为空时使用默认风格设置
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 当前配置摘要 */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-start gap-2">
                <BookOpen className="h-4 w-4 text-gray-500 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-gray-700">当前配置：</p>
                  <p className="text-gray-600">
                    使用<strong>{selectedOption?.name}</strong>风格（强度 {styleIntensity}%）
                    {customPrompt && '，结合自定义要求'}进行改写
                  </p>
                  {customPrompt && (
                    <p className="text-xs text-gray-500 mt-1 italic">
                      "{customPrompt.slice(0, 100)}{customPrompt.length > 100 ? '...' : ''}"
                    </p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>


          {/* 分段模型页面 */}
          <TabsContent value="segment-model" className="space-y-4">
            <div className="p-3 bg-orange-50 rounded-lg mb-4">
              <h4 className="font-medium text-orange-900 mb-1">AI智能分段</h4>
              <p className="text-sm text-orange-700">
                使用AI模型分析文章的语义结构和逻辑层次，智能化地进行分段。请选择用于分段的AI模型。
              </p>
            </div>
            
            <ModelSelector
              purpose="segmentation"
              selectedModel={segmentationModel}
              onModelChange={onSegmentationModelChange}
              disabled={disabled}
              showRecommended={true}
            />
          </TabsContent>

          {/* 改写模型页面 */}
          <TabsContent value="rewrite-model" className="space-y-4">
            <ModelSelector
              purpose="rewriting"
              selectedModel={rewriteModel}
              onModelChange={onRewriteModelChange}
              disabled={disabled}
              showRecommended={true}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}