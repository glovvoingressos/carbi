# Chat de Suporte Público Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a public, anonymous-capable support chat with a floating Carbi widget, admin inbox, email notifications, and secure visitor conversation isolation.

**Architecture:** Keep direct Supabase access out of the browser for support data. Next.js route handlers use the service-role client only after validating an HttpOnly visitor cookie or an authenticated admin bearer token. A four-second polling loop gives the visitor and admin live updates without requiring Supabase Realtime configuration.

**Tech Stack:** Next.js App Router, React, TypeScript, Supabase Postgres/Auth, Resend, Vitest, existing Carbi CSS tokens and support components.

**Spec:** `docs/superpowers/specs/2026-09-15-support-chat-design.md`

## Global Constraints

- The visitor email remains optional; the visitor must be able to send without logging in.
- Store only a SHA-256 hash of the visitor token; never store the raw token in Supabase.
- Keep `SUPABASE_SERVICE_ROLE_KEY` and `RESEND_API_KEY` server-only.
- Enable RLS on support tables and do not grant direct `anon` or `authenticated` table access.
- The widget copy must include “Precisa de ajuda?” and use the existing Carbi visual language.
- Preserve unrelated working-tree files and stage only files belonging to the current task.
- Validate inputs with explicit limits: name 120 characters, email 254 characters, message 2,000 characters.

---

### Task 1: Test and validation foundation

