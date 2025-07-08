# Next.js Local Storage App

A full-stack web application built with Next.js 15, TypeScript, and a local storage-based database.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Jotai + TanStack Query
- **Database**: Local Storage (browser-based)
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **Testing**: Vitest + Testing Library

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm/yarn

### Installation

1. Clone the repository
2. Install dependencies:
```bash
pnpm install
```

3. Run the development server:
```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
├── app/                    # Next.js App Router pages
├── components/            
│   ├── ui/                # shadcn/ui components
│   ├── forms/             # Form components
│   ├── layout/            # Layout components
│   ├── features/          # Feature-specific components
│   └── common/            # Shared components
├── hooks/                 # Custom React hooks
├── lib/                   
│   ├── db/                # Local storage database
│   ├── utils.ts           # Utility functions
│   └── validations.ts     # Zod schemas
├── states/                # Jotai atoms
├── types/                 # TypeScript types
└── tests/                 # Test files
```

## Features

- 🔐 User authentication (mock)
- 📝 Create, read, update, delete posts
- 💬 Comments system
- 📊 Dashboard with statistics
- 🌐 Fully responsive design
- 💾 Persistent data storage in browser
- 🎨 Dark mode support (ready to implement)

## Local Storage Database

This app uses a custom local storage database implementation that provides:

- Repository pattern for data access
- Type-safe models and queries
- Mock data initialization
- Backup and restore functionality

### Database Schema

- **Users**: id, email, name, avatar, createdAt, updatedAt
- **Posts**: id, title, content, authorId, tags, status, createdAt, updatedAt
- **Comments**: id, content, postId, authorId, parentId, createdAt, updatedAt

## Development

### Running Tests

```bash
pnpm test
```

### Building for Production

```bash
pnpm build
```

### Linting

```bash
pnpm lint
```

## License

MIT# hiko0707
