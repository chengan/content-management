"use client"

import { useState, useMemo } from "react"
import { useApp } from "@/src/contexts/AppContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  FolderOpen,
  Search,
  Filter,
  Grid3X3,
  List,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Calendar,
  User,
  Tag,
  Heart,
  CheckCircle,
  Clock,
  Send,
  RefreshCw,
} from "lucide-react"
import type { Article } from "@/src/types"

const statusConfig = {
  pending: { label: "待处理", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  rewritten: { label: "已改写", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
  published: { label: "已发布", color: "bg-green-100 text-green-800", icon: Send },
}

const platforms = ["全部", "微信公众号", "知乎", "百度热搜", "微博"]
const categories = ["全部", "科技", "营销", "商业", "教育", "娱乐", "健康", "财经"]

export default function MaterialsPage() {
  const { materials, updateMaterial, deleteMaterial } = useApp()
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPlatform, setSelectedPlatform] = useState("全部")
  const [selectedCategory, setSelectedCategory] = useState("全部")
  const [selectedStatus, setSelectedStatus] = useState("全部")
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([])
  const [editingMaterial, setEditingMaterial] = useState<Article | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  // Filter materials based on search and filters
  const filteredMaterials = useMemo(() => {
    return materials.filter((material) => {
      const matchesSearch =
        material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        material.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        material.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesPlatform = selectedPlatform === "全部" || material.source === selectedPlatform
      const matchesCategory = selectedCategory === "全部" || material.category === selectedCategory
      const matchesStatus = selectedStatus === "全部" || material.status === selectedStatus

      return matchesSearch && matchesPlatform && matchesCategory && matchesStatus
    })
  }, [materials, searchQuery, selectedPlatform, selectedCategory, selectedStatus])

  const handleSelectAll = () => {
    if (selectedMaterials.length === filteredMaterials.length) {
      setSelectedMaterials([])
    } else {
      setSelectedMaterials(filteredMaterials.map((m) => m.id))
    }
  }

  const handleSelectMaterial = (id: string) => {
    setSelectedMaterials((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  const handleBatchDelete = () => {
    selectedMaterials.forEach((id) => deleteMaterial(id))
    setSelectedMaterials([])
  }

  const handleBatchStatusUpdate = (status: Article["status"]) => {
    selectedMaterials.forEach((id) => updateMaterial(id, { status }))
    setSelectedMaterials([])
  }

  const handleEditMaterial = (material: Article) => {
    setEditingMaterial(material)
  }

  const handleSaveEdit = (updates: Partial<Article>) => {
    if (editingMaterial) {
      updateMaterial(editingMaterial.id, updates)
      setEditingMaterial(null)
    }
  }

  const MaterialCard = ({ material }: { material: Article }) => {
    const statusInfo = statusConfig[material.status]
    const StatusIcon = statusInfo.icon

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <Checkbox
                checked={selectedMaterials.includes(material.id)}
                onCheckedChange={() => handleSelectMaterial(material.id)}
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2">{material.title}</h3>
                <p className="text-gray-600 text-sm line-clamp-2 mb-3">{material.content}</p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleEditMaterial(material)}>
                  <Edit className="h-4 w-4 mr-2" />
                  编辑
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Eye className="h-4 w-4 mr-2" />
                  查看详情
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => deleteMaterial(material.id)} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {material.author}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(material.collectTime).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {material.readCount.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                {material.likeCount.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{material.source}</Badge>
              <Badge variant="secondary">{material.category}</Badge>
            </div>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
              <StatusIcon className="h-3 w-3" />
              {statusInfo.label}
            </div>
          </div>

          {material.tags.length > 0 && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
              <Tag className="h-3 w-3 text-gray-400" />
              <div className="flex flex-wrap gap-1">
                {material.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {material.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{material.tags.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const MaterialRow = ({ material }: { material: Article }) => {
    const statusInfo = statusConfig[material.status]
    const StatusIcon = statusInfo.icon

    return (
      <tr className="hover:bg-gray-50">
        <td className="px-4 py-3">
          <Checkbox
            checked={selectedMaterials.includes(material.id)}
            onCheckedChange={() => handleSelectMaterial(material.id)}
          />
        </td>
        <td className="px-4 py-3">
          <div className="max-w-md">
            <h3 className="font-medium text-gray-900 line-clamp-1">{material.title}</h3>
            <p className="text-sm text-gray-500 line-clamp-1 mt-1">{material.content}</p>
          </div>
        </td>
        <td className="px-4 py-3">
          <Badge variant="outline">{material.source}</Badge>
        </td>
        <td className="px-4 py-3">
          <span className="text-sm text-gray-600">{material.author}</span>
        </td>
        <td className="px-4 py-3">
          <Badge variant="secondary">{material.category}</Badge>
        </td>
        <td className="px-4 py-3">
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium w-fit ${statusInfo.color}`}
          >
            <StatusIcon className="h-3 w-3" />
            {statusInfo.label}
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="text-sm text-gray-500">{new Date(material.collectTime).toLocaleDateString()}</div>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {material.readCount.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              {material.likeCount.toLocaleString()}
            </span>
          </div>
        </td>
        <td className="px-4 py-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEditMaterial(material)}>
                <Edit className="h-4 w-4 mr-2" />
                编辑
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Eye className="h-4 w-4 mr-2" />
                查看详情
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => deleteMaterial(material.id)} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </td>
      </tr>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">素材管理</h1>
            <p className="text-gray-600">管理和组织您的内容素材库</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}>
              {viewMode === "list" ? <Grid3X3 className="h-4 w-4" /> : <List className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4 mr-2" />
              筛选
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜索标题、作者或标签..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={() => setSearchQuery("")} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                重置
              </Button>
            </div>

            {showFilters && (
              <>
                <Separator className="mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">来源平台</Label>
                    <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {platforms.map((platform) => (
                          <SelectItem key={platform} value={platform}>
                            {platform}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-2 block">内容分类</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-2 block">处理状态</Label>
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="全部">全部</SelectItem>
                        <SelectItem value="pending">待处理</SelectItem>
                        <SelectItem value="rewritten">已改写</SelectItem>
                        <SelectItem value="published">已发布</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Batch Operations */}
        {selectedMaterials.length > 0 && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">已选择 {selectedMaterials.length} 个素材</span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleBatchStatusUpdate("rewritten")}>
                    标记为已改写
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleBatchStatusUpdate("published")}>
                    标记为已发布
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleBatchDelete}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    批量删除
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Materials List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  素材列表
                </CardTitle>
                <CardDescription>共 {filteredMaterials.length} 个素材</CardDescription>
              </div>
              <Checkbox
                checked={selectedMaterials.length === filteredMaterials.length && filteredMaterials.length > 0}
                onCheckedChange={handleSelectAll}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredMaterials.length > 0 ? (
              viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                  {filteredMaterials.map((material) => (
                    <MaterialCard key={material.id} material={material} />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left">
                          <Checkbox
                            checked={
                              selectedMaterials.length === filteredMaterials.length && filteredMaterials.length > 0
                            }
                            onCheckedChange={handleSelectAll}
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">标题</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">来源</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">作者</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">分类</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">状态</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">采集时间</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">数据</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredMaterials.map((material) => (
                        <MaterialRow key={material.id} material={material} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FolderOpen className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">暂无素材</h3>
                <p className="text-gray-500 mb-4">开始采集内容或调整筛选条件</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Material Dialog */}
        <Dialog open={!!editingMaterial} onOpenChange={() => setEditingMaterial(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>编辑素材</DialogTitle>
              <DialogDescription>修改素材的标题、分类和标签信息</DialogDescription>
            </DialogHeader>
            {editingMaterial && (
              <EditMaterialForm
                material={editingMaterial}
                onSave={handleSaveEdit}
                onCancel={() => setEditingMaterial(null)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

function EditMaterialForm({
  material,
  onSave,
  onCancel,
}: {
  material: Article
  onSave: (updates: Partial<Article>) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(material.title)
  const [category, setCategory] = useState(material.category)
  const [tags, setTags] = useState(material.tags.join(", "))

  const handleSave = () => {
    onSave({
      title,
      category,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title" className="text-sm font-medium mb-2 block">
          标题
        </Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="输入文章标题" />
      </div>
      <div>
        <Label htmlFor="category" className="text-sm font-medium mb-2 block">
          分类
        </Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.slice(1).map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="tags" className="text-sm font-medium mb-2 block">
          标签
        </Label>
        <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="输入标签，用逗号分隔" />
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button onClick={handleSave}>保存</Button>
      </div>
    </div>
  )
}
