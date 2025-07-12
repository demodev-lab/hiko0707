import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function FormFieldSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full rounded-md" />
    </div>
  )
}

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: fields }).map((_, i) => (
        <FormFieldSkeleton key={i} />
      ))}
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24 rounded-md" />
        <Skeleton className="h-10 w-24 rounded-md" />
      </div>
    </div>
  )
}

export function LoginFormSkeleton() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <Skeleton className="h-7 w-24 mx-auto" />
        <Skeleton className="h-4 w-48 mx-auto" />
      </CardHeader>
      <CardContent className="space-y-4">
        <FormFieldSkeleton />
        <FormFieldSkeleton />
        <Skeleton className="h-10 w-full rounded-md" />
        <div className="relative">
          <Skeleton className="h-px w-full" />
          <Skeleton className="h-4 w-12 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-10 rounded-md" />
          <Skeleton className="h-10 rounded-md" />
        </div>
      </CardContent>
    </Card>
  )
}

export function CheckoutFormSkeleton() {
  return (
    <div className="grid gap-6">
      {/* 배송 정보 */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <FormFieldSkeleton />
          <FormFieldSkeleton />
          <div className="grid grid-cols-2 gap-4">
            <FormFieldSkeleton />
            <FormFieldSkeleton />
          </div>
          <FormFieldSkeleton />
        </CardContent>
      </Card>
      
      {/* 결제 정보 */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-md" />
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* 주문 요약 */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex justify-between pt-2 border-t">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-6 w-32" />
            </div>
          </div>
          <Skeleton className="h-12 w-full rounded-md" />
        </CardContent>
      </Card>
    </div>
  )
}