'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { 
  Package,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Settings,
  Plus,
  Edit3,
  Trash2,
  Search,
  Filter,
  BarChart3,
  TrendingUp,
  Target,
  Zap,
  Clock,
  Activity,
  Eye,
  Bell,
  BellOff,
  ShoppingCart,
  Database,
  Globe,
  Calendar,
  DollarSign,
  XCircle
} from 'lucide-react'
import { 
  useInventoryAutomation,
  useProductInventory 
} from '@/hooks/use-inventory-automation'
import { InventoryStatus, InventoryAlert, InventoryRule } from '@/lib/services/inventory-automation'
import { format, formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface InventoryAutomationManagerProps {
  className?: string
}

export function InventoryAutomationManager({ className = '' }: InventoryAutomationManagerProps) {
  const [activeTab, setActiveTab] = useState<'inventory' | 'alerts' | 'rules' | 'analytics'>('inventory')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSite, setFilterSite] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedInventory, setSelectedInventory] = useState<InventoryStatus | null>(null)
  const [showInventoryDialog, setShowInventoryDialog] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newInventoryForm, setNewInventoryForm] = useState({
    productUrl: '',
    productTitle: '',
    site: '',
    category: '',
    brand: '',
    seller: ''
  })

  const {
    inventoryStatuses,
    alerts,
    urgentAlerts,
    rules,
    inventoryStats,
    alertStats,
    ruleStats,
    recentChanges,
    isLoadingInventory,
    isLoadingAlerts,
    isLoadingRules,
    registerInventoryTracking,
    checkInventoryStatus,
    forceCheckAll,
    acknowledgeAlert,
    addRule,
    updateRule,
    deleteRule,
    toggleRule,
    refetchInventory,
    isRegistering,
    isChecking,
    isForceChecking,
    isAcknowledging
  } = useInventoryAutomation()

  // 필터링된 재고 목록
  const filteredInventories = inventoryStatuses.filter(inventory => {
    const matchesSearch = inventory.productTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         inventory.productUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         inventory.site.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesSite = filterSite === 'all' || inventory.site === filterSite
    const matchesStatus = filterStatus === 'all' || inventory.stockLevel === filterStatus

    return matchesSearch && matchesSite && matchesStatus
  })

  // 사이트 목록 추출
  const sites = Array.from(new Set(inventoryStatuses.map(item => item.site)))

  const handleForceCheckAll = async () => {
    await forceCheckAll()
  }

  const handleRegisterInventory = async () => {
    if (!newInventoryForm.productUrl || !newInventoryForm.productTitle || !newInventoryForm.site) {
      toast.error('필수 정보를 모두 입력해주세요')
      return
    }

    const metadata = {
      category: newInventoryForm.category || undefined,
      brand: newInventoryForm.brand || undefined,
      seller: newInventoryForm.seller || undefined
    }

    const result = await registerInventoryTracking(
      newInventoryForm.productUrl,
      newInventoryForm.productTitle,
      newInventoryForm.site,
      metadata
    )

    if (result) {
      setShowAddDialog(false)
      setNewInventoryForm({
        productUrl: '',
        productTitle: '',
        site: '',
        category: '',
        brand: '',
        seller: ''
      })
    }
  }

  const handleAcknowledgeAlert = async (alertId: string) => {
    await acknowledgeAlert(alertId, 'admin') // 실제 구현에서는 현재 관리자 ID 사용
  }

  const renderStockLevelBadge = (stockLevel: string, currentStock: number) => {
    const config = {
      'in_stock': { variant: 'default' as const, color: 'bg-green-100 text-green-800', label: '재고 있음' },
      'low_stock': { variant: 'default' as const, color: 'bg-yellow-100 text-yellow-800', label: '재고 부족' },
      'out_of_stock': { variant: 'default' as const, color: 'bg-red-100 text-red-800', label: '품절' },
      'unknown': { variant: 'secondary' as const, color: 'bg-gray-100 text-gray-800', label: '확인 중' }
    }

    const { variant, color, label } = config[stockLevel as keyof typeof config] || config.unknown

    return (
      <Badge variant={variant} className={`text-xs ${color} border-0`}>
        {label} {currentStock >= 0 && `(${currentStock})`}
      </Badge>
    )
  }

  const renderAlertSeverityBadge = (severity: string) => {
    const config = {
      critical: { variant: 'destructive' as const, label: '긴급' },
      high: { variant: 'default' as const, color: 'bg-red-100 text-red-800', label: '높음' },
      medium: { variant: 'default' as const, color: 'bg-yellow-100 text-yellow-800', label: '보통' },
      low: { variant: 'secondary' as const, label: '낮음' }
    }

    const configItem = config[severity as keyof typeof config] || config.low
    const { variant, label } = configItem
    const color = 'color' in configItem ? configItem.color : undefined

    return (
      <Badge variant={variant} className={color ? `text-xs ${color} border-0` : 'text-xs'}>
        {label}
      </Badge>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            재고 자동화 관리
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleForceCheckAll}
              disabled={isForceChecking}
            >
              {isForceChecking ? (
                <>
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                  업데이트 중...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3 mr-1" />
                  전체 새로고침
                </>
              )}
            </Button>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-3 h-3 mr-1" />
                  새 모니터링 추가
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>새 재고 모니터링 추가</DialogTitle>
                  <DialogDescription>
                    상품의 재고를 자동으로 모니터링할 수 있습니다.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="productUrl">상품 URL *</Label>
                    <Input
                      id="productUrl"
                      placeholder="https://example.com/product/123"
                      value={newInventoryForm.productUrl}
                      onChange={(e) => setNewInventoryForm(prev => ({ ...prev, productUrl: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="productTitle">상품명 *</Label>
                    <Input
                      id="productTitle"
                      placeholder="상품명을 입력하세요"
                      value={newInventoryForm.productTitle}
                      onChange={(e) => setNewInventoryForm(prev => ({ ...prev, productTitle: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="site">사이트 *</Label>
                      <Select 
                        value={newInventoryForm.site} 
                        onValueChange={(value) => setNewInventoryForm(prev => ({ ...prev, site: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="사이트 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="coupang">쿠팡</SelectItem>
                          <SelectItem value="gmarket">지마켓</SelectItem>
                          <SelectItem value="auction">옥션</SelectItem>
                          <SelectItem value="11st">11번가</SelectItem>
                          <SelectItem value="other">기타</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="category">카테고리</Label>
                      <Input
                        id="category"
                        placeholder="electronics, fashion, etc."
                        value={newInventoryForm.category}
                        onChange={(e) => setNewInventoryForm(prev => ({ ...prev, category: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="brand">브랜드</Label>
                      <Input
                        id="brand"
                        placeholder="브랜드명"
                        value={newInventoryForm.brand}
                        onChange={(e) => setNewInventoryForm(prev => ({ ...prev, brand: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="seller">판매자</Label>
                      <Input
                        id="seller"
                        placeholder="판매자명"
                        value={newInventoryForm.seller}
                        onChange={(e) => setNewInventoryForm(prev => ({ ...prev, seller: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    취소
                  </Button>
                  <Button onClick={handleRegisterInventory} disabled={isRegistering}>
                    {isRegistering ? (
                      <>
                        <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
                        등록 중...
                      </>
                    ) : (
                      '등록'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="inventory">재고 모니터링</TabsTrigger>
            <TabsTrigger value="alerts" className="relative">
              알림 관리
              {urgentAlerts.length > 0 && (
                <Badge variant="destructive" className="ml-1 px-1 text-xs">
                  {urgentAlerts.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="rules">자동화 규칙</TabsTrigger>
            <TabsTrigger value="analytics">성능 분석</TabsTrigger>
          </TabsList>

          {/* 재고 모니터링 탭 */}
          <TabsContent value="inventory" className="space-y-4">
            {/* 요약 통계 */}
            <div className="grid grid-cols-5 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">총 상품</p>
                <p className="text-lg font-bold text-blue-600">{inventoryStats.totalItems}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">재고 있음</p>
                <p className="text-lg font-bold text-green-600">{inventoryStats.inStock}</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">재고 부족</p>
                <p className="text-lg font-bold text-yellow-600">{inventoryStats.lowStock}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">품절</p>
                <p className="text-lg font-bold text-red-600">{inventoryStats.outOfStock}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">확인 중</p>
                <p className="text-lg font-bold text-gray-600">{inventoryStats.unknown}</p>
              </div>
            </div>

            {/* 검색 및 필터 */}
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="상품명, URL, 사이트 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterSite} onValueChange={setFilterSite}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="사이트 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 사이트</SelectItem>
                  {sites.map(site => (
                    <SelectItem key={site} value={site}>
                      {site}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="상태 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 상태</SelectItem>
                  <SelectItem value="in_stock">재고 있음</SelectItem>
                  <SelectItem value="low_stock">재고 부족</SelectItem>
                  <SelectItem value="out_of_stock">품절</SelectItem>
                  <SelectItem value="unknown">확인 중</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 긴급 알림 */}
            {urgentAlerts.length > 0 && (
              <Alert className="border-red-200">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="text-sm">긴급 재고 알림</AlertTitle>
                <AlertDescription className="text-xs">
                  {urgentAlerts.length}건의 긴급 알림이 있습니다. 확인이 필요합니다.
                </AlertDescription>
              </Alert>
            )}

            {/* 재고 목록 */}
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {isLoadingInventory ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="text-sm text-muted-foreground mt-2">재고 정보를 불러오는 중...</p>
                  </div>
                ) : filteredInventories.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">조건에 맞는 재고 정보가 없습니다</p>
                  </div>
                ) : (
                  filteredInventories.map((inventory) => (
                    <div key={inventory.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm truncate max-w-64">{inventory.productTitle}</h4>
                          {renderStockLevelBadge(inventory.stockLevel, inventory.currentStock)}
                          <Badge variant="outline" className="text-xs">
                            {inventory.site}
                          </Badge>
                          {inventory.priceChanged && (
                            <Badge variant="outline" className="text-xs text-orange-600">
                              가격 변동
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => checkInventoryStatus(inventory.productId)}
                            disabled={isChecking}
                          >
                            <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedInventory(inventory)
                              setShowInventoryDialog(true)
                            }}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">현재 재고</p>
                          <p className="font-medium">
                            {inventory.currentStock >= 0 ? `${inventory.currentStock}개` : '확인 중'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">가격</p>
                          <p className="font-medium">
                            ₩{inventory.price > 0 ? inventory.price.toLocaleString() : '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">마지막 확인</p>
                          <p className="font-medium">
                            {formatDistanceToNow(inventory.lastChecked, { 
                              addSuffix: true, 
                              locale: ko 
                            })}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">다음 확인</p>
                          <p className="font-medium">
                            {formatDistanceToNow(inventory.nextCheckAt, { 
                              addSuffix: true, 
                              locale: ko 
                            })}
                          </p>
                        </div>
                      </div>

                      {/* 메타데이터 */}
                      {inventory.metadata && (
                        <div className="bg-gray-50 p-3 rounded text-xs">
                          <div className="flex flex-wrap gap-2">
                            {inventory.metadata.category && (
                              <span>카테고리: {inventory.metadata.category}</span>
                            )}
                            {inventory.metadata.brand && (
                              <span>브랜드: {inventory.metadata.brand}</span>
                            )}
                            {inventory.metadata.seller && (
                              <span>판매자: {inventory.metadata.seller}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* 알림 관리 탭 */}
          <TabsContent value="alerts" className="space-y-4">
            {/* 알림 통계 */}
            <div className="grid grid-cols-4 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">총 알림</p>
                <p className="text-lg font-bold text-blue-600">{alertStats.totalAlerts}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">미확인</p>
                <p className="text-lg font-bold text-red-600">{alertStats.unacknowledged}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">긴급</p>
                <p className="text-lg font-bold text-orange-600">{alertStats.critical}</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">높음</p>
                <p className="text-lg font-bold text-yellow-600">{alertStats.high}</p>
              </div>
            </div>

            {/* 알림 목록 */}
            <ScrollArea className="h-80">
              <div className="space-y-3">
                {isLoadingAlerts ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="text-sm text-muted-foreground mt-2">알림을 불러오는 중...</p>
                  </div>
                ) : alerts.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">알림이 없습니다</p>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div key={alert.id} className={`border rounded-lg p-4 space-y-3 ${
                      !alert.acknowledged ? 'border-l-4 border-l-red-500' : ''
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {renderAlertSeverityBadge(alert.severity)}
                          <Badge variant="outline" className="text-xs">
                            {alert.alertType === 'out_of_stock' && '품절'}
                            {alert.alertType === 'low_stock' && '재고 부족'}
                            {alert.alertType === 'back_in_stock' && '재입고'}
                            {alert.alertType === 'price_change' && '가격 변동'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          {!alert.acknowledged ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAcknowledgeAlert(alert.id)}
                              disabled={isAcknowledging}
                            >
                              <Bell className="w-3 h-3" />
                            </Button>
                          ) : (
                            <BellOff className="w-3 h-3 text-gray-400" />
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium">{alert.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(alert.triggered, 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
                        </p>
                      </div>

                      {alert.relatedOrders.length > 0 && (
                        <div className="bg-gray-50 p-2 rounded text-xs">
                          <p className="font-medium mb-1">관련 주문:</p>
                          <div className="flex flex-wrap gap-1">
                            {alert.relatedOrders.map(orderId => (
                              <Badge key={orderId} variant="outline" className="text-xs">
                                {orderId}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {alert.acknowledged && (
                        <div className="text-xs text-muted-foreground">
                          확인됨: {alert.acknowledgedBy} ({alert.acknowledgedAt && 
                            format(alert.acknowledgedAt, 'MM/dd HH:mm', { locale: ko })})
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* 자동화 규칙 탭 */}
          <TabsContent value="rules" className="space-y-4">
            {/* 규칙 통계 */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">총 규칙</p>
                <p className="text-lg font-bold text-blue-600">{ruleStats.totalRules}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">활성 규칙</p>
                <p className="text-lg font-bold text-green-600">{ruleStats.activeRules}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">비활성 규칙</p>
                <p className="text-lg font-bold text-gray-600">{ruleStats.inactiveRules}</p>
              </div>
            </div>

            {/* 새 규칙 추가 버튼 */}
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">자동화 규칙 목록</h3>
              <Button size="sm">
                <Plus className="w-3 h-3 mr-1" />
                새 규칙 추가
              </Button>
            </div>

            {/* 규칙 목록 */}
            <ScrollArea className="h-80">
              <div className="space-y-3">
                {isLoadingRules ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="text-sm text-muted-foreground mt-2">규칙을 불러오는 중...</p>
                  </div>
                ) : rules.length === 0 ? (
                  <div className="text-center py-8">
                    <Settings className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">설정된 자동화 규칙이 없습니다</p>
                  </div>
                ) : (
                  rules.map((rule) => (
                    <div key={rule.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{rule.name}</h4>
                          <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                            {rule.enabled ? '활성' : '비활성'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            우선순위: {rule.priority}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Switch
                            checked={rule.enabled}
                            onCheckedChange={(checked) => toggleRule(rule.id, checked)}
                          />
                          <Button variant="ghost" size="sm">
                            <Edit3 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteRule(rule.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground">{rule.description}</p>

                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="font-medium text-muted-foreground">조건</p>
                          <div className="space-y-1 mt-1">
                            {rule.conditions.stockThreshold > 0 && (
                              <p>재고 임계값: {rule.conditions.stockThreshold}개 이하</p>
                            )}
                            {rule.conditions.sites.length > 0 && (
                              <p>사이트: {rule.conditions.sites.join(', ')}</p>
                            )}
                            {rule.conditions.categories.length > 0 && (
                              <p>카테고리: {rule.conditions.categories.join(', ')}</p>
                            )}
                            <p>체크 간격: {rule.checkInterval}분</p>
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground">액션</p>
                          <div className="space-y-1 mt-1">
                            {rule.actions.alertAdmin && <p>관리자 알림</p>}
                            {rule.actions.alertCustomers && <p>고객 알림</p>}
                            {rule.actions.pauseOrders && <p>주문 일시정지</p>}
                            {rule.actions.findAlternatives && <p>대안 상품 찾기</p>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* 성능 분석 탭 */}
          <TabsContent value="analytics" className="space-y-4">
            {/* 핵심 지표 */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">재고 가용률</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-green-600" />
                    <span className="text-lg font-bold">
                      {inventoryStats.totalItems > 0 
                        ? ((inventoryStats.inStock / inventoryStats.totalItems) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                  <Progress 
                    value={inventoryStats.totalItems > 0 
                      ? (inventoryStats.inStock / inventoryStats.totalItems) * 100
                      : 0} 
                    className="mt-2" 
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">모니터링 상품 수</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-600" />
                    <span className="text-lg font-bold">{inventoryStats.totalItems}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    최근 24시간 변화: {recentChanges.length}건
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* 사이트별 성능 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">사이트별 재고 현황</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(inventoryStats.sitesStats).map(([site, count]) => {
                    const siteInventories = inventoryStatuses.filter(item => item.site === site)
                    const inStockCount = siteInventories.filter(item => item.stockLevel === 'in_stock').length
                    const availabilityRate = count > 0 ? (inStockCount / count) * 100 : 0
                    
                    return (
                      <div key={site} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{site}</span>
                            <span className="text-xs text-muted-foreground">
                              {inStockCount}/{count} 가용
                            </span>
                          </div>
                          <Progress 
                            value={availabilityRate} 
                            className="h-2" 
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* 카테고리별 분석 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">카테고리별 분포</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(inventoryStats.categoryStats).map(([category, count]) => (
                    <div key={category} className="text-center p-3 bg-gray-50 rounded">
                      <p className="text-xs text-muted-foreground">{category}</p>
                      <p className="text-lg font-bold">{count}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 재고 상세 정보 다이얼로그 */}
        <Dialog open={showInventoryDialog} onOpenChange={setShowInventoryDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>재고 상세 정보</DialogTitle>
              <DialogDescription>
                {selectedInventory?.productTitle}
              </DialogDescription>
            </DialogHeader>
            {selectedInventory && (
              <div className="space-y-4">
                {/* 기본 정보 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">사이트</Label>
                    <p className="font-medium">{selectedInventory.site}</p>
                  </div>
                  <div>
                    <Label className="text-xs">현재 상태</Label>
                    <div className="mt-1">
                      {renderStockLevelBadge(selectedInventory.stockLevel, selectedInventory.currentStock)}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">현재 재고</Label>
                    <p className="font-medium">
                      {selectedInventory.currentStock >= 0 ? `${selectedInventory.currentStock}개` : '확인 중'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs">이전 재고</Label>
                    <p className="font-medium">
                      {selectedInventory.previousStock >= 0 ? `${selectedInventory.previousStock}개` : '-'}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* 가격 정보 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">현재 가격</Label>
                    <p className="font-medium">
                      ₩{selectedInventory.price > 0 ? selectedInventory.price.toLocaleString() : '-'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs">가격 변동</Label>
                    <p className="font-medium">
                      {selectedInventory.priceChanged ? (
                        <Badge variant="outline" className="text-orange-600">변동됨</Badge>
                      ) : (
                        <Badge variant="outline">변동 없음</Badge>
                      )}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* 모니터링 정보 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">마지막 확인</Label>
                    <p className="text-sm">
                      {format(selectedInventory.lastChecked, 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs">다음 확인 예정</Label>
                    <p className="text-sm">
                      {format(selectedInventory.nextCheckAt, 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs">체크 간격</Label>
                    <p className="font-medium">{selectedInventory.checkInterval}분</p>
                  </div>
                  <div>
                    <Label className="text-xs">가용성</Label>
                    <p className="font-medium">
                      {selectedInventory.isAvailable ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">이용 가능</Badge>
                      ) : (
                        <Badge variant="default" className="bg-red-100 text-red-800">이용 불가</Badge>
                      )}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* 상품 URL */}
                <div>
                  <Label className="text-xs">상품 URL</Label>
                  <p className="text-sm text-blue-600 break-all">{selectedInventory.productUrl}</p>
                </div>

                {/* 메타데이터 */}
                {selectedInventory.metadata && (
                  <>
                    <Separator />
                    <div>
                      <Label className="text-xs">추가 정보</Label>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        {selectedInventory.metadata.category && (
                          <div>
                            <p className="text-xs text-muted-foreground">카테고리</p>
                            <p className="text-sm">{selectedInventory.metadata.category}</p>
                          </div>
                        )}
                        {selectedInventory.metadata.brand && (
                          <div>
                            <p className="text-xs text-muted-foreground">브랜드</p>
                            <p className="text-sm">{selectedInventory.metadata.brand}</p>
                          </div>
                        )}
                        {selectedInventory.metadata.seller && (
                          <div>
                            <p className="text-xs text-muted-foreground">판매자</p>
                            <p className="text-sm">{selectedInventory.metadata.seller}</p>
                          </div>
                        )}
                        {selectedInventory.metadata.variant && (
                          <div>
                            <p className="text-xs text-muted-foreground">옵션</p>
                            <p className="text-sm">{selectedInventory.metadata.variant}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowInventoryDialog(false)}>
                닫기
              </Button>
              {selectedInventory && (
                <Button 
                  onClick={() => checkInventoryStatus(selectedInventory.productId)}
                  disabled={isChecking}
                >
                  {isChecking ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      확인 중...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      재고 확인
                    </>
                  )}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}