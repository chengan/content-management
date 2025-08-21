"use client"

import { useState, useEffect } from "react"
import { useApp } from "@/src/contexts/AppContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import {
  ImageIcon,
  FileText,
  Wand2,
  Download,
  RefreshCw,
  Trash2,
  Copy,
  Settings,
  Sparkles,
  Grid3X3,
  List,
  Search,
} from "lucide-react"
import { mockGenerateImages } from "@/src/utils/mock-api"
import type { Article } from "@/src/types"

interface GeneratedImage {
  id: string
  articleId: string
  url: string
  prompt: string
  createdAt: string
  associatedParagraph?: number
}

const imageStyles = [
  { value: "realistic", label: "写实风格", description: "真实感强的摄影风格图片" },
  { value: "illustration", label: "插画风格", description: "手绘插画风格的图片" },
  { value: "abstract", label: "抽象风格", description: "抽象艺术风格的图片" },
  { value: "minimalist", label: "简约风格", description: "简洁明了的设计风格" },
  { value: "cartoon", label: "卡通风格", description: "可爱的卡通动画风格" },
]

export default function ImagesPage() {
  const { materials } = useApp()
  const [selectedMaterial, setSelectedMaterial] = useState<Article | null>(null)
  const [imageStyle, setImageStyle] = useState("realistic")
  const [customPrompt, setCustomPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [activeTab, setActiveTab] = useState("generate")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")

  // Get materials that have content for image generation
  const availableMaterials = materials.filter((m) => m.content.length > 100)

  // Auto-select first available material if none selected
  useEffect(() => {
    if (!selectedMaterial && availableMaterials.length > 0) {
      setSelectedMaterial(availableMaterials[0])
    }
  }, [selectedMaterial, availableMaterials])

  // Filter generated images based on search
  const filteredImages = generatedImages.filter(
    (img) =>
      img.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      materials
        .find((m) => m.id === img.articleId)
        ?.title.toLowerCase()
        .includes(searchQuery.toLowerCase()),
  )

  const handleGenerateImages = async () => {
    if (!selectedMaterial) return

    setIsGenerating(true)

    try {
      // Generate prompt based on content and style
      const basePrompt = `为文章"${selectedMaterial.title}"生成${imageStyles.find((s) => s.value === imageStyle)?.label}的配图`
      const finalPrompt = customPrompt || basePrompt

      const imageUrls = await mockGenerateImages(selectedMaterial.content)

      // Create generated image records
      const newImages: GeneratedImage[] = imageUrls.map((url, index) => ({
        id: `img-${crypto.randomUUID()}-${index}`,
        articleId: selectedMaterial.id,
        url,
        prompt: finalPrompt,
        createdAt: new Date().toISOString(),
        associatedParagraph: index,
      }))

      setGeneratedImages((prev) => [...prev, ...newImages])
    } catch (error) {
      console.error("Image generation failed:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRegenerateImage = async (imageId: string) => {
    const image = generatedImages.find((img) => img.id === imageId)
    if (!image || !selectedMaterial) return

    setIsGenerating(true)

    try {
      const newImageUrls = await mockGenerateImages(selectedMaterial.content)
      const newUrl = newImageUrls[0]

      setGeneratedImages((prev) =>
        prev.map((img) => (img.id === imageId ? { ...img, url: newUrl, createdAt: new Date().toISOString() } : img)),
      )
    } catch (error) {
      console.error("Image regeneration failed:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDeleteImage = (imageId: string) => {
    setGeneratedImages((prev) => prev.filter((img) => img.id !== imageId))
  }

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const copyImageUrl = (url: string) => {
    navigator.clipboard.writeText(url)
  }

  // Get images for selected material
  const materialImages = selectedMaterial ? generatedImages.filter((img) => img.articleId === selectedMaterial.id) : []

  const ImageCard = ({ image }: { image: GeneratedImage }) => {
    const material = materials.find((m) => m.id === image.articleId)

    return (
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <div className="aspect-video bg-gray-100 relative">
          <img src={image.url || "/placeholder.svg"} alt={image.prompt} className="w-full h-full object-cover" />
          <div className="absolute top-2 right-2 flex gap-1">
            <Button variant="secondary" size="sm" onClick={() => handleRegenerateImage(image.id)}>
              <RefreshCw className="h-3 w-3" />
            </Button>
            <Button variant="secondary" size="sm" onClick={() => copyImageUrl(image.url)}>
              <Copy className="h-3 w-3" />
            </Button>
            <Button variant="secondary" size="sm" onClick={() => downloadImage(image.url, `image-${image.id}.png`)}>
              <Download className="h-3 w-3" />
            </Button>
            <Button variant="destructive" size="sm" onClick={() => handleDeleteImage(image.id)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <CardContent className="p-4">
          <div className="space-y-2">
            <h3 className="font-medium text-sm line-clamp-2">{material?.title}</h3>
            <p className="text-xs text-gray-500 line-clamp-2">{image.prompt}</p>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>{new Date(image.createdAt).toLocaleDateString()}</span>
              {image.associatedParagraph !== undefined && <span>段落 {image.associatedParagraph + 1}</span>}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">智能配图</h1>
          <p className="text-gray-600">为文章内容自动生成匹配的图片素材，提升内容视觉效果</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate">图片生成</TabsTrigger>
            <TabsTrigger value="manage">图片管理</TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Material Selection */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      选择文章
                    </CardTitle>
                    <CardDescription>选择需要配图的文章</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-96">
                      <div className="p-4 space-y-2">
                        {availableMaterials.length > 0 ? (
                          availableMaterials.map((material) => (
                            <div
                              key={material.id}
                              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                selectedMaterial?.id === material.id
                                  ? "border-blue-200 bg-blue-50"
                                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                              }`}
                              onClick={() => setSelectedMaterial(material)}
                            >
                              <h3 className="font-medium text-sm line-clamp-2 mb-2">{material.title}</h3>
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <Badge variant="outline" className="text-xs">
                                  {material.source}
                                </Badge>
                                <span>{material.content.length} 字</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">暂无可配图文章</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Generation Interface */}
              <div className="lg:col-span-3">
                {selectedMaterial ? (
                  <div className="space-y-6">
                    {/* Generation Settings */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Settings className="h-5 w-5" />
                          配图设置
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium mb-2 block">图片风格</Label>
                            <Select value={imageStyle} onValueChange={setImageStyle}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {imageStyles.map((style) => (
                                  <SelectItem key={style.value} value={style.value}>
                                    {style.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500 mt-1">
                              {imageStyles.find((s) => s.value === imageStyle)?.description}
                            </p>
                          </div>

                          <div>
                            <Label className="text-sm font-medium mb-2 block">自定义描述</Label>
                            <Textarea
                              placeholder="输入图片生成的特殊要求（可选）"
                              value={customPrompt}
                              onChange={(e) => setCustomPrompt(e.target.value)}
                              className="min-h-[80px]"
                            />
                          </div>
                        </div>

                        <Button onClick={handleGenerateImages} disabled={isGenerating} className="w-full" size="lg">
                          {isGenerating ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              生成中...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 mr-2" />
                              生成配图
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Article Preview */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            文章内容
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <h3 className="font-semibold text-gray-900 mb-2">{selectedMaterial.title}</h3>
                              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                                <Badge variant="outline">{selectedMaterial.source}</Badge>
                                <span>•</span>
                                <span>{selectedMaterial.author}</span>
                              </div>
                            </div>
                            <ScrollArea className="h-96">
                              <div className="pr-4">
                                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                  {selectedMaterial.content}
                                </p>
                              </div>
                            </ScrollArea>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Generated Images Preview */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <ImageIcon className="h-5 w-5" />
                            生成的配图
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {materialImages.length > 0 ? (
                            <ScrollArea className="h-96">
                              <div className="space-y-4 pr-4">
                                {materialImages.map((image) => (
                                  <div key={image.id} className="border rounded-lg overflow-hidden">
                                    <div className="aspect-video bg-gray-100 relative">
                                      <img
                                        src={image.url || "/placeholder.svg"}
                                        alt={image.prompt}
                                        className="w-full h-full object-cover"
                                      />
                                      <div className="absolute top-2 right-2 flex gap-1">
                                        <Button
                                          variant="secondary"
                                          size="sm"
                                          onClick={() => handleRegenerateImage(image.id)}
                                        >
                                          <RefreshCw className="h-3 w-3" />
                                        </Button>
                                        <Button variant="secondary" size="sm" onClick={() => copyImageUrl(image.url)}>
                                          <Copy className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          variant="secondary"
                                          size="sm"
                                          onClick={() => downloadImage(image.url, `image-${image.id}.png`)}
                                        >
                                          <Download className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                    <div className="p-3">
                                      <p className="text-xs text-gray-500 line-clamp-2">{image.prompt}</p>
                                      <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
                                        <span>{new Date(image.createdAt).toLocaleDateString()}</span>
                                        {image.associatedParagraph !== undefined && (
                                          <span>段落 {image.associatedParagraph + 1}</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          ) : (
                            <div className="flex items-center justify-center h-96">
                              <div className="text-center">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                  <Wand2 className="h-8 w-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">等待生成配图</h3>
                                <p className="text-gray-500">点击"生成配图"按钮开始创建图片</p>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex items-center justify-center h-96">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <ImageIcon className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">选择文章开始配图</h3>
                        <p className="text-gray-500">从左侧选择一篇文章来生成配图</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="manage" className="space-y-6">
            {/* Search and View Controls */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="搜索图片或文章..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                    >
                      {viewMode === "grid" ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Images Gallery */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  图片库
                </CardTitle>
                <CardDescription>共 {filteredImages.length} 张图片</CardDescription>
              </CardHeader>
              <CardContent>
                {filteredImages.length > 0 ? (
                  <div
                    className={
                      viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-4"
                    }
                  >
                    {filteredImages.map((image) => (
                      <ImageCard key={image.id} image={image} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">暂无图片</h3>
                    <p className="text-gray-500 mb-4">开始生成配图或调整搜索条件</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
