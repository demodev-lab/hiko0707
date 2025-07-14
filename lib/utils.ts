import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDistanceToNow(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  
  let interval = seconds / 31536000
  if (interval > 1) {
    return Math.floor(interval) + " years ago"
  }
  
  interval = seconds / 2592000
  if (interval > 1) {
    return Math.floor(interval) + " months ago"
  }
  
  interval = seconds / 86400
  if (interval > 1) {
    return Math.floor(interval) + " days ago"
  }
  
  interval = seconds / 3600
  if (interval > 1) {
    return Math.floor(interval) + " hours ago"
  }
  
  interval = seconds / 60
  if (interval > 1) {
    return Math.floor(interval) + " minutes ago"
  }
  
  return Math.floor(seconds) + " seconds ago"
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}