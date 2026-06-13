# Circulation of Love — spec v1

> Inspired by the user's grandfather's idea — *the circulation of love*. A way to share quiet, hopeful entries with strangers who speak your language, then let them drift away on a 14-day current.

## What it is

An opt-in, anonymous, time-bound sharing layer on top of the existing journaling app. The user shares a single short entry (≤500 chars) in their primary language. The entry rides a 14-day current — visible to other opted-in users in the same primary language — then archives itself.

## What it is NOT (lock these down so scope doesn't drift)

- Not a social network (no follows, no profiles, no replies, no comments).
- Not a comment thread (single-shot reaction only).
- Not cross-lingual (same primary language; no translation in v1).
- Not public outside the app (only signed-in opted-in users see letters).
- Not viral (no share buttons, no "send to friend").
- Not search-indexed.

## User-visible flow

```
┌─ Discover ──────────────────────────────────────────────────────────┐
│ HomeScreen → tap "Circulation" tile                                  │
│ → land on LettersInCirculationScreen                                 │
│ → drift animation if opted-in;                                       │
│   "Join the current" CTA if not                                      │
└──────────────────────────────────────────────────────────────────────┘

┌─ Opt in ────────────────────────────────────────────────────────────┐
│ One-tap settings:                                                    │
│   • Receive letters (default OFF)                                    │
│   • Share my letters (default OFF)                                   │
│   • TTL: 7 / 14 (default) / 30 days                                  │
└──────────────────────────────────────────────────────────────────────┘

┌─ Share ─────────────────────────────────────────────────────────────┐
│ ShareALetterScreen                                                   │
│ → compose (≤500 chars, primary language)                             │
│ → see auto-pseudonym ("雪落松間" / "Soft Wind" — regenerable once)   │
│ → tap "Release into the current"                                     │
│ → AI moderation runs (Gemini, ~2 sec)                                │
│   • pass → letter enters circulation                                 │
│   • soft-fail → "Could you say it a different way?" + reasoning      │
│ → confirmation: "Your letter joins the current. Returns in 14 days." │
└──────────────────────────────────────────────────────────────────────┘

┌─ Read ──────────────────────────────────────────────────────────────┐
│ LettersInCirculationScreen                                           │
│ → drifting envelopes (animation, see Phase 4)                        │
│ → tap one → opens softly                                             │
│ → shows: content, pseudonym, language, days remaining                │
│ → ONE reaction: "Hold this for a moment" (single tap, idempotent)    │
│ → close, drift continues                                             │
└──────────────────────────────────────────────────────────────────────┘

┌─ Expire ────────────────────────────────────────────────────────────┐
│ At T+14d:                                                            │
│   • Letter disappears from feed                                      │
│   • Soft-archived; only original author can see                      │
│   • Author sees: total holdings received (the only reaction count    │
│     they ever see)                                                   │
└──────────────────────────────────────────────────────────────────────┘
```

## Data model

```sql
love_letters
  id                uuid pk
  author_id         text          -- user_anonymous_id
  content           text          -- ≤500 chars, validated at insert
  language          text          -- 'en' | 'fr' | 'es' | 'ja' | 'zh-Hans' | 'zh-Hant'
  pseudonym         text          -- generated once on insert
  moderated_status  text          -- 'pending' | 'passed' | 'softfailed' | 'blocked'
  moderation_note   text          -- why it softfailed (shown to author only)
  posted_at         timestamptz   -- when moderation passed
  expires_at        timestamptz   -- posted_at + ttl_days
  archived          boolean       -- set true at expires_at by cron
  created_at        timestamptz

letter_holdings
  letter_id         uuid fk
  holder_id         text          -- user_anonymous_id
  held_at           timestamptz
  PRIMARY KEY (letter_id, holder_id)    -- idempotent reactions

circulation_settings
  user_id           text pk       -- user_anonymous_id
  receive_letters   boolean       -- default false
  share_letters     boolean       -- default false
  ttl_days          int           -- 7 | 14 | 30, default 14
  updated_at        timestamptz
```

## RLS — non-negotiable

