import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, logApiRequest, logApiError } from '../../../../lib/api-utils';
import RewriteService from '../../../../lib/rewrite-service';

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

// POST: 评估改写质量
export async function POST(request: NextRequest) {
  try {
    logApiRequest('POST', '/api/rewrite/evaluate-quality');
    
    const body = await request.json();
    
    // 验证必需字段
    if (!body.originalContent || typeof body.originalContent !== 'string') {
      return createErrorResponse('originalContent 是必需的字符串字段', 400);
    }
    
    if (!body.rewrittenContent || typeof body.rewrittenContent !== 'string') {
      return createErrorResponse('rewrittenContent 是必需的字符串字段', 400);
    }
    
    if (body.originalContent.trim().length === 0) {
      return createErrorResponse('原文内容不能为空', 400);
    }
    
    if (body.rewrittenContent.trim().length === 0) {
      return createErrorResponse('改写内容不能为空', 400);
    }
    
    const {
      originalContent,
      rewrittenContent,
      articleId,
      evaluationType = 'comprehensive',
      weightConfig
    }: {
      originalContent: string;
      rewrittenContent: string;
      articleId?: string;
      evaluationType?: 'comprehensive' | 'style-focused' | 'quality-focused';
      weightConfig?: {
        originality?: number;
        fluency?: number;
        styleConsistency?: number;
        readability?: number;
      };
    } = body;
    
    console.log(`📊 开始质量评估: ${articleId || '未知文章'}, 类型: ${evaluationType}`);
    
    // 执行质量评估
    const qualityScore = RewriteService.evaluateQuality(originalContent, rewrittenContent);
    
    // 根据评估类型调整权重
    let adjustedScore = qualityScore;
    
    if (evaluationType === 'style-focused') {
      // 风格导向：更重视风格一致性和流畅度
      const weights = weightConfig || { originality: 0.2, fluency: 0.3, styleConsistency: 0.4, readability: 0.1 };
      adjustedScore.overallScore = 
        qualityScore.originality * weights.originality +
        qualityScore.fluency * weights.fluency +
        qualityScore.styleConsistency * weights.styleConsistency +
        qualityScore.readability * weights.readability;
    } else if (evaluationType === 'quality-focused') {
      // 质量导向：更重视原创度和可读性
      const weights = weightConfig || { originality: 0.4, fluency: 0.2, styleConsistency: 0.2, readability: 0.2 };
      adjustedScore.overallScore = 
        qualityScore.originality * weights.originality +
        qualityScore.fluency * weights.fluency +
        qualityScore.styleConsistency * weights.styleConsistency +
        qualityScore.readability * weights.readability;
    }
    // comprehensive 类型使用默认权重
    
    // 生成详细分析
    const analysis = {
      lengthComparison: {
        original: originalContent.length,
        rewritten: rewrittenContent.length,
        ratio: originalContent.length > 0 ? rewrittenContent.length / originalContent.length : 0,
        change: rewrittenContent.length - originalContent.length
      },
      sentenceAnalysis: {
        originalSentences: originalContent.split(/[。！？]/).filter(s => s.trim().length > 0).length,
        rewrittenSentences: rewrittenContent.split(/[。！？]/).filter(s => s.trim().length > 0).length
      },
      vocabularyAnalysis: {
        originalWords: originalContent.replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 0).length,
        rewrittenWords: rewrittenContent.replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 0).length
      }
    };
    
    // 生成等级评价
    const getGradeFromScore = (score: number): string => {
      if (score >= 0.9) return 'A+';
      if (score >= 0.8) return 'A';
      if (score >= 0.7) return 'B+';
      if (score >= 0.6) return 'B';
      if (score >= 0.5) return 'C+';
      if (score >= 0.4) return 'C';
      return 'D';
    };
    
    const gradeReport = {
      overall: getGradeFromScore(adjustedScore.overallScore),
      originality: getGradeFromScore(adjustedScore.originality),
      fluency: getGradeFromScore(adjustedScore.fluency),
      styleConsistency: getGradeFromScore(adjustedScore.styleConsistency),
      readability: getGradeFromScore(adjustedScore.readability)
    };
    
    // 生成改进建议（基于最低分项）
    const scores = [
      { name: 'originality', score: adjustedScore.originality, label: '原创度' },
      { name: 'fluency', score: adjustedScore.fluency, label: '流畅度' },
      { name: 'styleConsistency', score: adjustedScore.styleConsistency, label: '风格一致性' },
      { name: 'readability', score: adjustedScore.readability, label: '可读性' }
    ];
    
    const lowestScore = scores.reduce((min, current) => current.score < min.score ? current : min);
    const improvementTips = [...adjustedScore.suggestions];
    
    if (lowestScore.score < 0.6) {
      improvementTips.unshift(`重点改进${lowestScore.label}，当前得分 ${(lowestScore.score * 100).toFixed(1)}%`);
    }
    
    console.log(`✅ 质量评估完成: 综合评分 ${(adjustedScore.overallScore * 100).toFixed(1)}% (${gradeReport.overall})`);
    
    // 构造响应结果
    const result = {
      articleId: articleId || null,
      evaluationType,
      qualityScore: {
        overallScore: Math.round(adjustedScore.overallScore * 1000) / 1000,
        overallGrade: gradeReport.overall,
        dimensions: {
          originality: {
            score: Math.round(adjustedScore.originality * 1000) / 1000,
            grade: gradeReport.originality,
            description: '原创度 - 改写与原文的差异程度'
          },
          fluency: {
            score: Math.round(adjustedScore.fluency * 1000) / 1000,
            grade: gradeReport.fluency,
            description: '流畅度 - 句子结构和语言表达的自然程度'
          },
          styleConsistency: {
            score: Math.round(adjustedScore.styleConsistency * 1000) / 1000,
            grade: gradeReport.styleConsistency,
            description: '风格一致性 - 李诞风格特征的体现程度'
          },
          readability: {
            score: Math.round(adjustedScore.readability * 1000) / 1000,
            grade: gradeReport.readability,
            description: '可读性 - 文章易读性和理解难度'
          }
        }
      },
      analysis,
      suggestions: improvementTips,
      metadata: {
        evaluationTime: new Date().toISOString(),
        evaluationType,
        weightConfig: weightConfig || 'default'
      }
    };
    
    return createSuccessResponse(result, {
      message: `质量评估完成！综合评分: ${(adjustedScore.overallScore * 100).toFixed(1)}% (${gradeReport.overall} 级)`,
      summary: {
        grade: gradeReport.overall,
        score: Math.round(adjustedScore.overallScore * 100),
        topStrength: scores.reduce((max, current) => current.score > max.score ? current : max).label,
        mainWeakness: lowestScore.label
      }
    });
    
  } catch (error: any) {
    logApiError('POST', '/api/rewrite/evaluate-quality', error);
    return createErrorResponse(`质量评估失败: ${error.message}`, 500);
  }
}