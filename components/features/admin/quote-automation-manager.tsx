'use client'

import { useState, useEffect } from 'react'
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
import { 
  Settings, 
  Zap, 
  Plus,
  Edit3,
  Trash2,
  Play,
  Pause,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Target,
  Filter,
  Save,
  RefreshCw,
  Brain,
  TrendingUp,
  Layers
} from 'lucide-react'
import { 
  AutoQuoteRule, 
  AutoQuoteCondition, 
  AutoQuoteAction,
  QuoteAutomationResult,
  quoteAutomationService 
} from '@/lib/services/quote-automation'
import { BuyForMeRequest } from '@/types/buy-for-me'
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

interface QuoteAutomationManagerProps {
  className?: string
}

export function QuoteAutomationManager({ className = '' }: QuoteAutomationManagerProps) {
  const [rules, setRules] = useState<AutoQuoteRule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'rules' | 'templates' | 'analytics'>('rules')
  const [editingRule, setEditingRule] = useState<AutoQuoteRule | null>(null)
  const [showRuleDialog, setShowRuleDialog] = useState(false)
  const [testResult, setTestResult] = useState<QuoteAutomationResult | null>(null)

  // 통계 데이터
  const [stats, setStats] = useState({
    totalRules: 0,
    activeRules: 0,
    automationRate: 0,
    averageProcessingTime: 0,
    successRate: 0
  })

  useEffect(() => {
    loadRules()
    loadStats()
  }, [])

  const loadRules = async () => {
    try {
      setIsLoading(true)
      const loadedRules = quoteAutomationService.getRules()
      setRules(loadedRules)
    } catch (error) {
      console.error('Failed to load rules:', error)
      toast.error('규칙 로드에 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  const loadStats = async () => {
    // 실제 구현에서는 API 호출
    setStats({
      totalRules: 8,
      activeRules: 6,
      automationRate: 85,
      averageProcessingTime: 2.3,
      successRate: 94
    })
  }

  const handleSaveRule = async (rule: Omit<AutoQuoteRule, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingRule) {
        quoteAutomationService.updateRule(editingRule.id, rule)
        toast.success('규칙이 수정되었습니다')
      } else {
        quoteAutomationService.addRule(rule)
        toast.success('규칙이 추가되었습니다')
      }
      
      await loadRules()
      setShowRuleDialog(false)
      setEditingRule(null)
    } catch (error) {
      console.error('Failed to save rule:', error)
      toast.error('규칙 저장에 실패했습니다')
    }
  }

  const handleDeleteRule = async (ruleId: string) => {
    try {
      quoteAutomationService.deleteRule(ruleId)
      await loadRules()
      toast.success('규칙이 삭제되었습니다')
    } catch (error) {
      console.error('Failed to delete rule:', error)
      toast.error('규칙 삭제에 실패했습니다')
    }
  }

  const handleToggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      quoteAutomationService.updateRule(ruleId, { enabled })
      await loadRules()
      toast.success(enabled ? '규칙이 활성화되었습니다' : '규칙이 비활성화되었습니다')
    } catch (error) {
      console.error('Failed to toggle rule:', error)
      toast.error('규칙 상태 변경에 실패했습니다')
    }
  }

  const handleTestAutomation = async () => {
    // 테스트 데이터로 자동화 시뮬레이션
    const testRequest: BuyForMeRequest = {
      id: 'test-123',
      userId: 'test-user',
      hotdealId: 'hotdeal-123',
      requestDate: new Date(),
      estimatedServiceFee: 96000,
      estimatedTotalAmount: 1296000,
      productInfo: {
        title: '애플 아이폰 15 프로 256GB',
        originalUrl: 'https://example.com/iphone15pro',
        originalPrice: 1300000,
        discountedPrice: 1200000,
        discountRate: 7.7,
        shippingFee: 0,
        siteName: 'Apple Store',
        imageUrl: ''
      },
      quantity: 1,
      shippingInfo: {
        name: '테스트',
        phone: '010-1234-5678',
        email: 'test@example.com',
        postalCode: '12345',
        address: '서울시 강남구',
        detailAddress: '테스트동 123호'
      },
      specialRequests: '빠른 배송 부탁드립니다',
      status: 'pending_review',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    try {
      const result = await quoteAutomationService.generateAutoQuote(testRequest)
      setTestResult(result)
      toast.success('자동화 테스트가 완료되었습니다')
    } catch (error) {
      console.error('Failed to test automation:', error)
      toast.error('자동화 테스트에 실패했습니다')
    }
  }

  const renderRuleConditions = (conditions: AutoQuoteCondition[]) => {
    return conditions.map((condition, index) => (
      <div key={index} className="text-xs bg-blue-50 p-2 rounded">
        <span className="font-medium">{getConditionLabel(condition.type)}</span>
        <span className="mx-1">{getOperatorLabel(condition.operator)}</span>
        <span className="font-medium">{condition.value.toString()}</span>
      </div>
    ))
  }

  const renderRuleActions = (actions: AutoQuoteAction[]) => {
    return actions.map((action, index) => (
      <div key={index} className="text-xs bg-green-50 p-2 rounded">
        <span className="font-medium">{getActionLabel(action.type)}</span>
        {action.description && (
          <span className="ml-1 text-muted-foreground">({action.description})</span>
        )}
      </div>
    ))
  }

  const getConditionLabel = (type: string) => {
    const labels = {
      product_category: '상품카테고리',
      price_range: '가격대',
      shipping_country: '배송국가',
      user_tier: '사용자등급',
      order_count: '주문횟수'
    }
    return labels[type as keyof typeof labels] || type
  }

  const getOperatorLabel = (operator: string) => {
    const labels = {
      equals: '=',
      contains: '포함',
      greater_than: '>',
      less_than: '<',
      between: '사이'
    }
    return labels[operator as keyof typeof labels] || operator
  }

  const getActionLabel = (type: string) => {
    const labels = {
      apply_template: '템플릿적용',
      set_commission: '수수료설정',
      add_fee: '수수료추가',
      set_shipping: '배송비설정',
      apply_discount: '할인적용'
    }
    return labels[type as keyof typeof labels] || type
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            견적서 자동화 관리
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleTestAutomation}
            >
              <Play className="w-3 h-3 mr-1" />
              테스트 실행
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadRules}
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              새로고침
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="rules">자동화 규칙</TabsTrigger>
            <TabsTrigger value="templates">템플릿 관리</TabsTrigger>
            <TabsTrigger value="analytics">성능 분석</TabsTrigger>
          </TabsList>

          {/* 자동화 규칙 탭 */}
          <TabsContent value="rules" className="space-y-4">
            {/* 요약 통계 */}
            <div className="grid grid-cols-4 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">총 규칙</p>
                <p className="text-lg font-bold text-blue-600">{stats.totalRules}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">활성 규칙</p>
                <p className="text-lg font-bold text-green-600">{stats.activeRules}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">자동화율</p>
                <p className="text-lg font-bold text-purple-600">{stats.automationRate}%</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">성공률</p>
                <p className="text-lg font-bold text-orange-600">{stats.successRate}%</p>
              </div>
            </div>

            {/* 새 규칙 추가 버튼 */}
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">자동화 규칙 목록</h3>
              <Dialog open={showRuleDialog} onOpenChange={setShowRuleDialog}>
                <DialogTrigger asChild>
                  <Button 
                    size="sm" 
                    onClick={() => {
                      setEditingRule(null)
                      setShowRuleDialog(true)
                    }}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    새 규칙 추가
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingRule ? '규칙 수정' : '새 규칙 추가'}
                    </DialogTitle>
                    <DialogDescription>
                      자동화 조건과 액션을 설정하여 견적서 생성을 자동화할 수 있습니다.
                    </DialogDescription>
                  </DialogHeader>
                  <RuleForm 
                    rule={editingRule} 
                    onSave={handleSaveRule}
                    onCancel={() => setShowRuleDialog(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>

            {/* 규칙 목록 */}
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {isLoading ? (
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
                            우선순위 {rule.priority}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Switch
                            checked={rule.enabled}
                            onCheckedChange={(checked) => handleToggleRule(rule.id, checked)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingRule(rule)
                              setShowRuleDialog(true)
                            }}
                          >
                            <Edit3 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRule(rule.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground">{rule.description}</p>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground">조건</Label>
                          <div className="space-y-1 mt-1">
                            {renderRuleConditions(rule.conditions)}
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground">액션</Label>
                          <div className="space-y-1 mt-1">
                            {renderRuleActions(rule.actions)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* 템플릿 관리 탭 */}
          <TabsContent value="templates" className="space-y-4">
            <div className="text-center py-8">
              <Layers className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">템플릿 관리 기능이 곧 추가됩니다</p>
            </div>
          </TabsContent>

          {/* 성능 분석 탭 */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">평균 처리 시간</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-lg font-bold">{stats.averageProcessingTime}초</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    수동 대비 87% 단축
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">자동화 성공률</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-green-600" />
                    <span className="text-lg font-bold">{stats.successRate}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    지난 달 대비 3% 향상
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* 테스트 결과 */}
            {testResult && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>자동화 테스트 결과</AlertTitle>
                <AlertDescription className="space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p><strong>자동화 수준:</strong> {testResult.automationLevel}</p>
                      <p><strong>신뢰도:</strong> {testResult.confidence}%</p>
                    </div>
                    <div>
                      <p><strong>검토 필요:</strong> {testResult.requiresReview ? '예' : '아니오'}</p>
                      <p><strong>적용 규칙:</strong> {testResult.appliedRules.length}개</p>
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">총 금액: ₩{testResult.quotation.pricing.totalAmount.toLocaleString()}</p>
                  </div>
                  {testResult.warnings.length > 0 && (
                    <div>
                      <p className="font-medium text-yellow-600">경고:</p>
                      <ul className="list-disc list-inside">
                        {testResult.warnings.map((warning, index) => (
                          <li key={index} className="text-yellow-600">{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

// 규칙 편집 폼 컴포넌트
interface RuleFormProps {
  rule: AutoQuoteRule | null
  onSave: (rule: Omit<AutoQuoteRule, 'id' | 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
}

function RuleForm({ rule, onSave, onCancel }: RuleFormProps) {
  const [formData, setFormData] = useState({
    name: rule?.name || '',
    description: rule?.description || '',
    priority: rule?.priority || 5,
    enabled: rule?.enabled ?? true,
    conditions: rule?.conditions || [],
    actions: rule?.actions || []
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">규칙 이름</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="규칙 이름을 입력하세요"
            required
          />
        </div>
        <div>
          <Label htmlFor="priority">우선순위</Label>
          <Input
            id="priority"
            type="number"
            value={formData.priority}
            onChange={(e) => setFormData(prev => ({ ...prev, priority: Number(e.target.value) }))}
            min="1"
            max="10"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">설명</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="규칙에 대한 설명을 입력하세요"
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="enabled"
          checked={formData.enabled}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enabled: checked }))}
        />
        <Label htmlFor="enabled">규칙 활성화</Label>
      </div>

      <Separator />

      <div className="text-center text-sm text-muted-foreground">
        조건 및 액션 설정은 상세 편집기에서 가능합니다.
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit">
          <Save className="w-3 h-3 mr-1" />
          저장
        </Button>
      </DialogFooter>
    </form>
  )
}