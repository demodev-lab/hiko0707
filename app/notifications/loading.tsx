import { NotificationListSkeleton } from '@/components/features/notification/notification-skeleton'

export default function NotificationsLoading() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <NotificationListSkeleton count={8} />
    </div>
  )
}