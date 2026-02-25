# Bilingual System Update

**Date:** 2026-02-25

## Summary

Updated the bilingual display system to show the auxiliary language only for key vocabulary anchors, not for all UI elements. This change supports ADHD/Autistic-friendly pattern recognition while reducing visual noise.

## Rationale

For neurodivergent users:
- **Pattern Recognition**: Key terms in both languages help map concepts
- **Anchor Points**: Terms like "Jardin de pensées" or "Vide-tête" act as mental anchors
- **Reduced Friction**: Seeing vocabulary in both languages reduces "translation lag"
- **Contextual Learning**: Users learn mental health vocabulary in both languages

## Display Pattern

| Element Type | Function Used | Display |
|-------------|---------------|---------|
| Navigation buttons (Back, Continue, Skip) | `t().primary` | Single language |
| Status labels (Completed, Loading, Not started) | `t().primary` | Single language |
| Action buttons (Write today, Archive, Create) | `t().primary` | Single language |
| Helper/placeholder text | `t().primary` | Single language |
| **Feature names** (Vide-tête, Jardin de pensées, Mes Clusters) | `bilingual()` | Both languages |
| **Section headers** (Pensées liées, Nommer avec précision) | `bilingual()` | Both languages |
| **Emotion words** | Inline pattern | Primary + (secondary) |
| **Journaling prompts** | `t().primary` + `t().secondary` | Primary large, secondary italic |

## Files Updated

### Screen Components (src/components/journal/)

1. **HomeScreen.tsx**
   - Sign out button → primary only
   - Tagline → primary only
   - Status labels → primary only
   - Write/action buttons → primary only
   - Feature buttons (Vide-tête, Jardin de pensées, Mes Clusters) → bilingual (kept)
   - Helper text → primary only
   - View progress → primary only

2. **WriteScreen.tsx**
   - Back button → primary only
   - Placeholder → primary only
   - Helper text → primary only
   - Continue button → primary only
   - Prompt display → kept as primary/secondary (unchanged)

3. **FeedbackScreen.tsx**
   - Continue/Skip buttons → primary only
   - Section headers (Nommer avec précision, Une petite note) → bilingual (kept)

4. **EmotionsScreen.tsx**
   - Back button → primary only
   - Instruction text → primary only
   - Continue/Skip buttons → primary only
   - Emotion categories → bilingual (kept)
   - Emotion words → bilingual inline pattern (kept)

5. **ReflectionScreen.tsx**
   - Back button → primary only
   - Loading text → primary only
   - Continue button → primary only
   - Placeholder → primary only
   - Optional helper → primary only
   - Exploration choice buttons → bilingual (kept, content-oriented)

6. **GratitudeScreen.tsx**
   - Back button → primary only
   - Helper text → primary only
   - Placeholder → primary only
   - Complete/Skip buttons → primary only

7. **BrainDumpScreen.tsx**
   - Back button → primary only
   - Thought count → primary only
   - Title (Vide-tête) → bilingual (kept)
   - Instruction text → primary only
   - Add button → primary only

8. **ThoughtGardenScreen.tsx**
   - Back button → primary only
   - Archive button → primary only
   - Title (Jardin de pensées) → bilingual (kept)
   - Stats text → primary only
   - Tag buttons → primary only
   - Search placeholder → primary only
   - Loading/empty states → primary only

9. **ClustersScreen.tsx**
   - Back button → primary only
   - Title (Mes Clusters) → bilingual (kept)
   - Helper text → primary only
   - Create input/button → primary only
   - Loading/empty states → primary only

10. **ClusterDetailScreen.tsx**
    - Back button → primary only
    - Section header (Pensées liées) → bilingual (kept)
    - Loading/empty states → primary only
    - Generate Proposal button → bilingual (kept, feature name)
    - Coming soon → primary only

11. **ProgressScreen.tsx**
    - Helper text → primary only
    - Action buttons → primary only
    - Stats labels → bilingual inline (kept, vocabulary anchors)
    - Affirmation → bilingual (kept, content)

## Language Context API

No changes to `src/contexts/LanguageContext.tsx`. The existing API supports both patterns:

```typescript
// For single-language display (UI chrome)
t('French text', 'English text').primary

// For bilingual display (vocabulary anchors)
bilingual('French text', 'English text')
```

## Testing Notes

- Verify language toggle still works correctly
- Check that key vocabulary terms show both languages
- Confirm navigation/action buttons show single language
- Test both French-primary and English-primary modes
