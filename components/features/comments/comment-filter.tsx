'use client'

import { useState } from 'react'
import { Filter, TrendingUp, Clock, Heart } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export type CommentSortType = 'latest' | 'oldest' | 'popular'
export type CommentFilterType = 'all' | 'replies' | 'questions'

interface CommentFilterProps {
  onSortChange: (sort: CommentSortType) => void
  onFilterChange: (filter: CommentFilterType) => void
  currentSort: CommentSortType
  currentFilter: CommentFilterType
}

export function CommentFilter({
  onSortChange,
  onFilterChange,
  currentSort,
  currentFilter
}: CommentFilterProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Tabs value={currentFilter} onValueChange={(v) => onFilterChange(v as CommentFilterType)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">전체</TabsTrigger>
          <TabsTrigger value="replies">답글</TabsTrigger>
          <TabsTrigger value="questions">질문</TabsTrigger>
        </TabsList>
      </Tabs>
      
      <Select value={currentSort} onValueChange={(v) => onSortChange(v as CommentSortType)}>
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="latest">
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3" />
              최신순
            </div>
          </SelectItem>
          <SelectItem value="oldest">
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 rotate-180" />
              오래된순
            </div>
          </SelectItem>
          <SelectItem value="popular">
            <div className="flex items-center gap-2">
              <Heart className="w-3 h-3" />
              인기순
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}