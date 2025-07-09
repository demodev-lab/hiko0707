'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/lib/i18n/context'
import { parseProductUrl, ParsedProduct, shoppingSiteParsers } from '@/lib/parsers/shopping-sites'
import Image from 'next/image'
import { 
  Link, 
  Search, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  ShoppingBag,
  Package,
  Truck,
  Tag
} from 'lucide-react'
import { toast } from 'sonner'

interface UrlParserProps {
  onProductParsed: (product: ParsedProduct) => void
  initialUrl?: string
}

export function UrlParser({ onProductParsed, initialUrl = '' }: UrlParserProps) {
  const { t } = useLanguage()
  const [url, setUrl] = useState(initialUrl)
  const [isLoading, setIsLoading] = useState(false)
  const [parsedProduct, setParsedProduct] = useState<ParsedProduct | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isValidUrl = (text: string): boolean => {
    try {
      new URL(text)
      return true
    } catch {
      return false
    }
  }

  const handleParse = useCallback(async (urlToParse?: string) => {
    const targetUrl = urlToParse || url
    if (!targetUrl) {
      setError(t('order.urlParser.enterUrl'))
      return
    }

    if (!isValidUrl(targetUrl)) {
      setError(t('order.urlParser.invalidUrl'))
      return
    }

    setIsLoading(true)
    setError(null)
    setParsedProduct(null)

    try {
      const product = await parseProductUrl(targetUrl)
      if (product) {
        setParsedProduct(product)
        onProductParsed(product)
        toast.success(t('order.urlParser.parseSuccess'))
      } else {
        setError(t('order.urlParser.parseFailed'))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('order.urlParser.parseError'))
      toast.error(t('order.urlParser.parseError'))
    } finally {
      setIsLoading(false)
    }
  }, [url, onProductParsed, t])

  // Auto-parse if URL is pasted
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const pastedText = e.clipboardData?.getData('text')
      if (pastedText && isValidUrl(pastedText)) {
        setUrl(pastedText)
        // Auto-parse after a short delay
        setTimeout(() => handleParse(pastedText), 500)
      }
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [handleParse])

  const getSupportedSites = () => {
    const sites = new Set<string>()
    shoppingSiteParsers.forEach(parser => {
      sites.add(parser.name)
    })
    return Array.from(sites)
  }

  return (
    <div className="space-y-6">
      {/* URL Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <Link className="w-4 h-4" />
          {t('order.urlParser.productUrl')}
        </label>
        <div className="flex gap-2">
          <Input
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value)
              setError(null)
            }}
            placeholder={t('order.urlParser.urlPlaceholder')}
            className="flex-1"
            disabled={isLoading}
          />
          <Button
            onClick={() => handleParse()}
            disabled={!url || isLoading}
            className="min-w-[100px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('order.urlParser.parsing')}
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                {t('order.urlParser.parse')}
              </>
            )}
          </Button>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Supported sites */}
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {t('order.urlParser.supportedSites')}: {getSupportedSites().join(', ')}
        </div>
      </div>

      {/* Parsed Product Preview */}
      {parsedProduct && (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Product Image */}
              <div className="md:w-1/3 aspect-square bg-gray-100 dark:bg-gray-800 relative">
                <Image
                  src={parsedProduct.imageUrl}
                  alt={parsedProduct.title}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/400x400?text=No+Image'
                  }}
                />
              </div>

              {/* Product Info */}
              <div className="flex-1 p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg leading-tight">
                      {parsedProduct.title}
                    </h3>
                    {parsedProduct.brand && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {parsedProduct.brand}
                      </p>
                    )}
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    ₩{parsedProduct.price.toLocaleString()}
                  </span>
                  {parsedProduct.originalPrice && parsedProduct.originalPrice > parsedProduct.price && (
                    <>
                      <span className="text-lg text-gray-500 line-through">
                        ₩{parsedProduct.originalPrice.toLocaleString()}
                      </span>
                      <Badge variant="destructive" className="ml-2">
                        {Math.round((1 - parsedProduct.price / parsedProduct.originalPrice) * 100)}% OFF
                      </Badge>
                    </>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm">
                  {parsedProduct.seller && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <ShoppingBag className="w-4 h-4" />
                      <span>{t('order.urlParser.seller')}: {parsedProduct.seller}</span>
                    </div>
                  )}
                  
                  {parsedProduct.category && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Tag className="w-4 h-4" />
                      <span>{t('order.urlParser.category')}: {parsedProduct.category}</span>
                    </div>
                  )}
                  
                  {parsedProduct.shippingInfo && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Truck className="w-4 h-4" />
                      <span>{parsedProduct.shippingInfo}</span>
                    </div>
                  )}
                </div>

                {/* Options */}
                {parsedProduct.options && parsedProduct.options.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">{t('order.urlParser.options')}:</p>
                    <div className="flex flex-wrap gap-2">
                      {parsedProduct.options.map((option, index) => (
                        <Badge key={index} variant="outline">
                          {option}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                {parsedProduct.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {parsedProduct.description}
                  </p>
                )}

                {/* Source */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Package className="w-4 h-4 text-gray-500" />
                  <span className="text-xs text-gray-500">
                    {t('order.urlParser.source')}: {parsedProduct.source}
                  </span>
                  <a
                    href={parsedProduct.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline ml-auto"
                  >
                    {t('order.urlParser.viewOriginal')} →
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}