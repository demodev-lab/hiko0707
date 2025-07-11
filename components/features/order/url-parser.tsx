'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Link2, CheckCircle, AlertCircle, Info } from 'lucide-react'
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
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Link2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="쇼핑몰 상품 URL을 붙여넣으세요"
            className="pl-10"
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
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              파싱 중...
            </>
          ) : (
            '상품 정보 가져오기'
          )}
        </Button>
      </div>

      {/* 지원 쇼핑몰 안내 */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>지원 쇼핑몰:</strong> {ShoppingUrlParser.getSupportedShops().join(', ')}
        </AlertDescription>
      </Alert>

      {/* 에러 메시지 */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 파싱 결과 */}
      {parsedInfo && parsedInfo.isValid && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              {parsedInfo.imageUrl && (
                <img 
                  src={parsedInfo.imageUrl} 
                  alt={parsedInfo.productName}
                  className="w-24 h-24 object-cover rounded-lg"
                />
              )}
              <div className="flex-1 space-y-2">
                <h4 className="font-medium">{parsedInfo.productName}</h4>
                <p className="text-sm text-gray-600">{parsedInfo.shopName}</p>
                {parsedInfo.price && (
                  <p className="text-lg font-semibold text-blue-600">
                    {parsedInfo.price}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={handleAddProduct} size="sm">
                <CheckCircle className="w-4 h-4 mr-2" />
                상품 추가하기
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 사용 방법 */}
      <div className="text-sm text-gray-600 space-y-1">
        <p>• 상품 페이지의 URL을 복사하여 붙여넣으세요</p>
        <p>• 자동으로 상품명과 가격 정보를 가져옵니다</p>
        <p>• 여러 상품을 추가하려면 각각 URL을 입력하세요</p>
      </div>
    </div>
  )
}