```
love_letters
  SELECT:
    • Author always sees their own letters (active + archived)
    • Other users see ONLY: status='passed', archived=false,
      language matches their primaryLang in profile, AND they have
      receive_letters=true
  INSERT:
    • Authenticated, author_id = auth.uid()
    • Content length 1..500
    • moderated_status forced to 'pending' on insert
  UPDATE:
    • Author can update only their own row, only soft-archive flag
    • System (service_role) updates moderated_status + posted_at
  DELETE:
    • Author can delete their own letters at any time

letter_holdings
  SELECT:
    • Holder sees their own (for "letters I've held" view, optional)
    • Author of the letter sees aggregate count, NOT holder identity
  INSERT:
    • Authenticated, holder_id = auth.uid()
    • Letter must exist, status='passed', not expired, not own letter
  DELETE:
    • Holder can unhold (rare; mostly for accidental taps)

circulation_settings
  SELECT/INSERT/UPDATE/DELETE:
    • user_id = auth.uid() only
```

## Critical business rules

1. **Author cannot react to their own letter.** Self-holding makes no sense.
2. **Holding is idempotent.** Tapping twice = still 1 hold. PK enforces.
3. **Pseudonym is regenerable ONCE before posting, never after.** Once in the current, it stays.
4. **Language filter is strict.** A `fr` user never sees `en` letters even if they're learning English. Translation = v2.
5. **Reaction count is private to author.** No public popularity-mongering.
6. **TTL is honored even if user changes settings later.** Letter posted with 14d stays 14d.
7. **Archive ≠ delete.** Honors CLAUDE.md *Object Permanence* — author can still see their old letters.

## Moderation — non-negotiable

Pre-publish AI moderation via Gemini 2.5 Flash. Blocks:

- Self-harm content (with grace — show a gentle support resource link, not an error)
- Targeted harassment
- Sexually explicit content
- Personal identifying information (names, addresses, phone numbers)
- Spam / promotion
- Content that names a specific person identifiably (even non-malicious)

Pass-list:
- Sad content (the WHOLE point is to share difficulty)
- Difficult emotions, anger, grief, loneliness
- Religious or political content if non-extremist
- Discussions of mental health symptoms (not in crisis)

The moderation prompt is in `supabase/functions/moderate-letter/index.ts` and is the most carefully reviewed file in this feature.

## Pseudonym generation

Per-language pseudonym pools, lifted from natural imagery — no animals (overdone), no abstract emotions. Sample (full list in `src/lib/pseudonyms.ts`):

- en: *Soft Wind*, *Late Light*, *Wet Grass*, *Drift Snow*, *Quiet Bell*, *Held Stone*
- fr: *Vent Doux*, *Lumière Tardive*, *Herbe Mouillée*, *Cloche Calme*, *Mer Sombre*
- es: *Viento Suave*, *Luz Tardía*, *Hierba Húmeda*, *Campana Quieta*
- ja: *小波* (sazanami), *夕風* (yūkaze), *雨上がり* (ame-agari), *月待ち* (tsuki-machi)
- zh-Hans: *雪落松间*, *林晚风*, *秋千上*, *夜归人*
- zh-Hant: *雪落松間*, *林晚風*, *秋千上*, *夜歸人*

Deterministic per `(author_id, letter_id)` — same draft re-rendered = same pseudonym until user explicitly regenerates.

## Routes / step state

New `JournalStep`s:

- `'circulation-feed'` — LettersInCirculationScreen
- `'circulation-share'` — ShareALetterScreen
- `'circulation-settings'` — opt-in / TTL prefs

Entry: HomeScreen tile + footer link.

## Phasing

| Phase | Surface | Approx tokens | Ship as |
|---|---|---|---|
| 1 (here) | spec + migration + types | ~5k output | PR for review |
| 2 | edge fns: moderate + circulate-cron | ~15k | small PR |
| 3 | hooks (3) + screens (3) | ~30k | small PR |
| 4 | animation + Lovable display prompt | ~15k | small PR + .md |
| 5 | tests + bilingual sweep + changelog | ~15k | wrap PR |

Total: ~80k output tokens, ~$1.50 at Opus 4.7 rates, ~3 hrs wall.

## Open questions for the reviewer (you)

1. Should the share button live on the existing `JournalEntry` (after writing, "would you like to release this?") OR in its own flow only? — *Default: own flow only, to keep the journal pure and the share intentional.*
2. Should the "Hold this for a moment" reaction be silent (no notification to author until they check) or noisy? — *Default: silent. Author sees count when they visit.*
3. Default TTL: 7, 14, or 30 days? — *Default: 14.*
4. Should non-opted-in users see the *teaser* (drift animation) without content? — *Default: yes — drift animation with placeholder letters that say "join to read."*
5. Cross-language: *Should an `fr` user be able to share an `en` letter?* — *Default: no — primary language only.*

If any of those defaults are wrong, say so before Phase 2. Otherwise I'll proceed.
