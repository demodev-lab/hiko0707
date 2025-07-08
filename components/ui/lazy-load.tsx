'use client'

import { Suspense, lazy, ComponentType } from 'react'
import { Loader2 } from 'lucide-react'

interface LazyLoadProps {
  component: () => Promise<{ default: ComponentType<any> }>
  fallback?: React.ReactNode
  [key: string]: any
}

const LazyLoad = ({ component, fallback, ...props }: LazyLoadProps) => {
  const LazyComponent = lazy(component)
  
  const defaultFallback = (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      <span className="ml-2 text-gray-600">로딩 중...</span>
    </div>
  )

  return (
    <Suspense fallback={fallback || defaultFallback}>
      <LazyComponent {...props} />
    </Suspense>
  )
}

export default LazyLoad

// 사전 정의된 lazy 컴포넌트들
export const LazyHotDealCard = lazy(() => 
  import('@/components/features/hotdeal/hotdeal-card').then(module => ({ default: module.HotDealCard }))
)

export const LazyCommentSection = lazy(() => 
  import('@/components/features/comments/comment-section').then(module => ({ default: module.CommentSection }))
)

export const LazyOrderTracking = lazy(() => 
  import('@/components/features/order/order-tracking').then(module => ({ default: module.OrderTracking }))
)

export const LazyPaymentForm = lazy(() => 
  import('@/components/features/payment/payment-form').then(module => ({ default: module.PaymentForm }))
)

// HOC for wrapping components with lazy loading
export function withLazyLoading<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  const WrappedComponent = (componentProps: React.ComponentProps<T>) => {
    const lazyProps: LazyLoadProps = {
      component: importFn,
      fallback,
      ...componentProps
    }
    return <LazyLoad {...lazyProps} />
  }
  
  WrappedComponent.displayName = 'LazyWrappedComponent'
  
  return WrappedComponent
}