export interface JsonLdProps {
  data: Record<string, any>
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data, null, 2)
      }}
    />
  )
}

// 웹사이트 구조화 데이터
export function WebsiteJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "HiKo - 한국 쇼핑 도우미",
    "alternateName": "하이코",
    "url": "https://hiko.kr",
    "description": "외국인을 위한 한국 쇼핑 플랫폼. 실시간 핫딜 정보와 구매대행 서비스 제공",
    "inLanguage": ["ko", "en", "zh", "ja", "vi", "th", "mn", "ru"],
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://hiko.kr/search?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  }
  
  return <JsonLd data={data} />
}

// 조직 구조화 데이터
export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "HiKo",
    "url": "https://hiko.kr",
    "logo": "https://hiko.kr/logo.png",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+82-2-1234-5678",
      "contactType": "customer service",
      "email": "support@hiko.kr",
      "availableLanguage": ["Korean", "English", "Chinese", "Japanese", "Vietnamese", "Thai", "Mongolian", "Russian"]
    },
    "sameAs": [
      "https://www.facebook.com/hikokorea",
      "https://www.instagram.com/hikokorea",
      "https://twitter.com/hikokorea"
    ]
  }
  
  return <JsonLd data={data} />
}

// 제품 구조화 데이터 (핫딜용)
export interface ProductJsonLdProps {
  id: string
  name: string
  description?: string
  image?: string
  price: number
  originalPrice?: number
  currency?: string
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder' | 'SoldOut'
  seller?: string
  brand?: string
  category?: string
  ratingValue?: number
  reviewCount?: number
  url?: string
}

export function ProductJsonLd({
  id,
  name,
  description,
  image,
  price,
  originalPrice,
  currency = 'KRW',
  availability = 'InStock',
  seller,
  brand,
  category,
  ratingValue,
  reviewCount,
  url
}: ProductJsonLdProps) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `https://hiko.kr/hotdeals/${id}`,
    "name": name,
    "description": description,
    "image": image,
    "brand": brand ? {
      "@type": "Brand",
      "name": brand
    } : undefined,
    "category": category,
    "offers": {
      "@type": "Offer",
      "url": url || `https://hiko.kr/hotdeals/${id}`,
      "priceCurrency": currency,
      "price": price,
      "priceValidUntil": new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7일 후
      "availability": `https://schema.org/${availability}`,
      "seller": seller ? {
        "@type": "Organization",
        "name": seller
      } : undefined
    },
    "aggregateRating": ratingValue && reviewCount ? {
      "@type": "AggregateRating",
      "ratingValue": ratingValue,
      "reviewCount": reviewCount
    } : undefined
  }
  
  // undefined 값 제거
  Object.keys(data).forEach(key => {
    if (data[key as keyof typeof data] === undefined) {
      delete data[key as keyof typeof data]
    }
  })
  
  if (data.offers) {
    Object.keys(data.offers).forEach(key => {
      if (data.offers[key as keyof typeof data.offers] === undefined) {
        delete data.offers[key as keyof typeof data.offers]
      }
    })
  }
  
  return <JsonLd data={data} />
}

// FAQ 구조화 데이터
export interface FAQJsonLdProps {
  faqs: Array<{
    question: string
    answer: string
  }>
}

export function FAQJsonLd({ faqs }: FAQJsonLdProps) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  }
  
  return <JsonLd data={data} />
}

// 빵가루 네비게이션 구조화 데이터
export interface BreadcrumbItem {
  name: string
  url: string
}

export interface BreadcrumbJsonLdProps {
  items: BreadcrumbItem[]
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  }
  
  return <JsonLd data={data} />
}

// 서비스 구조화 데이터 (구매대행 서비스)
export function ServiceJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": "Shopping Agent Service",
    "provider": {
      "@type": "Organization",
      "name": "HiKo"
    },
    "areaServed": {
      "@type": "Country",
      "name": "South Korea"
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "구매대행 서비스",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "한국 온라인 쇼핑 대행",
            "description": "복잡한 한국 쇼핑몰에서 대신 구매해드립니다"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "국제 배송 서비스",
            "description": "한국에서 전 세계로 안전하게 배송해드립니다"
          }
        }
      ]
    }
  }
  
  return <JsonLd data={data} />
}