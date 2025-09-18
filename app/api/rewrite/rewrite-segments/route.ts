import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, logApiRequest, logApiError, isValidUUID } from '../../../../lib/api-utils';
import RewriteService from '../../../../lib/rewrite-service';
import LiDanPromptService, { LiDanPromptConfig } from '../../../../lib/lidan-prompt-service';

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

// 模拟OpenRouter API调用（当没有真实API密钥时使用）
async function mockOpenRouterCall(prompt: string, content: string): Promise<string> {
  // 模拟API延迟
  await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
  
  // 使用本地模拟改写
  return RewriteService.mockRewriteSegment(content, 'lidan');
}

// 真实的OpenRouter API调用（当有API密钥时使用）
async function callOpenRouterAPI(prompt: string, model: string = 'openai/gpt-3.5-turbo'): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY 环境变量未配置');
  }
  
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://wx-content-management.app',
      'X-Title': 'WeChat Content Management'
    },
    body: JSON.stringify({
      model: model,
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
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`OpenRouter API 调用失败 (${model}): ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
  }
  
  const data = await response.json();
  
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('OpenRouter API 返回数据格式错误');
  }
  
  return data.choices[0].message.content.trim();
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
    
    const rewrittenSegments = [];
    const errors = [];
    let successCount = 0;
    let errorCount = 0;
    
    // 检查是否有OpenRouter API密钥
    const hasApiKey = !!process.env.OPENROUTER_API_KEY;
    const modelToUse = aiModel || 'openai/gpt-3.5-turbo';
    console.log(`🔑 OpenRouter API 状态: ${hasApiKey ? '已配置' : '未配置，将使用模拟改写'}`);
    console.log(`🤖 使用模型: ${modelToUse}`);
    
    // 分批处理段落（并行处理提高效率）
    for (let i = 0; i < segments.length; i += batchSize) {
      const batch = segments.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (segment) => {
        try {
          console.log(`📝 改写段落 ${segment.order}: ${segment.content.substring(0, 50)}...`);
          
          let rewrittenContent = '';
          
          if (hasApiKey) {
            // 使用真实API
            const prompt = customPrompt || 
              (styleConfig ? LiDanPromptService.generateCustomPrompt(styleConfig) : LiDanPromptService.generateBasePrompt()) +
              `\n\n需要改写的文字：\n${segment.content}`;
            
            rewrittenContent = await callOpenRouterAPI(prompt, modelToUse);
          } else {
            // 使用模拟改写
            const prompt = LiDanPromptService.generateSegmentPrompt(segment.content, styleConfig);
            rewrittenContent = await mockOpenRouterCall(prompt, segment.content);
          }
          
          // 计算改写质量
          const qualityScore = RewriteService.evaluateQuality(segment.content, rewrittenContent);
          
          return {
            id: segment.id,
            order: segment.order,
            originalContent: segment.content,
            rewrittenContent: rewrittenContent.trim(),
            wordCount: rewrittenContent.length,
            rewriteStatus: 'completed' as const,
            qualityScore: qualityScore.overallScore,
            apiUsed: hasApiKey ? 'openrouter' : 'mock',
            modelUsed: hasApiKey ? modelToUse : 'mock'
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
            apiUsed: hasApiKey ? 'openrouter' : 'mock',
            modelUsed: hasApiKey ? modelToUse : 'mock'
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      rewrittenSegments.push(...batchResults);
      
      // 统计成功数量
      successCount += batchResults.filter(r => r.rewriteStatus === 'completed').length;
      
      // 小延迟避免API限流
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
      apiMode: hasApiKey ? 'real' : 'mock',
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
      message: hasApiKey 
        ? `段落改写完成！成功改写 ${successCount} 个段落，失败 ${errorCount} 个`
        : `模拟改写完成！成功改写 ${successCount} 个段落（请配置 OPENROUTER_API_KEY 使用真实AI改写）`,
      config: {
        batchSize,
        apiMode: hasApiKey ? 'real' : 'mock',
        modelUsed: modelToUse,
        styleConfig
      }
    });
    
  } catch (error: any) {
    logApiError('POST', '/api/rewrite/rewrite-segments', error);
    return createErrorResponse(`段落改写失败: ${error.message}`, 500);
  }
}