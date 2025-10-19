import type {
  RewriteSegment,
  SegmentData,
  SegmentStrategy,
  QualityScore,
  RewriteConfig
} from '../src/types/rewrite';
import { getOpenRouterClient } from './openrouter-client';

export interface AnalyzeSegmentsParams {
  articleId: string;
  content: string;
  segmentStrategy: SegmentStrategy;
  maxSegmentLength?: number;
  minSegmentLength?: number;
  aiModel?: string; // AI分段时使用的模型
}

export interface RewriteSegmentsParams {
  articleId: string;
  segments: Array<{
    id: string;
    content: string;
    order: number;
  }>;
  style: 'lidan';
  customPrompt?: string;
  batchSize?: number;
  aiModel?: string; // 改写时使用的模型
}

export interface IntegrateSegmentsParams {
  articleId: string;
  rewrittenSegments: Array<{
    id: string;
    rewrittenContent: string;
    order: number;
  }>;
}

export class RewriteService {
  
  /**
   * 分析文章并进行AI智能分段
   */
  static async analyzeSegments(params: AnalyzeSegmentsParams): Promise<Array<SegmentData>> {
    const { content, segmentStrategy, maxSegmentLength = 1500, minSegmentLength = 500, aiModel } = params;
    
    console.log(`🔍 开始AI智能分段，文章长度: ${content.length}字，使用模型: ${aiModel || '未指定'}`);
    
    if (segmentStrategy !== 'ai') {
      throw new Error('仅支持AI智能分段策略');
    }
    
    if (!aiModel) {
      throw new Error('AI分段需要指定模型ID');
    }
    
    const segments = await this.aiSegmentation(content, maxSegmentLength, minSegmentLength, aiModel);
    
    return segments.map((segment, index) => ({
      ...segment,
      id: `segment_${Date.now()}_${index}`,
      order: index + 1,
      rewriteStatus: 'pending' as const
    }));
  }
  
  /**
   * 语义分段：根据段落和语义单元进行分段
   */
  private static semanticSegmentation(content: string, maxLength: number, minLength: number): Array<Omit<SegmentData, 'id' | 'order' | 'rewriteStatus'>> {
    // 首先按段落分割
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const segments: Array<Omit<SegmentData, 'id' | 'order' | 'rewriteStatus'>> = [];
    
    let currentSegment = '';
    
    for (const paragraph of paragraphs) {
      const trimmedParagraph = paragraph.trim();
      
      // 如果当前段落加上现有段落超过最大长度，则保存当前段落
      if (currentSegment.length > 0 && (currentSegment.length + trimmedParagraph.length) > maxLength) {
        if (currentSegment.length >= minLength) {
          segments.push({
            originalContent: currentSegment.trim(),
            rewrittenContent: '',
            wordCount: currentSegment.length
          });
          currentSegment = trimmedParagraph;
        } else {
          // 如果当前段落太短，继续添加
          currentSegment += '\n\n' + trimmedParagraph;
        }
      } else {
        // 添加到当前段落
        if (currentSegment.length > 0) {
          currentSegment += '\n\n' + trimmedParagraph;
        } else {
          currentSegment = trimmedParagraph;
        }
      }
    }
    
    // 处理最后一个段落
    if (currentSegment.trim().length > 0) {
      if (currentSegment.length < minLength && segments.length > 0) {
        // 如果最后一个段落太短，合并到前一个段落
        segments[segments.length - 1].originalContent += '\n\n' + currentSegment.trim();
        segments[segments.length - 1].wordCount = segments[segments.length - 1].originalContent.length;
      } else {
        segments.push({
          originalContent: currentSegment.trim(),
          wordCount: currentSegment.length
        });
      }
    }
    
    return segments;
  }
  
