# 第二阶段 Step 2：测试API连接操作指南

## 🎯 这一步要做什么？
测试今日热榜API是否配置正确，能否正常获取微信公众号的热门文章数据。

## 📝 操作步骤（超级简单版）

### 第1步：启动开发服务器
1. 打开命令行（CMD或PowerShell）
2. 进入项目目录
3. 运行命令：
```bash
pnpm dev
```
4. 等待服务器启动，看到类似 `Local: http://localhost:3000` 的提示

### 第2步：测试API连接
1. 打开浏览器
2. 访问测试接口：`http://localhost:3000/api/test-tophub`
3. 你会看到一个JSON格式的返回结果

### 第3步：解读测试结果

#### ✅ 成功的情况
如果一切正常，你会看到类似这样的结果：
```json
{
  "success": true,
  "data": {
    "connection": {
      "status": "success",
      "message": "今日热榜API连接正常"
    },
    "apiInfo": {
      "baseURL": "https://api.tophubdata.com",
      "hasAccessKey": true,
      "accessKeyPrefix": "abc12345..."
    },
    "wechatTest": {
      "status": "success",
      "data": {
        "name": "微信公众号",
        "hashid": "WnBe01o371",
        "itemCount": 20,
        "sampleItems": [
          {
            "title": "某篇热门文章标题",
            "url": "https://...",
            "description": "文章描述..."
          }
        ]
      }
    }
  }
}
```

**这表示：**
- ✅ API密钥配置正确
- ✅ 网络连接正常
- ✅ 能够获取微信公众号热文数据

#### ❌ 失败的情况

**情况1：API密钥未配置**
```json
{
  "success": false,
  "error": "缺少今日热榜API密钥。请在.env.local文件中配置TOPHUB_ACCESS_KEY。"
}
```
**解决方法：** 检查.env.local文件中是否正确配置了TOPHUB_ACCESS_KEY

**情况2：API密钥无效**
```json
{
  "success": false,
  "error": "API密钥无效，请检查TOPHUB_ACCESS_KEY配置"
}
```
**解决方法：** 联系服务提供商确认API密钥是否正确

**情况3：网络连接失败**
```json
{
  "success": false,
  "error": "请求超时，请稍后重试"
}
```
**解决方法：** 检查网络连接，稍后重试

## 🔧 故障排除步骤

### 步骤1：检查环境变量配置
1. 打开 `.env.local` 文件
2. 确认包含以下配置：
```env
TOPHUB_ACCESS_KEY=你的真实API密钥
```
3. 确认API密钥没有多余的空格或引号

### 步骤2：重启开发服务器
1. 在命令行按 `Ctrl + C` 停止服务器
2. 重新运行 `pnpm dev`
3. 再次访问测试接口

### 步骤3：查看控制台日志
1. 在浏览器中按 `F12` 打开开发者工具
2. 点击 `Console` 标签
3. 刷新测试页面，查看是否有错误信息

### 步骤4：查看服务器日志
1. 在运行 `pnpm dev` 的命令行窗口中
2. 查看是否有错误或警告信息
3. 特别注意包含 "今日热榜" 或 "tophub" 的日志

## 📞 获取帮助

如果按照以上步骤仍然无法解决问题，请：

1. **截图保存**以下内容：
   - 测试接口的返回结果
   - 浏览器控制台的错误信息
   - 服务器命令行的错误日志

2. **检查以下信息**：
   - .env.local文件的配置（隐藏敏感信息）
   - 网络连接状态
   - 开发服务器是否正常启动

3. **联系技术支持**时提供上述信息

## ✅ 测试通过标志

当你看到以下结果时，说明配置成功：
- ✅ 测试接口返回 `"success": true`
- ✅ 能够看到微信公众号的名称和数据条目
- ✅ 控制台没有相关错误信息
- ✅ 服务器日志显示"今日热榜API连接成功"

---

**下一步：** 配置成功后，我们将开始创建数据库表结构，为采集功能做准备。