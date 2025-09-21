## 关键词 搜索 微信文章

### https://www.dajiala.com/fbmain/monitor/v3/kw_search

可翻页，每页20条。
接口返回结果为数据库中数据，如需微信客户端一致实时数据请联系客服
kw, any_kw, ex_kw 三个条件为”与“关系，都满足才会返回数据
至少提交 kw, any_kw, ex_kw 三个条件其中的一个
按照返回条数扣费(0.02/条), 最低0.02
状态码	说明
{"message":"Internal Server Error"}	网络错误，请重试1~3次
0	成功

### 参数
"""
/**
 * 请求参数
 */
export interface ApifoxModel {
    /**
     * 满足其中任意一个的文章（支持以空格为分隔符的多词组搜索 例如："关键词1 关键词2"）
     */
    any_kw: string;
    /**
     * 不包含关键词的文章（支持以空格为分隔符的多词组搜索 例如："关键词1 关键词2"）
     */
    ex_kw: string;
    /**
     * 极致了官网 key
     */
    key: string;
    /**
     * 关键词 （支持以空格为分隔符的多词组搜索 例如："关键词1 关键词2"）
     */
    kw: string;
    /**
     * 1：搜索标题 2：搜索正文 3：搜索标题和正文 默认为1（如果搜索正文 最大天数period 为7）
     */
    mode: number;
    /**
     * 页码，默认为1（默认页码1为获取前20位结果，页码2为获取20到40位结果）
     */
    page: number;
    /**
     * （1-7 天内数据）默认为7
     */
    period: number;
    /**
     * 1：按照阅读数排序 2：按照时间排序 默认为 1
     */
    sort_type: number;
    [property: string]: any;
}
"""

### 示例代码
"""
var axios = require('axios');
var data = JSON.stringify({
   "kw": "人民日报",
   "sort_type": 1,
   "mode": 1,
   "period": 7,
   "page": 1,
   "key": "{{key}}",
   "any_kw": "",
   "ex_kw": "",
   "verifycode": "",
   "type": 1
});

var config = {
   method: 'post',
   url: 'https://www.dajiala.com/fbmain/monitor/v3/kw_search',
   headers: { 
      'Content-Type': 'application/json'
   },
   data : data
};

axios(config)
.then(function (response) {
   console.log(JSON.stringify(response.data));
})
.catch(function (error) {
   console.log(error);
});

"""

### 返回响应
"""
export interface ApifoxModel {
    code: number;
    cost_money: number;
    cut_words: string;
    data: Datum[];
    data_number: number;
    msg: string;
    page: number;
    remain_money: number;
    total: number;
    total_page: number;
    [property: string]: any;
}

export interface Datum {
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
     * 发布时间
     */
    publish_time: number;
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
     * 更新时间
     */
    update_time: number;
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
    [property: string]: any;
}
"""

## 获取文章详情(纯文本,富文本,不带html文章格式)
https://www.dajiala.com/fbmain/monitor/v3/article_detail

状态码	说明
{"message":"Internal Server Error"}	网络错误，请重试1~3次
0	成功
101	文章被删除或违规或公众号已迁移
105,106	文章解析失败
107	解析失败，请重试

### 请求参数
"""
export interface ApifoxModel {
    /**
     * 极致了官网 key
     */
    key?: string;
    /**
     * 1.带图片标签纯文本    2.纯文字+富文本格式
     */
    mode?: string;
    /**
     * 微信文章链接 （ 0.03/次）
     */
    url?: string;
    /**
     * 附加码 (如设置了附加码verifycode，则此参数为必选，如未设置则为非必选)
     */
    verifycode?: string;
    [property: string]: any;
}

"""

请求示例代码：
"""
var axios = require('axios');

var config = {
   method: 'get',
   url: 'https://www.dajiala.com/fbmain/monitor/v3/article_detail?url=https://mp.weixin.qq.com/s?__biz=MjM5MjAxNDM4MA==%26mid=2666900240%26idx=1%26sn=a130a51c16cbe0169dd776a470e63bba%26chksm=bc1219084e2f51c60f29a7a5d8c25e6ed32554270bf36dbb032fdc6d39d05d2c24742d3367d2%23rd&key={{key}}&mode=1&verifycode',
   headers: { }
};

axios(config)
.then(function (response) {
   console.log(JSON.stringify(response.data));
})
.catch(function (error) {
   console.log(error);
});
"""

返回响应
"""
export interface ApifoxModel {
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
    [property: string]: any;
}
"""