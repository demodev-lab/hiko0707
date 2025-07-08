import { LanguageCode } from './translations-merged'

// Currency configurations for each locale
const currencyConfig: Record<LanguageCode, {
  currency: string
  symbol: string
  locale: string
}> = {
  ko: { currency: 'KRW', symbol: '₩', locale: 'ko-KR' },
  en: { currency: 'USD', symbol: '$', locale: 'en-US' },
  zh: { currency: 'CNY', symbol: '¥', locale: 'zh-CN' },
  ja: { currency: 'JPY', symbol: '¥', locale: 'ja-JP' },
  vi: { currency: 'VND', symbol: '₫', locale: 'vi-VN' },
  th: { currency: 'THB', symbol: '฿', locale: 'th-TH' },
  mn: { currency: 'MNT', symbol: '₮', locale: 'mn-MN' },
  ru: { currency: 'RUB', symbol: '₽', locale: 'ru-RU' },
}

// Format currency based on locale
export function formatCurrency(
  amount: number,
  language: LanguageCode,
  showSymbol = true
): string {
  const config = currencyConfig[language]
  
  try {
    const formatted = new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
    
    return formatted
  } catch (error) {
    // Fallback formatting
    const formattedNumber = amount.toLocaleString(config.locale)
    return showSymbol ? `${config.symbol}${formattedNumber}` : formattedNumber
  }
}

// Format date based on locale
export function formatDate(
  date: Date | string,
  language: LanguageCode,
  options?: Intl.DateTimeFormatOptions
): string {
  const config = currencyConfig[language]
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  }
  
  try {
    return new Intl.DateTimeFormat(config.locale, defaultOptions).format(dateObj)
  } catch (error) {
    // Fallback formatting
    return dateObj.toLocaleDateString(config.locale)
  }
}

// Format relative time (e.g., "2 hours ago")
export function formatRelativeTime(
  date: Date | string,
  language: LanguageCode
): string {
  const config = currencyConfig[language]
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - dateObj.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  try {
    const rtf = new Intl.RelativeTimeFormat(config.locale, { numeric: 'auto' })
    
    if (diffDays > 0) {
      return rtf.format(-diffDays, 'day')
    } else if (diffHours > 0) {
      return rtf.format(-diffHours, 'hour')
    } else if (diffMins > 0) {
      return rtf.format(-diffMins, 'minute')
    } else {
      return rtf.format(0, 'second')
    }
  } catch (error) {
    // Fallback for browsers without RelativeTimeFormat
    const translations = {
      ko: { minute: '분', hour: '시간', day: '일', ago: '전' },
      en: { minute: 'min', hour: 'hour', day: 'day', ago: 'ago' },
      zh: { minute: '分钟', hour: '小时', day: '天', ago: '前' },
      ja: { minute: '分', hour: '時間', day: '日', ago: '前' },
      vi: { minute: 'phút', hour: 'giờ', day: 'ngày', ago: 'trước' },
      th: { minute: 'นาที', hour: 'ชั่วโมง', day: 'วัน', ago: 'ที่แล้ว' },
      mn: { minute: 'минут', hour: 'цаг', day: 'өдөр', ago: 'өмнө' },
      ru: { minute: 'мин', hour: 'час', day: 'день', ago: 'назад' },
    }
    
    const t = translations[language]
    
    if (diffDays > 0) {
      return `${diffDays} ${t.day} ${t.ago}`
    } else if (diffHours > 0) {
      return `${diffHours} ${t.hour} ${t.ago}`
    } else if (diffMins > 0) {
      return `${diffMins} ${t.minute} ${t.ago}`
    } else {
      return language === 'ko' ? '방금 전' : 
             language === 'en' ? 'just now' :
             language === 'zh' ? '刚刚' :
             language === 'ja' ? 'たった今' :
             language === 'vi' ? 'vừa xong' :
             language === 'th' ? 'เมื่อสักครู่' :
             language === 'mn' ? 'дөнгөж сая' :
             language === 'ru' ? 'только что' : 'now'
    }
  }
}

// Format number based on locale
export function formatNumber(
  number: number,
  language: LanguageCode,
  options?: Intl.NumberFormatOptions
): string {
  const config = currencyConfig[language]
  
  try {
    return new Intl.NumberFormat(config.locale, options).format(number)
  } catch (error) {
    return number.toLocaleString(config.locale)
  }
}

// Format percentage
export function formatPercentage(
  value: number,
  language: LanguageCode,
  decimals = 0
): string {
  const config = currencyConfig[language]
  
  try {
    return new Intl.NumberFormat(config.locale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value / 100)
  } catch (error) {
    return `${value}%`
  }
}

// Get currency symbol for a language
export function getCurrencySymbol(language: LanguageCode): string {
  return currencyConfig[language].symbol
}

// Get locale string for a language
export function getLocale(language: LanguageCode): string {
  return currencyConfig[language].locale
}

// Format time remaining (for deals ending soon)
export function formatTimeRemaining(
  endDate: Date | string,
  language: LanguageCode
): string {
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate
  const now = new Date()
  const diffMs = end.getTime() - now.getTime()
  
  if (diffMs <= 0) {
    const endedTranslations = {
      ko: '종료됨',
      en: 'Ended',
      zh: '已结束',
      ja: '終了',
      vi: 'Đã kết thúc',
      th: 'สิ้นสุดแล้ว',
      mn: 'Дууссан',
      ru: 'Завершено',
    }
    return endedTranslations[language]
  }
  
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)
  const remainingHours = diffHours % 24
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  
  const translations = {
    ko: { day: '일', hour: '시간', minute: '분', remaining: '남음' },
    en: { day: 'd', hour: 'h', minute: 'm', remaining: 'left' },
    zh: { day: '天', hour: '小时', minute: '分钟', remaining: '剩余' },
    ja: { day: '日', hour: '時間', minute: '分', remaining: '残り' },
    vi: { day: 'ngày', hour: 'giờ', minute: 'phút', remaining: 'còn lại' },
    th: { day: 'วัน', hour: 'ชั่วโมง', minute: 'นาที', remaining: 'เหลือ' },
    mn: { day: 'өдөр', hour: 'цаг', minute: 'минут', remaining: 'үлдсэн' },
    ru: { day: 'д', hour: 'ч', minute: 'м', remaining: 'осталось' },
  }
  
  const t = translations[language]
  const parts = []
  
  if (diffDays > 0) {
    parts.push(`${diffDays}${t.day}`)
  }
  if (remainingHours > 0) {
    parts.push(`${remainingHours}${t.hour}`)
  }
  if (diffMinutes > 0 && diffDays === 0) {
    parts.push(`${diffMinutes}${t.minute}`)
  }
  
  return `${parts.join(' ')} ${t.remaining}`
}

// Format file size
export function formatFileSize(
  bytes: number,
  language: LanguageCode
): string {
  const config = currencyConfig[language]
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = bytes
  let unitIndex = 0
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  try {
    const formatted = new Intl.NumberFormat(config.locale, {
      maximumFractionDigits: unitIndex === 0 ? 0 : 1,
    }).format(size)
    return `${formatted} ${units[unitIndex]}`
  } catch (error) {
    return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
  }
}