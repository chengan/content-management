"use client"

import { useState } from "react"
import { useApp } from "@/src/contexts/AppContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Settings, Key, Users, Zap, CheckCircle, XCircle, Plus, Bot, Sparkles, TestTube } from "lucide-react"

export default function SettingsPage() {
  const { config, accounts, updateConfig, updateAccount } = useApp()
  const [apiKey, setApiKey] = useState(config.aiApiKey)
  const [aiModel, setAiModel] = useState(config.aiModel)
  const [collectFrequency, setCollectFrequency] = useState(config.collectFrequency.toString())
  const [autoRewrite, setAutoRewrite] = useState(config.autoRewrite)
  const [autoPublish, setAutoPublish] = useState(config.autoPublish)

  // OpenRouter配置状态
  const [openRouterApiKey, setOpenRouterApiKey] = useState("")
  const [cleanModel, setCleanModel] = useState("mistralai/mistral-7b-instruct:free")
  const [autoClean, setAutoClean] = useState(true)
  const [testingConnection, setTestingConnection] = useState(false)

  const handleSaveConfig = () => {
    updateConfig({
      aiApiKey: apiKey,
      aiModel,
      collectFrequency: Number.parseInt(collectFrequency),
      autoRewrite,
      autoPublish,
    })
  }

  // 保存OpenRouter配置
  const handleSaveOpenRouterConfig = async () => {
    try {
      // 保存API Key
      await fetch('/api/rewrite/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'openrouter_api_key',
          value: openRouterApiKey,
          description: 'OpenRouter API密钥，用于内容清理',
          dataType: 'string'
        })
      });

      // 保存清理模型
      await fetch('/api/rewrite/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'content_clean_model',
          value: cleanModel,
          description: '内容清理使用的AI模型',
          dataType: 'string'
        })
      });

      // 保存自动清理设置
      await fetch('/api/rewrite/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'auto_content_clean',
          value: autoClean,
          description: '是否启用自动内容清理',
          dataType: 'boolean'
        })
      });

      alert('OpenRouter配置保存成功！');
    } catch (error) {
      console.error('保存OpenRouter配置失败:', error);
      alert('保存配置失败，请稍后重试');
    }
  }

  // 测试OpenRouter连接
  const handleTestConnection = async () => {
    if (!openRouterApiKey.trim()) {
      alert('请先输入OpenRouter API Key');
      return;
    }

    setTestingConnection(true);
    try {
      const response = await fetch('/api/content/clean?action=test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openRouterApiKey}` // 临时传递API Key用于测试
        }
      });

      const result = await response.json();
      
      if (result.success && result.data.testResult) {
        alert('✅ 连接测试成功！OpenRouter配置正常');
      } else {
        alert('❌ 连接测试失败，请检查API Key是否正确');
      }
    } catch (error) {
      console.error('测试连接失败:', error);
      alert('❌ 连接测试异常，请稍后重试');
    } finally {
      setTestingConnection(false);
    }
  }

  const handleToggleAccount = (accountId: string) => {
    const account = accounts.find((acc) => acc.id === accountId)
    if (account) {
      updateAccount(accountId, { isConnected: !account.isConnected })
    }
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">系统设置</h1>
          <p className="text-gray-600">配置AI接口、采集源和账号管理等系统参数</p>
        </div>

        <Tabs defaultValue="ai" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="ai">AI配置</TabsTrigger>
            <TabsTrigger value="content">内容清理</TabsTrigger>
            <TabsTrigger value="accounts">账号管理</TabsTrigger>
            <TabsTrigger value="automation">自动化设置</TabsTrigger>
          </TabsList>

          <TabsContent value="ai" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  AI接口配置
                </CardTitle>
                <CardDescription>配置AI模型和API密钥</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="apiKey" className="text-sm font-medium mb-2 block">
                    API密钥
                  </Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="输入您的AI API密钥"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">用于AI改写和图片生成功能</p>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">AI模型选择</Label>
                  <Select value={aiModel} onValueChange={setAiModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4">GPT-4</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                      <SelectItem value="claude-3">Claude 3</SelectItem>
                      <SelectItem value="claude-2">Claude 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleSaveConfig} className="w-full">
                  保存AI配置
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  服务状态
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">AI改写服务</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-600">正常</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">图片生成服务</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-600">正常</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">内容采集服务</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-600">运行中</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  内容清理配置
                </CardTitle>
                <CardDescription>配置OpenRouter AI模型，自动清理采集内容中的广告和推广信息</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="openRouterApiKey" className="text-sm font-medium mb-2 block">
                    OpenRouter API Key
                  </Label>
                  <Input
                    id="openRouterApiKey"
                    type="password"
                    placeholder="输入您的OpenRouter API密钥"
                    value={openRouterApiKey}
                    onChange={(e) => setOpenRouterApiKey(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    用于AI内容清理功能，支持免费和付费模型。
                    <a 
                      href="https://openrouter.ai/keys" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 hover:underline ml-1"
                    >
                      获取API Key
                    </a>
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">清理模型选择</Label>
                  <Select value={cleanModel} onValueChange={setCleanModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mistralai/mistral-7b-instruct:free">
                        Mistral 7B (免费) - 推荐
                      </SelectItem>
                      <SelectItem value="openchat/openchat-7b:free">
                        OpenChat 7B (免费) - 高质量
                      </SelectItem>
                      <SelectItem value="gryphe/mythomist-7b:free">
                        MythoMist 7B (免费) - 创意写作
                      </SelectItem>
                      <SelectItem value="openai/gpt-3.5-turbo">
                        GPT-3.5 Turbo (付费) - 最佳效果
                      </SelectItem>
                      <SelectItem value="anthropic/claude-3-haiku">
                        Claude-3 Haiku (付费) - 快速经济
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    免费模型适合日常使用，付费模型效果更佳
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">自动内容清理</Label>
                    <p className="text-xs text-gray-500">在获取文章内容后自动进行AI清理</p>
                  </div>
                  <Switch checked={autoClean} onCheckedChange={setAutoClean} />
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleTestConnection} 
                    variant="outline" 
                    disabled={testingConnection || !openRouterApiKey}
                    className="flex-1"
                  >
                    {testingConnection ? (
                      <>
                        <TestTube className="h-4 w-4 mr-2 animate-spin" />
                        测试中...
                      </>
                    ) : (
                      <>
                        <TestTube className="h-4 w-4 mr-2" />
                        测试连接
                      </>
                    )}
                  </Button>
                  <Button onClick={handleSaveOpenRouterConfig} className="flex-1">
                    <Sparkles className="h-4 w-4 mr-2" />
                    保存配置
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  清理服务状态
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">OpenRouter连接</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm text-yellow-600">未测试</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">内容清理服务</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-600">就绪</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">自动清理功能</span>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 ${autoClean ? 'bg-green-500' : 'bg-gray-400'} rounded-full`}></div>
                      <span className={`text-sm ${autoClean ? 'text-green-600' : 'text-gray-600'}`}>
                        {autoClean ? '已启用' : '已禁用'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="accounts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  微信公众号账号
                </CardTitle>
                <CardDescription>管理连接的微信公众号账号</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {accounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={account.avatar || "/placeholder.svg"} />
                          <AvatarFallback>账号</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium text-gray-900">{account.name}</h3>
                          <p className="text-sm text-gray-500">
                            最后同步: {new Date(account.lastSync).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={account.isConnected ? "default" : "secondary"}>
                          {account.isConnected ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              已连接
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              未连接
                            </>
                          )}
                        </Badge>
                        <Button
                          variant={account.isConnected ? "outline" : "default"}
                          size="sm"
                          onClick={() => handleToggleAccount(account.id)}
                        >
                          {account.isConnected ? "断开连接" : "连接账号"}
                        </Button>
                      </div>
                    </div>
                  ))}

                  <Button variant="outline" className="w-full bg-transparent">
                    <Plus className="h-4 w-4 mr-2" />
                    添加新账号
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="automation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  自动化设置
                </CardTitle>
                <CardDescription>配置内容采集和发布的自动化参数</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="frequency" className="text-sm font-medium mb-2 block">
                    采集频率（分钟）
                  </Label>
                  <Input
                    id="frequency"
                    type="number"
                    placeholder="60"
                    value={collectFrequency}
                    onChange={(e) => setCollectFrequency(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">设置自动采集内容的时间间隔</p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">自动改写</Label>
                    <p className="text-xs text-gray-500">采集到新内容后自动进行AI改写</p>
                  </div>
                  <Switch checked={autoRewrite} onCheckedChange={setAutoRewrite} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">自动发布</Label>
                    <p className="text-xs text-gray-500">改写完成后自动发布到公众号</p>
                  </div>
                  <Switch checked={autoPublish} onCheckedChange={setAutoPublish} />
                </div>

                <Button onClick={handleSaveConfig} className="w-full">
                  保存自动化设置
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
