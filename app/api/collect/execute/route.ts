import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, logApiRequest, logApiError } from '../../../../lib/api-utils';
import SupabaseService from '../../../../lib/supabase';
import { getNodeDetail, searchNodeContent } from '../../../../lib/tophub';
import { kwSearch } from '../../../../lib/jizhile';
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
          // 关键词采集 - 根据平台选择API
          if (source.platform.toLowerCase() === '微信' || source.platform.toLowerCase() === 'wechat') {
            // 使用极致了API搜索微信文章
            const jizhileResult = await kwSearch({
              kw: keyword,
              mode: 3, // 搜索标题和正文
              period: 7, // 7天内数据
              page: 1,
              sort_type: 1, // 按阅读数排序
              key: source.config?.apiKey // 从采集源配置中获取API密钥
            });

            // 转换极致了数据格式为内部格式
            articles = jizhileResult.data?.slice(0, limit).map(item => ({
              title: item.title,
              desc: item.content || '', // 极致了返回的content作为描述
              url: item.url,
              author: item.wx_name || '',
              extra: `${item.read} 阅读`, // 格式化阅读数
              wx_name: item.wx_name,
              read_count: item.read,
              publish_time: item.publish_time,
              publish_time_str: item.publish_time_str
            })) || [];
          } else {
            // 使用今日热榜API搜索其他平台内容
            const searchResult = await searchNodeContent({
              q: keyword,
              hashid: source.hashId,
              p: 1
            });
            articles = searchResult.items?.slice(0, limit) || [];
          }

        } else {
          // 一键采集（获取热榜内容）
          console.log(`🔍 正在调用今日热榜API获取数据，hashId: ${source.hashId}`);
          const nodeDetail = await getNodeDetail(source.hashId!);
          articles = nodeDetail.items?.slice(0, limit) || [];

          // 打印今日热榜API原始数据（前3条用于调试）
          console.log(`📋 今日热榜API原始返回数据（前3条）:`, JSON.stringify(articles.slice(0, 3), null, 2));

          // 特别检查URL字段
          articles.slice(0, 3).forEach((article, index) => {
            console.log(`🔗 文章${index + 1} URL信息:`, {
              title: article.title,
              url: article.url,
              link: article.link,
              originalUrl: article.url || article.link,
              urlLength: (article.url || article.link || '').length
            });
          });
        }

        console.log(`📊 从 ${source.name} 获取到 ${articles.length} 篇文章`);
        totalCount += articles.length;
        
        // 解析热度数字的辅助函数
        const parseHotValue = (extraStr: string, readCount?: number): number => {
          // 如果直接有阅读数，优先使用
          if (typeof readCount === 'number' && readCount > 0) {
            return readCount;
          }

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
        const collectResults = articles.map((article, index) => {
          // 处理发布时间 - 极致了API提供时间戳和字符串格式
          let publishTime = '';
          if (article.publish_time) {
            publishTime = new Date(article.publish_time * 1000).toISOString();
          } else if (article.publish_time_str) {
            publishTime = article.publish_time_str;
          }

          const sourceUrl = article.url || article.link || '';

          // 记录URL处理详情（前3条用于调试）
          if (index < 3) {
            console.log(`🔄 文章${index + 1} 数据转换详情:`, {
              originalTitle: article.title,
              originalUrl: article.url,
              originalLink: article.link,
              finalSourceUrl: sourceUrl,
              urlHasBiz: sourceUrl.includes('__biz='),
              urlLength: sourceUrl.length
            });

            // 检查微信文章URL的biz参数
            if (sourceUrl.includes('mp.weixin.qq.com') && sourceUrl.includes('__biz=')) {
              const bizMatch = sourceUrl.match(/__biz=([^&]+)/);
              if (bizMatch) {
                console.log(`📱 微信文章biz参数: "${bizMatch[1]}", 长度: ${bizMatch[1].length}`);
                if (bizMatch[1].length < 20) {
                  console.warn(`⚠️  biz参数可能异常，长度过短: ${bizMatch[1]}`);
                }
              }
            }
          }

          return {
            title: article.title || '无标题',
            content: article.desc || article.description || '',
            source: article.wx_name || source.name, // 优先使用公众号名称
            sourceUrl,
            author: article.wx_name || article.author || '', // 微信文章使用公众号名称作为作者
            publishTime, // 使用处理后的发布时间
            collectTime: new Date().toISOString(),
            tags: [],
            category: source.category || '',
            readCount: parseHotValue(article.extra, article.read_count), // 优先使用直接的阅读数
            likeCount: article.praise || 0, // 极致了提供点赞数
            sourceId: source.id,
            collectBatchId: batchId,
            keyword: collectType === 'keyword' ? keyword : '',
            isSelected: false,
            addedToMaterials: false
          };
        });
        
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