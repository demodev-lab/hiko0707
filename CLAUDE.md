# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands
```bash
# Development
pnpm dev              # Start development server on http://localhost:3000
pnpm build            # Build for production
pnpm start            # Start production server

# Code Quality
pnpm lint             # Run ESLint
pnpm test             # Run all tests
pnpm test:watch       # Run tests in watch mode

# Testing Specific Files
pnpm test [filename]  # Run tests for a specific file
```

### Project-Specific Commands
```bash
# Image Management
pnpm scrape-images           # Scrape product images from external sources
pnpm scrape-images:fast      # Quick scrape (5 images only)
pnpm map-local-images        # Map local images to products
pnpm generate-product-images # Generate placeholder product images
pnpm verify-images           # Verify all image links are valid

# Data Management
pnpm clear-auth              # Clear authentication data
pnpm crawl                   # Run hotdeal crawler
pnpm crawl:ppomppu           # Crawl only Ppomppu
pnpm crawl:all               # Crawl all sources
pnpm reset-hotdeals          # Reset hotdeal data
pnpm import-hotdeals         # Import crawled hotdeal data

# Browser Management Tools
# Visit /admin/hotdeal-manager for integrated hotdeal management
# Visit /clear-storage.html or /reset-data.html in browser for data management

# Demo admin account
# Email: admin@hiko.kr
# Password: admin123
```

## Architecture Overview

### Project Structure
This is a Next.js 15 application using App Router with a custom local storage database implementation. The project is HiKo (하이코) - a shopping assistant platform for foreigners in Korea.

```
├── app/                    # Next.js App Router pages (routing only)
├── components/            
│   ├── ui/                # shadcn/ui components
│   ├── features/          # Domain-specific components
│   ├── layout/            # Layout components
│   └── common/            # Shared components
├── actions/               # Server Actions (preferred over API routes)
├── hooks/                 # Custom React hooks
├── lib/                   
│   ├── db/                # Local storage database layer
│   ├── i18n/              # Internationalization (7 languages)
│   ├── services/          # Business logic services
│   └── validations.ts     # Zod schemas
├── states/                # Jotai atoms for global state
├── types/                 # TypeScript type definitions
└── docs/                  # Project documentation
```

### Database Layer
The application uses a custom local storage database with a Repository pattern:
- **BaseRepository** (`lib/db/local/repositories/base-repository.ts`): Abstract base class providing CRUD operations
- **Entity Repositories**: Extend BaseRepository for User, Post, Comment, HotDeal, Order, Payment entities
- **Database Service** (`lib/db/database-service.ts`): Singleton that exports repository instances
- **Storage Layer** (`lib/db/storage.ts`): LocalStorage wrapper with JSON serialization
- **Auto-initialization**: Mock data automatically initializes on first load via `initializeMockData()`

### State Management Architecture
- **Global State**: Jotai atoms in `states/` directory (auth, UI state)
- **Server State**: TanStack Query for async data fetching (5-minute stale time)
- **Local State**: React hooks in `hooks/` directory
- **Providers**: Centralized in `components/common/providers.tsx`

### Component Architecture
- **Server Components**: Default for all pages and components unless 'use client' is specified
- **Client Components**: Only for interactive features (forms, state management)
- **UI Components**: shadcn/ui components in `components/ui/`
- **Feature Components**: Domain-specific components in `components/features/`

### Data Flow Pattern
1. **Server Components** fetch data directly from repositories
2. **Client Components** use custom hooks (`use-local-db.ts`) for data operations
3. **Forms** use React Hook Form + Zod for validation
4. **State Updates** trigger re-fetches through TanStack Query

## HiKo Project Context

HiKo is a platform helping foreigners shop online in Korea:

### Core Features
1. **Hot Deal Crawling**: Real-time crawling from 6 Korean communities (Ppomppu, Ruliweb, Clien, Quasarzone, Coolenjoy, Itcm)
2. **Multi-language Support**: Translation to 7 languages (EN, ZH, VI, MN, TH, JA, RU) with caching
3. **Order Service**: "Buy for me" service with 8% commission for complex Korean shopping sites
4. **User System**: Role-based access (guest, member, admin)
5. **Payment Integration**: Support for multiple payment methods

### Key Technical Decisions
- **No API Routes**: Use Server Actions in `actions/` directory instead
- **Local Storage DB**: With prepared migration path to Supabase
- **Repository Pattern**: Enables easy database transition
- **Server Components**: For SEO-critical pages (hot deals list, detail pages)
- **Image Optimization**: Next.js Image with external domain support and 7-day caching

