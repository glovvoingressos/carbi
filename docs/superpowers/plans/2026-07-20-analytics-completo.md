# Analytics Completo - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close all analytics gaps — fix bugs, add event tracking, replace mock data with real data, and build an admin dashboard.

**Architecture:** Server-side analytics via Supabase (views, events, price history) + client-side GA event tracking via a thin utility layer. Admin dashboard reads from Supabase RPC functions. Homepage stats query real aggregate data via a public API endpoint.

**Tech Stack:** Next.js 15, Supabase (PostgreSQL + RPC), Google Analytics (gtag.js), React, Tailwind CSS, Framer Motion

## Global Constraints

- TypeScript strict, no `any` in new code
- Follow existing patterns: API routes in `src/app/api/`, components in `src/components/`, lib utils in `src/lib/`
- RLS must be respected — admin queries use `getSupabaseAdminClient()` (service role key)
- All new Supabase functions use `SECURITY DEFINER` and are idempotent (use `CREATE OR REPLACE`)
- No new npm dependencies — use what's already in package.json
- Brazilian Portuguese for all UI text

---

### Task 1: Fix View Count Fallback Bug + Add Deduplication

**Files:**
- Modify: `src/app/api/marketplace/listings/[listingId]/views/route.ts`
- Create: `supabase/migrations/20260720_fix_view_count_dedup.sql`

**Interfaces:**
- Consumes: existing `increment_listing_views` RPC, `listing_views` table
- Produces: corrected view count logic, `recent_listing_view` RPC for dedup

- [ ] **Step 1: Create the dedup migration**

```sql
-- supabase/migrations/20260720_fix_view_count_dedup.sql
-- RPC: check if this ip_hash viewed this listing in the last 30 minutes
CREATE OR REPLACE FUNCTION recent_listing_view(
  p_listing_id uuid,
  p_ip_hash text,
  p_window_minutes integer DEFAULT 30
)
RETURNS boolean AS $$
DECLARE
  found_row boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM listing_views
    WHERE listing_id = p_listing_id
      AND ip_hash = p_ip_hash
      AND viewed_at > now() - (p_window_minutes || ' minutes')::interval
  ) INTO found_row;
  RETURN found_row;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

- [ ] **Step 2: Apply the migration via Supabase MCP**

Run the migration SQL using the `supabase_apply_migration` tool against the `carbi` project.

- [ ] **Step 3: Fix the views API route**

Replace the entire file `src/app/api/marketplace/listings/[listingId]/views/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase-server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ listingId: string }> },
) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase não configurado.' }, { status: 503 })
    }

    const { listingId } = await params
    const supabase = getSupabaseServerClient()

    // Get client IP hash for dedup
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const ipHash = Buffer.from(ip).toString('base64').substring(0, 16)

    // Dedup: skip if same IP viewed this listing in last 30 minutes
    const { data: isRecent } = await supabase.rpc('recent_listing_view', {
      p_listing_id: listingId,
      p_ip_hash: ipHash,
      p_window_minutes: 30,
    })

    if (!isRecent) {
      // Increment view count atomically
      const { error } = await supabase.rpc('increment_listing_views', {
        listing_uuid: listingId,
      })

      if (error) {
        console.error('increment_listing_views RPC failed:', error)
      }

      // Log detailed view (non-blocking)
      supabase
        .from('listing_views')
        .insert({
          listing_id: listingId,
          ip_hash: ipHash,
          user_agent: req.headers.get('user-agent')?.substring(0, 255) || null,
        })
        .then(() => {})
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('POST /api/marketplace/listings/[listingId]/views failed', error)
    return NextResponse.json({ ok: true })
  }
}
```

- [ ] **Step 4: Verify the change compiles**

Run: `npx tsc --noEmit --pretty` from the project root.
Expected: no errors related to the changed file.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/marketplace/listings/\[listingId\]/views/route.ts supabase/migrations/20260720_fix_view_count_dedup.sql
git commit -m "fix: correct view count fallback and add 30-min deduplication"
```

---

### Task 2: Create GA Events Utility + Add Custom Event Tracking

**Files:**
- Create: `src/lib/analytics.ts`
- Modify: `src/components/analytics/GoogleAnalytics.tsx`
- Modify: `src/components/marketplace/VehicleDetailView.tsx` (line ~112, view tracking)
- Modify: `src/app/anunciar-carro/fluxo/page.tsx` (listing creation event)

