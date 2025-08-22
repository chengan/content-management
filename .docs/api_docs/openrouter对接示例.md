
# OpenRouter API TypeScript 接入示例

## 1. 获取 API Key

- 访问 [OpenRouter 个人密钥页面](https://openrouter.ai/settings/keys) 创建你的 API Key。

## 2. TypeScript 示例代码

```typescript
// TypeScript 示例：向 OpenRouter API 发送对话请求
const fetchOpenRouter = async () => {
  const apiKey = '你的 OpenRouter API KEY'; // 替换为你的真实密钥

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": "你的站点地址", // 可选, 用于排行榜统计
      "X-Title": "你的站点标题",     // 可选, 用于排行榜统计
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "deepseek/deepseek-chat-v3.1", // 指定模型
      messages: [
        {
          role: "user",
          content: "What is the meaning of life?"
        }
      ]
      // 可按需扩展参数，例如 temperature, max_tokens 等
    })
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const result = await response.json();
  console.log(result);
};

fetchOpenRouter();
```

## 3. 重要说明

- **API 地址**：`https://openrouter.ai/api/v1/chat/completions`
- **模型名**：`deepseek/deepseek-chat-v3.1`
- **身份认证**：`Authorization` header 填写 `Bearer YOUR_API_KEY`
- **可选 headers**：
  - `HTTP-Referer`: 你的网站地址
  - `X-Title`: 你的网站名称
- **请求体参数**：
    - `model`：指定模型名称
    - `messages`：对话消息数组（可参考 OpenAI Chat Completion 格式）
    - 其他参数详见 [OpenRouter API 文档](https://openrouter.ai/docs/api-reference/overview)

## 4. 常见问题

- **如何使用第三方 SDK？**
  - 可参考 [OpenRouter官方文档-集成SDK](https://openrouter.ai/docs/community/frameworks)。

[1](https://openrouter.ai/deepseek/deepseek-chat-v3.1/api)