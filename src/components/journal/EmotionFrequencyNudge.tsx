import { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFrequencyMirror } from '@/hooks/useFrequencyMirror';

interface EmotionFrequencyNudgeProps {
  onOpenVocabulary: () => void;
}

/**
 * Surfaces a soft "you've used this vague emotion a lot this month" mirror
 * card to nudge users toward higher emotional granularity over time.
 *
 * - Pulls counts from useEmotionVocab's existing storage (no new tracking).
 * - Dismissal stores the word + ISO date; word stays suppressed for 14 days.
 * - Renders nothing if no word currently qualifies.
 */
export function EmotionFrequencyNudge({ onOpenVocabulary }: EmotionFrequencyNudgeProps) {
  const { t } = useLanguage();
  const { getOverUsedVagueWord, dismissWord } = useFrequencyMirror();
  const [pick, setPick] = useState(() => getOverUsedVagueWord());

  if (!pick) return null;

  const { word, count } = pick;

  const handleDismiss = () => {
    dismissWord(word);
    setPick(null);
  };

  return (
    <div
      data-testid="freq-mirror-nudge"
      className="rounded-xl border border-primary/15 bg-primary/5 px-4 py-3 animate-fade-in-up"
    >
      <div className="flex items-start gap-2">
        <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-sm text-foreground leading-relaxed">
            {t(
              { fr: `Vous vous êtes décrit·e comme « ${word} » ${count} fois ce mois-ci.`, en: `You've named yourself "${word}" ${count} times this month.`, es: `Te has descrito como "${word}" ${count} veces este mes.`, ja: `今月、自分を「${word}」と${count}回呼んでいます。`, 'zh-Hans': `这个月你已经把自己叫作"${word}"${count}次了。`, 'zh-Hant': `這個月你已經把自己叫作「${word}」${count}次了。` },
            ).primary}
          </p>
          <p className="text-xs text-muted-foreground italic">
            {t(
              { fr: 'Un mot plus précis pourrait aider.', en: 'A more precise word might help.', es: 'Una palabra más precisa podría ayudar.', ja: 'もっと具体的な言葉が助けになるかもしれません。', 'zh-Hans': '更具体的词或许能帮上忙。', 'zh-Hant': '更具體的詞或許能幫上忙。' },
            ).primary}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          data-testid="freq-mirror-dismiss"
          aria-label={t({ fr: 'Ignorer', en: 'Dismiss', es: 'Descartar', ja: '閉じる', 'zh-Hans': '忽略', 'zh-Hant': '忽略' }).primary}
          className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="mt-3 flex justify-end">
        <button
          onClick={onOpenVocabulary}
          data-testid="freq-mirror-alternatives"
          className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
        >
          {t({ fr: 'Voir des alternatives', en: 'See alternatives', es: 'Ver alternativas', ja: '別の言葉を見る', 'zh-Hans': '查看其他选项', 'zh-Hant': '查看其他選項' }).primary} →
        </button>
      </div>
    </div>
  );
}
