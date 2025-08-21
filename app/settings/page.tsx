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
import { Settings, Key, Users, Zap, CheckCircle, XCircle, Plus } from "lucide-react"

export default function SettingsPage() {
  const { config, accounts, updateConfig, updateAccount } = useApp()
  const [apiKey, setApiKey] = useState(config.aiApiKey)
  const [aiModel, setAiModel] = useState(config.aiModel)
  const [collectFrequency, setCollectFrequency] = useState(config.collectFrequency.toString())
  const [autoRewrite, setAutoRewrite] = useState(config.autoRewrite)
  const [autoPublish, setAutoPublish] = useState(config.autoPublish)

  const handleSaveConfig = () => {
    updateConfig({
      aiApiKey: apiKey,
      aiModel,
      collectFrequency: Number.parseInt(collectFrequency),
      autoRewrite,
      autoPublish,
    })
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ai">AI配置</TabsTrigger>
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
