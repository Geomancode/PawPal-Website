# PawPal Website — Copilot Instructions

## Project Overview
PawPal marketing website + NFC tag lookup, built with Next.js 16 + React 19 + Supabase.

## Key Rules
1. **Server Components** by default. Only add `'use client'` when interactivity needed.
2. **Supabase**: Server side → `supabaseServer.ts`. Client side → `supabase.ts`. NEVER raw fetch.
3. **Styling**: Tailwind CSS v4. Follow existing warm color palette (amber/emerald).
4. **Animations**: `framer-motion` only. Icons: `lucide-react` only.
5. **SEO**: Every page needs title + meta description + semantic HTML.
6. **Security**: API keys in `.env.local` only. Never expose server secrets to client.
7. **Performance**: Lazy-load heavy components (Globe, Maps) with `dynamic()`.

## File Reference
- See `DEVELOPER_GUIDE.md` in parent directory for complete documentation.