  /**
   * AI智能分段：使用AI模型分析文章结构进行分段
   * 🔄 v2.0: 使用统一的 AI 客户端，支持多服务降级
   */
  private static async aiSegmentation(
    content: string,
    maxLength: number,
    minLength: number,
    aiModel: string
  ): Promise<Array<Omit<SegmentData, 'id' | 'order' | 'rewriteStatus'>>> {

    console.log(`🤖 开始 AI 智能分段`);
    console.log(`   模型: ${aiModel}`);
    console.log(`   文章长度: ${content.length}字`);
    console.log(`   分段长度范围: ${minLength}-${maxLength}字`);

    const prompt = `你是专业的文章结构分析专家。请分析以下文章，并按照语义完整性将其分成若干段落。

要求：
1. 每个段落应该包含完整的主题或观点
2. 段落之间有清晰的逻辑边界
3. 每段长度在${minLength}-${maxLength}字之间（允许适当超出）
4. 保持原文的完整性，不要遗漏内容
5. 返回JSON格式，包含segments数组，每个segment包含content、reason字段

文章内容：
${content}

请返回JSON格式的分段结果：
{
  "segments": [
    {
      "content": "段落内容",
      "reason": "分段理由"
    }
  ]
}`;

    try {
      // 🔥 关键修改：统一使用客户端调用
      const client = getOpenRouterClient();

      // 使用带降级的调用方法
      const response = await client.chatCompletionWithFallback({
        model: aiModel,
        messages: [
          {
            role: 'system',
            content: '你是专业的文章结构分析专家。请分析文章并返回JSON格式的分段结果。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 4000
      });

      const responseContent = response.choices[0]?.message?.content;
      if (!responseContent) {
        throw new Error('AI 返回内容为空');
      }

      console.log(`📝 AI返回内容长度: ${responseContent.length}字符`);

      // 解析 JSON 结果
      let result;
      try {
        result = JSON.parse(responseContent);
      } catch (parseError) {
        console.error('JSON解析失败，原始内容:', responseContent);
        throw new Error(`AI分段结果JSON解析失败: ${parseError}`);
      }

      if (!result.segments || !Array.isArray(result.segments)) {
        throw new Error('AI分段结果格式错误：缺少segments数组');
      }

      console.log(`🔢 AI分段结果: 共${result.segments.length}个段落`);

      // 转换为标准格式
      const segments: Array<Omit<SegmentData, 'id' | 'order' | 'rewriteStatus'>> =
        result.segments.map((seg: any, index: number) => {
          if (!seg.content || typeof seg.content !== 'string') {
            throw new Error(`段落${index + 1}格式错误：缺少content字段`);
          }

          const segmentContent = seg.content.trim();
          console.log(`   段落${index + 1}: ${segmentContent.length}字 - ${seg.reason || '无理由'}`);

          return {
            originalContent: segmentContent,
            wordCount: segmentContent.length,
            reason: seg.reason || 'AI智能分段'
          };
        });

      // 验证分段结果
      const totalSegmentLength = segments.reduce((sum, seg) => sum + seg.wordCount, 0);
      const originalLength = content.length;
      const lengthDifference = Math.abs(totalSegmentLength - originalLength);
      const lengthDifferencePercent = (lengthDifference / originalLength) * 100;

      console.log(`📊 分段内容验证:`);
      console.log(`   原文长度: ${originalLength}字`);
      console.log(`   分段总长度: ${totalSegmentLength}字`);
      console.log(`   差异: ${lengthDifference}字 (${lengthDifferencePercent.toFixed(1)}%)`);

      if (lengthDifferencePercent > 10) {
        console.warn(`⚠️  内容长度差异较大(${lengthDifferencePercent.toFixed(1)}%)`);
        throw new Error(
          `AI分段存在较大内容差异(${lengthDifferencePercent.toFixed(1)}%)，请检查模型输出`
        );
      }

      console.log(`✅ AI智能分段完成，生成 ${segments.length} 个段落`);
      return segments;

    } catch (error: any) {
      console.error(`❌ AI分段失败:`, error.message);

      // 提供更友好的错误信息
      if (error.message.includes('未配置任何 AI 服务')) {
        throw new Error('AI 服务未配置，请在 .env.local 中配置 AI_API_KEY 和 AI_API_BASE_URL');
      }

      throw new Error(`AI分段失败: ${error.message}`);
    }
  }
  
  /**
   * 整合改写后的段落
   */
  static integrateSegments(params: IntegrateSegmentsParams): string {
    const { rewrittenSegments } = params;
    
    // 按顺序排序
    const sortedSegments = rewrittenSegments.sort((a, b) => a.order - b.order);
    
    // 简单整合，用双换行连接
    let integratedContent = sortedSegments
      .map(segment => segment.rewrittenContent.trim())
      .join('\n\n');
    
    // 优化段落衔接
    integratedContent = this.optimizeTransitions(integratedContent);
    
    return integratedContent;
  }
  
  /**
   * 优化段落衔接
   */
  private static optimizeTransitions(content: string): string {
    // 简单的衔接词添加逻辑
    const transitionWords = [
      '此外', '另外', '同时', '然而', '不过', '因此', '所以', '总之', '总的来说', '综上所述'
    ];
    
    const paragraphs = content.split('\n\n');
    if (paragraphs.length <= 1) return content;
    
    // 在部分段落开头添加衔接词（随机，不是每个段落都添加）
    for (let i = 1; i < paragraphs.length; i++) {
      if (Math.random() < 0.3 && paragraphs[i].length > 50) { // 30%的概率添加衔接词
        const randomTransition = transitionWords[Math.floor(Math.random() * transitionWords.length)];
        // 只有当段落开头不是衔接词时才添加
        if (!transitionWords.some(word => paragraphs[i].startsWith(word))) {
          paragraphs[i] = randomTransition + '，' + paragraphs[i];
        }
      }
    }
    
    return paragraphs.join('\n\n');
  }
  
  /**
   * 评估改写质量
   */
  static evaluateQuality(originalContent: string, rewrittenContent: string): QualityScore {
    // 计算原创度（简化版本：基于字符重复度）
    const originality = this.calculateOriginality(originalContent, rewrittenContent);
    
    // 计算流畅度（基于句子长度和标点符号分布）
    const fluency = this.calculateFluency(rewrittenContent);
    
    // 计算风格一致性（李诞风格特征检测）
    const styleConsistency = this.calculateStyleConsistency(rewrittenContent);
    
    // 计算可读性
    const readability = this.calculateReadability(rewrittenContent);
    
    // 综合评分
    const overallScore = (originality * 0.3 + fluency * 0.25 + styleConsistency * 0.25 + readability * 0.2);
    
    return {
      overallScore: Math.round(overallScore * 100) / 100,
      originality: Math.round(originality * 100) / 100,
      fluency: Math.round(fluency * 100) / 100,
      styleConsistency: Math.round(styleConsistency * 100) / 100,
      readability: Math.round(readability * 100) / 100,
      suggestions: this.generateSuggestions(originality, fluency, styleConsistency, readability)
    };
  }
  
  /**
   * 计算原创度
   */
  private static calculateOriginality(original: string, rewritten: string): number {
    const originalWords = original.replace(/[^\w\s]/g, '').split(/\s+/);
    const rewrittenWords = rewritten.replace(/[^\w\s]/g, '').split(/\s+/);
    
    const commonWords = originalWords.filter(word => 
      word.length > 1 && rewrittenWords.includes(word)
    ).length;
    
    const totalWords = Math.max(originalWords.length, rewrittenWords.length);
    const similarity = totalWords > 0 ? commonWords / totalWords : 0;
    
    return Math.max(0, 1 - similarity); // 原创度 = 1 - 相似度
  }
  
  /**
   * 计算流畅度
   */
  private static calculateFluency(content: string): number {
    const sentences = content.split(/[。！？]/).filter(s => s.trim().length > 0);
    
    if (sentences.length === 0) return 0;
    
    // 计算句子长度的标准差（句子长度越均匀，流畅度越高）
    const avgLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;
    const variance = sentences.reduce((sum, s) => sum + Math.pow(s.length - avgLength, 2), 0) / sentences.length;
    const stdDev = Math.sqrt(variance);
    
    // 标准差越小，流畅度越高
    const fluencyScore = Math.max(0, 1 - (stdDev / avgLength));
    
    return Math.min(1, fluencyScore);
  }
  
  /**
   * 计算风格一致性（李诞风格）
   */
  private static calculateStyleConsistency(content: string): number {
    let score = 0.5; // 基础分
    
    // 李诞风格特征检测
    const lidanFeatures = [
      /人生/, /生活/, /世界/, /孤独/, /无奈/, /真相/, /幻觉/, /现实/,
      /不过/, /然而/, /说起来/, /其实/, /毕竟/, /总之/,
      /可能/, /大概/, /或许/, /应该/, /也许/,
      /朋友/, /师父/, /小北/
    ];
    
    let featureCount = 0;
    for (const feature of lidanFeatures) {
      if (feature.test(content)) {
        featureCount++;
      }
    }
    
    // 特征越多，风格一致性越高
    score += (featureCount / lidanFeatures.length) * 0.5;
    
    return Math.min(1, score);
  }
  
  /**
   * 计算可读性
   */
  private static calculateReadability(content: string): number {
    const sentences = content.split(/[。！？]/).filter(s => s.trim().length > 0);
    const words = content.replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 0);
    
    if (sentences.length === 0 || words.length === 0) return 0;
    
    const avgWordsPerSentence = words.length / sentences.length;
    const avgCharsPerWord = words.reduce((sum, w) => sum + w.length, 0) / words.length;
    
    // 理想的中文句子长度约10-20个词，每个词约2-3个字符
    const sentenceLengthScore = Math.max(0, 1 - Math.abs(avgWordsPerSentence - 15) / 15);
    const wordLengthScore = Math.max(0, 1 - Math.abs(avgCharsPerWord - 2.5) / 2.5);
    
    return (sentenceLengthScore + wordLengthScore) / 2;
  }
  
  /**
   * 生成改写建议
   */
  private static generateSuggestions(originality: number, fluency: number, styleConsistency: number, readability: number): string[] {
    const suggestions: string[] = [];
    
    if (originality < 0.7) {
      suggestions.push('建议增加更多原创表达，减少与原文的直接重复');
    }
    
    if (fluency < 0.7) {
      suggestions.push('建议调整句子长度，使表达更加流畅自然');
    }
    
    if (styleConsistency < 0.7) {
      suggestions.push('建议增加更多李诞式的幽默表达和人生感悟');
    }
    
    if (readability < 0.7) {
      suggestions.push('建议简化复杂句式，提高文章可读性');
    }
    
    if (suggestions.length === 0) {
      suggestions.push('改写质量良好，各项指标均符合标准');
    }
    
    return suggestions;
  }
  
  /**
   * 模拟AI改写（用于没有真实API密钥的情况）
   */
  static mockRewriteSegment(segment: string, style: string): string {
    // 这是一个简化的模拟改写，实际使用中会调用真实的AI API
    const templates = [
      (text: string) => `说起来，${text}。不过这事儿吧，也就那么回事。`,
      (text: string) => `${text}，人生就是这样，总有些事情让人哭笑不得。`,
      (text: string) => `朋友们，${text}。这大概就是生活的真相了。`,
      (text: string) => `${text}。毕竟在这个世界上，什么事都有可能发生。`,
      (text: string) => `其实${text}这件事，挺有意思的，至少比看电视剧有趣。`
    ];
    
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
    
    // 简化原文（移除部分词汇，改变表达方式）
    let simplified = segment
      .replace(/因此|所以|因为/g, '不过')
      .replace(/但是|然而/g, '说起来')
      .replace(/非常|特别|十分/g, '挺')
      .replace(/重要|关键|核心/g, '有意思');
    
    return randomTemplate(simplified);
  }
}

export default RewriteService;