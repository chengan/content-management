import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, logApiRequest, logApiError } from '../../../../lib/api-utils';
import SupabaseService from '../../../../lib/supabase';
import { getNodeDetail, searchNodeContent } from '../../../../lib/tophub';
import { CollectBatch, CollectResult, CollectOperationResult } from '../../../../src/types';

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

// POST: 执行采集任务
export async function POST(request: NextRequest) {
  let batchId = '';
  
  try {
    logApiRequest('POST', '/api/collect/execute');
    
    const body = await request.json();
    
    // 验证必需字段
    if (!body.sourceIds || !Array.isArray(body.sourceIds) || body.sourceIds.length === 0) {
      return createErrorResponse('请选择至少一个采集源', 400);
    }
    
    if (!body.collectType || !['keyword', 'full'].includes(body.collectType)) {
      return createErrorResponse('采集类型必须是 keyword 或 full', 400);
    }
    
    if (body.collectType === 'keyword' && (!body.keyword || body.keyword.trim().length === 0)) {
      return createErrorResponse('关键词采集时必须提供关键词', 400);
    }
    
    const {
      sourceIds,
      collectType,
      keyword = '',
      name = `${collectType === 'keyword' ? '关键词' : '一键'}采集任务_${new Date().toLocaleString()}`,
      description = '',
      limit = 20 // 每个源采集的文章数量限制
    } = body;
    
    console.log('🚀 开始执行采集任务:', {
      sourceIds,
      collectType,
      keyword,
      limit
    });
    
    // 1. 创建采集批次记录
    const batchData: Omit<CollectBatch, 'id' | 'createdAt'> = {
      name,
      description,
      collectType,
      keyword: keyword.trim(),
      sourceIds,
      totalCount: 0,
      successCount: 0,
      errorCount: 0,
      status: 'running',
      startedAt: new Date().toISOString(),
      completedAt: null
    };
    
    const batch = await SupabaseService.createCollectBatch(batchData);
    batchId = batch.id;
    
    console.log(`📦 创建采集批次: ${batchId}`);
    
    // 2. 获取采集源信息
    const sources = await Promise.all(
      sourceIds.map(async (sourceId: string) => {
        const source = await SupabaseService.getCollectSourceById(sourceId);
        if (!source) {
          throw new Error(`采集源不存在: ${sourceId}`);
        }
        if (!source.isActive) {
          throw new Error(`采集源已禁用: ${source.name}`);
        }
        return source;
      })
    );
    
    // 3. 执行采集任务
    const allResults: CollectResult[] = [];
    let totalCount = 0;
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    
    for (const source of sources) {
      try {
        console.log(`📡 从 ${source.name} 采集数据...`);
        
        let articles: any[] = [];
        
        if (collectType === 'keyword' && keyword) {
          // 关键词采集
          const searchResult = await searchNodeContent({
            q: keyword,
            hashid: source.hashId,
            p: 1
          });
          articles = searchResult.items?.slice(0, limit) || [];
          
        } else {
          // 一键采集（获取热榜内容）
          const nodeDetail = await getNodeDetail(source.hashId!);
          articles = nodeDetail.items?.slice(0, limit) || [];
        }
        
        console.log(`📊 从 ${source.name} 获取到 ${articles.length} 篇文章`);
        totalCount += articles.length;
        
        // 解析热度数字的辅助函数
        const parseHotValue = (extraStr: string): number => {
          if (!extraStr || typeof extraStr !== 'string') return 0;
          
          // 匹配数字和单位，如 "1829 万热度"、"502 万热度" 等
          const match = extraStr.match(/(\d+(?:\.\d+)?)\s*万/);
          if (match) {
            return Math.floor(parseFloat(match[1]) * 10000); // 万转换为具体数字
          }
          
          // 匹配纯数字，如 "50000" 等
          const numberMatch = extraStr.match(/(\d+)/);
          if (numberMatch) {
            return parseInt(numberMatch[1], 10);
          }
          
          return 0;
        };

        // 转换为采集结果格式
        const collectResults = articles.map((article, index) => ({
          title: article.title || '无标题',
          content: article.desc || article.description || '',
          source: source.name,
          sourceUrl: article.url || article.link || '',
          author: article.author || '',
          publishTime: '', // 今日热榜API通常不提供发布时间
          collectTime: new Date().toISOString(),
          tags: [],
          category: source.category || '',
          readCount: parseHotValue(article.extra), // 从 extra 字段解析热度
          likeCount: 0, // 今日热榜不提供喜欢数
          sourceId: source.id,
          collectBatchId: batchId,
          keyword: collectType === 'keyword' ? keyword : '',
          isSelected: false,
          addedToMaterials: false
        }));
        
        // 批量创建采集结果
        if (collectResults.length > 0) {
          const createdResults = await SupabaseService.batchCreateCollectResults(collectResults);
          allResults.push(...createdResults);
          successCount += createdResults.length;
        }
        
      } catch (error: any) {
        console.error(`❌ 从 ${source.name} 采集失败:`, error.message);
        errorCount++;
        errors.push(`${source.name}: ${error.message}`);
      }
    }
    
    // 4. 更新批次状态
    const finalStatus = errorCount === sources.length ? 'failed' : 'completed';
    await SupabaseService.updateCollectBatch(batchId, {
      totalCount,
      successCount,
      errorCount,
      status: finalStatus,
      completedAt: new Date().toISOString()
    });
    
    console.log(`✅ 采集任务完成: 总数=${totalCount}, 成功=${successCount}, 失败=${errorCount}`);
    
    // 5. 构造响应结果
    const result: CollectOperationResult = {
      success: successCount > 0,
      total: totalCount,
      collected: successCount,
      duplicated: 0, // 暂时不实现去重统计
      failed: errorCount,
      batchId,
      results: allResults,
      errors: errors.length > 0 ? errors : undefined
    };
    
    return createSuccessResponse(result, {
      message: `采集完成！成功采集 ${successCount} 篇文章`,
      batch: {
        id: batchId,
        name,
        status: finalStatus
      }
    });
    
  } catch (error: any) {
    logApiError('POST', '/api/collect/execute', error);
    
    // 如果批次已创建，更新为失败状态
    if (batchId) {
      try {
        await SupabaseService.updateCollectBatch(batchId, {
          status: 'failed',
          completedAt: new Date().toISOString(),
          errorCount: 1
        });
      } catch (updateError) {
        console.error('更新批次失败状态时出错:', updateError);
      }
    }
    
    return createErrorResponse(error.message, 500);
  }
}