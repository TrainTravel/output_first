import { Button } from '@/components/ui/button';
import { ArrowLeft, Sprout, CheckSquare } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuadrants, type QuadrantItem } from '@/hooks/useQuadrants';
import type { Quadrant } from '@/types/journal';
import { cn } from '@/lib/utils';

interface QuadrantsScreenProps {
  onBack: () => void;
}

interface QuadrantMeta {
  id: Quadrant;
  label: ReturnType<typeof bilingualPlaceholder>;
  subtitle: string;
  tone: string;
}

// placeholder for typing only
function bilingualPlaceholder() { return ''; }

export function QuadrantsScreen({ onBack }: QuadrantsScreenProps) {
  const { bilingual, t } = useLanguage();
  const { buckets, loading, isEmpty } = useQuadrants();

  const headerTitle = bilingual({
    fr: 'Matrice de priorités',
    en: 'Priority Quadrants',
    es: 'Matriz de prioridades',
    ja: '優先順位マトリックス',
    'zh-Hans': '优先级矩阵',
    'zh-Hant': '優先級矩陣',
  });

  const back = t({
    fr: 'Retour', en: 'Back', es: 'Atrás',
    ja: '戻る', 'zh-Hans': '返回', 'zh-Hant': '返回',
  }).primary;

  const emptyText = t({
    fr: 'Vide.', en: 'Empty.', es: 'Vacío.',
    ja: '空です。', 'zh-Hans': '空。', 'zh-Hant': '空。',
  }).primary;

  const loadingText = t({
    fr: 'Chargement…', en: 'Loading…', es: 'Cargando…',
    ja: '読み込み中…', 'zh-Hans': '加载中…', 'zh-Hant': '載入中…',
  }).primary;

  const nothingYet = t({
    fr: 'Rien encore. Ajoutez des pensées ou des tâches.',
    en: 'Nothing yet. Add thoughts or tasks.',
    es: 'Nada aún. Añade pensamientos o tareas.',
    ja: 'まだありません。思考やタスクを追加しましょう。',
    'zh-Hans': '还没有内容。添加想法或任务。',
    'zh-Hant': '還沒有內容。新增想法或任務。',
  }).primary;

  const quadrants: Array<{
    id: Quadrant;
    label: ReturnType<typeof bilingual>;
    subtitle: string;
    tone: string;
  }> = [
    {
      id: 'q1',
      label: bilingual({
        fr: 'Urgent et important',
        en: 'Urgent + Important',
        es: 'Urgente e importante',
        ja: '緊急かつ重要',
        'zh-Hans': '紧急且重要',
        'zh-Hant': '緊急且重要',
      }),
      subtitle: t({
        fr: 'À faire maintenant.',
        en: 'Do now.',
        es: 'Hacer ahora.',
        ja: '今すぐやる。',
        'zh-Hans': '现在做。',
        'zh-Hant': '現在做。',
      }).primary,
      tone: 'border-accent/40 bg-accent/10',
    },
    {
      id: 'q2',
      label: bilingual({
        fr: 'Important, non urgent',
        en: 'Important, Not Urgent',
        es: 'Importante, no urgente',
        ja: '重要だが緊急ではない',
        'zh-Hans': '重要但不紧急',
        'zh-Hant': '重要但不緊急',
      }),
      subtitle: t({
        fr: 'À planifier.',
        en: 'Schedule it.',
        es: 'Planificar.',
        ja: '計画する。',
        'zh-Hans': '安排时间。',
        'zh-Hant': '安排時間。',
      }).primary,
      tone: 'border-primary/40 bg-primary/10',
    },
    {
      id: 'q3',
      label: bilingual({
        fr: 'Urgent, non important',
        en: 'Urgent, Not Important',
        es: 'Urgente, no importante',
        ja: '緊急だが重要ではない',
        'zh-Hans': '紧急但不重要',
        'zh-Hant': '緊急但不重要',
      }),
      subtitle: t({
        fr: 'Déléguer si possible.',
        en: 'Delegate if possible.',
        es: 'Delegar si es posible.',
        ja: '可能なら委任。',
        'zh-Hans': '尽可能委派。',
        'zh-Hant': '盡可能委派。',
      }).primary,
      tone: 'border-secondary/50 bg-secondary/20',
    },
    {
      id: 'q4',
      label: bilingual({
        fr: 'Ni urgent ni important',
        en: 'Neither',
        es: 'Ninguno',
        ja: 'どちらでもない',
        'zh-Hans': '都不是',
        'zh-Hant': '都不是',
      }),
      subtitle: t({
        fr: 'À revoir plus tard.',
        en: 'Revisit later.',
        es: 'Revisar más tarde.',
        ja: '後で見直す。',
        'zh-Hans': '稍后再看。',
        'zh-Hant': '稍後再看。',
      }).primary,
      tone: 'border-border bg-muted/30',
    },
  ];

  return (
    <main
      data-testid="quadrants-screen"
      className="min-h-screen flex flex-col items-center px-4 sm:px-6 py-8"
    >
      <div className="w-full max-w-4xl space-y-6 animate-fade-in-up">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-1" />
            {back}
          </Button>
        </div>

        <header className="text-center space-y-2">
          <h1 className="font-serif text-3xl md:text-4xl text-foreground whitespace-normal h-auto">
            {headerTitle}
          </h1>
        </header>

        {loading ? (
          <p
            data-testid="quadrants-loading"
            className="text-center text-muted-foreground animate-gentle-pulse py-12"
          >
            {loadingText}
          </p>
        ) : isEmpty ? (
          <p
            data-testid="quadrants-empty"
            className="text-center text-muted-foreground italic py-12"
          >
            {nothingYet}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quadrants.map(q => (
              <QuadrantCard
                key={q.id}
                id={q.id}
                label={q.label}
                subtitle={q.subtitle}
                tone={q.tone}
                items={buckets[q.id]}
                emptyText={emptyText}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

interface QuadrantCardProps {
  id: Quadrant;
  label: React.ReactNode;
  subtitle: string;
  tone: string;
  items: QuadrantItem[];
  emptyText: string;
}

function QuadrantCard({ id, label, subtitle, tone, items, emptyText }: QuadrantCardProps) {
  return (
    <section
      data-testid={`quadrant-${id}`}
      className={cn(
        'rounded-xl border-2 shadow-sm p-4 min-h-[180px] flex flex-col',
        tone,
      )}
    >
      <header className="mb-3">
        <h2 className="font-serif text-lg text-foreground whitespace-normal h-auto leading-snug">
          {label}
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </header>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground/70 italic mt-2">{emptyText}</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map(item => (
            <li
              key={item.id}
              data-testid={`quadrant-item-${id}`}
              className="flex items-start gap-2 rounded-md bg-card/60 px-2.5 py-1.5 text-sm text-foreground"
            >
              <span className="flex-1 break-words">{item.content}</span>
              <SourceTag source={item.source} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SourceTag({ source }: { source: 'thought' | 'todo' }) {
  const Icon = source === 'thought' ? Sprout : CheckSquare;
  const tint =
    source === 'thought'
      ? 'text-primary bg-primary/10'
      : 'text-accent-foreground bg-accent/20';
  return (
    <span
      className={cn(
        'shrink-0 inline-flex items-center justify-center rounded-full p-1',
        tint,
      )}
      aria-label={source}
      title={source}
    >
      <Icon className="w-3 h-3" />
    </span>
  );
}
