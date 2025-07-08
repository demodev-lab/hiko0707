'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { usePosts, useUsers } from '@/hooks/use-local-db'
import { formatDistanceToNow } from '@/lib/utils'
import { POST_STATUS_LABELS } from '@/lib/constants'

export function RecentPosts() {
  const { posts, loading } = usePosts()
  const { users } = useUsers()

  const recentPosts = posts
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Posts</CardTitle>
        <CardDescription>
          You have {posts.length} total posts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {recentPosts.map((post) => {
            const author = users.find(u => u.id === post.authorId)
            return (
              <div key={post.id} className="flex items-start space-x-4">
                <div className="space-y-1 flex-1">
                  <p className="text-sm font-medium leading-none">
                    {post.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    by {author?.name || 'Unknown'} • {formatDistanceToNow(new Date(post.createdAt))}
                  </p>
                </div>
                <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                  {POST_STATUS_LABELS[post.status]}
                </Badge>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}