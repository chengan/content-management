/**
 * 内容清理服务
 * 使用AI自动清理文章中的广告、推广链接和无关信息
 */

import { getOpenRouterClient } from './openrouter-client';

// 清理结果接口
export interface ContentCleanResult {
  success: boolean;
  originalContent: string;
  cleanedContent: string;
  removedSections: string[];
  wordCountBefore: number;
  wordCountAfter: number;
  error?: string;
  modelUsed?: string;
}

// 清理配置接口
export interface ContentCleanConfig {
  modelId?: string;
  apiKey?: string;
  enableRemoveAds?: boolean;
  enableRemovePromotions?: boolean;
  enableRemoveHeaders?: boolean;
  enableRemoveFooters?: boolean;
  enableRemoveSubscriptions?: boolean;
  preserveFormatting?: boolean;
}

/**
 * 内容清理服务类
 */
export class ContentCleanerService {
  
  /**
   * 获取默认清理配置
   */
  static getDefaultConfig(): ContentCleanConfig {
    return {
      modelId: 'mistralai/mistral-7b-instruct:free',
      enableRemoveAds: true,
      enableRemovePromotions: true,
      enableRemoveHeaders: true,
      enableRemoveFooters: true,
      enableRemoveSubscriptions: true,
      preserveFormatting: true,
    };
  }

  /**
   * 生成系统提示词
   */
  private static generateSystemPrompt(config: ContentCleanConfig): string {
    const features = [];
    
    if (config.enableRemoveAds) {
      features.push('广告内容');
    }
    if (config.enableRemovePromotions) {
      features.push('推广链接和营销内容');
    }
    if (config.enableRemoveHeaders) {
      features.push('文章头部的无关信息（如"关注我们"、"点击蓝字关注"等）');
    }
    if (config.enableRemoveFooters) {
      features.push('文章尾部的推广内容（如"扫码关注"、"更多精彩内容"等）');
    }
    if (config.enableRemoveSubscriptions) {
      features.push('重复的订阅提示和关注引导');
    }

    return `你是一个专业的内容清理专家。你的任务是清理文章内容，移除以下类型的无关信息：

${features.map(f => `- ${f}`).join('\n')}

清理要求：
1. 保留文章的核心内容和主要观点
2. 移除明显的广告、推广、订阅提示等干扰内容
3. ${config.preserveFormatting ? '尽量保持原文的段落结构和格式' : '可以适当调整段落结构'}
4. 不要添加任何新的内容或观点
5. 如果某段内容有价值但包含推广信息，保留有价值的部分，移除推广部分

请直接返回清理后的文章内容，不要添加任何解释或说明。`;
  }

  /**
   * 生成用户提示词
   */
  private static generateUserPrompt(content: string): string {
    return `请清理以下文章内容，移除广告、推广链接和无关信息：

${content}`;
  }

  /**
   * 清理单篇文章内容
   */
  static async cleanContent(
    content: string,
    config: ContentCleanConfig = {}
  ): Promise<ContentCleanResult> {
    try {
      // 验证输入
      if (!content || content.trim().length === 0) {
        return {
          success: false,
          originalContent: content,
          cleanedContent: content,
          removedSections: [],
          wordCountBefore: 0,
          wordCountAfter: 0,
          error: '输入内容为空',
        };
      }

      const originalWordCount = content.length;
      
      // 如果内容过短，直接返回
      if (originalWordCount < 100) {
        console.log('内容过短，跳过清理');
        return {
          success: true,
          originalContent: content,
          cleanedContent: content,
          removedSections: [],
          wordCountBefore: originalWordCount,
          wordCountAfter: originalWordCount,
          modelUsed: config.modelId,
        };
      }

      // 合并配置
      const finalConfig = { ...this.getDefaultConfig(), ...config };
      
      console.log(`🧹 开始清理内容: ${originalWordCount} 字符`);
      console.log(`🤖 使用模型: ${finalConfig.modelId}`);

      // 获取OpenRouter客户端
      const client = getOpenRouterClient(finalConfig.apiKey);
      
      // 检查API Key
      if (!client.hasApiKey()) {
        return {
          success: false,
          originalContent: content,
          cleanedContent: content,
          removedSections: [],
          wordCountBefore: originalWordCount,
          wordCountAfter: originalWordCount,
          error: 'OpenRouter API Key未配置',
        };
      }

      // 生成提示词
      const systemPrompt = this.generateSystemPrompt(finalConfig);
      const userPrompt = this.generateUserPrompt(content);

      // 调用AI清理
      const cleanedContent = await client.generateText(
        userPrompt,
        systemPrompt,
        finalConfig.modelId,
        {
          temperature: 0.3, // 较低温度保证一致性
          max_tokens: Math.min(4000, Math.ceil(originalWordCount * 1.2)), // 动态设置最大token
        }
      );

      const cleanedWordCount = cleanedContent.length;
      const reductionRatio = ((originalWordCount - cleanedWordCount) / originalWordCount * 100);

      console.log(`✅ 内容清理完成:`);
      console.log(`📝 原始长度: ${originalWordCount} 字符`);
      console.log(`🧹 清理后长度: ${cleanedWordCount} 字符`);
      console.log(`📊 减少比例: ${reductionRatio.toFixed(1)}%`);

      // 分析移除的内容（简单启发式方法）
      const removedSections = this.analyzeRemovedContent(content, cleanedContent);

      // 质量检查
      if (cleanedWordCount < originalWordCount * 0.3) {
        console.warn('⚠️  清理后内容过短，可能清理过度');
      }

      if (cleanedWordCount > originalWordCount * 0.95) {
        console.warn('⚠️  清理后内容变化很小，可能清理不充分');
      }

      return {
        success: true,
        originalContent: content,
        cleanedContent: cleanedContent.trim(),
        removedSections,
        wordCountBefore: originalWordCount,
        wordCountAfter: cleanedWordCount,
        modelUsed: finalConfig.modelId,
      };

    } catch (error: any) {
      console.error('❌ 内容清理失败:', error);
      
      return {
        success: false,
        originalContent: content,
        cleanedContent: content,
        removedSections: [],
        wordCountBefore: content.length,
        wordCountAfter: content.length,
        error: error.message || '内容清理失败',
        modelUsed: config.modelId,
      };
    }
  }

