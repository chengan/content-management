Node.js 对接 Supabase 主要通过官方的 JavaScript 客户端库来实现。以下是详细的对接步骤：

## 1. 安装 Supabase 客户端

```bash
npm install @supabase/supabase-js
```

## 2. 初始化 Supabase 客户端

首先需要在 Supabase 控制台获取项目的 URL 和 API Key：

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://your-project.supabase.co'
const supabaseKey = 'your-anon-key'

const supabase = createClient(supabaseUrl, supabaseKey)
```

## 3. 基本数据库操作

### 查询数据
```javascript
// 查询所有数据
const { data, error } = await supabase
  .from('users')
  .select('*')

// 条件查询
const { data, error } = await supabase
  .from('users')
  .select('name, email')
  .eq('status', 'active')
  .limit(10)
```

### 插入数据
```javascript
const { data, error } = await supabase
  .from('users')
  .insert([
    { name: 'John', email: 'john@example.com' },
    { name: 'Jane', email: 'jane@example.com' }
  ])
```

### 更新数据
```javascript
const { data, error } = await supabase
  .from('users')
  .update({ name: 'Updated Name' })
  .eq('id', 1)
```

### 删除数据
```javascript
const { data, error } = await supabase
  .from('users')
  .delete()
  .eq('id', 1)
```

## 4. 身份验证

```javascript
// 用户注册
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
})

// 用户登录
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})

// 获取当前用户
const { data: { user } } = await supabase.auth.getUser()

// 登出
const { error } = await supabase.auth.signOut()
```

## 5. 实时订阅

```javascript
// 监听数据变化
const channel = supabase
  .channel('users-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'users' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()

// 取消订阅
supabase.removeChannel(channel)
```

## 6. 文件存储

```javascript
// 上传文件
const { data, error } = await supabase.storage
  .from('avatars')
  .upload('public/avatar1.png', file)

// 下载文件
const { data, error } = await supabase.storage
  .from('avatars')
  .download('public/avatar1.png')

// 获取公共 URL
const { data } = supabase.storage
  .from('avatars')
  .getPublicUrl('public/avatar1.png')
```

## 7. 完整的 Express.js 示例

```javascript
import express from 'express'
import { createClient } from '@supabase/supabase-js'

const app = express()
app.use(express.json())

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

// 获取用户列表
app.get('/users', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
    
    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 创建用户
app.post('/users', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert(req.body)
      .select()
    
    if (error) throw error
    res.status(201).json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.listen(3000, () => {
  console.log('Server running on port 3000')
})
```

## 8. 环境变量配置

创建 `.env` 文件：

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 注意事项

1. **安全性**：在服务端使用时，可以使用 service role key 来绕过 RLS（Row Level Security）
2. **错误处理**：始终检查返回的 `error` 对象
3. **类型安全**：如果使用 TypeScript，可以生成类型定义来获得更好的类型支持
4. **连接池**：Supabase 客户端会自动管理连接池，无需手动处理
