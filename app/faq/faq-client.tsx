'use client'

import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'

interface FAQItem {
  id: string
  category: string
  question: string
  answer: string
  tags?: string[]
}

interface FAQClientProps {
  faqData: FAQItem[]
  categories: {
    name: string
    icon: React.ReactNode
    count: number
  }[]
}

export function FAQClient({ faqData, categories }: FAQClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const filteredFAQs = useMemo(() => {
    return faqData.filter(faq => {
      const matchesSearch = searchQuery === '' || 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      
      const matchesCategory = !selectedCategory || faq.category === selectedCategory
      
      return matchesSearch && matchesCategory
    })
  }, [searchQuery, selectedCategory, faqData])

  const groupedFAQs = useMemo(() => {
    return filteredFAQs.reduce((acc, faq) => {
      if (!acc[faq.category]) {
        acc[faq.category] = []
      }
      acc[faq.category].push(faq)
      return acc
    }, {} as Record<string, FAQItem[]>)
  }, [filteredFAQs])

  return (
    <>
      {/* 검색 바 */}
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          placeholder="질문을 검색하세요..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 py-6 text-lg"
        />
      </div>

      {/* 카테고리 필터 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
        {categories.map((category) => (
          <Card
            key={category.name}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedCategory === category.name ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedCategory(
              selectedCategory === category.name ? null : category.name
            )}
          >
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 mx-auto mb-2 text-blue-600 flex items-center justify-center">
                {category.icon}
              </div>
              <h3 className="font-medium text-sm">{category.name}</h3>
              <Badge variant="secondary" className="mt-2">
                {category.count}개
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FAQ 목록 */}
      {Object.keys(groupedFAQs).length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">검색 결과가 없습니다.</p>
        </div>
      ) : (
        Object.entries(groupedFAQs).map(([category, faqs]) => (
          <Card key={category} className="mb-8">
            <CardHeader>
              <CardTitle className="text-xl">{category}</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                {faqs.map((faq) => (
                  <AccordionItem key={faq.id} value={faq.id}>
                    <AccordionTrigger className="text-left">
                      <div className="flex-1 pr-4">
                        <p className="font-medium">{faq.question}</p>
                        {faq.tags && (
                          <div className="flex gap-2 mt-2">
                            {faq.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600 leading-relaxed">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        ))
      )}
    </>
  )
}