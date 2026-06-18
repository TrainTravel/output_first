# Lovable prompt — Circulation of Love visual pass

Paste into Lovable's chat. Visual/atmospheric pass only; no logic touched. This is the "make it feel like a current" deliverable for the Circulation of Love feature shipped in `feat/love-circulation`.

---

# Make the Circulation of Love feel like an actual current

You are working as the lead UI/UX designer on `quiet-words-grow` (OutputFirst), a multilingual ADHD-friendly journaling app. A new feature, **Circulation of Love** (`feat/love-circulation` branch), lets users release short anonymous letters in their primary language. Letters drift for 7-30 days, then quietly archive. The data layer, edge functions, and three screens are all shipped and functional.

Your job is to elevate the visual layer so the feed feels less like *"a list of cards"* and more like *"a current of paper letters drifting past me on a slow river"* — while preserving every existing interaction (release, hold, settings toggle, navigation).

## What's already shipped (READ, do NOT rewrite)

```
src/components/journal/LettersInCirculationScreen.tsx   feed (main file you edit)
src/components/journal/ShareALetterScreen.tsx           compose flow
src/components/journal/CirculationSettingsScreen.tsx    opt-in prefs
src/hooks/useLoveLetters.ts                              data — DO NOT TOUCH
src/hooks/useCirculationSettings.ts                      settings — DO NOT TOUCH
src/hooks/usePseudonym.ts                                pseudonyms — DO NOT TOUCH
src/lib/pseudonyms.ts                                    per-lang name pools — DO NOT TOUCH
src/index.css                                            warm palette + animate-letter-drift keyframe
docs/specs/love-circulation.md                           full design spec — read for context
```

The feed already uses `animate-letter-drift` (a 12-second sine-like loop) with staggered `animationDelay` per card. That's the *floor* you're building from, not the ceiling.

## Design intent — non-negotiable

These come from `CLAUDE.md` and the spec. Do not override:

```
1. Letters are anonymous and live for 7-30 days. They are NOT social
   posts. No likes, no comments, no shares, no follower count.
   The ONLY reaction is "Hold this for a moment" (private to author).

2. Same-language only. A French user never sees an English letter.
   Don't add language badges that imply otherwise.

3. Object permanence: a letter the user wrote is theirs forever,
   even after archive. Don't visually "delete" anything mid-session.

4. Adaptive arousal: when many letters are present, MORE negative space,
   not less. The current should feel calm even when it's full.

5. No dark patterns. No "unread" badges, no urgency, no loss aversion.
```

## What the feature already looks like (current state)

Cards are `rounded-3xl` with a soft sage border, drift on a 12s loop, stagger by `(index % 6) * 0.4s`. The "Join the current" CTA is a flat sage-tinted card. The tile on HomeScreen is a single Waves icon + bilingual title row — same shape as every other tile.

That's all functional. It's also flat. The user's gut reaction when they land on the feed should be *"oh — these are floating"*, not *"oh — a grid."*

## Concrete design moves to try

You don't have to do all of them — pick whichever combination genuinely makes the screen feel less like a grid and more like a current. If you find a better path, take it.

### A. Paper-letter aesthetic, not card aesthetic

Cards currently read as "UI cards." Try one of:

- A very subtle paper texture via a near-imperceptible `bg-gradient-to-br from-card to-primary/[0.02]` plus a soft inner shadow (`shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]`).
- Asymmetric corners — `rounded-tl-[28px] rounded-tr-[18px] rounded-bl-[20px] rounded-br-[26px]` — like a hand-folded letter rather than a print-out.
- A whisper of rotation per card based on `index` (e.g. `index % 2 ? '-rotate-[0.5deg]' : 'rotate-[0.5deg]'`).

Don't combine all three — pick the one that lands best.

### B. The drift loop should feel like ONE current, not 12 separate ticks

Right now each card has its own offset delay so they look like leaves in a still pond. Try giving each card a slightly different **animation-duration** (10s, 12s, 14s) in addition to delay — so they drift past each other at slightly different rates. That's what a real current does.

```tsx
style={{
  animationDelay: `${(i % 6) * 0.4}s`,
  animationDuration: `${10 + (i % 3) * 2}s`,  // 10s, 12s, or 14s
}}
```

### C. The "Join the current" CTA should feel inviting, not corporate

Current state: flat sage card with a Heart icon, a heading, a paragraph, and a button. It reads "modal." Soften it:

- The Heart could be replaced (or paired) with **two or three small ghost-letter shapes drifting behind the CTA text** — using the same `animate-letter-drift` keyframe but with `opacity: 0.18` so they're hinted, not loud. (Pure CSS, no new components — wrap a few empty divs styled to look like blank paper.)
- Replace the rounded button with a softer pill (`rounded-full`) styled to feel like a tide pulling the user in, not a CTA pressing them.

### D. Negative space rebalance

Increase the gap between cards from `gap-4` to `gap-6` on mobile, `gap-8` on `sm+`. Don't compress to fit more on screen — the current metaphor REQUIRES breathing room. Mobile users will scroll; that's the point.

