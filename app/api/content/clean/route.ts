import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, logApiRequest, logApiError } from '../../../../lib/api-utils';
import SupabaseService from '../../../../lib/supabase';
import { ContentCleanerService } from '../../../../lib/content-cleaner';

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

// POST: 手动清理文章内容
export async function POST(request: NextRequest) {
  try {
    logApiRequest('POST', '/api/content/clean');
    
    const body = await request.json();
    
    // 验证必需字段
    if (!body.articleId && !body.content) {
      return createErrorResponse('需要提供文章ID或直接内容', 400);
    }

    let article = null;
    let contentToClean = body.content;

    // 如果提供了文章ID，先获取文章信息
    if (body.articleId) {
      article = await SupabaseService.getArticleById(body.articleId);
      if (!article) {
        return createErrorResponse('文章不存在', 404);
      }
      
      if (!article.content) {
        return createErrorResponse('文章内容为空，无法清理', 400);
      }
      
      contentToClean = article.content;
    }

    if (!contentToClean) {
      return createErrorResponse('没有要清理的内容', 400);
    }

    console.log(`🧹 开始清理内容: ${contentToClean.length} 字符`);

    // 如果有文章ID，更新清理状态
    if (article) {
      await SupabaseService.updateArticle(article.id, {
        cleanStatus: 'cleaning'
      });
    }

    try {
      // 获取清理配置（从数据库读取或使用默认值）
      let cleanConfig = ContentCleanerService.getDefaultConfig();
      
      // 尝试从数据库获取配置
      try {
        const configResponse = await fetch(`${request.nextUrl.origin}/api/rewrite/config?key=content_clean_model`, {
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (configResponse.ok) {
          const configData = await configResponse.json();
          if (configData.data?.value) {
            cleanConfig.modelId = JSON.parse(configData.data.value);
          }
        }
        
        // 获取API Key配置
        const apiKeyResponse = await fetch(`${request.nextUrl.origin}/api/rewrite/config?key=openrouter_api_key`, {
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (apiKeyResponse.ok) {
          const apiKeyData = await apiKeyResponse.json();
          if (apiKeyData.data?.value) {
            cleanConfig.apiKey = JSON.parse(apiKeyData.data.value);
          }
        }
      } catch (configError) {
        console.warn('获取清理配置失败，使用默认配置:', configError);
      }

      // 应用用户自定义配置
      if (body.config) {
        cleanConfig = { ...cleanConfig, ...body.config };
      }

      // 使用内容清理服务清理内容
      const cleanResult = await ContentCleanerService.cleanContent(contentToClean, cleanConfig);

      if (!cleanResult.success) {
        // 清理失败，更新状态
        if (article) {
          await SupabaseService.updateArticle(article.id, {
            cleanStatus: 'failed'
          });
        }
        
        return createErrorResponse(`内容清理失败: ${cleanResult.error}`, 400);
      }

      console.log(`✅ 内容清理成功: ${cleanResult.wordCountBefore} → ${cleanResult.wordCountAfter} 字符`);

      // 如果有文章ID，更新文章内容和状态
      if (article) {
        const updatedArticle = await SupabaseService.updateArticle(article.id, {
          content: cleanResult.cleanedContent,
          originalContent: cleanResult.originalContent,
          cleanStatus: 'completed',
          cleanedAt: new Date().toISOString(),
          wordCount: cleanResult.wordCountAfter
        });

        return createSuccessResponse({
          article: {
            id: article.id,
            title: article.title,
            content: cleanResult.cleanedContent,
            originalContent: cleanResult.originalContent,
            wordCount: cleanResult.wordCountAfter,
            cleanStatus: 'completed',
            cleanedAt: updatedArticle.cleanedAt
          },
          cleanResult
        }, {
          message: `内容清理完成，字数从 ${cleanResult.wordCountBefore} 减少到 ${cleanResult.wordCountAfter}`
        });
      } else {
        // 没有文章ID，只返回清理结果
        return createSuccessResponse({
          cleanResult
        }, {
          message: `内容清理完成，字数从 ${cleanResult.wordCountBefore} 减少到 ${cleanResult.wordCountAfter}`
        });
      }

    } catch (cleanError: any) {
      console.error('内容清理时出错:', cleanError);
      
      // 更新状态为失败
      if (article) {
        await SupabaseService.updateArticle(article.id, {
          cleanStatus: 'failed'
        });
      }

      return createErrorResponse(`内容清理失败: ${cleanError.message}`, 500);
    }

  } catch (error: any) {
    logApiError('POST', '/api/content/clean', error);
    return createErrorResponse(error.message, 500);
  }
}

// GET: 批量清理或测试清理功能
export async function GET(request: NextRequest) {
  try {
    logApiRequest('GET', '/api/content/clean');
    
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action === 'test') {
      // 测试清理功能
      console.log(`🧪 测试内容清理功能`);
      
      const result = await ContentCleanerService.testCleanFunction();
      
      return createSuccessResponse({
        testResult: result,
        status: result ? '清理功能正常' : '清理功能异常'
      }, {
        message: result ? '清理功能测试通过' : '清理功能测试失败'
      });
    }
    
    if (action === 'batch') {
      // 批量清理待处理的文章
      const limit = parseInt(searchParams.get('limit') || '10');
      const status = searchParams.get('status') || 'pending';
      
      console.log(`🚀 批量清理文章，限制: ${limit}，状态筛选: ${status}`);
      
      // 获取需要清理的文章
      const articles = await SupabaseService.getArticles({
        cleanStatus: status,
        limit,
        hasContent: true
      });
      
      if (articles.length === 0) {
        return createSuccessResponse({
          processedCount: 0,
          results: []
        }, {
          message: '没有找到需要清理的文章'
        });
      }
      
      console.log(`📝 找到 ${articles.length} 篇文章需要清理`);
      
      const results = [];
      let successCount = 0;
      let failedCount = 0;
      
      for (const article of articles) {
        console.log(`🧹 清理文章: ${article.title.substring(0, 50)}...`);
        
        try {
          // 获取清理配置
          let cleanConfig = ContentCleanerService.getDefaultConfig();
          
          const cleanResult = await ContentCleanerService.cleanContent(article.content, cleanConfig);
          
          if (cleanResult.success) {
            // 更新文章
            await SupabaseService.updateArticle(article.id, {
              content: cleanResult.cleanedContent,
              originalContent: cleanResult.originalContent,
              cleanStatus: 'completed',
              cleanedAt: new Date().toISOString(),
              wordCount: cleanResult.wordCountAfter
            });
            
            successCount++;
            results.push({
              articleId: article.id,
              title: article.title,
              success: true,
              wordCountBefore: cleanResult.wordCountBefore,
              wordCountAfter: cleanResult.wordCountAfter
            });
          } else {
            // 标记为失败
            await SupabaseService.updateArticle(article.id, {
              cleanStatus: 'failed'
            });
            
            failedCount++;
            results.push({
              articleId: article.id,
              title: article.title,
              success: false,
              error: cleanResult.error
            });
          }
          
          // 添加延迟避免API限流
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error: any) {
          console.error(`文章清理失败 (${article.id}):`, error);
          
          await SupabaseService.updateArticle(article.id, {
            cleanStatus: 'failed'
          });
          
          failedCount++;
          results.push({
            articleId: article.id,
            title: article.title,
            success: false,
            error: error.message
          });
        }
      }
      
      return createSuccessResponse({
        processedCount: articles.length,
        successCount,
        failedCount,
        results
      }, {
        message: `批量清理完成: 成功 ${successCount} 篇，失败 ${failedCount} 篇`
      });
    }
    
    return createErrorResponse('不支持的操作类型', 400);

  } catch (error: any) {
    logApiError('GET', '/api/content/clean', error);
    return createErrorResponse(error.message, 500);
  }
}