  /**
   * 批量清理多篇文章内容
   */
  static async batchCleanContent(
    contents: string[],
    config: ContentCleanConfig = {},
    options: {
      onProgress?: (completed: number, total: number, current: string) => void;
      maxConcurrent?: number;
      delayBetweenRequests?: number;
    } = {}
  ): Promise<ContentCleanResult[]> {
    const {
      onProgress,
      maxConcurrent = 2, // 限制并发数避免API限流
      delayBetweenRequests = 1000, // 请求间隔
    } = options;

    console.log(`🚀 开始批量清理 ${contents.length} 篇内容`);
    
    const results: ContentCleanResult[] = [];
    const chunks = [];

    // 将内容分成小块，控制并发数
    for (let i = 0; i < contents.length; i += maxConcurrent) {
      chunks.push(contents.slice(i, i + maxConcurrent));
    }

    for (const chunk of chunks) {
      // 并发处理当前块
      const chunkPromises = chunk.map(async (content, index) => {
        const globalIndex = results.length + index;
        console.log(`🧹 处理第 ${globalIndex + 1}/${contents.length} 篇内容`);
        
        const result = await this.cleanContent(content, config);
        
        // 调用进度回调
        if (onProgress) {
          onProgress(globalIndex + 1, contents.length, content.substring(0, 50) + '...');
        }
        
        return result;
      });

      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);

      // 如果不是最后一块，等待一段时间
      if (chunk !== chunks[chunks.length - 1]) {
        console.log(`⏱️  等待 ${delayBetweenRequests}ms 后继续...`);
        await this.delay(delayBetweenRequests);
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.length - successCount;
    
    console.log(`🏁 批量清理完成: 成功 ${successCount} 篇，失败 ${failedCount} 篇`);
    
    return results;
  }

  /**
   * 分析移除的内容（简单实现）
   */
  private static analyzeRemovedContent(original: string, cleaned: string): string[] {
    const removedSections: string[] = [];
    
    // 简单的启发式检测，实际应用中可以更精细
    const commonAdPatterns = [
      /关注.*公众号/,
      /扫码.*关注/,
      /点击.*蓝字/,
      /更多精彩内容/,
      /商务合作/,
      /广告/,
      /推广/,
      /订阅.*号/,
    ];

    const originalLines = original.split('\n').filter(line => line.trim());
    const cleanedLines = cleaned.split('\n').filter(line => line.trim());
    
    for (const line of originalLines) {
      if (!cleanedLines.some(cleanLine => cleanLine.includes(line.trim()))) {
        // 检查是否匹配广告模式
        const isAd = commonAdPatterns.some(pattern => pattern.test(line));
        if (isAd) {
          removedSections.push(line.trim());
        }
      }
    }

    return removedSections;
  }

  /**
   * 延迟函数
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 测试清理功能
   */
  static async testCleanFunction(config: ContentCleanConfig = {}): Promise<boolean> {
    const testContent = `
关注我们的公众号获取更多精彩内容

今天我们来谈谈人工智能的发展。人工智能是一个非常重要的技术领域，它正在改变我们的生活。

AI技术的应用包括机器学习、深度学习等。

商务合作请联系：xxx@example.com
扫码关注我们，获取更多资讯
    `.trim();

    try {
      const result = await this.cleanContent(testContent, config);
      
      if (result.success) {
        console.log('✅ 清理功能测试通过');
        console.log(`原始长度: ${result.wordCountBefore}, 清理后长度: ${result.wordCountAfter}`);
        return true;
      } else {
        console.error('❌ 清理功能测试失败:', result.error);
        return false;
      }
    } catch (error) {
      console.error('❌ 清理功能测试异常:', error);
      return false;
    }
  }
}

// 导出便捷方法
export const cleanContent = ContentCleanerService.cleanContent.bind(ContentCleanerService);
export const batchCleanContent = ContentCleanerService.batchCleanContent.bind(ContentCleanerService);
export const testCleanFunction = ContentCleanerService.testCleanFunction.bind(ContentCleanerService);

// 默认导出
export default ContentCleanerService;