### E. Subtle horizontal motion hint

Right now letters only drift vertically. Add a very gentle horizontal sway to the keyframe by adjusting `translate3d` x-values — already partially in the keyframe, but you may push them another 1-2px so the side-to-side feel is more visible. Test on a slow device first; if it competes with reading, dial it back.

### F. Opened-letter modal should feel like paper unfolded

Tap a card → modal opens. Right now it's a generic centered dialog. Try:

- A slight scale-from-center on open (existing `animate-fade-in-up` already does part of this).
- The pseudonym in italics, with a hair-thin separator above it (`border-t border-primary/10 pt-3`) to feel like a signature line at the bottom of a letter.
- A barely-perceptible shadow that hints at paper resting on a surface (`shadow-[0_4px_24px_rgba(60,40,20,0.06)]`).

### G. The HomeScreen tile should hint at the current

The HomeScreen tile is a plain row with a Waves icon. Optional: layer 2 tiny ghost-letter shapes inside the tile background (positioned absolutely, very faint, no animation needed at this scale — the page is busy enough). Hint at what's inside without crowding the row.

## Hard constraints (do not violate)

- **Do not add any npm dependencies.** No framer-motion, no react-spring, no fancy SVG libraries. Pure Tailwind + existing lucide-react icons + the `animate-letter-drift` keyframe already in `src/index.css`.
- **Do not modify** `useLoveLetters`, `useCirculationSettings`, `usePseudonym`. Hook contracts are frozen.
- **Do not break the data flow** — `share()`, `hold()`, `update()` must still be reachable from the same components.
- **Preserve every existing testid**:
  - `circulation-feed-screen`, `circulation-feed-settings`
  - `circulation-join-cta`, `circulation-optin-button`
  - `circulation-open-share`, `circulation-letters`, `circulation-letter-card`
  - `circulation-empty`, `circulation-letter-open`, `circulation-letter-held-mark`
  - `circulation-hold-button`
  - On ShareALetter: `circulation-share-screen`, `circulation-share-textarea`, `circulation-regenerate-pseudonym`, `circulation-release-button`, `circulation-softfail-note`, `circulation-block-note`
  - On Settings: `circulation-settings-screen`, `circulation-receive-toggle`, `circulation-share-toggle`, `circulation-ttl-7`, `circulation-ttl-14`, `circulation-ttl-30`
  - On HomeScreen: `home-circulation-tile`
- **Preserve every bilingual string** in 6 languages (en/fr/es/ja/zh-Hans/zh-Hant). New strings need full coverage too.
- **Respect `prefers-reduced-motion: reduce`** — the existing media query at the bottom of `src/index.css` already disables `animate-letter-drift`; don't add new animations that bypass it.
- **No dark mode regressions** — the warm palette has both light and dark in `src/index.css`. Test both.
- **Mobile-first** — the feed lives mostly on phones. Don't introduce horizontal layouts that break under 380px.
- **Do not add tests.** Claude Code handles tests after integration.
- **Do not create new files** unless absolutely necessary. Edit the 3 existing screens + `src/index.css`.

## Style anchors (use existing tokens — don't hardcode)

```
Colors via Tailwind tokens:
  bg-primary    sage green       — calm, ground
  bg-accent     terracotta       — warmth, action (used for "held" reaction)
  bg-secondary  ochre            — gold, gathering
  bg-muted      warm neutral     — paper
  text-ink                       — deep blue-black (letter body)

Fonts:
  font-serif    Cormorant Garamond — letter body, pseudonym
  font-sans     DM Sans            — chrome, buttons, days-remaining

Animations (already in src/index.css):
  animate-fade-in-up
  animate-letter-drift       ← the drift loop
  animate-gentle-pulse
```

## Deliverables checklist

- [ ] `src/components/journal/LettersInCirculationScreen.tsx` — the feed + modal pass
- [ ] `src/components/journal/ShareALetterScreen.tsx` — paper-letter aesthetic on the compose surface
- [ ] `src/components/journal/CirculationSettingsScreen.tsx` — soften the toggles to match
- [ ] `src/components/journal/HomeScreen.tsx` — tile ghost-letter hint (optional)
- [ ] Optional: very small CSS additions to `src/index.css` if you need a new keyframe (e.g. a slower second drift variant). Keep them tiny.
- [ ] A brief one-paragraph summary in your final message: what you tried, what you kept, what you cut, why.

After your pass lands, Claude Code will:
- Run the existing test suite
- Add visual-regression coverage on the feed
- Sanity-check the bilingual chrome (6 languages)
- Open the PR for review

## What success looks like

Open the feed with 4-6 letters in it. The user's gut reaction should be: *"these are floating past me"* — not *"a grid of cards I need to scroll through."* Quiet, organic, alive. The current is the metaphor, not the decoration.

If the screenshot of your version would look at home in a Things3 / Stoic / Endel design review *and* honor the ADHD-friendly + ethical-monetization principles, you've succeeded.
