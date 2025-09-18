/**
 * OpenRouter模型配置
 * 定义支持的AI模型列表及其特性
 */

export interface OpenRouterModel {
  id: string              // OpenRouter模型ID
  name: string            // 显示名称
  provider: string        // 提供商
  contextLength: number   // 上下文长度
  pricing: {
    prompt: number        // 输入价格(USD per 1K tokens)
    completion: number    // 输出价格(USD per 1K tokens)
  }
  features: string[]      // 特点标签
  description: string     // 描述
  recommended?: boolean   // 是否推荐
}

// 免费模型列表
export const FREE_MODELS: OpenRouterModel[] = [
  {
    id: 'mistralai/mistral-7b-instruct:free',
    name: 'Mistral 7B Instruct (Free)',
    provider: 'Mistral AI',
    contextLength: 32768,
    pricing: {
      prompt: 0,
      completion: 0
    },
    features: ['免费使用', '指令优化', '多语言', '快速响应'],
    description: '免费的Mistral 7B指令优化模型，适合大多数常规任务',
    recommended: true
  },
  {
    id: 'huggingface/meta-llama/Llama-2-7b-chat-hf',
    name: 'Llama 2 7B Chat (Free)',
    provider: 'Meta',
    contextLength: 4096,
    pricing: {
      prompt: 0,
      completion: 0
    },
    features: ['免费使用', '对话优化', '开源', '社区支持'],
    description: '免费的Llama 2 7B对话模型，适合日常对话任务',
    recommended: false
  },
  {
    id: 'openchat/openchat-7b:free',
    name: 'OpenChat 7B (Free)',
    provider: 'OpenChat',
    contextLength: 8192,
    pricing: {
      prompt: 0,
      completion: 0
    },
    features: ['免费使用', '高质量', '对话优化', '指令跟随'],
    description: '免费的OpenChat 7B模型，在多项评测中表现优秀',
    recommended: true
  },
  {
    id: 'gryphe/mythomist-7b:free',
    name: 'MythoMist 7B (Free)',
    provider: 'Gryphe',
    contextLength: 32768,
    pricing: {
      prompt: 0,
      completion: 0
    },
    features: ['免费使用', '创意写作', '长上下文', '故事生成'],
    description: '专门用于创意写作和故事生成的免费模型',
    recommended: false
  },
  {
    id: 'undi95/toppy-m-7b:free',
    name: 'Toppy M 7B (Free)',
    provider: 'Undi95',
    contextLength: 4096,
    pricing: {
      prompt: 0,
      completion: 0
    },
    features: ['免费使用', '平衡性能', '通用任务', '稳定输出'],
    description: '免费的通用7B模型，在各类任务中表现平衡',
    recommended: false
  }
]

