export function highlightText(text: string, query: string): string {
  if (!query) return text
  
  const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function normalizeSearchQuery(query: string): string {
  return query
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

export function getSearchQueryParams(searchParams: URLSearchParams) {
  return {
    query: searchParams.get('q') || '',
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    site: searchParams.get('site') || '',
    sort: searchParams.get('sort') || 'relevance',
    page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
  }
}

export function buildSearchUrl(params: {
  query?: string
  category?: string
  minPrice?: number
  maxPrice?: number
  site?: string
  sort?: string
  page?: number
}) {
  const searchParams = new URLSearchParams()
  
  if (params.query) searchParams.set('q', params.query)
  if (params.category) searchParams.set('category', params.category)
  if (params.minPrice !== undefined) searchParams.set('minPrice', params.minPrice.toString())
  if (params.maxPrice !== undefined) searchParams.set('maxPrice', params.maxPrice.toString())
  if (params.site) searchParams.set('site', params.site)
  if (params.sort) searchParams.set('sort', params.sort)
  if (params.page && params.page > 1) searchParams.set('page', params.page.toString())
  
  return `/search?${searchParams.toString()}`
}