## Development Guidelines

### File Naming Conventions
- ALL files use kebab-case (`hotdeal-card.tsx`, NOT `HotDealCard.tsx`)
- Components have PascalCase names but kebab-case filenames
- Routes: kebab-case folders under `app/`

### TypeScript Configuration
- Strict mode enabled (no `any` types allowed)
- Path alias: `@/*` maps to project root
- Target: ES2017

### Testing Strategy
- Vitest for unit tests with jsdom environment
- Testing Library for component tests
- Custom test utils in `tests/utils/test-utils.tsx`
- LocalStorage cleared between tests
- Window APIs mocked (matchMedia, IntersectionObserver)
- Run specific tests with: `pnpm test [filename]`

### Local Storage Database Usage
```typescript
// Server Component usage
import { db } from '@/lib/db/database-service'
const posts = await db.posts.findAll()

// Client Component usage
import { usePosts } from '@/hooks/use-local-db'
const { posts, loading, createPost } = usePosts()
```

### Form Validation Pattern
```typescript
// Use Zod schemas in lib/validations.ts
// Use React Hook Form with zodResolver
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { postSchema } from '@/lib/validations'
```

### Internationalization Pattern
```typescript
// Always use translation system, no hardcoded text
import { useTranslation } from '@/hooks/use-translation'
const { t } = useTranslation()
// Use: t('key.path')
// Fallback to English for missing translations
```

### Order Flow Implementation
```typescript
// Order statuses: pending → processing → shipped → delivered → cancelled
// 8% commission automatically calculated
// Use buy-for-me-modal.tsx for order creation
```

## Performance Considerations

- Server Components are used by default for better performance
- Images should use Next.js Image component with proper dimensions
- Local storage operations are synchronous - consider pagination for large datasets
- TanStack Query configured with 5-minute stale time
- Implement loading states for all async operations
- Use Suspense boundaries for better UX
- Image domains whitelisted in next.config.js for optimization

## Important Notes

1. **shadcn/ui**: Always check if component exists before creating new ones
2. **Icons**: Use lucide-react for all icons
3. **Styling**: Tailwind CSS only, no CSS modules or styled-components
4. **Forms**: Always validate with Zod schemas
5. **Authentication**: Check user role/auth state before protected operations
6. **Translations**: All user-facing text must use i18n system
7. **Mock Data**: Automatically initializes on first load - check localStorage before testing
8. **Image Management**: Use provided pnpm scripts for image operations

## Development Rules & Constraints

### File Operations
- NEVER create files unless absolutely necessary for achieving your goal
- ALWAYS prefer editing existing files over creating new ones
- NEVER proactively create documentation files (*.md) or README files unless explicitly requested
- ALL files use kebab-case naming (`hotdeal-card.tsx`, NOT `HotDealCard.tsx`)

### Code Quality Requirements
- **TypeScript**: Strict mode enabled, no `any` types allowed
- **ESLint**: Must pass `pnpm lint` before completing tasks
- **Testing**: Use `pnpm test` to verify changes don't break existing functionality
- **Error Handling**: Always use try-catch blocks in Server Actions with proper error messages

### Architecture Constraints
- **No API Routes**: Use Server Actions in `actions/` directory instead
- **Component Types**: Server Components by default, Client Components only for interactivity
- **Database Access**: Repository pattern only, no direct LocalStorage access
- **State Management**: Jotai for global state, TanStack Query for server state
- **Forms**: React Hook Form + Zod resolver pattern required

### Korean Context Requirements
- **HiKo Project**: Shopping assistant platform for foreigners in Korea
- **Multi-language**: All text must use i18n system (7 languages: EN, ZH, VI, MN, TH, JA, RU)
- **Hot Deal Crawling**: System crawls 6 Korean communities (Ppomppu, Ruliweb, Clien, Quasarzone, Coolenjoy, Itcm)
- **Order Service**: 8% commission "Buy for me" service for Korean shopping sites
- **Admin Account**: Email: admin@hiko.kr, Password: admin123

### Special Project Rules
These rules are derived from shrimp-rules.md and must be followed:
- **Server Components**: Never add 'use client' directive
- **Client Components**: Never access Repository directly
- **Hardcoded Text**: All user-facing text must use translation system
- **Image Handling**: Use Next.js Image component with proper dimensions
- **Migration Ready**: Repository pattern enables future Supabase migration