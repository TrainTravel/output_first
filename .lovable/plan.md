
# OutputFirst — Product Plan & Roadmap

## Current State (Feb 2026)

A bilingual (French/English) journaling app with:
- Journaling flow (breathe → write → feedback → emotions → reflection → gratitude → progress)
- Brain Dump (rapid thought capture)
- Thought Garden (AI-themed thought organization)
- Clusters (group thoughts into clusters, generate proposals)
- French conversation practice (Chat)
- Anonymous auth (auto sign-in, zero friction)
- Garden Themes monetization concept (cosmetic upgrades)

**Published at:** https://quiet-words-grow.lovable.app

---

## Phase 1: Reddit Launch & Feedback Collection (NEXT)

### Goal
Post to neurodivergent communities, collect structured feedback to validate demand and guide iteration.

### 1.1 — In-App Feedback Widget
- Add a floating feedback button (bottom-right, subtle but visible)
- Opens a short modal with:
  - "How's your experience?" (1-5 stars or emoji scale)
  - "What would you change?" (open text, optional)
  - "Would you pay for this?" (Yes / No / Maybe)
  - "How much per month?" ($0-3 / $3-5 / $5-10 / $10+) — only shown if Yes/Maybe
  - "Where do you want this?" (Web / iOS / Android / Don't care)
- Store responses in a `feedback` table in the database
- No login required — tied to anonymous session
- Keep it to ONE screen, < 60 seconds to complete

### 1.2 — Feedback Dashboard (Internal)
- Simple `/feedback-results` page (protected or hidden)
- Show aggregated stats: avg rating, payment willingness %, platform preference breakdown
- List individual responses with timestamps

### 1.3 — Reddit Launch Posts
Target subreddits:
- r/ADHD, r/adhdwomen, r/neurodiversity
- r/depression, r/anxiety
- r/journaling, r/getdisciplined
- r/productivity (for neurotypical reach)

**Post framing:**
> "I built a free journaling app designed for ADHD brains — zero friction, no blank pages, gentle AI feedback. Looking for honest feedback from people who actually struggle with journaling."

- Link to published app
- Mention: free, no signup, no data collection beyond anonymous feedback
- Ask for brutal honesty
- Cross-post strategically (not spam — space out over 1-2 weeks)

---

## Phase 2: Iterate Based on Feedback

### 2.1 — Quick Wins (< 1 week each)
Based on feedback themes, prioritize:
- UX friction points (anything users complain about twice = fix immediately)
- Missing features users expect (e.g., dark mode polish, export journal entries)
- Accessibility issues

### 2.2 — Neurotypical Appeal
The app should work for everyone, not just neurodivergent users. Strategy:
- **Keep the ADHD-friendly UX** — it's just good UX. One thing at a time, low friction, clear paths.
- **Tone down clinical language** in public-facing copy — frame as "simple, calm journaling" not "ADHD tool"
- **Add a clean landing page** that appeals broadly: "Journal in 2 minutes. Feel better."
- The bilingual angle is a unique differentiator for language learners too

### 2.3 — Feature Prioritization Framework
Use feedback data to score features:
- **Frequency** — How many people asked for it?
- **Willingness to pay** — Did paying users want this?
- **Effort** — How long to build?
- **Alignment** — Does it fit the core product principles?

---

## Phase 3: Platform Strategy

### 3.1 — PWA First (Before Native iOS)
- Make the existing Vite app installable as a Progressive Web App
- Add manifest.json, service worker, install prompt
- This gets mobile users 80% of the native experience for 5% of the effort
- Track install rates and usage patterns

### 3.2 — Native iOS (Only If Validated)
- Build only if feedback shows 60%+ want iOS AND willingness to pay is strong
- Consider React Native or Expo for code sharing
- This is a significant investment — validate first

---

## Phase 4: Monetization Validation

### Competitive Landscape
| App | Price | Focus |
|-----|-------|-------|
| Daylio | $5-10/mo | Mood tracking |
| Finch | $5/mo | Mental health pet |
| Reflectly | $10/mo | AI journaling |
| Stoic | $5/mo | CBT + journaling |

### OutputFirst Differentiators
- **ADHD-first design** (not bolted on)
- **Bilingual** (French/English — unique in market)
- **Brain Dump → Cluster → Proposal** pipeline (thought-to-action)
- **No predatory mechanics** (no streak shaming, no paywalls on core features)

### Pricing Strategy
- **Free tier**: Full journaling flow, brain dump, thought garden
- **Premium ($5-7/mo)**: Garden themes, advanced AI features, proposal export, custom prompts
- Validate price point through feedback widget data before implementing payments

---

## Phase 5: Growth & Retention

### 5.1 — Retention Mechanics (Non-Punitive)
- Gentle streak display (celebrate, never shame)
- Weekly reflection email (opt-in)
- "Your garden grew" — visual progress over time

### 5.2 — Organic Growth
- SEO landing page
- Reddit community presence (not ads — genuine participation)
- Content marketing: "How journaling helps ADHD" blog posts
- Shareable proposals (from Cluster feature)

---

## Design Principles (Non-Negotiable)

These apply to ALL future features:

1. **One thing at a time** — each screen has one primary action
2. **Low friction** — minimal clicks, clear paths, Enter key submits
3. **No blank pages** — rotating prompts, pre-filled defaults
4. **Skip is always available** — no forced completion
5. **Gentle, not clinical** — support awareness without therapy overreach
6. **Bilingual anchors** — key terms shown in both languages for learning
7. **No predatory monetization** — core features stay free forever
8. **ADHD-friendly = good UX for everyone** — don't compromise on this

---

## Technical Debt & Cleanup

- [ ] Remove `claim_all_thoughts` RPC (temporary migration hack)
- [ ] Clean up legacy localStorage keys handling
- [ ] Add proper error boundaries to all screens
- [ ] Consider adding basic analytics (privacy-respecting)
