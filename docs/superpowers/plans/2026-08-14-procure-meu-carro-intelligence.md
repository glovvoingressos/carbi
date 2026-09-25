# Procure Meu Carro — Intelligent Assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Procure Meu Carro understand natural-language intent, rank near matches such as Q3 2013 → Q3 2017 transparently, and present the assistant on Home as a minimal Carbi design-system module.

**Architecture:** Keep the deterministic interpreter plus LLM fallback, but separate candidate retrieval from match scoring. Retrieval will use controlled relaxed passes so model/brand candidates are not discarded by strict year filters. Scoring will classify exact, near, and possible matches, with explicit deviations and reasons. Home will use a focused light surface with one input, one CTA, and restrained examples.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Supabase, Zod, existing Carbi CSS tokens, Lucide icons.

## Global Constraints

- Use the existing Carbi palette: `#D4F576`, `#1A1A1A`, `#F5F5F5`, `#FFFFFF`, `#3A3A3A`, `#6F6F6F`, `#5A47D1`.
- Keep the Home module minimal, light, mobile-first, and aligned with the existing design system.
- Preserve the promise: `O Carbi acompanha os anúncios disponíveis e procura oportunidades compatíveis com o que você procura.`
- Never claim access to vehicles that are not listed on Carbi.
- Brand and model remain higher priority than year and price during ranking.
- A Q3 2013 query must be able to return a Q3 2017 listing as `proximo` when other criteria are compatible.
- Do not add dependencies.
- Do not add comments to production code.

---

### Task 1: Add failing tests for intelligent matching

**Files:**
- Create: `scripts/test-procurar-intelligence.mjs`
- Modify: `src/lib/buyer-agent/candidates.ts`
- Modify: `src/lib/buyer-agent/match.ts`

**Interfaces:**
- Test `evaluateMatch(criteria, listing)` directly with plain objects.
- Test `findCandidates(criteria, opts)` through a small injectable listing source or an exported pure ranking helper.
- The expected public behavior is that a same-brand/model listing four years away is `proximo`, not excluded before scoring.

- [ ] **Step 1: Write the failing test**

Add executable assertions covering:

```js
assert.equal(
  evaluateMatch(
    { ...emptyCriteria, brand: 'Audi', model: 'Q3', year_min: 2013, year_max: 2013 },
    listing({ brand: 'Audi', model: 'Q3', year_model: 2017 })
  ).level,
  'proximo'
)

assert.equal(
  evaluateMatch(
    { ...emptyCriteria, brand: 'Audi', model: 'Q3', year_min: 2013, year_max: 2013 },
    listing({ brand: 'Audi', model: 'Q3', year_model: 2017 })
  ).compatible,
  true
)
```

Also cover that a different model does not outrank a same-model year deviation when price and body criteria are equal.

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
node scripts/test-procurar-intelligence.mjs
```

Expected: FAIL because the current candidate/retrieval path applies strict year filters and/or the current evaluation marks the year deviation incompatible.

- [ ] **Step 3: Implement the smallest scoring change**

Update `src/lib/buyer-agent/match.ts` so year deviations are graded:

- exact requested year/range: matched, no deviation;
- within 2 years: minor deviation;
- within 5 years: relevant deviation but compatible as `proximo`;
- beyond 5 years: incompatible unless no concrete year was requested.

Keep brand/model incompatibility rules unchanged. Ensure the score remains numeric and `explanation` can describe the year deviation.

- [ ] **Step 4: Run the test to verify it passes**

Run:

```bash
node scripts/test-procurar-intelligence.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit the focused behavior**

```bash
git add scripts/test-procurar-intelligence.mjs src/lib/buyer-agent/match.ts
git commit -m "fix: rank near vehicle matches by intent"
```

---

### Task 2: Make candidate retrieval intent-aware

**Files:**
- Modify: `src/lib/buyer-agent/candidates.ts`
- Modify: `src/app/api/procurar/results/route.ts`
- Test: `scripts/test-procurar-intelligence.mjs`

**Interfaces:**
- `findCandidates(criteria, opts)` remains the server entry point.
- Add a pure exported helper with a stable signature:

```ts
export function rankCandidates(
  criteria: CarCriteria,
  listings: ListingPublic[],
  options?: { floor?: MatchLevel; maxResults?: number }
): RankedCandidate[]
```

- `findCandidates` retrieves broad candidates and delegates ranking to `rankCandidates`.

- [ ] **Step 1: Extend the failing test**

Add a fixture containing:

- Audi Q3 2017;
- Audi Q5 2017;
- Honda HR-V 2017;

Then assert Q3 2017 is returned for Q3 2013 and appears before Q5/HR-V.

- [ ] **Step 2: Run the test to verify the new assertion fails**

Run:

```bash
node scripts/test-procurar-intelligence.mjs
```

Expected: FAIL because ranking is coupled to remote retrieval and cannot be tested deterministically.

- [ ] **Step 3: Implement broad retrieval passes**

In `findCandidates`:

1. retrieve exact filters;
2. retrieve same brand/model with year expanded by five years and price expanded by ten percent;
3. retrieve same brand with model removed only if fewer than the target count;
4. retrieve body/fuel/transmission alternatives only as the final fallback.

Do not remove brand/model in the first two passes. Do not use `floor: 'possivel'` to hide compatible near matches. Use `rankCandidates` for evaluation, deduplication, score sorting, and result slicing.

- [ ] **Step 4: Run the test to verify it passes**

Run:

