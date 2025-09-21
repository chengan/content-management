import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, logApiRequest, logApiError } from '../../../../lib/api-utils';
import SupabaseService from '../../../../lib/supabase';
import { ContentFetcherService } from '../../../../lib/content-fetcher';

// 处理OPTIONS预检请求
export async function OPTIONS() {
  return new NextResponse(null, { 
    status: 200, 
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}

// 处理单批文章的函数
async function processBatch(articles: any[], options: {
  delayBetweenRequests: number;
  batchNum: number;
  totalBatches: number;
}) {
  const { delayBetweenRequests, batchNum, totalBatches } = options;
  const results: any[] = [];
  let successful = 0;
  let failed = 0;

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    try {
      const progress = `[批次${batchNum}/${totalBatches}] [${i + 1}/${articles.length}]`;
      console.log(`📖 ${progress} 正在获取: ${article.title}`);
      console.log(`🔗 链接: ${article.sourceUrl}`);
      console.log(`🔄 已尝试次数: ${article.fetchAttempts || 0}`);

      // 更新状态为正在获取
      await SupabaseService.updateArticleContentStatus(
        article.id, 
        'fetching', 
        undefined, 
        true // 增加尝试次数
      );

      const startTime = Date.now();

      // 检测是否为微信文章，智能选择获取方法
      const isWechatArticle = article.sourceUrl.includes('mp.weixin.qq.com');

      // 获取文章内容
      const fetchResult = await ContentFetcherService.fetchArticleContent(article.sourceUrl);
      const duration = Date.now() - startTime;

      if (fetchResult.success && fetchResult.content) {
        // 获取成功，更新文章内容
        await SupabaseService.updateArticleContentStatus(
          article.id,
          'completed',
          fetchResult.content
        );

        // 如果获取到更好的标题或作者，也更新
        const additionalUpdates: any = {};
        if (fetchResult.title && fetchResult.title !== article.title && fetchResult.title.length > article.title.length) {
          additionalUpdates.title = fetchResult.title;
        }
        if (fetchResult.author && !article.author) {
          additionalUpdates.author = fetchResult.author;
        }

        if (Object.keys(additionalUpdates).length > 0) {
          await SupabaseService.updateArticle(article.id, additionalUpdates);
        }

        successful++;
        results.push({
          articleId: article.id,
          title: article.title,
          status: 'success',
          wordCount: fetchResult.wordCount,
          contentLength: fetchResult.content.length,
          platform: fetchResult.platform,
          method: fetchResult.method || 'html', // 获取方法
          apiCost: fetchResult.apiCost || 0 // API成本
        });

        console.log(`✅ ${progress} 成功获取: ${article.title}`);
        console.log(`📄 内容长度: ${fetchResult.wordCount} 字，耗时: ${duration}ms`);
        if (fetchResult.title && fetchResult.title !== article.title) {
          console.log(`📝 更新标题: ${fetchResult.title}`);
        }
        if (fetchResult.author) {
          console.log(`👤 作者: ${fetchResult.author}`);
        }

      } else {
        // 获取失败
        await SupabaseService.updateArticleContentStatus(
          article.id,
          'failed'
        );

        failed++;
        results.push({
          articleId: article.id,
          title: article.title,
          status: 'failed',
          error: fetchResult.error || '未知错误',
          platform: fetchResult.platform,
          method: fetchResult.method || 'fallback'
        });

        console.log(`❌ ${progress} 获取失败: ${article.title}`);
        console.log(`⚠️  错误原因: ${fetchResult.error}`);
        console.log(`⏱️  耗时: ${duration}ms`);
      }

    } catch (error: any) {
      const progress = `[批次${batchNum}/${totalBatches}] [${i + 1}/${articles.length}]`;
      console.error(`❌ ${progress} 处理文章失败: ${article.title}`);
      console.error(`⚠️  异常信息:`, error.message);

      // 更新状态为失败
      try {
        await SupabaseService.updateArticleContentStatus(
          article.id,
          'failed'
        );
      } catch (updateError) {
        console.error('更新文章状态失败:', updateError);
      }

      failed++;
      results.push({
        articleId: article.id,
        title: article.title,
        status: 'failed',
        error: error.message,
        platform: 'unknown',
        method: 'error'
      });
    }

    // 智能延迟：根据成功/失败情况动态调整延迟时间
    if (i < articles.length - 1) {
      let adaptiveDelay = delayBetweenRequests;
      
      // 如果本次获取失败，增加延迟时间
      if (results[results.length - 1]?.status === 'failed') {
        adaptiveDelay = delayBetweenRequests * 1.5;
        console.log(`⚠️  本次获取失败，延长等待时间到 ${adaptiveDelay}ms`);
      }
      
      // 如果连续失败，进一步增加延迟
      const recentResults = results.slice(-3);
      const recentFailures = recentResults.filter(r => r.status === 'failed').length;
      if (recentFailures >= 2) {
        adaptiveDelay = delayBetweenRequests * 2;
        console.log(`🚨 连续失败 ${recentFailures} 次，大幅延长等待时间到 ${adaptiveDelay}ms`);
      }
      
      // 微信文章使用更长的延迟，特别是使用极致了API时
      const nextArticle = articles[i + 1];
      if (nextArticle && nextArticle.sourceUrl.includes('mp.weixin.qq.com')) {
        // 基础延迟为5秒，如果刚刚使用了极致了API，延长到8秒
        const currentResult = results[results.length - 1];
        const isJizhileAPI = currentResult?.method === 'jizhile';

        const wechatDelay = isJizhileAPI ? 8000 : 5000;
        adaptiveDelay = Math.max(adaptiveDelay, wechatDelay);

        console.log(`📱 下一篇为微信文章，使用${isJizhileAPI ? '极致了API' : '标准'}延迟: ${adaptiveDelay}ms`);
      }
      
      if (adaptiveDelay > 0) {
        console.log(`⏱️  智能延迟 ${adaptiveDelay}ms 后处理下一篇文章...`);
        await new Promise(resolve => setTimeout(resolve, adaptiveDelay));
      }
    }
  }

  return { results, successful, failed };
}

// POST: 批量处理内容获取任务
export async function POST(request: NextRequest) {
  try {
    logApiRequest('POST', '/api/content/batch-process');
    
    const body = await request.json();
    const { 
      limit = 20,          // 每批处理数量，默认20篇
      maxAttempts = 3,     // 最大尝试次数，默认3次
      delayBetweenRequests = 3000,  // 请求间隔，默认3秒
      processAll = false   // 是否处理所有待获取文章，默认false
    } = body;

    console.log(`🚀 开始批量处理内容获取任务，批量大小: ${limit}, 处理所有: ${processAll}`);

    // 1. 获取需要获取内容的文章
    const articles = await SupabaseService.getArticlesNeedingContent(processAll ? 1000 : limit);
    
    if (articles.length === 0) {
      return createSuccessResponse({
        processed: 0,
        successful: 0,
        failed: 0,
        results: []
      }, {
        message: '没有需要获取内容的文章'
      });
    }

    console.log(`📄 找到 ${articles.length} 篇文章需要获取内容`);

    // 2. 过滤掉已经超过最大尝试次数的文章
    const articlesToProcess = articles.filter(article => 
      (article.fetchAttempts || 0) < maxAttempts
    );

    if (articlesToProcess.length === 0) {
      return createSuccessResponse({
        processed: 0,
        successful: 0,
        failed: 0,
        results: [],
        skipped: articles.length
      }, {
        message: `所有 ${articles.length} 篇文章都已超过最大尝试次数`
      });
    }

    console.log(`🔄 实际处理 ${articlesToProcess.length} 篇文章`);

    // 3. 批量获取内容
    const results: any[] = [];
    let successful = 0;
    let failed = 0;

    // 如果是处理所有文章，分批进行处理
    if (processAll && articlesToProcess.length > limit) {
      console.log(`📦 分批处理模式: 将 ${articlesToProcess.length} 篇文章分成 ${Math.ceil(articlesToProcess.length / limit)} 批处理`);
      
      for (let batchIndex = 0; batchIndex < articlesToProcess.length; batchIndex += limit) {
        const batch = articlesToProcess.slice(batchIndex, batchIndex + limit);
        const batchNum = Math.floor(batchIndex / limit) + 1;
        const totalBatches = Math.ceil(articlesToProcess.length / limit);
        
        console.log(`🚀 开始处理第 ${batchNum}/${totalBatches} 批，共 ${batch.length} 篇文章`);
        
        const batchResults = await processBatch(batch, {
          delayBetweenRequests,
          batchNum,
          totalBatches
        });
        
        results.push(...batchResults.results);
        successful += batchResults.successful;
        failed += batchResults.failed;
        
        console.log(`📊 第 ${batchNum}/${totalBatches} 批完成: 成功 ${batchResults.successful}，失败 ${batchResults.failed}`);
        
        // 批次间延迟
        if (batchIndex + limit < articlesToProcess.length) {
          const batchDelay = 5000; // 批次间5秒延迟
          console.log(`⏱️  批次间延迟 ${batchDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, batchDelay));
        }
      }
    } else {
      // 单批处理
      const batchResults = await processBatch(articlesToProcess, {
        delayBetweenRequests,
        batchNum: 1,
        totalBatches: 1
      });
      
      results.push(...batchResults.results);
      successful = batchResults.successful;
      failed = batchResults.failed;
    }

    // 统计各平台和获取方法的成功率
    const platformStats = results.reduce((acc, result) => {
      const platform = result.platform || 'unknown';
      if (!acc[platform]) {
        acc[platform] = { total: 0, success: 0 };
      }
      acc[platform].total++;
      if (result.status === 'success') {
        acc[platform].success++;
      }
      return acc;
    }, {} as Record<string, { total: number; success: number }>);

    // 统计获取方法
    const methodStats = results.reduce((acc, result) => {
      const method = result.method || 'unknown';
      if (!acc[method]) {
        acc[method] = { total: 0, success: 0, totalCost: 0 };
      }
      acc[method].total++;
      if (result.status === 'success') {
        acc[method].success++;
      }
      if (result.apiCost) {
        acc[method].totalCost += result.apiCost;
      }
      return acc;
    }, {} as Record<string, { total: number; success: number; totalCost: number }>);

    // 计算总API成本
    const totalApiCost = results.reduce((sum, result) => sum + (result.apiCost || 0), 0);

    console.log(`🏁 批量处理完成统计:`);
    console.log(`✅ 成功: ${successful} 篇`);
    console.log(`❌ 失败: ${failed} 篇`);
    console.log(`📈 成功率: ${((successful / articlesToProcess.length) * 100).toFixed(1)}%`);

    if (totalApiCost > 0) {
      console.log(`💰 API总消费: ${totalApiCost.toFixed(4)} 元`);
    }

    // 按平台统计
    Object.entries(platformStats).forEach(([platform, stats]) => {
      const rate = ((stats.success / stats.total) * 100).toFixed(1);
      const icon = platform === 'wechat' ? '📱' : '🌐';
      console.log(`${icon} ${platform}: ${stats.success}/${stats.total} (成功率 ${rate}%)`);
    });

    // 按获取方法统计
    console.log(`📊 获取方法统计:`);
    Object.entries(methodStats).forEach(([method, stats]) => {
      const rate = ((stats.success / stats.total) * 100).toFixed(1);
      let icon = '🔧';
      switch (method) {
        case 'jizhile':
          icon = '🔥';
          break;
        case 'html':
          icon = '🌐';
          break;
        case 'fallback':
          icon = '⚠️ ';
          break;
      }

      const costInfo = stats.totalCost > 0 ? ` (消费 ${stats.totalCost.toFixed(4)} 元)` : '';
      console.log(`${icon} ${method}: ${stats.success}/${stats.total} (成功率 ${rate}%)${costInfo}`);
    });

    const message = `批量处理完成：成功 ${successful} 篇，失败 ${failed} 篇`;

    return createSuccessResponse({
      processed: articlesToProcess.length,
      successful,
      failed,
      results,
      skipped: articles.length - articlesToProcess.length,
      stats: {
        platforms: platformStats,
        methods: methodStats,
        totalApiCost: totalApiCost
      }
    }, { message });

  } catch (error: any) {
    logApiError('POST', '/api/content/batch-process', error);
    return createErrorResponse(error.message, 500);
  }
}

// GET: 获取批量处理状态信息
export async function GET() {
  try {
    logApiRequest('GET', '/api/content/batch-process');
    
    // 获取统计信息
    const stats = await SupabaseService.getContentFetchStats();
    
    return createSuccessResponse(stats, {
      message: '获取内容处理状态成功'
    });

  } catch (error: any) {
    logApiError('GET', '/api/content/batch-process', error);
    return createErrorResponse(error.message, 500);
  }
}