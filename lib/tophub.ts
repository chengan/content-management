/**
 * 今日热榜API客户端
 * 封装与今日热榜API的所有交互功能
 */

import axios from 'axios';

// API配置
const TOPHUB_BASE_URL = 'https://api.tophubdata.com';
const ACCESS_KEY = process.env.TOPHUB_ACCESS_KEY;

// 检查环境变量
if (!ACCESS_KEY && process.env.NODE_ENV !== 'development') {
  throw new Error('缺少今日热榜API密钥。请在.env.local文件中配置TOPHUB_ACCESS_KEY。');
}

// 创建axios实例
const tophubClient = axios.create({
  baseURL: TOPHUB_BASE_URL,
  headers: {
    'Authorization': ACCESS_KEY || '',
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10秒超时
  proxy: false, // 禁用代理，避免代理问题
});

// 响应拦截器 - 处理错误
tophubClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      throw new Error('请求超时，请稍后重试');
    }
    if (error.response?.status === 401) {
      throw new Error('API密钥无效，请检查TOPHUB_ACCESS_KEY配置');
    }
    if (error.response?.status === 429) {
      throw new Error('请求频率过高，请稍后重试');
    }
    throw new Error(`API请求失败: ${error.message}`);
  }
);

// 数据类型定义
export interface TophubNode {
  hashid: string;
  name: string;
  display?: string;
  avatar?: string;
  description?: string;
}

export interface TophubItem {
  title: string;
  url: string;
  description?: string;
  hot?: number;
  time?: string;
  author?: string;
}

export interface TophubNodeDetail {
  hashid: string;
  name: string;
  items: TophubItem[];
  updated_at?: string;
}

export interface SearchResult {
  items: TophubItem[];
  total?: number;
}

/**
 * 今日热榜API封装类
 */
export class TophubService {
  
  /**
   * 获取所有榜单节点列表
   * @returns Promise<TophubNode[]> 榜单节点数组
   */
  static async getAllNodes(): Promise<TophubNode[]> {
    try {
      console.log('正在获取今日热榜所有节点...');
      
      const response = await tophubClient.get('/nodes');
      
      if (response.data?.success === false) {
        throw new Error(response.data?.message || '获取节点列表失败');
      }
      
      const nodes = response.data?.data || response.data || [];
      console.log(`成功获取 ${nodes.length} 个榜单节点`);
      
      return nodes;
      
    } catch (error) {
      console.error('获取榜单节点失败:', error);
      throw error;
    }
  }

  /**
   * 获取指定榜单的详细内容
   * @param hashid 榜单的唯一标识
   * @returns Promise<TophubNodeDetail> 榜单详细内容
   */
  static async getNodeDetail(hashid: string): Promise<TophubNodeDetail> {
    try {
      if (!hashid) {
        throw new Error('hashid参数不能为空');
      }
      
      console.log(`正在获取榜单详情，hashid: ${hashid}`);
      
      const response = await tophubClient.get(`/nodes/${hashid}`);
      
      if (response.data?.success === false) {
        throw new Error(response.data?.message || '获取榜单详情失败');
      }
      
      const detail = response.data?.data || response.data;
      
      if (!detail) {
        throw new Error('榜单数据为空');
      }
      
      console.log(`成功获取榜单 "${detail.name}"，包含 ${detail.items?.length || 0} 个条目`);
      
      return detail;
      
    } catch (error) {
      console.error(`获取榜单详情失败 (hashid: ${hashid}):`, error);
      throw error;
    }
  }

  /**
   * 根据关键词搜索指定榜单内容
   * @param options 搜索选项
   * @param options.q 搜索关键词
   * @param options.hashid 可选，指定榜单hashid
   * @param options.p 可选，页码，默认为1
   * @returns Promise<SearchResult> 搜索结果
   */
  static async searchNodeContent(options: {
    q: string;
    hashid?: string;
    p?: number;
  }): Promise<SearchResult> {
    try {
      const { q, hashid, p = 1 } = options;
      
      if (!q || !q.trim()) {
        throw new Error('搜索关键词不能为空');
      }
      
      console.log(`正在搜索内容，关键词: "${q}"`, hashid ? `，榜单: ${hashid}` : '');
      
      const params: any = { q: q.trim(), p };
      if (hashid) {
        params.hashid = hashid;
      }
      
      const response = await tophubClient.get('/search', { params });
      
      if (response.data?.success === false) {
        throw new Error(response.data?.message || '搜索失败');
      }
      
      const result = response.data?.data || response.data || { items: [] };
      
      console.log(`搜索完成，找到 ${result.items?.length || 0} 个结果`);
      
      return result;
      
    } catch (error) {
      console.error('搜索内容失败:', error);
      throw error;
    }
  }

  /**
   * 获取微信公众号热文总榜内容
   * @returns Promise<TophubNodeDetail> 微信热文榜详细内容
   */
  static async getWechatHotlist(): Promise<TophubNodeDetail> {
    const WECHAT_HASHID = 'WnBe01o371'; // 微信热文总榜的hashid
    return TophubService.getNodeDetail(WECHAT_HASHID);
  }

  /**
   * 测试API连接
   * @returns Promise<boolean> 连接是否成功
   */
  static async testConnection(): Promise<boolean> {
    try {
      console.log('正在测试今日热榜API连接...');
      
      const response = await tophubClient.get('/nodes', {
        timeout: 5000, // 5秒超时
      });
      
      const success = response.status === 200 && response.data;
      
      if (success) {
        console.log('✅ 今日热榜API连接成功');
        return true;
      } else {
        console.log('❌ 今日热榜API连接失败：响应数据异常');
        return false;
      }
      
    } catch (error) {
      console.error('❌ 今日热榜API连接失败:', error);
      return false;
    }
  }

  /**
   * 获取API配置信息（用于调试）
   * @returns 配置信息
   */
  static getApiInfo() {
    return {
      baseURL: TOPHUB_BASE_URL,
      hasAccessKey: !!ACCESS_KEY,
      accessKeyPrefix: ACCESS_KEY ? ACCESS_KEY.substring(0, 8) + '...' : '未配置',
    };
  }
}

// 导出便捷方法
export const {
  getAllNodes,
  getNodeDetail,
  searchNodeContent,
  getWechatHotlist,
  testConnection,
} = TophubService;

// 导出默认服务
export default TophubService;