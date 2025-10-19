import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, logApiRequest, logApiError, isValidUUID } from '../../../../lib/api-utils';
import RewriteService from '../../../../lib/rewrite-service';
import LiDanPromptService, { LiDanPromptConfig } from '../../../../lib/lidan-prompt-service';
import { getOpenRouterClient } from '../../../../lib/openrouter-client';
import { getAIConfig } from '../../../../lib/ai-config';

// 处理OPTIONS预检请求
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}

// POST: 改写文章段落
export async function POST(request: NextRequest) {
  try {
    logApiRequest('POST', '/api/rewrite/rewrite-segments');
    
    const body = await request.json();
    
    // 验证必需字段
    if (!body.articleId || typeof body.articleId !== 'string') {
      return createErrorResponse('articleId 是必需的字符串字段', 400);
    }
    
    if (!isValidUUID(body.articleId)) {
      return createErrorResponse('articleId 必须是有效的UUID格式', 400);
    }
    
    if (!body.segments || !Array.isArray(body.segments) || body.segments.length === 0) {
      return createErrorResponse('segments 必须是非空数组', 400);
    }
    
    // 验证segments格式
    for (let i = 0; i < body.segments.length; i++) {
      const segment = body.segments[i];
      if (!segment.id || typeof segment.id !== 'string') {
        return createErrorResponse(`segments[${i}].id 是必需的字符串字段`, 400);
      }
      if (!segment.content || typeof segment.content !== 'string') {
        return createErrorResponse(`segments[${i}].content 是必需的字符串字段`, 400);
      }
      if (typeof segment.order !== 'number' || segment.order < 1) {
        return createErrorResponse(`segments[${i}].order 必须是正整数`, 400);
      }
    }
    
    if (!body.style || body.style !== 'lidan') {
      return createErrorResponse('style 目前只支持 "lidan"', 400);
    }
    
    const {
      articleId,
      segments,
      style,
      customPrompt,
      batchSize = 3,
      styleConfig,
      aiModel
    }: {
      articleId: string;
      segments: Array<{id: string; content: string; order: number}>;
      style: 'lidan';
      customPrompt?: string;
      batchSize?: number;
      styleConfig?: LiDanPromptConfig;
      aiModel?: string;
    } = body;
    
    // 验证批处理大小
    if (batchSize < 1 || batchSize > 10) {
      return createErrorResponse('batchSize 必须在 1-10 之间', 400);
    }
    
    console.log(`🎭 开始改写段落: ${articleId}, 共 ${segments.length} 个段落, 风格: ${style}${aiModel ? `, 模型: ${aiModel}` : ''}`);

    const rewrittenSegments: any[] = [];
    const errors: string[] = [];
    let successCount = 0;
    let errorCount = 0;

    // 🔥 关键修改：使用统一的 AI 配置和客户端
    const aiConfig = getAIConfig();
    const hasAvailableService = aiConfig.hasAvailableService();
    const modelToUse = aiModel || 'openai/gpt-3.5-turbo';

    console.log(`🔑 AI 服务状态: ${hasAvailableService ? '已配置' : '未配置，将使用模拟改写'}`);
    console.log(`🤖 使用模型: ${modelToUse}`);

    // 分批处理段落
    for (let i = 0; i < segments.length; i += batchSize) {
      const batch = segments.slice(i, i + batchSize);

      const batchPromises = batch.map(async (segment) => {
        try {
          console.log(`📝 改写段落 ${segment.order}: ${segment.content.substring(0, 50)}...`);

          let rewrittenContent = '';
          let apiUsed = 'mock';
          let modelUsed = 'mock';

          if (hasAvailableService) {
            // 🔥 使用统一客户端进行改写
            const client = getOpenRouterClient();
            const prompt = customPrompt ||
              (styleConfig ?
                LiDanPromptService.generateCustomPrompt(styleConfig) :
                LiDanPromptService.generateBasePrompt()) +
              `\n\n需要改写的文字：\n${segment.content}`;

            // 使用带降级的调用方法
            const response = await client.chatCompletionWithFallback({
              model: modelToUse,
              messages: [
                {
                  role: 'system',
                  content: '你是专业的李诞风格文案改写助手。'
                },
                {
                  role: 'user',
                  content: prompt
                }
              ],
              temperature: 0.8,
              max_tokens: 2000
            });

            rewrittenContent = response.choices[0]?.message?.content?.trim() || '';
            const primaryService = aiConfig.getPrimaryService();
            apiUsed = primaryService?.name || 'unknown';
            modelUsed = modelToUse;

          } else {
            // 降级到模拟改写
            const prompt = LiDanPromptService.generateSegmentPrompt(segment.content, styleConfig);
            rewrittenContent = RewriteService.mockRewriteSegment(segment.content, style);
          }

          // 计算改写质量
          const qualityScore = RewriteService.evaluateQuality(segment.content, rewrittenContent);

          successCount++;
          return {
            id: segment.id,
            order: segment.order,
            originalContent: segment.content,
            rewrittenContent: rewrittenContent,
            wordCount: rewrittenContent.length,
            rewriteStatus: 'completed' as const,
            qualityScore: qualityScore.overallScore,
            apiUsed,
            modelUsed
          };

        } catch (error: any) {
          console.error(`❌ 段落 ${segment.order} 改写失败:`, error.message);
          errorCount++;
          errors.push(`段落 ${segment.order}: ${error.message}`);

          return {
            id: segment.id,
            order: segment.order,
            originalContent: segment.content,
            rewrittenContent: '',
            wordCount: 0,
            rewriteStatus: 'failed' as const,
            qualityScore: 0,
            error: error.message,
            apiUsed: 'none',
            modelUsed: 'none'
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      rewrittenSegments.push(...batchResults);

      // 小延迟避免限流
      if (i + batchSize < segments.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // 按顺序排序
    rewrittenSegments.sort((a, b) => a.order - b.order);
    
    console.log(`✅ 改写完成: 成功 ${successCount}, 失败 ${errorCount}`);
    
    // 构造响应结果
    const result = {
      articleId,
      style,
      totalSegments: segments.length,
      successCount,
      errorCount,
      apiMode: hasAvailableService ? 'real' : 'mock',
      segments: rewrittenSegments,
      summary: {
        averageQuality: rewrittenSegments
          .filter(s => s.rewriteStatus === 'completed')
          .reduce((sum, s) => sum + s.qualityScore, 0) / Math.max(successCount, 1),
        totalOriginalWords: segments.reduce((sum, s) => sum + s.content.length, 0),
        totalRewrittenWords: rewrittenSegments.reduce((sum, s) => sum + s.wordCount, 0)
      },
      errors: errors.length > 0 ? errors : undefined
    };
    
    return createSuccessResponse(result, {
      message: hasAvailableService
        ? `段落改写完成！成功改写 ${successCount} 个段落，失败 ${errorCount} 个`
        : `模拟改写完成！成功改写 ${successCount} 个段落（请配置 AI_API_KEY 使用真实AI改写）`,
      config: {
        batchSize,
        apiMode: hasAvailableService ? 'real' : 'mock',
        modelUsed: modelToUse,
        styleConfig
      }
    });
    
  } catch (error: any) {
    logApiError('POST', '/api/rewrite/rewrite-segments', error);
    return createErrorResponse(`段落改写失败: ${error.message}`, 500);
  }
}