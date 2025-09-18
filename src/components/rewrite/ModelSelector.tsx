"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Brain, 
  Zap, 
  DollarSign, 
  Clock, 
  Info,
  Star,
  Users,
  Sparkles,
  Edit3,
  Gift,
  AlertCircle,
  Check
} from "lucide-react"
import { 
  OPENROUTER_MODELS,
  FREE_MODELS, 
  getRecommendedModels, 
  getModelById, 
  formatModelPrice,
  validateModelId,
  isFreeModel,
  DEFAULT_SEGMENTATION_MODEL,
  DEFAULT_REWRITE_MODEL,
  type OpenRouterModel 
} from "@/lib/openrouter-models"

interface ModelSelectorProps {
  purpose: 'segmentation' | 'rewriting'
  selectedModel: string
  onModelChange: (modelId: string) => void
  disabled?: boolean
  showRecommended?: boolean
}

const getProviderColor = (provider: string) => {
  switch (provider.toLowerCase()) {
    case 'openai':
      return 'bg-green-100 text-green-800'
    case 'anthropic':
      return 'bg-blue-100 text-blue-800'
    case 'meta':
      return 'bg-purple-100 text-purple-800'
    case 'google':
      return 'bg-red-100 text-red-800'
    case 'mistral ai':
      return 'bg-orange-100 text-orange-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getPurposeInfo = (purpose: 'segmentation' | 'rewriting') => {
  if (purpose === 'segmentation') {
    return {
      title: "分段模型选择",
      description: "选择用于智能分段的AI模型",
      icon: <Brain className="h-5 w-5" />,
      defaultModel: DEFAULT_SEGMENTATION_MODEL,
      tip: "分段任务推荐选择快速、经济的模型"
    }
  } else {
    return {
      title: "改写模型选择", 
      description: "选择用于内容改写的AI模型",
      icon: <Sparkles className="h-5 w-5" />,
      defaultModel: DEFAULT_REWRITE_MODEL,
      tip: "改写任务推荐选择高质量、创意性强的模型"
    }
  }
}

export default function ModelSelector({
  purpose,
  selectedModel,
  onModelChange,
  disabled = false,
  showRecommended = true
}: ModelSelectorProps) {
  const [showAllModels, setShowAllModels] = useState(false)
  const [customModelId, setCustomModelId] = useState('')
  const [selectionMode, setSelectionMode] = useState<'preset' | 'custom'>('preset')
  const [inputError, setInputError] = useState<string | null>(null)
  
  const info = getPurposeInfo(purpose)
  
  const recommendedModels = getRecommendedModels(purpose)
  const displayModels = showRecommended && !showAllModels 
    ? recommendedModels 
    : OPENROUTER_MODELS
  
  // 当前模型可能来自预设列表或自定义输入
  const currentModel = getModelById(selectedModel)
  const isCustomModel = !currentModel && selectedModel
  const isValidCustomModel = isCustomModel && validateModelId(selectedModel)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {info.icon}
          {info.title}
        </CardTitle>
        <div className="text-sm text-gray-600">
          {info.description}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 选择模式切换 */}
        <Tabs value={selectionMode} onValueChange={(value) => setSelectionMode(value as 'preset' | 'custom')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preset" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              预设模型
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              自定义模型
            </TabsTrigger>
          </TabsList>

          {/* 预设模型选择 */}
          <TabsContent value="preset" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">选择模型</label>
              <Select
                value={selectionMode === 'preset' ? selectedModel : ''}
                onValueChange={(value) => {
                  onModelChange(value)
                  setInputError(null)
                }}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`选择${purpose === 'segmentation' ? '分段' : '改写'}模型`} />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {displayModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{model.name}</span>
                          {model.recommended && (
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          )}
                          {isFreeModel(model.id) && (
                            <Gift className="h-3 w-3 text-green-500 fill-current" />
                          )}
                        </div>
                        <Badge variant="outline" className={getProviderColor(model.provider)}>
                          {model.provider}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 显示/隐藏所有模型按钮 */}
            {showRecommended && (
              <div className="flex justify-between items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllModels(!showAllModels)}
                >
                  {showAllModels ? '只显示推荐模型' : '显示所有模型'}
                  <Users className="h-4 w-4 ml-1" />
                </Button>
                <div className="text-xs text-gray-500">
                  {showAllModels ? `共${OPENROUTER_MODELS.length}个模型` : `推荐${displayModels.length}个模型`}
                </div>
              </div>
            )}
          </TabsContent>

          {/* 自定义模型输入 */}
          <TabsContent value="custom" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="custom-model-input">输入模型ID</Label>
              <div className="space-y-2">
                <Input
                  id="custom-model-input"
                  placeholder="例如：mistralai/mistral-7b-instruct:free"
                  value={selectionMode === 'custom' ? selectedModel : customModelId}
                  onChange={(e) => {
                    const value = e.target.value
                    if (selectionMode === 'custom') {
                      onModelChange(value)
                    } else {
                      setCustomModelId(value)
                    }
                    
                    // 实时验证
                    if (value && !validateModelId(value)) {
                      setInputError('模型ID格式不正确，应为：提供商/模型名[:变体]')
                    } else {
                      setInputError(null)
                    }
                  }}
                  disabled={disabled}
                  className={inputError ? 'border-red-300 focus:border-red-500' : ''}
                />
                
                {/* 输入验证提示 */}
                {inputError && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    {inputError}
                  </div>
                )}
                
                {/* 格式说明 */}
                <div className="text-xs text-gray-500 space-y-1">
                  <div className="flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    <span>格式：提供商名/模型名[:变体]</span>
                  </div>
                  <div>例如：openai/gpt-3.5-turbo 或 mistralai/mistral-7b:free</div>
                </div>
              </div>
            </div>

            {/* 免费模型快速选择 */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-green-500" />
                免费模型快速选择
              </Label>
              <div className="grid grid-cols-1 gap-2">
                {FREE_MODELS.slice(0, 3).map((model) => (
                  <Button
                    key={model.id}
                    variant="outline"
                    size="sm"
                    className="justify-start text-left h-auto p-3"
                    onClick={() => {
                      onModelChange(model.id)
                      setInputError(null)
                    }}
                    disabled={disabled}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <div className="font-medium text-sm">{model.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{model.description}</div>
                      </div>
                      <Gift className="h-4 w-4 text-green-500 ml-2" />
                    </div>
                  </Button>
                ))}
              </div>
              
              {FREE_MODELS.length > 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    // 切换到预设模式显示所有免费模型
                    setSelectionMode('preset')
                    setShowAllModels(true)
                  }}
                >
                  查看更多免费模型 ({FREE_MODELS.length - 3} 个)
                </Button>
              )}
            </div>
          </TabsContent>
        </Tabs>


        <Separator />

        {/* 当前选中模型的详细信息 */}
        {currentModel ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium flex items-center gap-2">
                {currentModel.name}
                {currentModel.recommended && (
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                )}
                {isFreeModel(currentModel.id) && (
                  <Gift className="h-4 w-4 text-green-500 fill-current" />
                )}
              </h4>
              <Badge className={getProviderColor(currentModel.provider)}>
                {currentModel.provider}
              </Badge>
            </div>

            <p className="text-sm text-gray-600">{currentModel.description}</p>

            {/* 模型特点 */}
            <div className="flex flex-wrap gap-1">
              {currentModel.features.map((feature, index) => (
                <Badge key={index} variant="secondary" className={`text-xs ${
                  feature === '免费使用' ? 'bg-green-100 text-green-800' : ''
                }`}>
                  {feature}
                </Badge>
              ))}
            </div>

            {/* 模型规格 */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-blue-500" />
                <span className="text-gray-600">上下文:</span>
                <span className="font-medium">
                  {currentModel.contextLength.toLocaleString()}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-500" />
                <span className="text-gray-600">价格:</span>
                <span className="font-medium text-xs">
                  {isFreeModel(currentModel.id) ? '免费' : formatModelPrice(currentModel)}
                </span>
              </div>
            </div>

            {/* 使用建议 */}
            <div className={`p-3 rounded-lg ${
              isFreeModel(currentModel.id) ? 'bg-green-50' : 'bg-blue-50'
            }`}>
              <div className="flex items-start gap-2">
                {isFreeModel(currentModel.id) ? (
                  <Gift className="h-4 w-4 text-green-500 mt-0.5" />
                ) : (
                  <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                )}
                <div className={`text-sm ${
                  isFreeModel(currentModel.id) ? 'text-green-700' : 'text-blue-700'
                }`}>
                  <strong>建议：</strong>
                  {isFreeModel(currentModel.id) 
                    ? '免费模型，适合测试和简单任务，无使用费用'
                    : info.tip
                  }
                </div>
              </div>
            </div>
          </div>
        ) : isCustomModel ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium flex items-center gap-2">
                自定义模型
                {isValidCustomModel && (
                  <Check className="h-4 w-4 text-green-500" />
                )}
              </h4>
              <Badge variant="outline">
                {selectedModel.split('/')[0]}
              </Badge>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-mono text-gray-800">
                {selectedModel}
              </div>
            </div>
            
            {isValidCustomModel ? (
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5" />
                  <div className="text-sm text-green-700">
                    <strong>验证通过：</strong>
                    模型ID格式正确，{isFreeModel(selectedModel) ? '这是一个免费模型' : '准备就绪'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                  <div className="text-sm text-yellow-700">
                    <strong>提示：</strong>
                    请确保模型ID格式正确且在OpenRouter中可用
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="text-gray-400 mb-2">
              <Brain className="h-8 w-8 mx-auto" />
            </div>
            <p className="text-sm text-gray-600">请选择一个AI模型</p>
          </div>
        )}

        {/* 重置为默认模型按钮 */}
        {selectedModel !== info.defaultModel && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onModelChange(info.defaultModel)}
            disabled={disabled}
            className="w-full"
          >
            <Clock className="h-4 w-4 mr-2" />
            重置为默认模型
          </Button>
        )}
      </CardContent>
    </Card>
  )
}