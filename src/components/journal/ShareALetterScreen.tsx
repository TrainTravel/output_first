import { useId, useState } from 'react';
import { ArrowLeft, RefreshCw, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLoveLetters, type ModerationVerdict } from '@/hooks/useLoveLetters';
import { useCirculationSettings } from '@/hooks/useCirculationSettings';
import { usePseudonym } from '@/hooks/usePseudonym';
import type { PseudonymLang } from '@/lib/pseudonyms';

interface ShareALetterScreenProps {
  onBack: () => void;
  onReleased: () => void;
}

const MAX = 500;

export function ShareALetterScreen({ onBack, onReleased }: ShareALetterScreenProps) {
  const { t, bilingual, primaryLang } = useLanguage();
  const { share } = useLoveLetters();
  const { settings } = useCirculationSettings();
  const draftId = useId();
  const { pseudonym, regenerate, canRegenerate } = usePseudonym(primaryLang as PseudonymLang, draftId);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [verdict, setVerdict] = useState<ModerationVerdict | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const remaining = MAX - content.length;
  const tooLong = content.length > MAX;
  const trimmedEmpty = content.trim().length === 0;
  const disabled = submitting || trimmedEmpty || tooLong;

  async function handleRelease() {
    if (disabled) return;
    setSubmitting(true);
    setVerdict(null);
    setNote(null);
    const result = await share({
      content: content.trim(),
      pseudonym,
      ttl_days: settings.ttl_days,
    });
    setSubmitting(false);
    if (!result.ok) {
      setVerdict('softfail');
      setNote(t({ fr: 'On n\'a pas pu envoyer. Réessayez.', en: "We couldn't send. Try again.", es: 'No pudimos enviar. Inténtalo de nuevo.', ja: '送信できませんでした。もう一度お試しください。', 'zh-Hans': '没能寄出。请再试一次。', 'zh-Hant': '沒能寄出。請再試一次。' }).primary);
      return;
    }
    setVerdict(result.verdict);
    setNote(result.note);
    if (result.verdict === 'pass') {
      onReleased();
    }
  }

  return (
    <div data-testid="circulation-share-screen" className="min-h-screen flex flex-col px-6 py-12">
      <div className="w-full max-w-lg mx-auto flex-1 flex flex-col animate-fade-in-up">
        <button
          onClick={onBack}
          className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-8 self-start"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span className="text-sm">{t({ fr: 'Retour', en: 'Back', es: 'Volver', ja: '戻る', 'zh-Hans': '返回', 'zh-Hant': '返回' }).primary}</span>
        </button>

        <div className="mb-6 space-y-3">
          <h1 className="font-serif text-3xl md:text-4xl text-foreground leading-tight">
            {bilingual({ fr: 'Relâcher une lettre', en: 'Release a letter', es: 'Soltar una carta', ja: '手紙を放つ', 'zh-Hans': '放出一封信', 'zh-Hant': '放出一封信' })}
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            {t({
              fr: "Une lettre courte, anonyme, dans votre langue. Elle dérive pendant {n} jours, puis se range.",
              en: 'A short, anonymous letter in your language. It drifts for {n} days, then quietly archives.',
              es: 'Una carta corta y anónima en tu idioma. Deriva {n} días y luego se archiva en silencio.',
              ja: 'あなたの言語で書く短い匿名の手紙。{n}日漂って、静かに片付きます。',
              'zh-Hans': '一封简短的匿名信，用你的语言。漂流 {n} 天，然后静静归档。',
              'zh-Hant': '一封簡短的匿名信，用你的語言。漂流 {n} 天，然後靜靜歸檔。',
            }).primary.replace('{n}', String(settings.ttl_days))}
          </p>
        </div>

        <div className="mb-3 flex items-center justify-between">
          <span className="inline-flex items-center gap-2 rounded-tl-[12px] rounded-tr-[8px] rounded-bl-[10px] rounded-br-[14px] bg-gradient-to-br from-card to-primary/[0.025] border border-primary/10 px-3 py-1.5 text-xs text-foreground shadow-[0_2px_8px_-4px_rgba(60,40,20,0.06)]">
            <span className="font-serif italic">{pseudonym}</span>
          </span>
          <button
            type="button"
            data-testid="circulation-regenerate-pseudonym"
            onClick={regenerate}
            disabled={!canRegenerate}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            {t({ fr: 'Changer une fois', en: 'Change once', es: 'Cambiar una vez', ja: '一度だけ変える', 'zh-Hans': '只能换一次', 'zh-Hant': '只能換一次' }).primary}
          </button>
        </div>

        <Textarea
          data-testid="circulation-share-textarea"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t({
            fr: "Écrivez doucement. Ce qui vous traverse aujourd'hui.",
            en: 'Write softly. Something passing through you today.',
            es: 'Escribe con calma. Algo que te atraviesa hoy.',
            ja: 'やさしく書いてみる。今日のあなたを通り抜けるもの。',
            'zh-Hans': '轻轻地写。今天经过你的某个片段。',
            'zh-Hant': '輕輕地寫。今天經過你的某個片段。',
          }).primary}
          className="min-h-[200px] font-serif text-lg leading-relaxed"
          maxLength={MAX + 50}
        />
        <div className="mt-2 flex items-center justify-between">
          <span className={`text-xs ${tooLong ? 'text-destructive' : 'text-muted-foreground'}`}>
            {remaining} / {MAX}
          </span>
        </div>

        {verdict === 'softfail' && note && (
          <div data-testid="circulation-softfail-note" className="mt-4 rounded-2xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-foreground">
            {note}
          </div>
        )}
        {verdict === 'block' && note && (
          <div data-testid="circulation-block-note" className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-foreground">
            {note}
          </div>
        )}

        <Button
          data-testid="circulation-release-button"
          variant="default"
          size="full"
          className="mt-6"
          disabled={disabled}
          onClick={handleRelease}
        >
          <Send className="w-5 h-5 mr-2" />
          {submitting
            ? t({ fr: 'Envoi…', en: 'Releasing…', es: 'Soltando…', ja: '放っています…', 'zh-Hans': '放出中…', 'zh-Hant': '放出中…' }).primary
            : t({ fr: 'Relâcher dans le courant', en: 'Release into the current', es: 'Soltar en la corriente', ja: '流れに放つ', 'zh-Hans': '放入水流', 'zh-Hant': '放入水流' }).primary}
        </Button>
      </div>
    </div>
  );
}
