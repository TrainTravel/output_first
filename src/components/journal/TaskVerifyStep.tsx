import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useLanguage } from '@/contexts/LanguageContext';

export interface VerifyItem {
  id: string;
  content: string;
  /** AI's pre-filled guess for whether this is a task. */
  isTaskGuess: boolean;
}

interface TaskVerifyStepProps {
  items: VerifyItem[];
  onConfirm: (confirmedTaskIds: string[]) => void;
  onSkip: () => void;
}

/**
 * Standalone "quick check" screen — lets the user correct the AI's
 * task/thought classification before the items get sorted into quadrants.
 *
 * NOT wired into the BrainDump flow yet — this is scaffolding for a
 * follow-up integration.
 */
export function TaskVerifyStep({ items, onConfirm, onSkip }: TaskVerifyStepProps) {
  const { bilingual, t } = useLanguage();
  const [selected, setSelected] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(items.map(i => [i.id, i.isTaskGuess])),
  );

  const title = bilingual({
    fr: 'Vérification rapide',
    en: 'A quick check',
    es: 'Verificación rápida',
    ja: 'クイックチェック',
    'zh-Hans': '快速确认',
    'zh-Hant': '快速確認',
  });

  const subtitle = t({
    fr: 'Nous avons classé chaque entrée — est-ce une tâche ?',
    en: 'We classified each item — is it a task?',
    es: 'Clasificamos cada entrada — ¿es una tarea?',
    ja: '各項目を分類しました — タスクですか？',
    'zh-Hans': '我们分类了每一项 — 这是任务吗？',
    'zh-Hant': '我們分類了每一項 — 這是任務嗎？',
  }).primary;

  const help = t({
    fr: 'Touchez pour corriger.',
    en: 'Tap to correct.',
    es: 'Toca para corregir.',
    ja: 'タップして修正してください。',
    'zh-Hans': '点击纠正。',
    'zh-Hant': '點擊糾正。',
  }).primary;

  const confirmLabel = t({
    fr: 'Confirmer et trier',
    en: 'Confirm and sort',
    es: 'Confirmar y ordenar',
    ja: '確認して分類',
    'zh-Hans': '确认并分类',
    'zh-Hant': '確認並分類',
  }).primary;

  const skipLabel = t({
    fr: 'Passer', en: 'Skip', es: 'Omitir',
    ja: 'スキップ', 'zh-Hans': '跳过', 'zh-Hant': '跳過',
  }).primary;

  const toggle = (id: string) =>
    setSelected(prev => ({ ...prev, [id]: !prev[id] }));

  const handleConfirm = () => {
    const ids = Object.entries(selected).filter(([, v]) => v).map(([k]) => k);
    onConfirm(ids);
  };

  return (
    <main
      data-testid="task-verify-step"
      className="min-h-screen flex flex-col items-center px-4 sm:px-6 py-10"
    >
      <div className="w-full max-w-md space-y-6 animate-fade-in-up">
        <header className="text-center space-y-2">
          <h1 className="font-serif text-3xl text-foreground whitespace-normal h-auto">
            {title}
          </h1>
          <p className="text-sm text-foreground/80">{subtitle}</p>
          <p className="text-xs text-muted-foreground">{help}</p>
        </header>

        <ul className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden shadow-sm">
          {items.map(item => (
            <li
              key={item.id}
              data-testid={`task-verify-item-${item.id}`}
              className="flex items-start gap-3 px-4 py-3 hover:bg-muted/40 transition-colors cursor-pointer"
              onClick={() => toggle(item.id)}
            >
              <Checkbox
                data-testid={`task-verify-checkbox-${item.id}`}
                checked={!!selected[item.id]}
                onCheckedChange={() => toggle(item.id)}
                onClick={e => e.stopPropagation()}
                className="mt-0.5"
              />
              <span className="flex-1 text-sm text-foreground break-words">
                {item.content}
              </span>
            </li>
          ))}
        </ul>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button
            data-testid="task-verify-confirm"
            variant="default"
            size="lg"
            onClick={handleConfirm}
          >
            {confirmLabel}
          </Button>
          <Button
            data-testid="task-verify-skip"
            variant="skip"
            size="lg"
            onClick={onSkip}
          >
            {skipLabel}
          </Button>
        </div>
      </div>
    </main>
  );
}
