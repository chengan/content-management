### 1. 安装请求库（前置依赖）

官方SDK是一个简单的 Node.js 脚本，需配合 `axios` 或 `node-fetch` 做 http 请求，先确保安装好依赖：

```bash
npm install axios
```

或

```bash
npm install node-fetch
```
（根据 tophub.js 文件内部用到哪个库来决定）

***

### 2. 准备SDK（tophub.js）与 Access Key

- [下载 tophub.js 文件](https://github.com/ieliwb/tophub-api/blob/master/Nodejs/tophub.js) 到你的项目目录，并修改里面的 `ACCESS_KEY` 为你自己的 key。

***

### 3. 用法步骤举例

假设 SDK 的导出方法如下（如有变化请参照文件内容做对应调整！）：

#### a) 获取所有榜单列表，选中目标榜单：

```js
// 引入官方SDK示例
const { getAllNodes } = require('./tophub'); // 根据实际 exports 设置

getAllNodes().then(list => {
    // list: [{ hashid, name, display, ... }]
    const zhihu = list.find(node => node.name === '知乎');
    console.log('知乎hashid:', zhihu.hashid);
});
```

#### b) 拉取指定榜单最新内容列表

```js
const { getNodeDetail } = require('./tophub');

// 假设已获取知乎榜hashid
const hashid = 'mproPpoq6O';

getNodeDetail(hashid).then(detail => {
    // detail.items: 榜单条目数组
    detail.items.forEach(item => {
        console.log(item.title, item.url);
    });
});
```

#### c) 根据关键词拉取指定榜单节点内容

```js
const { searchNodeContent } = require('./tophub');

const hashid = 'mproPpoq6O'; // 指定榜单
const keyword = 'AI';

searchNodeContent({ q: keyword, hashid }).then(result => {
    // result.items: 搜索结果数组
    result.items.forEach(item => {
        console.log(item.title, item.url);
    });
});
```

***

### 4. 全部核心函数举例封装（伪代码）

你可以在 tophub.js 中加入：

```js
const axios = require('axios');
const ACCESS_KEY = 'YOUR_ACCESS_KEY';

async function getAllNodes() {
    const res = await axios.get('https://api.tophubdata.com/nodes', {
        headers: { Authorization: ACCESS_KEY }
    });
    return res.data.data;
}

async function getNodeDetail(hashid) {
    const res = await axios.get(`https://api.tophubdata.com/nodes/${hashid}`, {
        headers: { Authorization: ACCESS_KEY }
    });
    return res.data.data;
}

async function searchNodeContent({ q, hashid, p = 1 }) {
    const params = { q, p };
    if (hashid) params.hashid = hashid;
    const res = await axios.get(`https://api.tophubdata.com/search`, {
        headers: { Authorization: ACCESS_KEY },
        params
    });
    return res.data.data;
}

// 导出
module.exports = { getAllNodes, getNodeDetail, searchNodeContent };
```

***

### 5. 注意事项

- **不要在前端/客户端直接暴露 access_key**，仅在后端运行。
- 调用频率过高会被限流，请合理缓存结果。
- 可根据官方 github [Nodejs tophub.js 文件](https://github.com/ieliwb/tophub-api/blob/master/Nodejs/tophub.js)自定义进一步封装。
