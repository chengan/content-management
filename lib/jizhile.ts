/**
 * 极致了API客户端
 * 封装与极致了API的所有交互功能，主要用于微信文章采集
 */

import axios from 'axios';

// API配置
const JIZHILE_BASE_URL = 'https://www.dajiala.com';
const ACCESS_KEY = process.env.JIZHILE_API_KEY;

// 检查环境变量
if (!ACCESS_KEY && process.env.NODE_ENV !== 'development') {
  console.warn('缺少极致了API密钥。请在.env.local文件中配置JIZHILE_API_KEY。');
}

// 创建axios实例
const jizhileClient = axios.create({
  baseURL: JIZHILE_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15秒超时
  proxy: false, // 禁用代理，避免代理问题
});

// 响应拦截器 - 处理错误
jizhileClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      throw new Error('请求超时，请稍后重试');
    }
    if (error.response?.status === 401) {
      throw new Error('API密钥无效，请检查JIZHILE_API_KEY配置');
    }
    if (error.response?.status === 429) {
      throw new Error('请求频率过高，请稍后重试');
    }
    if (error.response?.data?.message === 'Internal Server Error') {
      throw new Error('网络错误，请重试1~3次');
    }
    throw new Error(`API请求失败: ${error.message}`);
  }
);

// 数据类型定义
export interface JizhileSearchParams {
  /**
   * 关键词 （支持以空格为分隔符的多词组搜索）
   */
  kw?: string;
  /**
   * 满足其中任意一个的文章（支持以空格为分隔符的多词组搜索）
   */
  any_kw?: string;
  /**
   * 不包含关键词的文章（支持以空格为分隔符的多词组搜索）
   */
  ex_kw?: string;
  /**
   * 极致了官网 key
   */
  key: string;
  /**
   * 1：搜索标题 2：搜索正文 3：搜索标题和正文 默认为1
   */
  mode?: number;
  /**
   * 页码，默认为1
   */
  page?: number;
  /**
   * （1-7 天内数据）默认为7
   */
  period?: number;
  /**
   * 1：按照阅读数排序 2：按照时间排序 默认为 1
   */
  sort_type?: number;
  /**
   * 附加码 (如设置了附加码，则此参数为必选)
   */
  verifycode?: string;
  /**
   * 类型标识，固定为1
   */
  type?: number;
}

export interface JizhileArticleDetailParams {
  /**
   * 微信文章链接
   */
  url: string;
  /**
   * 极致了官网 key
   */
  key: string;
  /**
   * 1.带图片标签纯文本 2.纯文字+富文本格式
   */
  mode?: string;
  /**
   * 附加码 (如设置了附加码，则此参数为必选)
   */
  verifycode?: string;
}

export interface JizhileSearchResultItem {
  /**
   * 封面
   */
  avatar: string;
  /**
   * 分类
   */
  classify: string;
  /**
   * 正文
   */
  content: string;
  /**
   * 原始id
   */
  ghid: string;
  /**
   * 发布地址
   */
  ip_wording: string;
  /**
   * 是否原创
   */
  is_original: number;
  /**
   * 再看数
   */
  looking: number;
  /**
   * 点赞数
   */
  praise: number;
  /**
   * 发布时间（时间戳）
   */
  publish_time: number;
  /**
   * 发布时间字符串
   */
  publish_time_str: string;
  /**
   * 阅读数
   */
  read: number;
  /**
   * 文章原始短链接
   */
  short_link: string;
  /**
   * 文章标题
   */
  title: string;
  /**
   * 更新时间（时间戳）
   */
  update_time: number;
  /**
   * 更新时间字符串
   */
  update_time_str: string;
  /**
   * 文章长连接
   */
  url: string;
  /**
   * wxid
   */
  wx_id: string;
  /**
   * 公众号名字
   */
  wx_name: string;
}

export interface JizhileSearchResult {
  code: number;
  cost_money: number;
  cut_words: string;
  data: JizhileSearchResultItem[];
  data_number: number;
  msg: string;
  page: number;
  remain_money: number;
  total: number;
  total_page: number;
}

