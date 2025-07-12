import { ProfileSkeleton } from '@/components/features/profile/profile-skeleton'

export default function ProfileLoading() {
  return (
    <div className="container mx-auto py-8 px-4">
      <ProfileSkeleton />
    </div>
  )
}