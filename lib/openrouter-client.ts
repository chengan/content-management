/**
 * OpenRouter API客户端
 * 用于与OpenRouter服务进行通信，支持多种AI模型
 */

import { OPENROUTER_MODELS, FREE_MODELS, getModelById, isFreeModel } from './openrouter-models';

// 环境变量配置
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_TIMEOUT = 30000; // 30秒超时

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stream?: boolean;
}

export interface OpenRouterResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface OpenRouterError {
  error: {
    message: string;
    type?: string;
    param?: string;
    code?: string;
  };
}

/**
 * OpenRouter客户端类
 */
export class OpenRouterClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENROUTER_API_KEY || '';
    this.baseUrl = OPENROUTER_API_URL;
  }

  /**
   * 设置API Key
   */
  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * 检查API Key是否已配置
   */
  hasApiKey(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim());
  }

  /**
   * 发送聊天完成请求
   */
  async chatCompletion(request: OpenRouterRequest): Promise<OpenRouterResponse> {
    if (!this.hasApiKey()) {
      throw new Error('OpenRouter API Key未配置');
    }

    // 验证模型ID
    if (!request.model) {
      throw new Error('模型ID是必需的');
    }

    const model = getModelById(request.model);
    if (!model) {
      console.warn(`未找到模型信息: ${request.model}，继续使用指定的模型ID`);
    }

    console.log(`🤖 调用OpenRouter API: ${request.model}`);
    console.log(`📝 消息数量: ${request.messages.length}`);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NODE_ENV === 'production' 
            ? process.env.NEXT_PUBLIC_SITE_URL || 'https://localhost:3000'
            : 'http://localhost:3000',
          'X-Title': 'WeChat Content Management System',
        },
        body: JSON.stringify({
          ...request,
          // 设置默认参数
          temperature: request.temperature ?? 0.7,
          max_tokens: request.max_tokens ?? 2000,
          top_p: request.top_p ?? 1,
          frequency_penalty: request.frequency_penalty ?? 0,
          presence_penalty: request.presence_penalty ?? 0,
          stream: false, // 暂不支持流式响应
        }),
        signal: AbortSignal.timeout(DEFAULT_TIMEOUT),
      });

      if (!response.ok) {
        const errorData: OpenRouterError = await response.json().catch(() => ({
          error: { message: `HTTP错误: ${response.status} ${response.statusText}` }
        }));
        
        throw new Error(`OpenRouter API请求失败: ${errorData.error.message}`);
      }

      const data: OpenRouterResponse = await response.json();
      
      console.log(`✅ OpenRouter API调用成功`);
      console.log(`📊 Token使用: ${data.usage?.prompt_tokens || 0}输入 + ${data.usage?.completion_tokens || 0}输出 = ${data.usage?.total_tokens || 0}总计`);
      
      if (model && !isFreeModel(request.model)) {
        const inputCost = (data.usage?.prompt_tokens || 0) * model.pricing.prompt / 1000;
        const outputCost = (data.usage?.completion_tokens || 0) * model.pricing.completion / 1000;
        const totalCost = inputCost + outputCost;
        console.log(`💰 预估费用: $${totalCost.toFixed(6)} USD`);
      }

      return data;

    } catch (error: any) {
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        throw new Error('OpenRouter API请求超时，请稍后重试');
      }

      console.error('OpenRouter API调用失败:', error);
      throw error;
    }
  }

  /**
   * 简化的文本生成方法
   */
  async generateText(
    prompt: string, 
    systemPrompt?: string, 
    modelId: string = 'mistralai/mistral-7b-instruct:free',
    options: Partial<OpenRouterRequest> = {}
  ): Promise<string> {
    const messages: OpenRouterMessage[] = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    messages.push({ role: 'user', content: prompt });

    const response = await this.chatCompletion({
      model: modelId,
      messages,
      ...options,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('OpenRouter API返回了空响应');
    }

    return content.trim();
  }

  /**
   * 测试API连接
   */
  async testConnection(modelId: string = 'mistralai/mistral-7b-instruct:free'): Promise<boolean> {
    try {
      const response = await this.generateText(
        '请回复"连接正常"',
        '你是一个API连接测试助手',
        modelId,
        { max_tokens: 10, temperature: 0 }
      );
      
      return response.includes('连接正常') || response.includes('正常') || response.toLowerCase().includes('normal');
    } catch (error) {
      console.error('OpenRouter连接测试失败:', error);
      return false;
    }
  }

  /**
   * 获取可用模型列表
   */
  getAvailableModels() {
    return OPENROUTER_MODELS;
  }

  /**
   * 获取免费模型列表
   */
  getFreeModels() {
    return FREE_MODELS;
  }

  /**
   * 根据用途获取推荐模型
   */
  getRecommendedModel(purpose: 'cleaning' | 'rewriting' | 'general' = 'general'): string {
    switch (purpose) {
      case 'cleaning':
        // 内容清理推荐快速、免费的模型
        return 'mistralai/mistral-7b-instruct:free';
      case 'rewriting':
        // 改写推荐质量更高的模型
        return 'openchat/openchat-7b:free';
      default:
        return 'mistralai/mistral-7b-instruct:free';
    }
  }
}

// 默认客户端实例
let defaultClient: OpenRouterClient;

/**
 * 获取默认客户端实例
 */
export function getOpenRouterClient(apiKey?: string): OpenRouterClient {
  if (!defaultClient || apiKey) {
    defaultClient = new OpenRouterClient(apiKey);
  }
  return defaultClient;
}

/**
 * 快捷方法：生成文本
 */
export async function generateText(
  prompt: string,
  systemPrompt?: string,
  modelId?: string,
  options?: Partial<OpenRouterRequest>
): Promise<string> {
  const client = getOpenRouterClient();
  return client.generateText(prompt, systemPrompt, modelId, options);
}

/**
 * 快捷方法：测试连接
 */
export async function testOpenRouterConnection(apiKey?: string, modelId?: string): Promise<boolean> {
  const client = getOpenRouterClient(apiKey);
  return client.testConnection(modelId);
}

export default OpenRouterClient;