**Files:**
- Create: `src/lib/support-validation.ts`
- Test: `src/lib/support-validation.test.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Produces `validateSupportMessage(input): { ok: true; value: ValidSupportMessage } | { ok: false; error: string }`.
- Produces `isValidSupportEmail(email): boolean`.
- Produces `normalizeSupportText(value): string`.

- [ ] **Step 1: Write failing tests** for whitespace trimming, empty messages, 2,000-character maximum, 120-character name maximum, optional email, invalid email, and honeypot rejection.
- [ ] **Step 2: Run `npx vitest run src/lib/support-validation.test.ts`** and confirm failure because the validation module is not implemented.
- [ ] **Step 3: Implement the validation functions** with no database or HTTP dependencies.
- [ ] **Step 4: Run the focused test again** and confirm all validation cases pass.
- [ ] **Step 5: Add the existing Vitest version as a pinned dev dependency** only if the checkout still cannot resolve Vitest locally; update the lockfile with `npm install --save-dev vitest@<resolved-version>`.
- [ ] **Step 6: Commit** with `git add src/lib/support-validation.ts src/lib/support-validation.test.ts package.json package-lock.json && git commit -m "test(support): add message validation foundation"`.

### Task 2: Supabase schema and secure token service

**Files:**
- Create: `supabase/migrations/20260915_support_chat.sql`
- Create: `src/lib/support-security.ts`
- Test: `src/lib/support-security.test.ts`

**Interfaces:**
- Produces `createVisitorToken(): string`.
- Produces `hashVisitorToken(token): Promise<string>` using SHA-256.
- Produces `getOrCreateVisitorToken(request): { token: string; setCookie: boolean }`.
- Migration produces `support_conversations` and `support_messages`, indexes, updated-at trigger, and RLS policies with no public table grants.

- [ ] **Step 1: Write failing tests** asserting token length/entropy expectations, deterministic hashing, and rejection of empty tokens.
- [ ] **Step 2: Run `npx vitest run src/lib/support-security.test.ts`** and confirm failure because the security module is not implemented.
- [ ] **Step 3: Create the migration** with the exact columns and status/sender constraints from the approved spec, `ON DELETE CASCADE`, indexes on `last_message_at` and `conversation_id`, RLS enabled, and no `anon`/`authenticated` policies.
- [ ] **Step 4: Implement token generation and hashing** with Web Crypto/Node crypto available to route handlers; use a 32-byte random token and SHA-256 hex digest.
- [ ] **Step 5: Run the focused tests** and verify deterministic hashes and unique tokens.
- [ ] **Step 6: Validate the SQL** with the linked Supabase project using the repository’s migration workflow, then run Supabase security advisors if available.
- [ ] **Step 7: Commit** with `git add supabase/migrations/20260915_support_chat.sql src/lib/support-security.ts src/lib/support-security.test.ts && git commit -m "feat(support): add private conversation storage"`.

### Task 3: Support service and public conversation APIs

**Files:**
- Create: `src/lib/support-service.ts`
- Create: `src/app/api/support/conversations/route.ts`
- Create: `src/app/api/support/conversations/messages/route.ts`
- Create: `src/lib/support-service.test.ts`
- Test: `src/app/api/support/conversations/route.test.ts`
- Test: `src/app/api/support/conversations/messages/route.test.ts`

**Interfaces:**
- `createConversationMessage(input, visitorToken): Promise<SupportConversation>` creates/reuses a conversation and inserts the first visitor message.
- `listVisitorConversation(visitorToken): Promise<SupportConversationWithMessages | null>` returns only the hashed-token match.
- `appendVisitorMessage(conversationId, visitorToken, input): Promise<SupportMessage>` checks ownership before insertion.
- `getVisitorCookieOptions()` returns the 30-day HttpOnly/Secure/SameSite=Lax cookie options.

- [ ] **Step 1: Write failing service tests** for create/reuse, token ownership, status updates, and rejection of another visitor token.
- [ ] **Step 2: Write failing route tests** for anonymous creation, GET without cookie, message validation, honeypot rejection, and cookie issuance.
- [ ] **Step 3: Run the focused tests** and confirm they fail before service/routes exist.
- [ ] **Step 4: Implement the service** using `getSupabaseAdminClient()` server-side, translating database failures into safe application errors without leaking SQL details.
- [ ] **Step 5: Implement the public routes** with JSON responses, secure cookie handling, validation, and a bounded rate-limit mechanism keyed by IP plus visitor token.
- [ ] **Step 6: Run the focused tests** and confirm all public-path cases pass.
- [ ] **Step 7: Commit** with `git add src/lib/support-service.ts src/app/api/support/conversations src/lib/support-service.test.ts src/app/api/support/conversations/route.test.ts src/app/api/support/conversations/messages/route.test.ts && git commit -m "feat(support): add anonymous conversation API"`.

### Task 4: Admin authorization and admin support APIs

**Files:**
- Create: `src/lib/support-admin.ts`
- Create: `src/app/api/admin/support/conversations/route.ts`
- Create: `src/app/api/admin/support/conversations/[id]/route.ts`
- Create: `src/app/api/admin/support/conversations/[id]/messages/route.ts`
- Test: `src/lib/support-admin.test.ts`
- Test: `src/app/api/admin/support/conversations/route.test.ts`

**Interfaces:**
- `getSupportAdminEmails(): Set<string>` reads comma-separated `SUPPORT_ADMIN_EMAILS`, falling back to `ADMIN_NOTIFY_EMAIL` when appropriate.
- `requireSupportAdmin(request): Promise<{ userId: string; email: string }>` validates the bearer session through Supabase Auth and checks the allowlist.
- Admin routes return conversation lists, one conversation, replies, and `open`/`closed` status transitions.

- [ ] **Step 1: Write failing tests** for allowed admin, non-admin authenticated user, missing bearer token, malformed conversation ID, and ownership-independent admin access.
- [ ] **Step 2: Run focused tests** and confirm failure before the admin guard/routes exist.
- [ ] **Step 3: Implement `requireSupportAdmin`** using `getAuthContext`, `getUser`, normalized email comparison, and the server-only allowlist.
- [ ] **Step 4: Implement list/detail/reply/status routes** with pagination, stable newest-activity ordering, and safe message validation.
- [ ] **Step 5: Run focused tests** and confirm unauthorized callers cannot read or mutate conversations.
- [ ] **Step 6: Commit** with `git add src/lib/support-admin.ts src/app/api/admin/support src/lib/support-admin.test.ts src/app/api/admin/support/conversations/route.test.ts && git commit -m "feat(support): add protected admin inbox API"`.

### Task 5: Resend notification service

**Files:**
- Modify: `src/lib/email.ts`
- Create: `src/lib/support-email.ts`
- Test: `src/lib/support-email.test.ts`

**Interfaces:**
- `sendSupportAdminNotification(params): Promise<{ success: boolean; warning?: string }>` sends a sanitized notification with admin link and optional Reply-To.
- `escapeHtml` remains server-side and is reused or extracted without changing existing email behavior.

- [ ] **Step 1: Write failing tests** for escaped message/name, optional Reply-To, exact subject, missing Resend configuration, and Resend failure behavior.
- [ ] **Step 2: Run focused tests** and confirm failure before the support email module exists.
- [ ] **Step 3: Implement the notification** using existing `RESEND_FROM_EMAIL`, `ADMIN_NOTIFY_EMAIL`, `RESEND_API_KEY`, and `NEXT_PUBLIC_SITE_URL` conventions; never include raw unescaped user input in HTML.
- [ ] **Step 4: Call the notifier after the first visitor message is persisted** and log notification failure without deleting the conversation.
- [ ] **Step 5: Run focused tests** and confirm notification behavior.
- [ ] **Step 6: Commit** with `git add src/lib/email.ts src/lib/support-email.ts src/lib/support-email.test.ts && git commit -m "feat(support): notify admin of visitor messages"`.

### Task 6: Public widget and live visitor conversation UI

**Files:**
- Modify: `src/components/support/SupportWidget.tsx`
- Modify: `src/app/globals.css`
- Create: `src/components/support/SupportConversation.tsx`
- Test: `src/components/support/SupportConversation.test.tsx`

**Interfaces:**
- `SupportConversation` renders the public form, message history, status states, and polling lifecycle.
- `SupportWidget` owns open/closed state and renders the exact floating trigger copy “Precisa de ajuda?”.

- [ ] **Step 1: Write failing component tests** for anonymous form visibility, optional email, send success, validation error, response rendering, polling cleanup, keyboard submission, and reduced-motion-safe behavior.
- [ ] **Step 2: Run focused tests** and confirm failure before the public component exists.
- [ ] **Step 3: Implement the component** with existing `cb-support-*` classes where possible, preserving dark header, chartreuse accent, rounded card, focus styles, and mobile placement.
- [ ] **Step 4: Replace the authenticated-only lock state** with the anonymous support form while keeping authenticated users in the same conversation experience.
- [ ] **Step 5: Add four-second polling** that starts only while open, stops on unmount/close, and avoids duplicate requests.
- [ ] **Step 6: Add accessible labels, live regions, focus management, disabled states, and a visible error state.**
- [ ] **Step 7: Run focused component tests** and visually inspect desktop/mobile layouts in the running app.
- [ ] **Step 8: Commit** with `git add src/components/support/SupportWidget.tsx src/components/support/SupportConversation.tsx src/components/support/SupportConversation.test.tsx src/app/globals.css && git commit -m "feat(support): open chat to visitors"`.

### Task 7: Admin support inbox UI

**Files:**
- Create: `src/app/admin/suporte/page.tsx`
- Create: `src/components/admin/AdminSupportInbox.tsx`
- Create: `src/components/admin/AdminSupportInbox.test.tsx`
- Modify: `src/app/admin/analytics/page.tsx` only if the existing admin navigation needs a support entry.

**Interfaces:**
- `AdminSupportInbox` loads admin APIs with the current Supabase session bearer token, displays filters/list/detail, sends replies, and toggles status.
- The page server-checks the admin allowlist and renders an unauthorized state or redirects to `/entrar`.

- [ ] **Step 1: Write failing component tests** for conversation sorting, filters, empty state, reply submission, close/reopen, polling, and unauthorized response handling.
- [ ] **Step 2: Run focused tests** and confirm failure before the inbox exists.
- [ ] **Step 3: Implement the admin page and inbox** using the same Carbi cards, borders, typography, chartreuse action, dark sections, and responsive behavior as `AdminAnalytics`.
- [ ] **Step 4: Add four-second polling** for the selected conversation and list while the admin page is active.
- [ ] **Step 5: Run component tests** and visually inspect the inbox at desktop and mobile widths.
- [ ] **Step 6: Commit** with `git add src/app/admin/suporte src/components/admin/AdminSupportInbox.tsx src/components/admin/AdminSupportInbox.test.tsx src/app/admin/analytics/page.tsx && git commit -m "feat(support): add admin conversation inbox"`.

### Task 8: Environment, migration, integration verification, and release

**Files:**
- Modify: `.env.example` if present; otherwise create `.env.example`
- Modify: `README.md` only if it contains deployment environment documentation
- Create: `src/app/api/support/conversations/integration.test.ts` if the project test setup supports route integration tests

- [ ] **Step 1: Add `SUPPORT_ADMIN_EMAILS` documentation** and state that `ADMIN_NOTIFY_EMAIL`, `RESEND_API_KEY`, and `RESEND_FROM_EMAIL` must be configured in production.
- [ ] **Step 2: Apply the Supabase migration** to the linked project and verify tables, indexes, RLS, and policies with read-only queries.
- [ ] **Step 3: Run all available Vitest tests** with `npx vitest run`.
- [ ] **Step 4: Run TypeScript and lint** with `npx tsc --noEmit` and the repository’s ESLint command; distinguish pre-existing failures from feature failures.
- [ ] **Step 5: Run the production build** with the same command used by Vercel and resolve all feature-related errors.
- [ ] **Step 6: Manually verify the full flow**: anonymous visitor sends, admin email arrives, admin replies, visitor receives reply, conversation closes/reopens, and a second visitor cannot read the first conversation.
- [ ] **Step 7: Review staged files and commit only feature changes** with `git diff --cached --check` and an explicit file list.
- [ ] **Step 8: Push `main` and verify the Vercel deployment** before reporting completion.
