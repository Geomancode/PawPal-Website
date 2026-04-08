# CLAUDE.md — PawPal Website

This file provides instructions for Claude and other AI assistants working on this codebase.

## Read First
- **`../DEVELOPER_GUIDE.md`** is the authoritative reference for all conventions.

## Critical Rules

### Architecture
- Next.js 16 App Router with React 19 + TypeScript.
- Pages are Server Components by default. Extract client interactivity to `*ClientParts.tsx`.
- Supabase: Server → `supabaseServer.ts`, Client → `supabase.ts`. NEVER raw REST fetch.

### Styling & Design
- Tailwind CSS v4. Warm palette: amber, emerald, `bg-[#fffdf9]`.
- Animations: `framer-motion`. Icons: `lucide-react`. 3D: `react-globe.gl`.
- Mobile-first responsive design. Test at 375px width.

### SEO
- Every page: descriptive `<title>`, meta description, single `<h1>`, semantic HTML.

### Security
- `.env.local` for all secrets (already git-ignored).
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to client components.
- Server components may use `supabaseServer` with anon key for public reads.

### Quality Gate
- `npm run build` must pass with 0 errors before committing.
