import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, logApiRequest, logApiError } from '../../../../lib/api-utils';

// 自动处理状态跟踪
let isProcessing = false;
let lastProcessTime = 0;
let processInterval: NodeJS.Timeout | null = null;

// 处理OPTIONS预检请求
export async function OPTIONS() {
  return new NextResponse(null, { 
    status: 200, 
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, DELETE, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}

// POST: 启动自动处理服务
export async function POST(request: NextRequest) {
  try {
    logApiRequest('POST', '/api/content/auto-process');
    
    const body = await request.json();
    const { 
      intervalMinutes = 2,  // 处理间隔，默认2分钟
      batchSize = 10,       // 每批处理数量，默认10篇
      enabled = true        // 是否启用
    } = body;

    if (!enabled) {
      // 停止自动处理
      if (processInterval) {
        clearInterval(processInterval);
        processInterval = null;
      }
      isProcessing = false;
      
      return createSuccessResponse({
        status: 'stopped',
        message: '自动处理已停止'
      });
    }

    if (processInterval) {
      return createSuccessResponse({
        status: 'already_running',
        message: '自动处理已在运行中'
      });
    }

    console.log(`🤖 启动自动内容获取服务，间隔: ${intervalMinutes} 分钟，批量大小: ${batchSize}`);

    // 立即执行一次
    triggerBatchProcess(batchSize);

    // 设置定时器
    processInterval = setInterval(() => {
      triggerBatchProcess(batchSize);
    }, intervalMinutes * 60 * 1000);

    return createSuccessResponse({
      status: 'started',
      intervalMinutes,
      batchSize,
      nextProcessTime: Date.now() + intervalMinutes * 60 * 1000
    }, {
      message: `自动处理服务已启动，每 ${intervalMinutes} 分钟处理一批`
    });

  } catch (error: any) {
    logApiError('POST', '/api/content/auto-process', error);
    return createErrorResponse(error.message, 500);
  }
}

// DELETE: 停止自动处理服务
export async function DELETE() {
  try {
    logApiRequest('DELETE', '/api/content/auto-process');
    
    if (processInterval) {
      clearInterval(processInterval);
      processInterval = null;
    }
    
    isProcessing = false;
    
    console.log('🛑 自动内容获取服务已停止');

    return createSuccessResponse({
      status: 'stopped'
    }, {
      message: '自动处理服务已停止'
    });

  } catch (error: any) {
    logApiError('DELETE', '/api/content/auto-process', error);
    return createErrorResponse(error.message, 500);
  }
}

// GET: 获取自动处理状态
export async function GET() {
  try {
    logApiRequest('GET', '/api/content/auto-process');
    
    return createSuccessResponse({
      isRunning: !!processInterval,
      isProcessing,
      lastProcessTime,
      nextProcessTime: processInterval ? lastProcessTime + (2 * 60 * 1000) : null
    }, {
      message: '获取自动处理状态成功'
    });

  } catch (error: any) {
    logApiError('GET', '/api/content/auto-process', error);
    return createErrorResponse(error.message, 500);
  }
}

// 触发批量处理的辅助函数
async function triggerBatchProcess(batchSize: number = 10) {
  if (isProcessing) {
    console.log('⏭️  上次处理尚未完成，跳过本次处理');
    return;
  }

  isProcessing = true;
  lastProcessTime = Date.now();

  try {
    console.log('🔄 开始自动批量处理内容获取...');

    // 调用批量处理API
    const response = await fetch('http://localhost:3000/api/content/batch-process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        limit: batchSize,
        maxAttempts: 3,
        delayBetweenRequests: 4000 // 自动处理时间间隔稍长一些，4秒
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ 自动处理完成: ${result.data?.successful || 0} 成功, ${result.data?.failed || 0} 失败`);
    } else {
      console.error('❌ 自动处理请求失败:', response.statusText);
    }

  } catch (error) {
    console.error('❌ 自动处理出错:', error);
  } finally {
    isProcessing = false;
  }
}