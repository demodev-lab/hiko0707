import { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { db } from '@/lib/db/database-service'
import { Package, Eye, Edit, Trash2, Download } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '주문 관리 - HiKo Admin',
  description: '주문 관리 페이지'
}

export default async function AdminOrdersPage() {
  const orders = await db.orders.findAll()
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">대기 중</Badge>
      case 'confirmed':
        return <Badge variant="default">확인됨</Badge>
      case 'processing':
        return <Badge className="bg-blue-600">처리 중</Badge>
      case 'shipped':
        return <Badge className="bg-green-600">배송 중</Badge>
      case 'delivered':
        return <Badge className="bg-green-800">완료</Badge>
      case 'cancelled':
        return <Badge variant="destructive">취소됨</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">주문 관리</h1>
            <p className="text-gray-600 mt-1">모든 주문을 관리하고 추적하세요</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              내보내기
            </Button>
            <Button size="sm">
              <Package className="w-4 h-4 mr-2" />
              새 주문
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              주문 목록 ({orders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">주문 ID</th>
                    <th className="text-left p-3">고객</th>
                    <th className="text-left p-3">상품</th>
                    <th className="text-left p-3">금액</th>
                    <th className="text-left p-3">상태</th>
                    <th className="text-left p-3">주문일</th>
                    <th className="text-left p-3">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-mono text-sm">{order.id}</td>
                      <td className="p-3">{order.customerName}</td>
                      <td className="p-3">{order.productName}</td>
                      <td className="p-3 font-semibold">₩{order.totalAmount.toLocaleString()}</td>
                      <td className="p-3">{getStatusBadge(order.status)}</td>
                      <td className="p-3 text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Link href={`/admin/orders/${order.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-500">
                        주문이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}