export interface JizhileArticleDetail {
  /**
   * 公众号wxid
   */
  alias: string;
  /**
   * 文章作者
   */
  author: string;
  /**
   * 公众号biz
   */
  biz: string;
  /**
   * 1:1的封面图
   */
  cdn_url_1_1: string;
  /**
   * 状态码
   */
  code: number;
  /**
   * 纯文本格式正文
   */
  content: string;
  /**
   * 适用于富文本编辑器的html格式
   */
  content_multi_text: string;
  /**
   * 是否原创 （1 原创 0非原创 2转载）
   */
  copyright_stat: number;
  /**
   * 消费金额
   */
  cost_money: number;
  /**
   * 文章创建（定时）时间
   */
  create_time: string;
  /**
   * 文章摘要
   */
  desc: string;
  /**
   * 文章唯一id
   */
  hashid: string;
  /**
   * 文章位置，8篇里面第几篇
   */
  idx: string;
  /**
   * ip地址
   */
  ip_wording: string;
  /**
   * 0:图文 5:纯视频 7:纯音乐 8:纯图片 10:纯文字 11:转载文章
   */
  item_show_type: number;
  /**
   * 公众号头像
   */
  mp_head_img: string;
  /**
   * 比如人民日报一天可以发10次，这是第几次发送
   */
  msg_daily_idx: string;
  /**
   * 公众号名字
   */
  nick_name: string;
  /**
   * 文章中图片列表
   */
  picture_page_info_list: { [key: string]: any }[];
  /**
   * 发文时间
   */
  pubtime: string;
  /**
   * 0:图文 5:纯视频 7:纯音乐 8:纯图片 10:纯文字 11:转载文章
   */
  real_item_show_type: number;
  /**
   * 所剩金额
   */
  remain_money: number;
  /**
   * 公众号简介
   */
  signature: string;
  /**
   * 文章原文链接 （如果没有则为空）
   */
  source_url: string;
  /**
   * 文章标题
   */
  title: string;
  /**
   * 9 群发的有通知  10002 发布无通知
   */
  type: number;
  /**
   * 文章长链接
   */
  url: string;
  /**
   * 公众号原始id
   */
  user_name: string;
  /**
   * 文章中的视频列表
   */
  video_page_infos: { [key: string]: any }[];
}

/**
 * 极致了API封装类
 */
export class JizhileService {

  /**
   * 关键词搜索微信文章
   * @param params 搜索参数
   * @returns Promise<JizhileSearchResult> 搜索结果
   */
  static async kwSearch(params: Omit<JizhileSearchParams, 'key'> & { key?: string }): Promise<JizhileSearchResult> {
    try {
      const apiKey = params.key || ACCESS_KEY;
      if (!apiKey) {
        throw new Error('缺少API密钥，请配置JIZHILE_API_KEY环境变量');
      }

      console.log('正在使用极致了API搜索微信文章...', {
        keyword: params.kw || params.any_kw,
        mode: params.mode || 1,
        period: params.period || 7,
        page: params.page || 1
      });

      const requestData: JizhileSearchParams = {
        key: apiKey,
        kw: params.kw || '',
        any_kw: params.any_kw || '',
        ex_kw: params.ex_kw || '',
        mode: params.mode || 1, // 默认搜索标题
        page: params.page || 1,
        period: params.period || 7,
        sort_type: params.sort_type || 1, // 默认按阅读数排序
        type: 1,
        verifycode: params.verifycode || process.env.JIZHILE_VERIFY_CODE || ''
      };

      const response = await jizhileClient.post('/fbmain/monitor/v3/kw_search', requestData);

      if (response.data?.code !== 0) {
        const errorMsg = response.data?.msg || '搜索失败';
        throw new Error(`极致了API错误: ${errorMsg} (code: ${response.data?.code})`);
      }

      const result = response.data as JizhileSearchResult;
      console.log(`成功搜索到 ${result.data?.length || 0} 篇文章，消费 ${result.cost_money} 元，余额 ${result.remain_money} 元`);

      return result;

    } catch (error) {
      console.error('极致了关键词搜索失败:', error);
      throw error;
    }
  }