**Interfaces:**
- Consumes: existing `window.gtag` type from `src/types/gtag.d.ts`
- Produces: `trackEvent(name, params)` helper, events fired at key moments

- [ ] **Step 1: Create the analytics utility**

```typescript
// src/lib/analytics.ts
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>,
) {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined' || !window.gtag) return
  window.gtag('event', eventName, params)
}

export function trackPageView(path: string) {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined' || !window.gtag) return
  window.gtag('config', GA_MEASUREMENT_ID, { page_path: path })
}
```

- [ ] **Step 2: Simplify GoogleAnalytics component to use the utility**

Replace the file `src/components/analytics/GoogleAnalytics.tsx`:

```tsx
'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { trackPageView } from '@/lib/analytics'

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

export function GoogleAnalytics() {
  const pathname = usePathname()

  useEffect(() => {
    trackPageView(pathname)
  }, [pathname])

  if (!GA_MEASUREMENT_ID) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    </>
  )
}
```

- [ ] **Step 3: Add event tracking to VehicleDetailView**

In `src/components/marketplace/VehicleDetailView.tsx`, add the import and fire a `view_item` event after the view fetch:

Add import at top:
```typescript
import { trackEvent } from '@/lib/analytics'
```

Replace the view tracking `fetch` block (around line 112):
```typescript
    // Track view (non-blocking)
    fetch(`/api/marketplace/listings/${listing.id}/views`, { method: 'POST' })
      .then(() => setViewCount((v) => v + 1))
      .catch(() => {})

    // GA event: view_item
    trackEvent('view_item', {
      item_id: listing.id,
      item_name: listing.title,
      item_brand: listing.brand,
      item_category: listing.body_type || 'vehicle',
      price: Number(listing.price),
      currency: 'BRL',
    })
```

- [ ] **Step 4: Add event tracking to listing creation flow**

In `src/app/anunciar-carro/fluxo/page.tsx`, find the success handler after a listing is created and add:

```typescript
import { trackEvent } from '@/lib/analytics'

// After successful listing creation:
trackEvent('create_listing', {
  item_brand: payload.brand,
  item_model: payload.model,
  price: payload.price,
  currency: 'BRL',
})
```

(Note: read the file first to find the exact success handler location and variable names.)

- [ ] **Step 5: Verify compilation**

