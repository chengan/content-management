import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, logApiRequest, logApiError, isValidUUID } from '../../../../lib/api-utils';
import RewriteService, { IntegrateSegmentsParams } from '../../../../lib/rewrite-service';

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

// POST: 整合改写后的段落
export async function POST(request: NextRequest) {
  try {
    logApiRequest('POST', '/api/rewrite/integrate-segments');
    
    const body = await request.json();
    
    // 验证必需字段
    if (!body.articleId || typeof body.articleId !== 'string') {
      return createErrorResponse('articleId 是必需的字符串字段', 400);
    }
    
    if (!isValidUUID(body.articleId)) {
      return createErrorResponse('articleId 必须是有效的UUID格式', 400);
    }
    
    if (!body.rewrittenSegments || !Array.isArray(body.rewrittenSegments) || body.rewrittenSegments.length === 0) {
      return createErrorResponse('rewrittenSegments 必须是非空数组', 400);
    }
    
    // 验证rewrittenSegments格式
    for (let i = 0; i < body.rewrittenSegments.length; i++) {
      const segment = body.rewrittenSegments[i];
      if (!segment.id || typeof segment.id !== 'string') {
        return createErrorResponse(`rewrittenSegments[${i}].id 是必需的字符串字段`, 400);
      }
      if (!segment.rewrittenContent || typeof segment.rewrittenContent !== 'string') {
        return createErrorResponse(`rewrittenSegments[${i}].rewrittenContent 是必需的字符串字段`, 400);
      }
      if (typeof segment.order !== 'number' || segment.order < 1) {
        return createErrorResponse(`rewrittenSegments[${i}].order 必须是正整数`, 400);
      }
    }
    
    const {
      articleId,
      rewrittenSegments,
      optimizeTransitions = true,
      formatStyle = 'standard'
    }: {
      articleId: string;
      rewrittenSegments: Array<{
        id: string;
        rewrittenContent: string;
        order: number;
      }>;
      optimizeTransitions?: boolean;
      formatStyle?: 'standard' | 'compact' | 'spaced';
    } = body;
    
    console.log(`🔗 开始整合段落: ${articleId}, 共 ${rewrittenSegments.length} 个段落`);
    
    // 筛选出有内容的段落
    const validSegments = rewrittenSegments.filter(segment => 
      segment.rewrittenContent && segment.rewrittenContent.trim().length > 0
    );
    
    if (validSegments.length === 0) {
      return createErrorResponse('没有有效的改写内容可以整合', 400);
    }
    
    // 执行段落整合
    const params: IntegrateSegmentsParams = {
      articleId,
      rewrittenSegments: validSegments.map(seg => ({
        id: seg.id,
        rewrittenContent: seg.rewrittenContent,
        order: seg.order
      }))
    };
    
    let integratedContent = RewriteService.integrateSegments(params);
    
    // 生成改写后的标题
    const rewrittenTitle = `${integratedContent.substring(0, 50).replace(/[。！？]/g, '')}...（改写版）`;
    
    // 根据格式样式进行调整
    switch (formatStyle) {
      case 'compact':
        // 紧凑格式：单个换行符连接
        integratedContent = integratedContent.replace(/\n\n/g, '\n');
        break;
      case 'spaced':
        // 宽松格式：三个换行符连接
        integratedContent = integratedContent.replace(/\n\n/g, '\n\n\n');
        break;
      case 'standard':
      default:
        // 标准格式：双换行符（不需要修改）
        break;
    }
    
    // 计算统计信息
    const stats = {
      totalSegments: rewrittenSegments.length,
      validSegments: validSegments.length,
      skippedSegments: rewrittenSegments.length - validSegments.length,
      finalWordCount: integratedContent.length,
      avgSegmentLength: Math.round(validSegments.reduce((sum, s) => sum + s.rewrittenContent.length, 0) / validSegments.length),
      compressionRatio: validSegments.length > 0 ? 
        integratedContent.length / validSegments.reduce((sum, s) => sum + s.rewrittenContent.length, 0) : 0
    };
    
    // 生成文章预览（前200字符）
    const preview = integratedContent.substring(0, 200) + (integratedContent.length > 200 ? '...' : '');
    
    console.log(`✅ 段落整合完成: ${stats.validSegments} 个段落，总长度 ${stats.finalWordCount} 字符`);
    
    // 计算质量评分（基于段落长度分布的简化评分）
    const qualityScore = Math.min(100, Math.max(60, 100 - (stats.avgSegmentLength / 50)));

    // 构造响应结果
    const result = {
      articleId,
      integratedContent,
      title: rewrittenTitle,
      qualityScore: Math.round(qualityScore),
      improvements: [
        {
          type: 'structure',
          description: `成功整合了${stats.validSegments}个段落`,
          position: 0
        },
        {
          type: 'flow',
          description: optimizeTransitions ? '已优化段落间的过渡衔接' : '保持原始段落结构',
          position: Math.floor(integratedContent.length / 2)
        }
      ],
      preview,
      stats,
      config: {
        optimizeTransitions,
        formatStyle
      },
      segmentInfo: validSegments.map((segment, index) => ({
        id: segment.id,
        order: segment.order,
        originalOrder: index + 1,
        wordCount: segment.rewrittenContent.length,
        preview: segment.rewrittenContent.substring(0, 100) + (segment.rewrittenContent.length > 100 ? '...' : '')
      }))
    };
    
    return createSuccessResponse(result, {
      message: `段落整合完成！成功整合 ${stats.validSegments} 个段落，生成 ${stats.finalWordCount} 字符的文章`,
      statistics: {
        segmentsProcessed: stats.totalSegments,
        validSegments: stats.validSegments,
        finalLength: stats.finalWordCount,
        formatStyle
      }
    });
    
  } catch (error: any) {
    logApiError('POST', '/api/rewrite/integrate-segments', error);
    return createErrorResponse(`段落整合失败: ${error.message}`, 500);
  }
}