  /**
   * 获取文章详情
   * @param params 文章详情参数
   * @returns Promise<JizhileArticleDetail> 文章详情
   */
  static async getArticleDetail(params: Omit<JizhileArticleDetailParams, 'key'> & { key?: string }): Promise<JizhileArticleDetail> {
    try {
      const apiKey = params.key || ACCESS_KEY;
      if (!apiKey) {
        throw new Error('缺少API密钥，请配置JIZHILE_API_KEY环境变量');
      }

      console.log('🔥 正在使用极致了API获取文章详情...', params.url);

      // URL预处理和验证
      let processedUrl = params.url;

      console.log('🔍 极致了API URL预处理分析:', {
        originalUrl: processedUrl,
        urlLength: processedUrl.length,
        hasDoubleEncoding: processedUrl.includes('%253D') || processedUrl.includes('%252B'),
        hasAnchor: processedUrl.includes('#'),
        hasBiz: processedUrl.includes('__biz=')
      });

      // 检查URL是否需要解码（处理双重编码问题）
      if (processedUrl.includes('%253D') || processedUrl.includes('%252B')) {
        // 存在双重编码，需要解码一次
        try {
          const originalUrl = processedUrl;
          processedUrl = decodeURIComponent(processedUrl);
          console.log('✅ 检测到双重编码，解码成功:', {
            before: originalUrl,
            after: processedUrl
          });
        } catch (e) {
          console.warn('⚠️  URL解码失败，使用原始URL:', e);
        }
      }

      // 验证微信文章URL的有效性
      if (processedUrl.includes('mp.weixin.qq.com')) {
        const bizMatch = processedUrl.match(/__biz=([^&]+)/);
        if (!bizMatch) {
          throw new Error('微信文章URL缺少必要的__biz参数');
        }

        const bizValue = bizMatch[1];
        console.log('📱 微信文章biz参数验证:', {
          bizValue: bizValue,
          bizLength: bizValue.length,
          isValidLength: bizValue.length >= 20
        });

        if (bizValue.length < 20) {
          console.warn(`⚠️  biz参数长度异常: ${bizValue} (长度: ${bizValue.length})`);
          // 不直接抛出错误，而是尝试继续调用，让API返回具体错误
        }

        // 检查mid和sn参数
        if (!processedUrl.includes('mid=') || !processedUrl.includes('sn=')) {
          throw new Error('微信文章URL缺少必要的mid或sn参数');
        }
      }

      const requestParams = {
        url: processedUrl,
        key: apiKey,
        mode: params.mode || '1', // 默认带图片标签纯文本
        verifycode: params.verifycode || process.env.JIZHILE_VERIFY_CODE || ''
      };

      console.log('🚀 发送极致了API请求:', {
        url: processedUrl,
        apiKeyPrefix: apiKey.substring(0, 8) + '...',
        mode: requestParams.mode,
        hasVerifyCode: !!requestParams.verifycode
      });

      const response = await jizhileClient.get('/fbmain/monitor/v3/article_detail', { params: requestParams });

      console.log('📨 极致了API响应:', {
        status: response.status,
        dataExists: !!response.data,
        code: response.data?.code,
        hasContent: !!response.data?.content,
        contentLength: response.data?.content?.length || 0
      });

      if (response.data?.code !== 0) {
        const errorMsg = this.getErrorMessage(response.data?.code) || response.data?.msg || '获取文章详情失败';
        const detailedError = `极致了API错误: ${errorMsg} (code: ${response.data?.code})`;

        // 根据错误码提供更详细的错误信息
        let suggestion = '';
        switch (response.data?.code) {
          case 101:
            suggestion = '可能是文章已被删除、违规或公众号迁移，请检查URL是否有效';
            break;
          case 105:
          case 106:
            suggestion = '文章解析失败，可能是URL格式问题或内容被加密';
            break;
          case 107:
            suggestion = '解析失败，建议稍后重试';
            break;
          case 400:
            suggestion = '请求参数错误，请检查URL格式是否正确';
            break;
          default:
            suggestion = '请检查API密钥是否正确，或联系极致了客服';
        }

        console.error('❌ 极致了API详细错误:', {
          code: response.data?.code,
          message: errorMsg,
          url: processedUrl,
          suggestion
        });

        throw new Error(`${detailedError}${suggestion ? ` 建议: ${suggestion}` : ''}`);
      }

      const result = response.data as JizhileArticleDetail;
      console.log(`✅ 极致了API获取成功: 消费 ${result.cost_money} 元，余额 ${result.remain_money} 元，内容长度: ${result.content?.length || 0} 字符`);

      return result;

    } catch (error: any) {
      console.error('❌ 极致了API调用失败:', {
        error: error.message,
        url: params.url,
        processedUrl: processedUrl || params.url,
        errorType: error.constructor.name
      });

      // 增强错误信息
      if (error.message.includes('timeout')) {
        throw new Error(`极致了API请求超时: ${error.message}`);
      } else if (error.message.includes('Network Error')) {
        throw new Error(`网络连接错误，无法访问极致了API: ${error.message}`);
      } else if (error.response?.status === 401) {
        throw new Error('极致了API密钥无效，请检查JIZHILE_API_KEY配置');
      } else if (error.response?.status === 429) {
        throw new Error('极致了API请求频率过高，请稍后重试');
      }

      throw error;
    }
  }

