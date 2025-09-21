/**
 * 文章内容获取服务
 * 智能获取各平台文章的完整内容
 */

import * as cheerio from 'cheerio';
import { ContentCleanerService } from './content-cleaner';
import { JizhileService } from './jizhile';

// 用户代理列表，模拟不同浏览器
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
];

// 平台特定的内容选择器
const PLATFORM_SELECTORS = {
  wechat: {
    // 微信公众号文章 - 优化选择器顺序，优先使用最可靠的选择器
    selectors: [
      '#js_content .rich_media_content', // 更精确的内容选择器
      '#js_content',           // 主要内容区域
      '.rich_media_area_primary .rich_media_content', // 主内容区域中的富媒体内容
      '.rich_media_content',   // 富媒体内容
      'div[data-tool="mdnice"]', // mdnice编辑器内容
      '.rich_media_area_primary', // 主内容区域
      'article',               // HTML5文章标签
      '#img-content',          // 图片内容
      '.rich_media_wrp',       // 内容包装器
      'section p',             // 段落文本
      'div[data-darkmode-bgcolor-16508267164934]', // 深色模式内容
      '.RichText-content',     // 富文本内容
      'section',               // 通用段落内容
    ],
    title: '#activity-name, .rich_media_title, h1, .rich_media_area_primary h1, .wx_article_title',
    author: '.rich_media_meta_text, .profile_nickname, .rich_media_meta .rich_media_meta_nickname, .account_nickname',
  },
  zhihu: {
    // 知乎文章/回答
    selectors: [
      '.RichContent-inner',    // 富文本内容
      '.Post-RichTextContainer', // 文章容器
      '.AnswerItem .RichContent', // 回答内容
    ],
    title: '.Post-Title, .QuestionHeader-title',
    author: '.AuthorInfo-name, .UserLink-link',
  },
  toutiao: {
    // 今日头条文章
    selectors: [
      '.article-content',      // 文章内容
      '.article-detail',       // 详情内容
      '#article-content',      // 内容ID
    ],
    title: '.article-title, h1',
    author: '.article-author, .author-name',
  },
  default: {
    // 通用网页内容
    selectors: [
      'article',              // HTML5 article 标签
      '.content',             // 通用content类
      '.article-content',     // 文章内容类
      '.post-content',        // 博客内容类
      'main',                 // 主要内容区域
      '#content',             // 内容ID
    ],
    title: 'h1, .title, .post-title, title',
    author: '.author, .byline, .writer',
  }
};

// 内容获取结果接口
export interface ContentFetchResult {
  success: boolean;
  content: string;
  originalContent?: string;
  title?: string;
  author?: string;
  wordCount: number;
  error?: string;
  platform?: string;
  method?: 'jizhile' | 'html' | 'fallback'; // 获取方法标识
  apiCost?: number; // API消费金额（仅极致了API）
  cleanResult?: {
    cleaned: boolean;
    wordCountBefore: number;
    wordCountAfter: number;
    removedSections: string[];
    error?: string;
  };
}

/**
 * 文章内容获取服务类
 */
export class ContentFetcherService {
  
  /**
   * 获取随机User-Agent
   */
  private static getRandomUserAgent(): string {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  }

  /**
   * 检测网站平台类型
   */
  private static detectPlatform(url: string): keyof typeof PLATFORM_SELECTORS {
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('mp.weixin.qq.com')) {
      return 'wechat';
    }
    if (urlLower.includes('zhihu.com')) {
      return 'zhihu';
    }
    if (urlLower.includes('toutiao.com') || urlLower.includes('jinritoutiao.com')) {
      return 'toutiao';
    }
    
