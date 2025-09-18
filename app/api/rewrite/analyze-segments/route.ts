import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, logApiRequest, logApiError } from '../../../../lib/api-utils';
import RewriteService, { AnalyzeSegmentsParams } from '../../../../lib/rewrite-service';
import { isValidUUID } from '../../../../lib/api-utils';
import type { SegmentStrategy } from '../../../../src/types/rewrite';

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

// POST: 分析文章并进行分段
export async function POST(request: NextRequest) {
  try {
    logApiRequest('POST', '/api/rewrite/analyze-segments');
    
    const body = await request.json();
    
    // 验证必需字段
    if (!body.articleId || typeof body.articleId !== 'string') {
      return createErrorResponse('articleId 是必需的字符串字段', 400);
    }
    
    if (!isValidUUID(body.articleId)) {
      return createErrorResponse('articleId 必须是有效的UUID格式', 400);
    }
    
    if (!body.content || typeof body.content !== 'string') {
      return createErrorResponse('content 是必需的字符串字段', 400);
    }
    
    if (body.content.trim().length === 0) {
      return createErrorResponse('文章内容不能为空', 400);
    }
    
    if (!body.segmentStrategy || body.segmentStrategy !== 'ai') {
      return createErrorResponse('仅支持AI智能分段策略 (ai)', 400);
    }
    
    const {
      articleId,
      content,
      segmentStrategy,
      maxSegmentLength = 1500,
      minSegmentLength = 500,
      aiModel
    }: {
      articleId: string;
      content: string;
      segmentStrategy: SegmentStrategy;
      maxSegmentLength?: number;
      minSegmentLength?: number;
      aiModel?: string;
    } = body;
    
    // 验证分段长度参数
    if (maxSegmentLength < 500 || maxSegmentLength > 3000) {
      return createErrorResponse('maxSegmentLength 必须在 500-3000 之间', 400);
    }
    
    if (minSegmentLength < 200 || minSegmentLength > 1000) {
      return createErrorResponse('minSegmentLength 必须在 200-1000 之间', 400);
    }
    
    if (minSegmentLength >= maxSegmentLength) {
      return createErrorResponse('minSegmentLength 必须小于 maxSegmentLength', 400);
    }
    
    console.log(`🔍 开始AI智能分段分析: ${articleId}, 模型: ${aiModel || '未指定'}`);
    
    // 验证AI分段必需的模型参数
    if (!aiModel) {
      return createErrorResponse('AI智能分段需要指定模型ID (aiModel)', 400);
    }
    
    console.log(`🤖 使用指定AI模型进行分段: ${aiModel}`);
    
    // 执行文章分段分析
    const params: AnalyzeSegmentsParams = {
      articleId,
      content,
      segmentStrategy,
      maxSegmentLength,
      minSegmentLength,
      aiModel
    };
    
    const segments = await RewriteService.analyzeSegments(params);
    
    console.log(`✅ 分段完成: 共 ${segments.length} 个段落`);
    
    // 构造响应数据
    const result = {
      articleId,
      strategy: segmentStrategy,
      totalSegments: segments.length,
      totalWords: content.length,
      averageWordsPerSegment: Math.round(segments.reduce((sum, s) => sum + s.wordCount, 0) / segments.length),
      segments: segments.map(segment => ({
        id: segment.id,
        order: segment.order,
        originalContent: segment.originalContent,
        wordCount: segment.wordCount,
        rewriteStatus: segment.rewriteStatus
      })),
      config: {
        maxSegmentLength,
        minSegmentLength,
        strategy: segmentStrategy,
        aiModel: aiModel
      }
    };
    
    return createSuccessResponse(result, {
      message: `文章分段完成，共生成 ${segments.length} 个段落`,
      analysis: {
        originalLength: content.length,
        segmentCount: segments.length,
        averageSegmentLength: result.averageWordsPerSegment,
        strategy: segmentStrategy
      }
    });
    
  } catch (error: any) {
    logApiError('POST', '/api/rewrite/analyze-segments', error);
    
    if (error.message.includes('不支持的分段策略')) {
      return createErrorResponse(error.message, 400);
    }
    
    return createErrorResponse(`文章分段分析失败: ${error.message}`, 500);
  }
}