Run: `npx tsc --noEmit --pretty`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/analytics.ts src/components/analytics/GoogleAnalytics.tsx src/components/marketplace/VehicleDetailView.tsx src/app/anunciar-carro/fluxo/page.tsx
git commit -m "feat: add GA event tracking utility and fire events on key actions"
```

---

### Task 3: Create Real Stats API Endpoint

**Files:**
- Create: `src/app/api/analytics/stats/route.ts`
- Create: `supabase/migrations/20260720_analytics_rpc_functions.sql`

**Interfaces:**
- Consumes: `vehicle_listings`, `listing_views`, `vehicle_listing_events` tables
- Produces: `GET /api/analytics/stats` returning `{ activeListings, totalViews, totalConversations, recentGrowthPercent }`

- [ ] **Step 1: Create the analytics RPC migration**

```sql
-- supabase/migrations/20260720_analytics_rpc_functions.sql
-- Aggregate stats for the homepage
CREATE OR REPLACE FUNCTION get_platform_stats()
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'active_listings', (
      SELECT count(*)::int FROM vehicle_listings WHERE status = 'active'
    ),
    'total_views', (
      SELECT COALESCE(sum(view_count), 0)::int FROM vehicle_listings
    ),
    'total_listings', (
      SELECT count(*)::int FROM vehicle_listings
    ),
    'views_this_month', (
      SELECT COALESCE(sum(view_count), 0)::int FROM vehicle_listings
    ),
    'views_last_month', (
      SELECT count(*)::int FROM listing_views
      WHERE viewed_at >= date_trunc('month', now() - interval '1 month')
        AND viewed_at < date_trunc('month', now())
    ),
    'new_listings_this_month', (
      SELECT count(*)::int FROM vehicle_listing_events
      WHERE type = 'created'
        AND created_at >= date_trunc('month', now())
    ),
    'new_listings_last_month', (
      SELECT count(*)::int FROM vehicle_listing_events
      WHERE type = 'created'
        AND created_at >= date_trunc('month', now() - interval '1 month')
        AND created_at < date_trunc('month', now())
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

- [ ] **Step 2: Apply the migration via Supabase MCP**

Use `supabase_apply_migration` tool against the `carbi` project.

- [ ] **Step 3: Create the stats API route**

```typescript
// src/app/api/analytics/stats/route.ts
import { NextResponse } from 'next/server'
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase não configurado.' }, { status: 503 })
  }

  const supabase = getSupabaseServerClient()

  const { data, error } = await supabase.rpc('get_platform_stats')

  if (error) {
    console.error('get_platform_stats RPC failed:', error)
    return NextResponse.json({ error: 'Falha ao carregar estatísticas.' }, { status: 500 })
  }

  return NextResponse.json(data)
}
```

- [ ] **Step 4: Verify compilation**

Run: `npx tsc --noEmit --pretty`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/analytics/stats/route.ts supabase/migrations/20260720_analytics_rpc_functions.sql
git commit -m "feat: add platform stats API endpoint with RPC aggregation"
```

---

### Task 4: Replace Hardcoded AnimatedStats with Real Data

**Files:**
- Modify: `src/components/ui/AnimatedStats.tsx`

**Interfaces:**
- Consumes: `GET /api/analytics/stats` (from Task 3)
- Produces: real stat values displayed with animated counters

- [ ] **Step 1: Rewrite AnimatedStats to fetch real data**

Replace the entire file `src/components/ui/AnimatedStats.tsx`:

```tsx
'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, useInView } from 'motion/react'
import { TrendingUp, Users, Car, Eye } from 'lucide-react'

interface PlatformStats {
  active_listings: number
  total_views: number
  new_listings_this_month: number
  new_listings_last_month: number
}

interface StatItem {
  icon: React.ReactNode
  value: number
  suffix: string
  label: string
  color: string
}

const fallbackStats: StatItem[] = [
  { icon: <Car size={20} />, value: 0, suffix: '+', label: 'Anúncios ativos', color: '#D4F576' },
  { icon: <Eye size={20} />, value: 0, suffix: '+', label: 'Visualizações totais', color: '#93C5FD' },
  { icon: <TrendingUp size={20} />, value: 0, suffix: '+', label: 'Novos este mês', color: '#C9B8FF' },
  { icon: <Users size={20} />, value: 0, suffix: '%', label: 'Crescimento mensal', color: '#39E09B' },
]

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView || value === 0) return

    let start = 0
    const duration = 2000
    const increment = value / (duration / 16)

    const timer = setInterval(() => {
      start += increment
      if (start >= value) {
        setCount(value)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)

    return () => clearInterval(timer)
  }, [isInView, value])

  const formatted = count >= 1000 ? `${(count / 1000).toFixed(1).replace('.0', '')}k` : count.toString()

  return (
    <span ref={ref} className="animated-stat-value">
      {formatted}{suffix}
    </span>
  )
}

export default function AnimatedStats() {
  const [stats, setStats] = useState<StatItem[]>(fallbackStats)

  useEffect(() => {
    fetch('/api/analytics/stats')
      .then((r) => r.json())
      .then((data: PlatformStats) => {
        const growth = data.new_listings_last_month > 0
          ? Math.round(((data.new_listings_this_month - data.new_listings_last_month) / data.new_listings_last_month) * 100)
          : 0

        setStats([
          { icon: <Car size={20} />, value: data.active_listings, suffix: '+', label: 'Anúncios ativos', color: '#D4F576' },
          { icon: <Eye size={20} />, value: data.total_views, suffix: '+', label: 'Visualizações totais', color: '#93C5FD' },
          { icon: <TrendingUp size={20} />, value: data.new_listings_this_month, suffix: '+', label: 'Novos este mês', color: '#C9B8FF' },
          { icon: <Users size={20} />, value: Math.max(0, growth), suffix: '%', label: 'Crescimento mensal', color: '#39E09B' },
        ])
      })
      .catch(() => {})
  }, [])

  const maxVal = Math.max(...stats.map((s) => s.value), 1)

  return (
    <section className="animated-stats">
      <div className="animated-stats-header">
        <h2 className="animated-stats-title">Números que comprovam</h2>
        <p className="animated-stats-sub">Dados reais da plataforma em tempo real</p>
      </div>

      <div className="animated-stats-grid">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            className="animated-stat-card"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.5,
              delay: i * 0.1,
              ease: [0.22, 1, 0.36, 1],
            }}
            whileHover={{
              y: -8,
              scale: 1.02,
              transition: { duration: 0.3 },
            }}
          >
            <div className="animated-stat-icon" style={{ color: stat.color, background: `${stat.color}15` }}>
              {stat.icon}
            </div>
            <AnimatedCounter value={stat.value} suffix={stat.suffix} />
            <div className="animated-stat-label">{stat.label}</div>
            <div className="animated-stat-bar">
              <motion.div
                className="animated-stat-bar-fill"
                style={{ background: stat.color }}
                initial={{ width: 0 }}
                whileInView={{ width: `${(stat.value / maxVal) * 100}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.5 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="animated-stats-bg">
        <motion.div
          className="animated-stats-bg-circle"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.03, 0.06, 0.03],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="animated-stats-bg-circle animated-stats-bg-circle-2"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.04, 0.08, 0.04],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit --pretty`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/AnimatedStats.tsx
git commit -m "feat: replace hardcoded stats with real platform data from API"
```

---

### Task 5: Replace Hardcoded AnimatedBarChart with Real Data

**Files:**
- Modify: `src/app/page.tsx` (lines ~114-123 where `statsData` is defined)

**Interfaces:**
- Consumes: `listing_views` table (queried via new RPC)
- Produces: real monthly view counts for the bar chart

- [ ] **Step 1: Add a monthly views RPC to the migration**

Add to `supabase/migrations/20260720_analytics_rpc_functions.sql` (append before the closing):

```sql
-- Monthly view counts for last 6 months
CREATE OR REPLACE FUNCTION get_monthly_views()
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'label', to_char(month_start, 'Mon'),
      'value', COALESCE(view_count, 0)
    ) ORDER BY month_start
  ) INTO result
  FROM (
    SELECT
      date_trunc('month', now()) - (n || ' months')::interval AS month_start,
      (SELECT count(*)::int FROM listing_views
       WHERE viewed_at >= date_trunc('month', now()) - (n || ' months')::interval
         AND viewed_at < date_trunc('month', now()) - ((n - 1) || ' months')::interval
      ) AS view_count
    FROM generate_series(0, 5) AS n
  ) sub;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

