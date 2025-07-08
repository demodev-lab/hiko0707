export const APP_NAME = 'HiKo'
export const APP_DESCRIPTION = '한국 거주 외국인을 위한 핫딜 쇼핑 도우미'

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  SETTINGS: '/dashboard/settings',
  HOTDEALS: '/hotdeals',
  ORDER: '/order',
  ORDERS: '/orders',
  PAYMENT: '/payment',
  PAYMENTS: '/dashboard/payments',
  ADMIN: '/admin',
} as const

export const POST_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const

export const POST_STATUS_LABELS = {
  [POST_STATUS.DRAFT]: 'Draft',
  [POST_STATUS.PUBLISHED]: 'Published',
  [POST_STATUS.ARCHIVED]: 'Archived',
} as const

export const DEFAULT_AVATAR = 'https://avatar.vercel.sh/default'

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 20, 50],
} as const