
# Chinese Learner MVP — Standalone Adaptation

## Overview
Adapt the existing OutputFirst architecture for **English-speaking learners of Mandarin Chinese**, supporting both **Traditional (繁體)** and **Simplified (简体)** writing systems. Reuse the proven journaling flow, emotion wheel, and inline assist patterns.

## Phase 1: Language Infrastructure

### 1a. Extend `LanguageContext` to support Chinese variants
- Add `'zh-Hans'` (Simplified) and `'zh-Hant'` (Traditional) to the `Language` type
- Update `t()` to accept Chinese strings: `t(fr, en, es, zhHans, zhHant)` — BUT this makes the API unwieldy
- **Better approach**: Create a new `t()` signature that uses an object: `t({ en: '...', zh: '...' })` where `zh` auto-resolves to Hans/Hant based on user preference
- Add a **Chinese variant toggle** (繁/简) in the language settings
- Update `LanguageToggle` to show: EN → 简 → 繁 (cycle)
- Store preference in localStorage

### 1b. Bilingual display for Chinese
- `bilingual()` shows: `中文 / English` or `English / 中文` depending on mode
- Chinese text uses appropriate font stack (system fonts handle CJK well, but add `"Noto Sans SC", "Noto Sans TC"` as web font fallbacks)

## Phase 2: Guided Journal + AI Feedback

### 2a. Chinese writing prompts
- Create 10-15 journaling prompts in both Traditional and Simplified Chinese
- Categories: Emotions (情緒/情绪), Daily Life (日常生活), Relationships (人際關係/人际关系), Growth (成長/成长), Situations (情境)
- Each prompt includes sentence starters calibrated for beginner-intermediate level
- Example: "今天我覺得___因為___" / "今天我觉得___因为___"

### 2b. AI Feedback for Chinese writing
- Create new edge function `chinese-feedback` (or extend `french-feedback` with language branching)
- Feedback focuses on:
  - Character usage corrections (wrong character with same pinyin)
  - Grammar patterns (了/過/过 usage, 把 construction)
  - Vocabulary upgrades (vague → precise)
  - Measure word (量詞/量词) suggestions
- Uses `gemini-2.5-flash` for quality Chinese feedback
- Tone: warm, encouraging, same philosophy as French version

### 2c. AI Chat for Chinese practice
- Extend `french-chat` → `chinese-chat` edge function
- Conversational partner that:
  - Responds primarily in Chinese with pinyin + English for key vocab
  - Helps with emotional expression in Chinese
  - Suggests more nuanced vocabulary
  - CBT-informed exploration adapted for Chinese cultural context

## Phase 3: Emotion Wheel in Chinese

### 3a. Chinese emotion vocabulary (48 words)
- Map the existing 8 emotion categories to Chinese:
  - 快樂/快乐 (Joy), 悲傷/悲伤 (Sadness), 憤怒/愤怒 (Anger), 恐懼/恐惧 (Fear), 驚訝/惊讶 (Surprise), 厭惡/厌恶 (Disgust), 平靜/平静 (Calm), 感激 (Gratitude)
- 6 words per category with nuance descriptions and pinyin
- Include collocations: 心煩意亂, 喜出望外, 怒不可遏, etc.
- Each word has: `zhHans`, `zhHant`, `pinyin`, `en`, `nuance`, `collocations[]`

### 3b. EmotionDetailDrawer for Chinese
- Show: Character → Pinyin → English meaning → Nuance → Collocations
- Tappable collocations insert into journal

## Phase 4: Inline Vocabulary Assist for Chinese

### 4a. Edge function: `chinese-inline-assist`
- Detect English words mixed into Chinese text → suggest Chinese alternatives
- Detect basic/vague Chinese words → suggest more expressive upgrades
- Return pinyin with all suggestions
- Example: "I feel 開心" → suggest: 愉快 (yúkuài, pleasant), 欣喜 (xīnxǐ, delighted)

### 4b. `InlineAssistBar` adaptation
- Show suggestions with: Character + Pinyin + English gloss
- Tappable to insert at cursor position

## Phase 5: Situation Prompts with Pre-loaded Vocab

- 6 scenario prompts with 3-4 vocabulary chips each
- Example: "Describe ordering food at a restaurant"
  - Chips: 點菜/点菜 (diǎncài, order food), 服務員/服务员 (fúwùyuán, waiter), 好吃 (hǎochī, delicious)

## Implementation Strategy

Since this is a **standalone MVP**, the cleanest approach is:
1. Extend the language system to support Chinese variants (reuse existing infra)
2. Create Chinese-specific data files (prompts, emotions, vocab)
3. Create Chinese-specific edge functions (feedback, chat, inline-assist)
4. All existing UI components (WriteScreen, EmotionWheel, InlineAssistBar) are already parameterized — they just need Chinese data

### Files to create/modify:
- `src/contexts/LanguageContext.tsx` — add zh-Hans/zh-Hant support
- `src/components/LanguageToggle.tsx` — add Chinese options
- `src/data/chinese-emotions.ts` (new) — 48 emotion words with pinyin
- `src/data/chinese-prompts.ts` (new) — journaling prompts
- `supabase/functions/chinese-feedback/index.ts` (new) — AI feedback
- `supabase/functions/chinese-chat/index.ts` (new) — conversation partner
- `src/types/journal.ts` — extend types for pinyin, zhHans/zhHant fields
- Various screen components — use `t()` with Chinese strings

### What we DON'T need to rebuild:
- JournalApp orchestration (reuse as-is)
- WriteScreen, FreeWriteScreen, ExpressiveWriteScreen (already parameterized)
- InlineAssistBar component (already generic)
- Auth, themes, layout (all reusable)

## Implementation Order (5 phases)
1. **Language infra** — extend t(), toggle, font stack
2. **Emotion data** — Chinese emotion vocabulary + drawer
3. **Prompts** — Chinese journaling prompts + situation vocab
4. **Edge functions** — chinese-feedback + chinese-chat
5. **Inline assist** — chinese-inline-assist mode

## Verification
- Build check after each phase
- Manual test: toggle to 简体/繁體, verify all UI text switches
- Manual test: write in Chinese, verify AI feedback returns
- Manual test: emotion wheel shows Chinese words with pinyin
- Manual test: inline assist detects English in Chinese text
