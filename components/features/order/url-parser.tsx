'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Link2, CheckCircle, AlertCircle, Info, Plus } from 'lucide-react'
import { ShoppingUrlParser, ParsedProductInfo } from '@/lib/url-parser/shopping-url-parser'
import { useLanguage } from '@/lib/i18n/context'

export interface ParsedProduct {
  title: string
  price: number
  sourceUrl: string
  imageUrl?: string
  description?: string
  options?: string[]
}

interface UrlParserProps {
  onProductParsed: (product: ParsedProduct) => void
}

export function UrlParser({ onProductParsed }: UrlParserProps) {
  const { t } = useLanguage()
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [parsedInfo, setParsedInfo] = useState<ParsedProductInfo | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleParse = async () => {
    if (!url.trim()) {
      setError('URL을 입력해주세요.')
      return
    }

    setIsLoading(true)
    setError(null)
    setParsedInfo(null)

    try {
      // URL 유효성 검사
      if (!ShoppingUrlParser.isShoppingUrl(url)) {
        setError('지원하지 않는 쇼핑몰입니다. 지원 쇼핑몰: ' + ShoppingUrlParser.getSupportedShops().join(', '))
        setIsLoading(false)
        return
      }

      const result = await ShoppingUrlParser.parseUrl(url)
      
      if (result.isValid) {
        setParsedInfo(result)
      } else {
        setError(result.error || '상품 정보를 가져올 수 없습니다.')
      }
    } catch (err) {
      setError('URL 파싱 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddProduct = () => {
    if (parsedInfo && parsedInfo.isValid) {
      const priceNumber = parsedInfo.price 
        ? parseInt(parsedInfo.price.replace(/[^\d]/g, ''))
        : 0

      onProductParsed({
        title: parsedInfo.productName || '',
        price: priceNumber,
        sourceUrl: parsedInfo.productUrl,
        imageUrl: parsedInfo.imageUrl,
        description: `${parsedInfo.shopName} 상품`
      })

      // 초기화
      setUrl('')
      setParsedInfo(null)
      setError(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* URL 입력 */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Link2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5" />
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="쇼핑몰 상품 URL을 붙여넣으세요 (Ctrl+V)"
              className="pl-10 h-14 text-base border-2 border-blue-200 focus:border-blue-500 transition-all"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleParse()
                }
              }}
            />
          </div>
          <Button 
            onClick={handleParse} 
            disabled={isLoading || !url.trim()}
            size="lg"
            className="px-8 h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold transition-all transform hover:scale-105"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                파싱 중...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5 mr-2" />
                상품 추가
              </>
            )}
          </Button>
        </div>
        
        {/* 지원 쇼핑몰 안내 - 더 눈에 띄게 */}
        <div className="flex flex-wrap items-center gap-2 bg-blue-50/50 px-3 py-2 rounded-lg">
          <Info className="w-4 h-4 text-blue-600" />
          <span className="text-sm text-blue-700 font-medium">지원 쇼핑몰:</span>
          <div className="flex flex-wrap gap-2">
            {ShoppingUrlParser.getSupportedShops().map((shop, index) => (
              <span key={shop} className="text-xs bg-white px-2 py-1 rounded-md text-gray-700 border border-gray-200">
                {shop}
              </span>
            ))}
          </div>
        </div>
      </div>


      {/* 에러 메시지 */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 파싱 결과 */}
      {parsedInfo && parsedInfo.isValid && (
        <Card className="border-2 border-green-200 bg-green-50/30 overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm font-medium text-green-700">상품 정보를 성공적으로 가져왔습니다!</span>
            </div>
            <div className="flex gap-4">
              {parsedInfo.imageUrl && (
                <img 
                  src={parsedInfo.imageUrl} 
                  alt={parsedInfo.productName}
                  className="w-28 h-28 object-cover rounded-lg border-2 border-white shadow-md"
                />
              )}
              <div className="flex-1 space-y-2">
                <h4 className="font-semibold text-lg text-gray-900">{parsedInfo.productName}</h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{parsedInfo.shopName}</span>
                </div>
                {parsedInfo.price && (
                  <p className="text-2xl font-bold text-blue-600">
                    {parsedInfo.price}
                  </p>
                )}
              </div>
            </div>
            <Button 
              onClick={handleAddProduct} 
              className="mt-4 w-full h-12 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold text-base transition-all transform hover:scale-105"
            >
              <Plus className="w-5 h-5 mr-2" />
              장바구니에 추가하기
            </Button>
          </CardContent>
        </Card>
      )}

    </div>
  )
}