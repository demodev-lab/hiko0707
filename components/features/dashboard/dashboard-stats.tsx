'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Users, MessageSquare, TrendingUp } from 'lucide-react'
import { usePosts, useUsers, useComments } from '@/hooks/use-local-db'

export function DashboardStats() {
  const { posts } = usePosts()
  const { users } = useUsers()
  const { comments } = useComments()

  const stats = [
    {
      title: 'Total Posts',
      value: posts.length.toString(),
      description: '+20% from last month',
      icon: FileText,
    },
    {
      title: 'Total Users',
      value: users.length.toString(),
      description: '+10% from last month',
      icon: Users,
    },
    {
      title: 'Comments',
      value: comments.length.toString(),
      description: '+5% from last month',
      icon: MessageSquare,
    },
    {
      title: 'Active Now',
      value: '573',
      description: '+201 since last hour',
      icon: TrendingUp,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}