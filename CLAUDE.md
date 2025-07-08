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
# Initialize mock data
# The app automatically initializes mock data on first load via lib/db/mock-data.ts

# Clear local storage data (run in browser console)
localStorage.clear()
```

## Architecture Overview

### Project Structure
This is a Next.js 15 application using App Router with a custom local storage database implementation. The project is transitioning to become HiKo - a shopping assistant platform for foreigners in Korea.

### Database Layer
The application uses a custom local storage database with a Repository pattern:
- **BaseRepository** (`lib/db/local/repositories/base-repository.ts`): Abstract base class providing CRUD operations
- **Entity Repositories**: Extend BaseRepository for User, Post, Comment entities
- **Database Service** (`lib/db/database-service.ts`): Singleton that exports repository instances
- **Storage Layer** (`lib/db/storage.ts`): LocalStorage wrapper with JSON serialization

### State Management Architecture
- **Global State**: Jotai atoms in `states/` directory
- **Server State**: TanStack Query for async data fetching
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

The project is being transformed into HiKo, a platform helping foreigners shop online in Korea:

### Core Features (from PRD)
1. **Hot Deal Crawling**: Real-time crawling from 6 Korean communities
2. **Multi-language Support**: Translation to 7 languages
3. **Order Service**: "Buy for me" service for complex Korean shopping sites

### Development Phases
- **Phase 1 (Week 1-4)**: Crawling system + basic UI
- **Phase 2 (Week 5-8)**: Translation + order forms
- **Phase 3 (Week 9-12)**: Payment integration + deployment

### Key Technical Decisions
- Server Components for SEO-critical pages (hot deals list, detail pages)
- Client Components for interactive features (filters, language selector, order forms)
- Local storage DB for rapid prototyping, with planned Supabase migration
- Repository pattern to ease future database transitions

## Development Guidelines

### File Naming Conventions
- Components: PascalCase (`HotDealCard.tsx`)
- Files: kebab-case (`hotdeal-card.tsx`)
- Routes: kebab-case folders under `app/`

### TypeScript Configuration
- Strict mode enabled
- Path alias: `@/*` maps to project root
- Target: ES2017

### Testing Strategy
- Vitest for unit tests
- Testing Library for component tests
- Test files alongside source files or in `tests/` directory

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
```

## Current Implementation Status

### Implemented
- Basic CRUD for Users, Posts, Comments
- Authentication hook structure
- Dashboard layout
- Local storage database layer
- Mock data initialization

### Pending (for HiKo transformation)
- Hot deal crawling system
- Translation integration
- Order management system
- Payment integration
- Multi-language UI

## Performance Considerations

- Server Components are used by default for better performance
- Images should use Next.js Image component
- Local storage operations are synchronous - consider pagination for large datasets
- TanStack Query configured with 5-minute stale time