'use client'

import { Order } from '@/types/order'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Eye, MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface OrdersTableProps {
  orders: Order[]
}

const statusConfig = {
  pending: { label: '대기중', variant: 'secondary' as const },
  confirmed: { label: '확인됨', variant: 'default' as const },
  purchasing: { label: '구매중', variant: 'default' as const },
  shipping: { label: '배송중', variant: 'default' as const },
  delivered: { label: '배송완료', variant: 'default' as const },
  cancelled: { label: '취소됨', variant: 'destructive' as const },
}

export function OrdersTable({ orders }: OrdersTableProps) {
  return (
    <div className="relative overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>주문번호</TableHead>
            <TableHead>고객명</TableHead>
            <TableHead>상품</TableHead>
            <TableHead>금액</TableHead>
            <TableHead>상태</TableHead>
            <TableHead>주문일</TableHead>
            <TableHead className="text-right">액션</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const status = statusConfig[order.status] || statusConfig.pending
            const orderDate = new Date(order.createdAt).toLocaleDateString('ko-KR')
            
            return (
              <TableRow key={order.id}>
                <TableCell className="font-medium">
                  {order.id.slice(0, 8)}...
                </TableCell>
                <TableCell>{order.shippingAddress.fullName || '이름 없음'}</TableCell>
                <TableCell>
                  <div className="max-w-[200px] truncate">
                    {order.items[0]?.productName || '상품명 없음'}
                    {order.items.length > 1 && ` 외 ${order.items.length - 1}건`}
                  </div>
                </TableCell>
                <TableCell>₩{order.totalAmount.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge variant={status.variant}>
                    {status.label}
                  </Badge>
                </TableCell>
                <TableCell>{orderDate}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">메뉴 열기</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>액션</DropdownMenuLabel>
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        상세 보기
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>상태 변경</DropdownMenuItem>
                      <DropdownMenuItem>메모 추가</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        주문 취소
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}