  /**
   * 获取错误信息
   * @param code 错误代码
   * @returns 错误信息
   */
  static getErrorMessage(code: number): string {
    const errorMessages: Record<number, string> = {
      101: '文章被删除或违规或公众号已迁移',
      105: '文章解析失败',
      106: '文章解析失败',
      107: '解析失败，请重试'
    };

    return errorMessages[code] || '未知错误';
  }

  /**
   * 批量获取文章详情（带重试和限流）
   * @param urls 文章URL列表
   * @param options 配置选项
   * @returns Promise<JizhileArticleDetail[]> 文章详情列表
   */
  static async batchGetArticleDetails(
    urls: string[],
    options: {
      key?: string;
      mode?: string;
      verifycode?: string;
      concurrency?: number; // 并发数限制
      retryCount?: number; // 重试次数
    } = {}
  ): Promise<(JizhileArticleDetail | null)[]> {
    const {
      key,
      mode = '1',
      verifycode,
      concurrency = 3, // 默认最多3个并发
      retryCount = 2
    } = options;

    const results: (JizhileArticleDetail | null)[] = [];

    // 分批处理，避免过多并发请求
    for (let i = 0; i < urls.length; i += concurrency) {
      const batch = urls.slice(i, i + concurrency);

      const batchPromises = batch.map(async (url, index) => {
        for (let retry = 0; retry <= retryCount; retry++) {
          try {
            const detail = await this.getArticleDetail({
              url,
              key,
              mode,
              verifycode
            });
            return detail;
          } catch (error) {
            console.error(`获取文章详情失败 (${retry + 1}/${retryCount + 1}):`, url, error);
            if (retry === retryCount) {
              return null; // 最终失败返回null
            }
            // 重试前等待一段时间
            await new Promise(resolve => setTimeout(resolve, 1000 * (retry + 1)));
          }
        }
        return null;
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // 批次间间隔，避免请求过于频繁
      if (i + concurrency < urls.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return results;
  }

  /**
   * 测试API连接
   * @param key 可选的API密钥
   * @returns Promise<boolean> 连接是否成功
   */
  static async testConnection(key?: string): Promise<boolean> {
    try {
      console.log('正在测试极致了API连接...');

      // 使用一个简单的搜索请求测试连接
      const result = await this.kwSearch({
        kw: '测试',
        key,
        page: 1,
        period: 1,
        mode: 1
      });

      const success = result.code === 0;

      if (success) {
        console.log('✅ 极致了API连接成功');
        console.log(`余额: ${result.remain_money} 元`);
        return true;
      } else {
        console.log('❌ 极致了API连接失败：', result.msg);
        return false;
      }

    } catch (error) {
      console.error('❌ 极致了API连接失败:', error);
      return false;
    }
  }

  /**
   * 获取API配置信息（用于调试）
   * @returns 配置信息
   */
  static getApiInfo() {
    return {
      baseURL: JIZHILE_BASE_URL,
      hasAccessKey: !!ACCESS_KEY,
      accessKeyPrefix: ACCESS_KEY ? ACCESS_KEY.substring(0, 8) + '...' : '未配置',
      hasVerifyCode: !!process.env.JIZHILE_VERIFY_CODE,
    };
  }
}

// 导出便捷方法
export const {
  kwSearch,
  getArticleDetail,
  batchGetArticleDetails,
  testConnection,
} = JizhileService;

// 导出默认服务
export default JizhileService;