```bash
node scripts/test-procurar-intelligence.mjs
npx tsc --noEmit
```

Expected: PASS with no TypeScript errors.

- [ ] **Step 5: Commit retrieval changes**

```bash
git add scripts/test-procurar-intelligence.mjs src/lib/buyer-agent/candidates.ts src/app/api/procurar/results/route.ts
git commit -m "feat: make buyer search retrieval intent-aware"
```

---

### Task 3: Improve natural-language intent interpretation

**Files:**
- Modify: `src/lib/buyer-agent/interpret.ts`
- Modify: `src/lib/buyer-agent/llm.ts`
- Modify: `src/lib/buyer-agent/types.ts`
- Test: `scripts/test-procurar-intelligence.mjs`

**Interfaces:**
- Keep `interpretQuery(query, vocabulary, options)` unchanged.
- Preserve `CarCriteria` JSON compatibility for existing saved searches.
- Expose only criteria already represented by `CarCriteria`; do not invent unsupported listing attributes.

- [ ] **Step 1: Add failing interpretation assertions**

Assert that these queries produce the intended criteria:

```js
'quero um audi q3 2013' -> brand Audi, model Q3, year_min 2013, year_max 2013
'quero um suv automático até 120 mil para família' -> body_type SUV, transmission automatico, price_max 120000, intent family
'quero algo econômico até 90 mil' -> price_max 90000, notes containing econômico, no invented brand/model
```

- [ ] **Step 2: Run the test and confirm failures**

```bash
node scripts/test-procurar-intelligence.mjs
```

Expected: FAIL for any missing criterion or hallucinated catalog value.

- [ ] **Step 3: Implement interpretation improvements**

Update rules and LLM merge behavior so:

- explicit user values always override LLM guesses;
- vague intent is stored in `intent`/`notes` instead of converted into a brand/model;
- year expressions support exact year, `a partir de`, `até`, and ranges;
- budget expressions normalize Brazilian currency safely;
- the follow-up question is only shown when a missing criterion materially changes ranking.

- [ ] **Step 4: Run tests and typecheck**

```bash
node scripts/test-procurar-intelligence.mjs
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 5: Commit interpretation changes**

```bash
git add scripts/test-procurar-intelligence.mjs src/lib/buyer-agent/interpret.ts src/lib/buyer-agent/llm.ts src/lib/buyer-agent/types.ts
git commit -m "feat: improve natural language car intent parsing"
```

---

### Task 4: Redesign the Home assistant module

**Files:**
- Modify: `src/components/buyer/BuyerAgentBanner.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/app/page.tsx` only if wrapper spacing needs adjustment

**Interfaces:**
- Keep `BuyerAgentBanner` as the Home entry point.
- Continue routing to `/procurar-meu-carro?q=<encoded query>`.
- Keep one primary action and keyboard-accessible form controls.

- [ ] **Step 1: Add the minimal light composition**

Replace the dark hero treatment with a compact light module:

- white surface on the existing `#F5F5F5` page;
- restrained border using the existing card token;
- heading: `Fale. A gente procura.`;
- supporting copy explaining that the user can describe the car naturally;
- one textarea/input with placeholder such as `Ex.: Q3 2013, automático, até R$ 120 mil`;
- chartreuse primary CTA with ink text;
- one quiet line of example prompts, not multiple pill buttons;
- small AI/search icon treatment only where it clarifies the action.

Avoid the current dark full-bleed hero, repeated eyebrow, large decorative glow, and excessive rounded surfaces.

- [ ] **Step 2: Add interaction states**

Implement visible focus, disabled, hover, and mobile stacked states. Submit on Enter only when the input is not empty; preserve Shift+Enter for multiline input if using textarea.

- [ ] **Step 3: Verify visually and semantically**

Run:

```bash
npx eslint src/components/buyer/BuyerAgentBanner.tsx src/app/page.tsx
npx tsc --noEmit
```

Confirm the module uses only design-system colors and the chartreuse accent remains limited to the CTA/focus state.

- [ ] **Step 4: Commit the Home redesign**

```bash
git add src/components/buyer/BuyerAgentBanner.tsx src/app/globals.css src/app/page.tsx
git commit -m "style: simplify Procure Meu Carro home module"
```

---

### Task 5: Verify the complete feature

**Files:**
- Modify: `scripts/test-procurar-intelligence.mjs` only if assertions need final fixture coverage

- [ ] **Step 1: Run focused intelligence tests**

```bash
node scripts/test-procurar-intelligence.mjs
```

Expected: PASS for Q3 2013 → Q3 2017, explicit criteria parsing, vague intent handling, and ranking order.

- [ ] **Step 2: Run typecheck**

```bash
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 3: Run targeted lint**

```bash
npx eslint src/components/buyer src/lib/buyer-agent src/app/api/procurar src/app/page.tsx src/app/globals.css
```

Expected: no errors. Existing unrelated warnings may remain, but new files must not introduce errors.

- [ ] **Step 4: Run production build**

```bash
npm run build
```

Expected: successful Next.js production build.

- [ ] **Step 5: Check final diff**

```bash
git diff --check
 git status --short
```

Expected: no whitespace errors; only intentionally changed feature files remain.

- [ ] **Step 6: Commit verification adjustments**

```bash
git add scripts/test-procurar-intelligence.mjs src/components/buyer src/lib/buyer-agent src/app/api/procurar src/app/globals.css src/app/page.tsx
git commit -m "test: verify Procure Meu Carro intelligence"
```