- [ ] **Step 2: Apply the migration via Supabase MCP**

Use `supabase_apply_migration` tool. Name: `add_monthly_views_rpc`.

- [ ] **Step 3: Create a server-side fetcher for monthly views**

Add to `src/lib/marketplace-server.ts` (append):

```typescript
export async function getMonthlyViews(): Promise<{ label: string; value: number }[]> {
  if (!isSupabaseConfigured()) return []

  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase.rpc('get_monthly_views')

  if (error || !data) return []

  return Array.isArray(data) ? data : []
}
```

Add the import at the top of the file:
```typescript
import { isSupabaseConfigured } from '@/lib/supabase-server'
```

(Check if `isSupabaseConfigured` is already imported — if so, skip.)

- [ ] **Step 4: Update homepage to use real data**

In `src/app/page.tsx`, add import:
```typescript
import { getLatestPublicListings, getMonthlyViews } from '@/lib/marketplace-server'
```

Replace the hardcoded `statsData` block (lines ~114-123):
```typescript
  // Stats data — real monthly views from Supabase
  const rawMonthlyViews = await getMonthlyViews()
  const statsData = rawMonthlyViews.length > 0
    ? rawMonthlyViews.map((m) => ({
        label: m.label.charAt(0).toUpperCase() + m.label.slice(1, 3),
        value: m.value,
      }))
    : [
        { label: 'Jan', value: 0 },
        { label: 'Fev', value: 0 },
        { label: 'Mar', value: 0 },
        { label: 'Abr', value: 0 },
        { label: 'Mai', value: 0 },
        { label: 'Jun', value: 0 },
      ]
  const maxValue = Math.max(...statsData.map((s) => s.value), 1)
```

- [ ] **Step 5: Verify compilation**

Run: `npx tsc --noEmit --pretty`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/page.tsx src/lib/marketplace-server.ts supabase/migrations/20260720_analytics_rpc_functions.sql
git commit -m "feat: replace hardcoded bar chart with real monthly views data"
```

---

### Task 6: Build Admin Analytics Dashboard

**Files:**
- Create: `src/app/admin/analytics/page.tsx`
- Create: `src/app/admin/layout.tsx` (if not exists)
- Create: `src/components/admin/AdminAnalytics.tsx`

**Interfaces:**
- Consumes: `get_platform_stats` RPC, `get_monthly_views` RPC, `listing_views` table, `vehicle_listing_events` table
- Produces: admin-only dashboard page at `/admin/analytics`

- [ ] **Step 1: Add admin-only analytics RPC**

Add to `supabase/migrations/20260720_analytics_rpc_functions.sql` (append):

```sql
-- Admin: top listings by views
CREATE OR REPLACE FUNCTION get_top_listings_by_views(p_limit integer DEFAULT 10)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', vl.id,
      'title', vl.title,
      'brand', vl.brand,
      'model', vl.model,
      'view_count', vl.view_count,
      'status', vl.status,
      'created_at', vl.created_at
    ) ORDER BY vl.view_count DESC
  ) INTO result
  FROM vehicle_listings vl
  WHERE vl.view_count > 0
  LIMIT p_limit;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin: views by day (last 30 days)