// 付费模型列表
export const PAID_MODELS: OpenRouterModel[] = [
  // OpenAI系列
  {
    id: "openai/gpt-4-turbo-preview",
    name: "GPT-4 Turbo Preview",
    provider: "OpenAI",
    contextLength: 128000,
    pricing: {
      prompt: 0.01,
      completion: 0.03
    },
    features: ["最新模型", "高质量", "大上下文"],
    description: "OpenAI最新的GPT-4模型，支持更长的上下文，适合复杂的改写任务",
    recommended: true
  },
  {
    id: "openai/gpt-4",
    name: "GPT-4",
    provider: "OpenAI",
    contextLength: 8192,
    pricing: {
      prompt: 0.03,
      completion: 0.06
    },
    features: ["高质量", "稳定"],
    description: "OpenAI的旗舰模型，改写质量极高，适合要求严格的内容"
  },
  {
    id: "openai/gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    provider: "OpenAI",
    contextLength: 16385,
    pricing: {
      prompt: 0.001,
      completion: 0.002
    },
    features: ["经济实用", "快速"],
    description: "性价比最高的选择，速度快，成本低，适合大批量改写",
    recommended: true
  },

  // Anthropic系列
  {
    id: "anthropic/claude-3-opus",
    name: "Claude-3 Opus",
    provider: "Anthropic",
    contextLength: 200000,
    pricing: {
      prompt: 0.015,
      completion: 0.075
    },
    features: ["超大上下文", "理解能力强", "创意性好"],
    description: "Anthropic最强模型，理解能力和创意表达极佳，适合需要深度改写的内容"
  },
  {
    id: "anthropic/claude-3-sonnet",
    name: "Claude-3 Sonnet",
    provider: "Anthropic",
    contextLength: 200000,
    pricing: {
      prompt: 0.003,
      completion: 0.015
    },
    features: ["平衡性好", "大上下文"],
    description: "平衡了性能和成本，理解能力强，适合多样化的改写需求"
  },
  {
    id: "anthropic/claude-3-haiku",
    name: "Claude-3 Haiku",
    provider: "Anthropic",
    contextLength: 200000,
    pricing: {
      prompt: 0.00025,
      completion: 0.00125
    },
    features: ["快速", "经济", "大上下文"],
    description: "最经济的Claude模型，速度快，适合简单的改写任务"
  },

  // Meta系列
  {
    id: "meta-llama/llama-3-70b-instruct",
    name: "Llama-3 70B Instruct",
    provider: "Meta",
    contextLength: 8192,
    pricing: {
      prompt: 0.00059,
      completion: 0.00079
    },
    features: ["开源", "性价比高"],
    description: "Meta的开源大模型，性能优秀，成本较低"
  },

  // Google系列
  {
    id: "google/gemini-pro",
    name: "Gemini Pro",
    provider: "Google",
    contextLength: 32768,
    pricing: {
      prompt: 0.000125,
      completion: 0.000375
    },
    features: ["谷歌出品", "多模态"],
    description: "Google的多模态模型，理解能力强"
  },

  // 其他推荐模型
  {
    id: "mistralai/mixtral-8x7b-instruct",
    name: "Mixtral 8x7B Instruct",
    provider: "Mistral AI",
    contextLength: 32768,
    pricing: {
      prompt: 0.00027,
      completion: 0.00027
    },
    features: ["开源", "高效"],
    description: "Mistral AI的混合专家模型，效率高，质量好"
  }
]

// OpenRouter支持的模型列表（免费 + 付费）
export const OPENROUTER_MODELS: OpenRouterModel[] = [
  ...FREE_MODELS,
  ...PAID_MODELS
]

// 验证模型ID格式
export function validateModelId(modelId: string): boolean {
  // 基本格式验证：provider/model 或 provider/model:variant
  const pattern = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+(?::[a-zA-Z0-9_.-]+)?$/
  return pattern.test(modelId)
}

// 检查是否为免费模型
export function isFreeModel(modelId: string): boolean {
  return FREE_MODELS.some(m => m.id === modelId) || modelId.includes(':free')
}

// 根据用途获取推荐模型
export function getRecommendedModels(purpose: 'segmentation' | 'rewriting' | 'all' = 'all'): OpenRouterModel[] {
  switch (purpose) {
    case 'segmentation':
      // 分段任务推荐快速、经济的模型
      return OPENROUTER_MODELS.filter(m => 
        m.features.includes('快速') || m.features.includes('经济实用')
      )
    
    case 'rewriting':
      // 改写任务推荐高质量模型
      return OPENROUTER_MODELS.filter(m => 
        m.features.includes('高质量') || m.features.includes('创意性好')
      )
    
    default:
      return OPENROUTER_MODELS.filter(m => m.recommended)
  }
}

// 根据ID获取模型信息
export function getModelById(id: string): OpenRouterModel | undefined {
  return OPENROUTER_MODELS.find(m => m.id === id)
}

// 格式化价格显示
export function formatModelPrice(model: OpenRouterModel): string {
  const inputPrice = model.pricing.prompt * 1000
  const outputPrice = model.pricing.completion * 1000
  return `输入: $${inputPrice.toFixed(3)}/1K • 输出: $${outputPrice.toFixed(3)}/1K`
}

// 默认模型配置
export const DEFAULT_SEGMENTATION_MODEL = "openai/gpt-3.5-turbo"
export const DEFAULT_REWRITE_MODEL = "openai/gpt-3.5-turbo"