    return 'default';
  }

  /**
   * 清理和格式化文本内容
   */
  private static cleanContent(content: string): string {
    return content
      // 移除多余空白
      .replace(/\s+/g, ' ')
      // 移除HTML标签
      .replace(/<[^>]*>/g, '')
      // 移除特殊字符
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      // 清理首尾空白
      .trim();
  }

  /**
   * 检测内容是否主要是代码而非文章内容
   */
  private static isCodeContent(content: string): boolean {
    if (!content || content.length < 50) return false;
    
    // 常见的代码特征
    const codePatterns = [
      /var\s+\w+\s*=/g,                    // JavaScript变量声明
      /function\s*\w*\s*\([^)]*\)/g,       // 函数定义
      /PAGE_MID\s*=\s*'/g,                 // 微信页面变量
      /body\.wx-root/g,                    // 微信页面CSS
      /--weui-/g,                          // WeUI CSS变量
      /rgba?\(\d+,\s*\d+,\s*\d+/g,         // CSS颜色值
      /\{[^}]*\}/g,                        // CSS/JS 对象
      /getElementById|querySelector/g,      // DOM操作
      /console\.(log|error|warn)/g,        // 控制台输出
      /#[a-fA-F0-9]{3,6}(\s|;|$)/g,       // CSS颜色值
      /[{}();]/g                           // 大量的括号和分号
    ];
    
    let codeScore = 0;
    let totalMatches = 0;
    
    codePatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        codeScore += matches.length;
        totalMatches++;
      }
    });
    
    // 计算代码特征密度
    const contentLength = content.length;
    const codeDensity = codeScore / contentLength * 1000; // 每千字符的代码特征数
    
    console.log(`🔍 内容代码检测: 长度=${contentLength}, 代码特征=${codeScore}, 密度=${codeDensity.toFixed(2)}`);
    
    // 如果代码密度超过阈值，认为是代码内容
    const isCode = codeDensity > 10 || (totalMatches >= 3 && codeDensity > 5);
    
    if (isCode) {
      console.warn('⚠️  检测到疑似代码内容，将尝试其他选择器');
    }
    
    return isCode;
  }

  /**
   * 提取网页内容
   */
  private static extractContent($: cheerio.CheerioAPI, platform: keyof typeof PLATFORM_SELECTORS): {
    content: string;
    title?: string;
    author?: string;
  } {
    const config = PLATFORM_SELECTORS[platform];
    let content = '';
    let title = '';
    let author = '';

    // 尝试获取内容
    for (const selector of config.selectors) {
      const element = $(selector);
      if (element.length > 0) {
        let extractedContent = element.text();
        
        // 微信文章特殊处理：尝试获取更完整的内容
        if (platform === 'wechat' && extractedContent.length < 200) {
          // 如果内容太短，尝试获取HTML内容并清理
          const htmlContent = element.html() || '';
          extractedContent = this.extractTextFromHtml(htmlContent);
        }
        
        console.log(`🔍 选择器 "${selector}" 获取到 ${extractedContent.length} 字符`);
        
        if (extractedContent && extractedContent.length > 100) {
          // 检测是否为代码内容
          if (this.isCodeContent(extractedContent)) {
            console.warn(`⚠️  选择器 "${selector}" 获取到代码内容，尝试下一个选择器`);
            continue; // 如果是代码，尝试下一个选择器
          }
          
          content = extractedContent;
          console.log(`✅ 使用选择器 "${selector}" 获取到有效内容`);
          break; // 找到有效内容就停止
        }
      }
    }

    // 如果所有选择器都没有获取到足够的内容，尝试获取body内容
    if (!content || content.length < 100) {
      console.log('⚠️  所有选择器获取内容不足，尝试获取body内容');
      const bodyContent = $('body').text();
      if (bodyContent && bodyContent.length > content.length) {
        // 也检测body内容是否为代码
        if (!this.isCodeContent(bodyContent)) {
          content = bodyContent;
          console.log(`📄 使用body内容，共 ${content.length} 字符`);
        } else {
          console.warn('⚠️  body内容也检测为代码，将返回空内容');
        }
      }
    }

    // 获取标题
    const titleElement = $(config.title).first();
    if (titleElement.length > 0) {
      title = titleElement.text().trim();
      console.log(`📝 获取到标题: ${title}`);
    }

    // 获取作者
    const authorElement = $(config.author).first();
    if (authorElement.length > 0) {
      author = authorElement.text().trim();
      console.log(`👤 获取到作者: ${author}`);
    }

    return {
      content: this.cleanContent(content),
      title,
      author,
    };
  }

  /**
   * 从HTML中提取文本内容（保留更多信息）
   */
  private static extractTextFromHtml(html: string): string {
    if (!html) return '';
    
    return html
      // 移除script和style标签及其内容
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      // 移除注释
      .replace(/<!--[\s\S]*?-->/g, '')
      // 将一些HTML标签转换为换行符
      .replace(/<\/(div|p|br|section|article)>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      // 移除所有HTML标签
      .replace(/<[^>]*>/g, '')
      // 处理HTML实体
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#[0-9]+;/g, '')
      // 移除明显的JavaScript代码片段
      .replace(/var\s+\w+\s*=\s*[^;]+;/g, '')
      .replace(/function\s*\w*\s*\([^)]*\)\s*\{[^}]*\}/g, '')
      // 清理多余的空白
      .replace(/\n+/g, '\n')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * 使用极致了API获取微信文章内容
   */
  private static async fetchWechatContentWithJizhile(url: string): Promise<{
    success: boolean;
    content: string;
    title?: string;
    author?: string;
    wordCount: number;
    apiCost?: number;
    error?: string;
  }> {
    try {
      console.log(`🔥 使用极致了API获取微信文章内容: ${url}`);

      // 清理和标准化URL
      // 1. 移除锚点（#后面的部分）
      let cleanUrl = url.split('#')[0];

      // 2. 解码可能存在的双重编码问题
      // 如果URL中包含 %3D%3D (双重编码的==)，需要解码
      if (cleanUrl.includes('%3D%3D')) {
        try {
          cleanUrl = decodeURIComponent(cleanUrl);
        } catch (e) {
          console.warn('URL解码失败，使用原始URL');
        }
      }

      // 3. 确保URL格式正确
      if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        cleanUrl = 'https://' + cleanUrl;
      }

      console.log(`📋 清理后的URL: ${cleanUrl}`);

      const articleDetail = await JizhileService.getArticleDetail({
        url: cleanUrl,
        mode: '2' // 纯文字+富文本格式，内容更完整
      });

      if (!articleDetail || !articleDetail.content) {
        throw new Error('极致了API未返回文章内容');
      }

      // 清理和格式化内容
      let content = articleDetail.content;

      // 移除HTML标签但保留换行结构
      content = content
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<\/(div|p|br|section|article|h[1-6])>/gi, '\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#[0-9]+;/g, '')
        .replace(/\n+/g, '\n')
        .replace(/\s+/g, ' ')
        .trim();

      const wordCount = content.length;
      const apiCost = articleDetail.cost_money || 0;

      console.log(`✅ 极致了API获取成功: ${wordCount} 字，消费 ${apiCost} 元`);

      return {
        success: true,
        content,
        title: articleDetail.title || undefined,
        author: articleDetail.nick_name || articleDetail.author || undefined,
        wordCount,
        apiCost
      };

    } catch (error: any) {
      console.error(`❌ 极致了API获取失败: ${error.message}`);
      return {
        success: false,
        content: '',
        wordCount: 0,
        error: `极致了API错误: ${error.message}`
      };
    }
  }

  /**
   * 获取文章内容（主要方法）
   */
  static async fetchArticleContent(
    url: string,
    retryCount: number = 0,
    options: {
      enableClean?: boolean;
      cleanConfig?: any;
      forceHtmlMethod?: boolean; // 强制使用HTML解析方法
    } = {}
  ): Promise<ContentFetchResult> {
    try {
      console.log(`📄 开始获取文章内容: ${url}`);
      console.log(`🔍 URL详细信息:`, {
        originalUrl: url,
        urlLength: url.length,
        hasBiz: url.includes('__biz='),
        hasAnchor: url.includes('#'),
        isWechat: url.includes('mp.weixin.qq.com')
      });

      // 特别检查微信文章URL的biz参数
      if (url.includes('mp.weixin.qq.com') && url.includes('__biz=')) {
        const bizMatch = url.match(/__biz=([^&]+)/);
        if (bizMatch) {
          console.log(`📱 微信文章biz参数分析:`, {
            bizValue: bizMatch[1],
            bizLength: bizMatch[1].length,
            isNormalLength: bizMatch[1].length >= 20,
            hasEquals: bizMatch[1].includes('=')
          });

          if (bizMatch[1].length < 20) {
            console.warn(`⚠️  biz参数长度异常: ${bizMatch[1]} (长度: ${bizMatch[1].length})`);
          }
        }
      }

      // 检测平台类型
      const platform = this.detectPlatform(url);
      console.log(`🔍 检测到平台类型: ${platform}`);

      // 对于微信文章，优先尝试使用极致了API
      if (platform === 'wechat' && !options.forceHtmlMethod) {
        console.log(`📱 微信文章检测，优先使用极致了API获取内容...`);

        const jizhileResult = await this.fetchWechatContentWithJizhile(url);

        if (jizhileResult.success) {
          // 极致了API获取成功
          let result: ContentFetchResult = {
            success: true,
            content: jizhileResult.content,
            originalContent: jizhileResult.content,
            title: jizhileResult.title,
            author: jizhileResult.author,
            wordCount: jizhileResult.wordCount,
            platform,
            method: 'jizhile',
            apiCost: jizhileResult.apiCost,
          };

          // 如果启用内容清理
          if (options.enableClean && jizhileResult.wordCount > 100) {
            console.log(`🧹 开始清理极致了API获取的内容...`);

            try {
              const cleanResult = await ContentCleanerService.cleanContent(
                jizhileResult.content,
                options.cleanConfig
              );

              if (cleanResult.success) {
                console.log(`✅ 内容清理成功: ${cleanResult.wordCountBefore} → ${cleanResult.wordCountAfter} 字`);

                result.content = cleanResult.cleanedContent;
                result.wordCount = cleanResult.wordCountAfter;
                result.cleanResult = {
                  cleaned: true,
                  wordCountBefore: cleanResult.wordCountBefore,
                  wordCountAfter: cleanResult.wordCountAfter,
                  removedSections: cleanResult.removedSections,
                };
              } else {
                console.warn(`⚠️  内容清理失败: ${cleanResult.error}`);
                result.cleanResult = {
                  cleaned: false,
                  wordCountBefore: jizhileResult.wordCount,
                  wordCountAfter: jizhileResult.wordCount,
                  removedSections: [],
                  error: cleanResult.error,
                };
              }
            } catch (cleanError: any) {
              console.warn(`⚠️  内容清理异常: ${cleanError.message}`);
              result.cleanResult = {
                cleaned: false,
                wordCountBefore: jizhileResult.wordCount,
                wordCountAfter: jizhileResult.wordCount,
                removedSections: [],
                error: cleanError.message,
              };
            }
          }

          console.log(`🎉 极致了API获取微信文章成功: ${result.wordCount} 字`);
          return result;
        } else {
          console.warn(`⚠️  极致了API获取失败: ${jizhileResult.error}，将降级使用HTML解析`);
          // 不直接返回错误，而是继续使用HTML解析方法作为备选方案
        }
      }

      // 根据平台设置特殊的请求头
      const headers: Record<string, string> = {
        'User-Agent': this.getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
      };

      // 微信公众号特殊处理
      if (platform === 'wechat') {
        headers['Referer'] = 'https://mp.weixin.qq.com/';
        headers['Origin'] = 'https://mp.weixin.qq.com';
        // 添加微信特有的头部信息
        headers['sec-ch-ua'] = '"Google Chrome";v="120", "Chromium";v="120", "Not_A Brand";v="24"';
        headers['sec-ch-ua-mobile'] = '?0';
        headers['sec-ch-ua-platform'] = '"Windows"';
      }

      // 发送HTTP请求
      const response = await fetch(url, {
        method: 'GET',
        headers,
        // 超时设置：微信文章延长超时时间
        signal: AbortSignal.timeout(platform === 'wechat' ? 45000 : 30000),
      });

      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
      }

      // 获取HTML内容
      const html = await response.text();
      
      if (!html || html.length < 100) {
        throw new Error('网页内容为空或过短');
      }

      // 使用cheerio解析HTML
      const $ = cheerio.load(html);

      // 提取内容
      const extracted = this.extractContent($, platform);

      // 检查内容质量
      if (!extracted.content) {
        throw new Error('未能提取到文章内容');
      }
      
      // 对于微信文章，放宽内容长度要求
      const minContentLength = platform === 'wechat' ? 20 : 50;
      if (extracted.content.length < minContentLength) {
        console.warn(`⚠️  内容过短 (平台: ${platform}, 长度: ${extracted.content.length}, 要求: ${minContentLength})`);
        // 对于微信文章，即使内容短也尝试返回
        if (platform !== 'wechat') {
          throw new Error(`提取的文章内容过短 (仅${extracted.content.length}字符)`);
        }
      }

      const wordCount = extracted.content.length;
      
      console.log(`✅ 内容获取成功: ${wordCount} 字 (平台: ${platform})`);
      
      // 记录成功的获取统计
      if (platform === 'wechat') {
        console.log(`📱 微信文章获取成功: ${extracted.title || '无标题'}`);
      }

      // 准备返回结果
      let result: ContentFetchResult = {
        success: true,
        content: extracted.content,
        originalContent: extracted.content,
        title: extracted.title,
        author: extracted.author,
        wordCount,
        platform,
        method: 'html', // 标识使用HTML解析方法
      };

      // 如果启用内容清理
      if (options.enableClean && wordCount > 100) {
        console.log(`🧹 开始清理内容...`);
        
        try {
          const cleanResult = await ContentCleanerService.cleanContent(
            extracted.content,
            options.cleanConfig
          );

          if (cleanResult.success) {
            console.log(`✅ 内容清理成功: ${cleanResult.wordCountBefore} → ${cleanResult.wordCountAfter} 字`);
            
            result.content = cleanResult.cleanedContent;
            result.wordCount = cleanResult.wordCountAfter;
            result.cleanResult = {
              cleaned: true,
              wordCountBefore: cleanResult.wordCountBefore,
              wordCountAfter: cleanResult.wordCountAfter,
              removedSections: cleanResult.removedSections,
            };
          } else {
            console.warn(`⚠️  内容清理失败: ${cleanResult.error}`);
            result.cleanResult = {
              cleaned: false,
              wordCountBefore: wordCount,
              wordCountAfter: wordCount,
              removedSections: [],
              error: cleanResult.error,
            };
          }
        } catch (cleanError: any) {
          console.warn(`⚠️  内容清理异常: ${cleanError.message}`);
          result.cleanResult = {
            cleaned: false,
            wordCountBefore: wordCount,
            wordCountAfter: wordCount,
            removedSections: [],
            error: cleanError.message,
          };
        }
      }

      return result;

    } catch (error: any) {
      console.error(`❌ 获取文章内容失败 (${url}):`, error.message);

      const platform = this.detectPlatform(url);
      
      // 根据平台设置不同的重试策略
      const maxRetries = platform === 'wechat' ? 5 : 3;
      
      // 如果是网络错误且重试次数未达到上限，则重试
      if (retryCount < maxRetries && (
        error.message.includes('timeout') ||
        error.message.includes('fetch') ||
        error.message.includes('network') ||
        error.message.includes('aborted') ||
        error.message.includes('ECONNRESET')
      )) {
        console.log(`🔄 第${retryCount + 1}次重试 (平台: ${platform}, 最大重试: ${maxRetries})...`);
        
        // 微信文章使用更长的重试间隔
        const baseDelay = platform === 'wechat' ? 5000 : 2000;
        const randomDelay = Math.random() * (platform === 'wechat' ? 5000 : 3000);
        const retryDelay = baseDelay + randomDelay + (retryCount * 1000); // 递增延迟
        
        console.log(`⏱️  等待 ${Math.round(retryDelay)}ms 后重试...`);
        await this.delay(retryDelay);
        
        return this.fetchArticleContent(url, retryCount + 1);
      }

      return {
        success: false,
        content: '',
        wordCount: 0,
        error: error.message,
        platform: this.detectPlatform(url),
        method: 'fallback',
      };
    }
  }

  /**
   * 延迟函数
   */
  static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 批量获取文章内容（优化版）
   */
  static async batchFetchContent(urls: string[], options: {
    maxConcurrent?: number;
    delayBetweenRequests?: number;
    onProgress?: (completed: number, total: number, current: string) => void;
  } = {}): Promise<ContentFetchResult[]> {
    const {
      maxConcurrent = 2,
      delayBetweenRequests = 3000,
      onProgress,
    } = options;

    console.log(`🚀 开始批量获取 ${urls.length} 篇文章内容`);
    
    // 按平台类型对URL进行分组，优先处理简单的
    const urlGroups = {
      wechat: [] as string[],
      other: [] as string[]
    };
    
    urls.forEach(url => {
      if (this.detectPlatform(url) === 'wechat') {
        urlGroups.wechat.push(url);
      } else {
        urlGroups.other.push(url);
      }
    });
    
    console.log(`📊 分组统计: 微信文章 ${urlGroups.wechat.length} 篇，其他平台 ${urlGroups.other.length} 篇`);

    const results: ContentFetchResult[] = [];
    let completedCount = 0;

    // 先处理非微信文章（更容易成功）
    if (urlGroups.other.length > 0) {
      console.log(`📄 先处理 ${urlGroups.other.length} 篇非微信文章`);
      const otherResults = await this.processBatchGroup(urlGroups.other, {
        maxConcurrent,
        delayBetweenRequests,
        onProgress: (completed, total, current) => {
          completedCount = completed;
          if (onProgress) {
            onProgress(completedCount, urls.length, current);
          }
        }
      });
      results.push(...otherResults);
    }

    // 再处理微信文章（更加谨慎）
    if (urlGroups.wechat.length > 0) {
      console.log(`📱 处理 ${urlGroups.wechat.length} 篇微信文章（使用谨慎模式）`);
      const wechatResults = await this.processBatchGroup(urlGroups.wechat, {
        maxConcurrent: 1, // 微信文章串行处理
        delayBetweenRequests: delayBetweenRequests * 2, // 更长的延迟
        onProgress: (completed, total, current) => {
          completedCount = urlGroups.other.length + completed;
          if (onProgress) {
            onProgress(completedCount, urls.length, current);
          }
        }
      });
      results.push(...wechatResults);
    }

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.length - successCount;
    console.log(`🏁 批量获取完成: 成功 ${successCount} 篇，失败 ${failedCount} 篇`);
    
    // 统计各平台成功率
    const wechatResults = results.filter(r => r.platform === 'wechat');
    const wechatSuccess = wechatResults.filter(r => r.success).length;
    if (wechatResults.length > 0) {
      const wechatSuccessRate = ((wechatSuccess / wechatResults.length) * 100).toFixed(1);
      console.log(`📱 微信文章成功率: ${wechatSuccessRate}% (${wechatSuccess}/${wechatResults.length})`);
    }

    return results;
  }

  /**
   * 处理一组URL的批量获取
   */
  private static async processBatchGroup(urls: string[], options: {
    maxConcurrent: number;
    delayBetweenRequests: number;
    onProgress?: (completed: number, total: number, current: string) => void;
  }): Promise<ContentFetchResult[]> {
    const { maxConcurrent, delayBetweenRequests, onProgress } = options;
    const results: ContentFetchResult[] = [];
    const chunks = [];

    // 将URL数组分成小块，控制并发数
    for (let i = 0; i < urls.length; i += maxConcurrent) {
      chunks.push(urls.slice(i, i + maxConcurrent));
    }

    for (const chunk of chunks) {
      // 并发处理当前块
      const chunkPromises = chunk.map(async (url) => {
        const result = await this.fetchArticleContent(url);
        
        // 调用进度回调
        if (onProgress) {
          onProgress(results.length + 1, urls.length, url);
        }
        
        return result;
      });

      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);

      // 如果不是最后一块，等待一段时间
      if (chunk !== chunks[chunks.length - 1]) {
        console.log(`⏱️  等待 ${delayBetweenRequests}ms 后继续...`);
        await this.delay(delayBetweenRequests);
      }
    }

    return results;
  }

  /**
   * 测试单个URL的可访问性
   */
  static async testUrl(url: string): Promise<{ accessible: boolean; statusCode?: number; error?: string; platform?: string }> {
    try {
      const platform = this.detectPlatform(url);
      console.log(`🧪 测试URL可访问性: ${url} (平台: ${platform})`);
      
      const headers: Record<string, string> = {
        'User-Agent': this.getRandomUserAgent(),
      };
      
      // 微信文章特殊处理
      if (platform === 'wechat') {
        headers['Referer'] = 'https://mp.weixin.qq.com/';
      }
      
      const response = await fetch(url, {
        method: 'HEAD', // 只获取头部，不下载内容
        headers,
        signal: AbortSignal.timeout(15000), // 15秒超时
      });
      
      const result = {
        accessible: response.ok,
        statusCode: response.status,
        platform,
      };
      
      console.log(`${response.ok ? '✅' : '❌'} URL测试结果: ${response.status} - ${url}`);
      return result;

    } catch (error: any) {
      console.log(`❌ URL测试失败: ${error.message} - ${url}`);
      return {
        accessible: false,
        error: error.message,
        platform: this.detectPlatform(url),
      };
    }
  }
}

// 导出便捷方法
export const {
  fetchArticleContent,
  batchFetchContent,
  testUrl,
} = ContentFetcherService;

// 默认导出
export default ContentFetcherService;