CREATE OR REPLACE FUNCTION get_views_by_day(p_days integer DEFAULT 30)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'date', to_char(day, 'YYYY-MM-DD'),
      'views', COALESCE(day_views, 0)
    ) ORDER BY day
  ) INTO result
  FROM (
    SELECT
      d.day::date,
      (SELECT count(*)::int FROM listing_views
       WHERE viewed_at::date = d.day::date
      ) AS day_views
    FROM generate_series(now() - (p_days || ' days')::interval, now(), '1 day') AS d(day)
  ) sub;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin: summary stats
CREATE OR REPLACE FUNCTION get_admin_summary()
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_listings', (SELECT count(*)::int FROM vehicle_listings),
    'active_listings', (SELECT count(*)::int FROM vehicle_listings WHERE status = 'active'),
    'total_views', (SELECT COALESCE(sum(view_count), 0)::int FROM vehicle_listings),
    'unique_viewers_30d', (
      SELECT count(DISTINCT ip_hash)::int FROM listing_views
      WHERE viewed_at > now() - interval '30 days'
    ),
    'total_conversations', (SELECT count(*)::int FROM conversations),
    'total_users', (SELECT count(*)::int FROM auth.users),
    'listings_created_7d', (
      SELECT count(*)::int FROM vehicle_listing_events
      WHERE type = 'created' AND created_at > now() - interval '7 days'
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

- [ ] **Step 2: Apply the migration via Supabase MCP**

Use `supabase_apply_migration`. Name: `add_admin_analytics_rpcs`.

- [ ] **Step 3: Create the admin analytics page**

```tsx
// src/app/admin/analytics/page.tsx
import type { Metadata } from 'next'
import AdminAnalytics from '@/components/admin/AdminAnalytics'

export const metadata: Metadata = {
  title: 'Analytics | Admin',
  robots: { index: false, follow: false },
}

export default function AdminAnalyticsPage() {
  return <AdminAnalytics />
}
```

- [ ] **Step 4: Create the AdminAnalytics component**

```tsx
// src/components/admin/AdminAnalytics.tsx
'use client'

import { useEffect, useState } from 'react'
import { BarChart3, Eye, Car, Users, MessageCircle, TrendingUp, Calendar } from 'lucide-react'

interface AdminSummary {
  total_listings: number
  active_listings: number
  total_views: number
  unique_viewers_30d: number
  total_conversations: number
  total_users: number
  listings_created_7d: number
}

interface TopListing {
  id: string
  title: string
  brand: string
  model: string
  view_count: number
  status: string
  created_at: string
}

interface DailyViews {
  date: string
  views: number
}

export default function AdminAnalytics() {
  const [summary, setSummary] = useState<AdminSummary | null>(null)
  const [topListings, setTopListings] = useState<TopListing[]>([])
  const [dailyViews, setDailyViews] = useState<DailyViews[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/analytics/summary').then((r) => r.json()),
      fetch('/api/admin/analytics/top-listings').then((r) => r.json()),
      fetch('/api/admin/analytics/views-by-day').then((r) => r.json()),
    ])
      .then(([s, t, d]) => {
        setSummary(s)
        setTopListings(Array.isArray(t) ? t : [])
        setDailyViews(Array.isArray(d) ? d : [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[#8A95A8] font-bold">Carregando analytics...</div>
      </div>
    )
  }

  const maxDailyViews = Math.max(...dailyViews.map((d) => d.views), 1)

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-black tracking-tight">Analytics Admin</h1>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Car, label: 'Anúncios ativos', value: summary.active_listings, color: '#D4F576' },
            { icon: Eye, label: 'Views totais', value: summary.total_views, color: '#93C5FD' },
            { icon: Users, label: 'Usuários', value: summary.total_users, color: '#C9B8FF' },
            { icon: MessageCircle, label: 'Conversas', value: summary.total_conversations, color: '#39E09B' },
          ].map((card) => (
            <div key={card.label} className="bg-white rounded-2xl border border-[#EAEAE8] p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${card.color}20` }}>
                <card.icon size={20} style={{ color: card.color }} />
              </div>
              <div className="text-3xl font-black">{card.value.toLocaleString('pt-BR')}</div>
              <div className="text-xs font-bold text-[#8A95A8] uppercase tracking-wider">{card.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Daily Views Chart */}
      <div className="bg-white rounded-2xl border border-[#EAEAE8] p-8 space-y-4">
        <div className="flex items-center gap-3">
          <Calendar size={18} className="text-[#8A95A8]" />
          <h2 className="font-black text-lg">Views por dia (últimos 30 dias)</h2>
        </div>
        <div className="flex items-end gap-1 h-40">
          {dailyViews.map((d) => (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-[#D4F576] transition-all"
                style={{ height: `${(d.views / maxDailyViews) * 100}%`, minHeight: d.views > 0 ? 2 : 0 }}
                title={`${d.date}: ${d.views} views`}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-[#A3A3A3] font-bold">
          {dailyViews.length > 0 && (
            <>
              <span>{dailyViews[0]?.date}</span>
              <span>{dailyViews[dailyViews.length - 1]?.date}</span>
            </>
          )}
        </div>
      </div>

      {/* Top Listings */}
      <div className="bg-white rounded-2xl border border-[#EAEAE8] p-8 space-y-4">
        <div className="flex items-center gap-3">
          <TrendingUp size={18} className="text-[#8A95A8]" />
          <h2 className="font-black text-lg">Top anúncios por views</h2>
        </div>
        <div className="space-y-2">
          {topListings.map((listing, i) => (
            <div key={listing.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-[#FAFAF9] transition-colors">
              <span className="text-sm font-black text-[#A3A3A3] w-6 text-center">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm truncate">{listing.title}</div>
                <div className="text-xs text-[#8A95A8]">{listing.brand} {listing.model}</div>
              </div>
              <div className="text-right">
                <div className="font-black text-sm">{listing.view_count.toLocaleString('pt-BR')}</div>
                <div className="text-[10px] text-[#8A95A8]">views</div>
              </div>
            </div>
          ))}
          {topListings.length === 0 && (
            <p className="text-sm text-[#8A95A8] text-center py-8">Nenhum dado de views ainda.</p>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create the admin API routes**

Create `src/app/api/admin/analytics/summary/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = getSupabaseAdminClient()
  if (!supabase) return NextResponse.json({ error: 'Admin não configurado.' }, { status: 503 })

  const { data, error } = await supabase.rpc('get_admin_summary')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}
```

Create `src/app/api/admin/analytics/top-listings/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = getSupabaseAdminClient()
  if (!supabase) return NextResponse.json({ error: 'Admin não configurado.' }, { status: 503 })

  const { data, error } = await supabase.rpc('get_top_listings_by_views', { p_limit: 10 })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data || [])
}
```

Create `src/app/api/admin/analytics/views-by-day/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = getSupabaseAdminClient()
  if (!supabase) return NextResponse.json({ error: 'Admin não configurado.' }, { status: 503 })

  const { data, error } = await supabase.rpc('get_views_by_day', { p_days: 30 })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data || [])
}
```

- [ ] **Step 6: Verify compilation**

Run: `npx tsc --noEmit --pretty`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/app/admin/analytics/page.tsx src/components/admin/AdminAnalytics.tsx src/app/api/admin/analytics/
git commit -m "feat: add admin analytics dashboard with summary, daily views, and top listings"
```

---

### Task 7: Create .env.example

**Files:**
- Create: `.env.example`

- [ ] **Step 1: Create the .env.example file**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# FIPE API
FIPE_API_TOKEN=
NEXT_PUBLIC_FIPE_API_BASE_URL=https://fipe.parallelum.com.br/api/v2

# AutoDev enrichment
AUTODEV_API_KEY=

# Google (used for Vision API - plate blur)
GOOGLE_API_KEY=

# Resend (transactional emails)
RESEND_API_KEY=
RESEND_FROM_EMAIL="Carbi <onboarding@resend.dev>"
ADMIN_NOTIFY_EMAIL=

# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "chore: add .env.example documenting required environment variables"
```

---

### Task 8: Verify End-to-End

- [ ] **Step 1: Run full type check**

Run: `npx tsc --noEmit --pretty`
Expected: zero errors.

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: successful build with no analytics-related errors.

- [ ] **Step 3: Commit any fixups if needed**

```bash
git add -A
git commit -m "chore: analytics implementation fixups"
```
