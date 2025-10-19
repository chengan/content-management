/**
 * AI 服务配置管理
 * 支持多服务配置和自动降级
 */

export interface AIServiceConfig {
  name: string;           // 服务名称（用于日志）
  baseUrl: string;        // API 基础地址
  apiKey: string;         // API 密钥
  priority: number;       // 优先级（数字越小越优先）
  enabled: boolean;       // 是否启用
}

export class AIConfigManager {
  private static instance: AIConfigManager;
  private services: AIServiceConfig[];

  private constructor() {
    this.services = this.loadServicesFromEnv();
  }

  static getInstance(): AIConfigManager {
    if (!AIConfigManager.instance) {
      AIConfigManager.instance = new AIConfigManager();
    }
    return AIConfigManager.instance;
  }

  /**
   * 从环境变量加载服务配置
   */
  private loadServicesFromEnv(): AIServiceConfig[] {
    const services: AIServiceConfig[] = [];

    // 优先级 1: 新的中转站（主服务）
    const customApiKey = process.env.AI_API_KEY;
    const customBaseUrl = process.env.AI_API_BASE_URL;

    if (customApiKey && customBaseUrl) {
      services.push({
        name: 'CustomProvider',
        baseUrl: customBaseUrl,
        apiKey: customApiKey,
        priority: 1,
        enabled: true
      });
      console.log('✅ 已配置主 AI 服务:', customBaseUrl);
    }

    // 优先级 2: OpenRouter（备用服务）
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    if (openrouterKey) {
      services.push({
        name: 'OpenRouter',
        baseUrl: 'https://openrouter.ai/api/v1',
        apiKey: openrouterKey,
        priority: 2,
        enabled: true
      });
      console.log('✅ 已配置备用 AI 服务: OpenRouter');
    }

    if (services.length === 0) {
      console.warn('⚠️  未配置任何 AI 服务，将使用 Mock 模式');
    }

    // 按优先级排序
    return services.sort((a, b) => a.priority - b.priority);
  }

  /**
   * 获取主服务配置
   */
  getPrimaryService(): AIServiceConfig | null {
    const primary = this.services.find(s => s.enabled && s.priority === 1);
    return primary || null;
  }

  /**
   * 获取所有可用服务（按优先级排序）
   */
  getAllServices(): AIServiceConfig[] {
    return this.services.filter(s => s.enabled);
  }

  /**
   * 获取备用服务
   */
  getFallbackServices(): AIServiceConfig[] {
    return this.services.filter(s => s.enabled && s.priority > 1);
  }

  /**
   * 检查是否有可用的 AI 服务
   */
  hasAvailableService(): boolean {
    return this.services.some(s => s.enabled);
  }

  /**
   * 标记某个服务为不可用（用于降级）
   */
  disableService(serviceName: string): void {
    const service = this.services.find(s => s.name === serviceName);
    if (service) {
      service.enabled = false;
      console.warn(`⚠️  已禁用 AI 服务: ${serviceName}`);
    }
  }

  /**
   * 重置所有服务状态
   */
  resetServices(): void {
    this.services.forEach(s => s.enabled = true);
  }

  /**
   * 模型名称映射（根据服务转换模型名）
   * 不同的 AI 服务可能对模型名称有不同的要求
   */
  mapModelName(modelId: string, serviceName: string): string {
    const mappings: Record<string, Record<string, string>> = {
      'CustomProvider': {
        // OpenRouter 格式 → 标准 OpenAI 格式
        'openai/gpt-3.5-turbo': 'gpt-3.5-turbo',
        'openai/gpt-4': 'gpt-4',
        'openai/gpt-4-turbo-preview': 'gpt-4-turbo-preview',
        'anthropic/claude-3-opus': 'claude-3-opus',
        'anthropic/claude-3-sonnet': 'claude-3-sonnet',
        'mistralai/mistral-7b-instruct:free': 'mistral-7b-instruct',
      },
      'OpenRouter': {
        // 标准 OpenAI 格式 → OpenRouter 格式
        'gpt-3.5-turbo': 'openai/gpt-3.5-turbo',
        'gpt-4': 'openai/gpt-4',
        'gpt-4-turbo-preview': 'openai/gpt-4-turbo-preview',
        'claude-3-opus': 'anthropic/claude-3-opus',
        'claude-3-sonnet': 'anthropic/claude-3-sonnet',
      }
    };

    const mapped = mappings[serviceName]?.[modelId];
    if (mapped) {
      console.log(`🔄 模型名称映射: ${modelId} → ${mapped} (${serviceName})`);
      return mapped;
    }

    return modelId;
  }
}

/**
 * 便捷函数：获取配置管理器实例
 */
export function getAIConfig(): AIConfigManager {
  return AIConfigManager.getInstance();
}

/**
 * 便捷函数：获取主服务配置
 */
export function getPrimaryAIService(): AIServiceConfig | null {
  return getAIConfig().getPrimaryService();
}
