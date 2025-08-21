"use client"

import { useState } from "react"
import { useApp } from "@/src/contexts/AppContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Download, Search, Play, RefreshCw, CheckCircle, Eye, Heart, Calendar, User, Tag } from "lucide-react"
import { mockCollectContent } from "@/src/utils/mock-api"
import type { Article } from "@/src/types"

const platforms = [
  { id: "wechat", name: "微信公众号", icon: "📱" },
  { id: "zhihu", name: "知乎", icon: "🔍" },
  { id: "baidu", name: "百度热搜", icon: "🔥" },
  { id: "weibo", name: "微博", icon: "📢" },
]

const categories = ["全部", "科技", "营销", "商业", "教育", "娱乐", "健康", "财经"]

export default function CollectPage() {
  const { addMaterials } = useApp()
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["wechat"])
  const [collectMethod, setCollectMethod] = useState<"auto" | "keyword">("keyword")
  const [keyword, setKeyword] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["全部"])
  const [isCollecting, setIsCollecting] = useState(false)
  const [collectProgress, setCollectProgress] = useState(0)
  const [collectedArticles, setCollectedArticles] = useState<Article[]>([])
  const [collectStats, setCollectStats] = useState({
    total: 0,
    new: 0,
    duplicates: 0,
  })

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId) ? prev.filter((id) => id !== platformId) : [...prev, platformId],
    )
  }

  const handleCategoryToggle = (category: string) => {
    if (category === "全部") {
      setSelectedCategories(["全部"])
    } else {
      setSelectedCategories((prev) => {
        const filtered = prev.filter((c) => c !== "全部")
        return filtered.includes(category) ? filtered.filter((c) => c !== category) : [...filtered, category]
      })
    }
  }

  const startCollection = async () => {
    if (selectedPlatforms.length === 0) return

    setIsCollecting(true)
    setCollectProgress(0)
    setCollectedArticles([])

    try {
      const allArticles: Article[] = []

      for (let i = 0; i < selectedPlatforms.length; i++) {
        const platform = platforms.find((p) => p.id === selectedPlatforms[i])?.name || ""
        setCollectProgress(((i + 1) / selectedPlatforms.length) * 100)

        const articles = await mockCollectContent(platform, collectMethod === "keyword" ? keyword : undefined)
        allArticles.push(...articles)
      }

      // Simulate deduplication
      const uniqueArticles = allArticles.filter(
        (article, index, self) => index === self.findIndex((a) => a.title === article.title),
      )

      setCollectedArticles(uniqueArticles)
      setCollectStats({
        total: allArticles.length,
        new: uniqueArticles.length,
        duplicates: allArticles.length - uniqueArticles.length,
      })
    } catch (error) {
      console.error("Collection failed:", error)
    } finally {
      setIsCollecting(false)
      setCollectProgress(100)
    }
  }

  const addToMaterials = () => {
    addMaterials(collectedArticles)
    setCollectedArticles([])
    setCollectStats({ total: 0, new: 0, duplicates: 0 })
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">内容采集</h1>
          <p className="text-gray-600">从各大平台自动采集热门内容，为创作提供丰富素材</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Collection Control Panel */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  采集设置
                </CardTitle>
                <CardDescription>配置内容采集参数</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Platform Selection */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">选择平台</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {platforms.map((platform) => (
                      <div
                        key={platform.id}
                        className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedPlatforms.includes(platform.id)
                            ? "border-blue-200 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => handlePlatformToggle(platform.id)}
                      >
                        <Checkbox checked={selectedPlatforms.includes(platform.id)} />
                        <span className="text-lg">{platform.icon}</span>
                        <span className="text-sm font-medium">{platform.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Collection Method */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">采集方式</Label>
                  <Select value={collectMethod} onValueChange={(value: "auto" | "keyword") => setCollectMethod(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">一键采集热门内容</SelectItem>
                      <SelectItem value="keyword">关键词定向采集</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Keyword Input */}
                {collectMethod === "keyword" && (
                  <div>
                    <Label htmlFor="keyword" className="text-sm font-medium mb-2 block">
                      关键词
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="keyword"
                        placeholder="输入关键词，如：AI、营销、科技..."
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                )}

                {/* Category Filter */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">内容分类</Label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <Badge
                        key={category}
                        variant={selectedCategories.includes(category) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => handleCategoryToggle(category)}
                      >
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Collection Button */}
                <Button
                  onClick={startCollection}
                  disabled={isCollecting || selectedPlatforms.length === 0}
                  className="w-full"
                  size="lg"
                >
                  {isCollecting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      采集中...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      开始采集
                    </>
                  )}
                </Button>

                {/* Progress */}
                {isCollecting && (
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>采集进度</span>
                      <span>{Math.round(collectProgress)}%</span>
                    </div>
                    <Progress value={collectProgress} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Collection Results */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  采集结果
                </CardTitle>
                <CardDescription>
                  {collectedArticles.length > 0
                    ? `共采集到 ${collectStats.total} 篇文章，去重后 ${collectStats.new} 篇，重复 ${collectStats.duplicates} 篇`
                    : "开始采集后，结果将在这里显示"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {collectedArticles.length > 0 ? (
                  <>
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{collectStats.total}</div>
                        <div className="text-sm text-blue-600">总采集数</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{collectStats.new}</div>
                        <div className="text-sm text-green-600">新增内容</div>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">{collectStats.duplicates}</div>
                        <div className="text-sm text-orange-600">重复内容</div>
                      </div>
                    </div>

                    {/* Articles List */}
                    <div className="space-y-4 mb-6">
                      {collectedArticles.map((article) => (
                        <div
                          key={article.id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1">{article.title}</h3>
                            <Badge variant="outline" className="ml-3 shrink-0">
                              {article.source}
                            </Badge>
                          </div>

                          <p className="text-gray-600 text-sm line-clamp-2 mb-3">{article.content}</p>

                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {article.author}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(article.publishTime).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {article.readCount.toLocaleString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Heart className="h-3 w-3" />
                                {article.likeCount.toLocaleString()}
                              </span>
                            </div>
                          </div>

                          {article.tags.length > 0 && (
                            <div className="flex items-center gap-2 mt-3">
                              <Tag className="h-3 w-3 text-gray-400" />
                              <div className="flex flex-wrap gap-1">
                                {article.tags.map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Add to Materials Button */}
                    <Button onClick={addToMaterials} className="w-full" size="lg">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      添加到素材库 ({collectedArticles.length} 篇)
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Download className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">暂无采集结果</h3>
                    <p className="text-gray-500 mb-4">选择平台和采集方式，开始采集内容</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
