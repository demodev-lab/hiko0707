# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
pnpm dev              # Start development server on http://localhost:3000
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint
pnpm tsc --noEmit     # Check TypeScript types without emitting files
```

### Testing
```bash
pnpm test             # Run unit tests with Vitest
pnpm test:watch       # Run tests in watch mode
pnpm test:unit        # Run unit tests with coverage
pnpm test:e2e         # Run Playwright E2E tests
pnpm test:e2e:ui      # Run Playwright tests with UI
pnpm test:all         # Run all tests (unit + e2e)
```

### Data Management
```bash
pnpm crawl            # Run hotdeal crawler for all sources
pnpm crawl:ppomppu    # Crawl only Ppomppu
pnpm import-hotdeals  # Import crawled hotdeal data
pnpm reset-hotdeals   # Reset hotdeal data
pnpm clear-auth       # Clear authentication data
```

### Supabase Operations
```bash
pnpm gen:types        # Generate TypeScript types from Supabase schema
pnpm migrate-to-supabase    # Migrate LocalStorage data to Supabase
pnpm test-supabase-crawler  # Test Supabase crawler functionality
```

### Image Management
```bash
pnpm scrape-images           # Scrape product images from external sources
pnpm scrape-images:fast      # Quick scrape (5 images only)
pnpm map-local-images        # Map local images to products
pnpm generate-product-images # Generate placeholder product images
pnpm verify-images           # Verify all image links are valid
```

## High-Level Architecture

### Project Overview
**HiKo (하이코)** is a shopping assistant platform for foreigners in Korea. It helps non-Korean speakers access Korean online shopping deals by:
1. Crawling hotdeals from 6 Korean communities in real-time
2. Translating deals into 7 languages
3. Providing a "Buy for me" service for complex Korean shopping sites

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode)
- **Database**: Supabase (migrated from LocalStorage)
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Jotai (global) + TanStack Query (server state)
- **Authentication**: Clerk
- **Testing**: Vitest (unit) + Playwright (E2E)

### Directory Structure
```
├── app/                    # Next.js App Router pages
├── actions/               # Server Actions (preferred over API routes)
├── components/            
│   ├── ui/               # shadcn/ui components
│   ├── features/         # Domain-specific components
│   ├── layout/           # Layout components (header, footer, sidebar)
│   └── common/           # Shared components (providers, error boundaries)
├── hooks/                 # Custom React hooks (use-supabase-*.ts)
├── lib/                   
│   ├── services/         # Supabase service layer
│   ├── crawlers/         # Hotdeal crawler implementations
│   ├── i18n/             # Internationalization (7 languages)
│   ├── types/            # TypeScript type definitions
│   └── validations.ts    # Zod schemas for validation
├── states/               # Jotai atoms for global state
└── e2e/                  # Playwright E2E tests
```

### Key Architectural Patterns

#### 1. Server Components First
- Default to Server Components for better performance and SEO
- Client Components only for interactive features (forms, modals, real-time updates)
- Server Actions for mutations instead of API routes

#### 2. Data Flow
```typescript
// Server Component
import { SupabaseHotDealService } from '@/lib/services/supabase-hotdeal-service'
const hotdeals = await SupabaseHotDealService.getHotDeals()

// Client Component
import { useSupabaseHotDeals } from '@/hooks/use-supabase-hotdeals'
const { data, isLoading, error } = useSupabaseHotDeals()
```

#### 3. Type System
All Supabase types are centralized in `lib/types/supabase.ts`:
```typescript
import type { HotDealRow, UserRow, OrderRow } from '@/lib/types/supabase'
```

#### 4. Form Validation
Always use React Hook Form + Zod:
```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { orderSchema } from '@/lib/validations'
```

#### 5. Internationalization
Never hardcode text - always use the translation system:
```typescript
import { useTranslation } from '@/hooks/use-translation'
const { t } = useTranslation()
// Usage: t('hotdeals.title')
```

### Supabase Migration Status
The project has completed migration from LocalStorage to Supabase:
- ✅ All data services migrated to `lib/services/supabase-*.ts`
- ✅ Centralized type system in `lib/types/supabase.ts`
- ✅ Real-time subscriptions with TanStack Query
- ✅ Deprecated LocalStorage repositories (marked with warnings)

### Hotdeal Crawler System
The system crawls 6 Korean communities every 10 minutes:
1. **Ppomppu** (뽐뿌) - Main hotdeal community
2. **Ruliweb** (루리웹) - Gaming and tech deals
3. **Clien** (클리앙) - Tech community deals
4. **Quasarzone** (퀘이사존) - PC hardware deals
5. **Coolenjoy** (쿨엔조이) - Electronics deals
6. **Eomisae** (어미새) - Various deals

Crawlers save directly to Supabase without LocalStorage intermediary.

### Authentication & Roles
- **Guest**: Can view hotdeals
- **Customer**: Can use "Buy for me" service
- **Admin**: Can manage orders and system settings
- Demo admin: admin@hiko.kr / admin123

### Important Development Rules
1. **File naming**: Always use kebab-case (e.g., `hotdeal-card.tsx`)
2. **No `any` types**: TypeScript strict mode is enforced
3. **No API routes**: Use Server Actions in `actions/` directory
4. **Always validate**: Use Zod schemas for all user input
5. **Test coverage**: Run tests before committing changes
6. **Image optimization**: Use Next.js Image component with proper dimensions

### Environment Variables
Required environment variables are configured in `.env.local`:
- Supabase connection (URL, keys)
- Clerk authentication
- Kakao API key for maps

### Performance Considerations
- Server Components for static content
- 5-minute stale time for TanStack Query
- Image optimization with 7-day browser caching
- Suspense boundaries for better perceived performance
- Real-time updates throttled based on page visibility