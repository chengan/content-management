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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}

// POST: 获取单篇文章内容
export async function POST(request: NextRequest) {
  try {
    logApiRequest('POST', '/api/content/fetch');
    
    const body = await request.json();
    
    // 验证必需字段
    if (!body.articleId && !body.url) {
      return createErrorResponse('需要提供文章ID或URL', 400);
    }

    let article = null;
    let url = body.url;

    // 如果提供了文章ID，先获取文章信息
    if (body.articleId) {
      article = await SupabaseService.getArticleById(body.articleId);
      if (!article) {
        return createErrorResponse('文章不存在', 404);
      }
      
      if (!article.sourceUrl) {
        return createErrorResponse('文章没有源链接，无法获取内容', 400);
      }
      
      url = article.sourceUrl;
    }

    console.log(`🚀 开始获取文章内容: ${url}`);

    // 如果有文章ID，更新状态为正在获取
    if (article) {
      await SupabaseService.updateArticleContentStatus(
        article.id, 
        'fetching', 
        undefined, 
        true // 增加尝试次数
      );
    }

    try {
      // 获取清理配置（从数据库读取或使用默认值）
      let enableClean = true; // 默认启用清理
      let cleanConfig = {};
      
      try {
        // 检查是否启用自动清理
        const cleanEnabledResponse = await fetch(`${request.nextUrl.origin}/api/rewrite/config?key=auto_content_clean`, {
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (cleanEnabledResponse.ok) {
          const enableData = await cleanEnabledResponse.json();
          if (enableData.data?.value !== undefined) {
            enableClean = JSON.parse(enableData.data.value);
          }
        }
        
        if (enableClean) {
          // 获取清理模型配置
          const modelResponse = await fetch(`${request.nextUrl.origin}/api/rewrite/config?key=content_clean_model`, {
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (modelResponse.ok) {
            const modelData = await modelResponse.json();
            if (modelData.data?.value) {
              cleanConfig = { modelId: JSON.parse(modelData.data.value) };
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
        }
      } catch (configError) {
        console.warn('获取清理配置失败，使用默认配置:', configError);
      }

      // 使用内容获取服务获取文章内容
      const result = await ContentFetcherService.fetchArticleContent(url, 0, {
        enableClean,
        cleanConfig
      });

      if (!result.success) {
        // 获取失败，更新状态
        if (article) {
          await SupabaseService.updateArticleContentStatus(
            article.id, 
            'failed'
          );
        }
        
        return createErrorResponse(`内容获取失败: ${result.error}`, 400);
      }

      console.log(`✅ 成功获取文章内容: ${result.wordCount} 字`);
      
      // 记录清理信息
      if (result.cleanResult) {
        if (result.cleanResult.cleaned) {
          console.log(`🧹 内容已自动清理: ${result.cleanResult.wordCountBefore} → ${result.cleanResult.wordCountAfter} 字`);
        } else if (result.cleanResult.error) {
          console.warn(`⚠️  内容清理失败: ${result.cleanResult.error}`);
        }
      }

      // 如果有文章ID，更新文章内容和状态
      if (article) {
        // 准备更新数据
        const updateData: any = {
          content: result.content,
          wordCount: result.wordCount,
        };
        
        // 如果有原始内容（清理前的内容），保存它
        if (result.originalContent && result.originalContent !== result.content) {
          updateData.originalContent = result.originalContent;
        }
        
        // 添加清理状态信息
        if (result.cleanResult) {
          if (result.cleanResult.cleaned) {
            updateData.cleanStatus = 'completed';
            updateData.cleanedAt = new Date().toISOString();
          } else {
            updateData.cleanStatus = 'failed';
          }
        } else {
          updateData.cleanStatus = 'skipped'; // 跳过清理
        }

        const updatedArticle = await SupabaseService.updateArticleContentStatus(
          article.id,
          'completed',
          result.content
        );
        
        // 更新额外的清理相关字段
        await SupabaseService.updateArticle(article.id, updateData);

        // 如果获取到了更好的标题或作者信息，也更新
        const additionalUpdates: any = {};
        if (result.title && result.title !== article.title && result.title.length > article.title.length) {
          additionalUpdates.title = result.title;
        }
        if (result.author && !article.author) {
          additionalUpdates.author = result.author;
        }

        // 如果有额外更新，再次更新文章
        if (Object.keys(additionalUpdates).length > 0) {
          await SupabaseService.updateArticle(article.id, additionalUpdates);
        }

        return createSuccessResponse({
          article: {
            id: article.id,
            title: additionalUpdates.title || article.title,
            content: result.content,
            originalContent: result.originalContent,
            author: additionalUpdates.author || article.author,
            wordCount: result.wordCount,
            contentStatus: 'completed',
            cleanStatus: updateData.cleanStatus,
            cleanedAt: updateData.cleanedAt,
          },
          fetchResult: result,
          cleanResult: result.cleanResult
        }, {
          message: result.cleanResult?.cleaned 
            ? `成功获取并清理文章内容：${result.cleanResult.wordCountBefore} → ${result.wordCount} 字`
            : `成功获取文章内容，共 ${result.wordCount} 字`
        });
      } else {
        // 没有文章ID，只返回获取结果
        return createSuccessResponse({
          fetchResult: result,
          cleanResult: result.cleanResult
        }, {
          message: result.cleanResult?.cleaned 
            ? `成功获取并清理文章内容：${result.cleanResult.wordCountBefore} → ${result.wordCount} 字`
            : `成功获取文章内容，共 ${result.wordCount} 字`
        });
      }

    } catch (fetchError: any) {
      console.error('获取文章内容时出错:', fetchError);
      
      // 更新状态为失败
      if (article) {
        await SupabaseService.updateArticleContentStatus(
          article.id, 
          'failed'
        );
      }

      return createErrorResponse(`内容获取失败: ${fetchError.message}`, 500);
    }

  } catch (error: any) {
    logApiError('POST', '/api/content/fetch', error);
    return createErrorResponse(error.message, 500);
  }
}

// GET: 测试URL可访问性
export async function GET(request: NextRequest) {
  try {
    logApiRequest('GET', '/api/content/fetch');
    
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    
    if (!url) {
      return createErrorResponse('需要提供URL参数', 400);
    }

    console.log(`🧪 测试URL可访问性: ${url}`);

    const testResult = await ContentFetcherService.testUrl(url);

    return createSuccessResponse(testResult, {
      message: testResult.accessible ? '网址可访问' : '网址不可访问'
    });

  } catch (error: any) {
    logApiError('GET', '/api/content/fetch', error);
    return createErrorResponse(error.message, 500);
  }
}