import { useState } from 'react';
import { ArrowLeft, Heart, Settings, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLoveLetters, type LoveLetter } from '@/hooks/useLoveLetters';
import { useCirculationSettings } from '@/hooks/useCirculationSettings';

interface LettersInCirculationScreenProps {
  onBack: () => void;
  onOpenShare: () => void;
  onOpenSettings: () => void;
}

function daysRemaining(expires: string | null): number {
  if (!expires) return 0;
  const ms = new Date(expires).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function LettersInCirculationScreen({ onBack, onOpenShare, onOpenSettings }: LettersInCirculationScreenProps) {
  const { t, bilingual } = useLanguage();
  const { settings, loading: settingsLoading, update } = useCirculationSettings();
  const { current, loading, error, hold } = useLoveLetters();
  const [opened, setOpened] = useState<LoveLetter | null>(null);
  const [heldIds, setHeldIds] = useState<Set<string>>(new Set());

  async function handleHold(id: string) {
    if (heldIds.has(id)) return;
    setHeldIds(prev => new Set(prev).add(id));
    await hold(id);
  }

  const optedIn = settings.receive_letters;

  return (
    <div data-testid="circulation-feed-screen" className="min-h-screen flex flex-col px-6 py-12">
      <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="text-sm">{t({ fr: 'Retour', en: 'Back', es: 'Volver', ja: '戻る', 'zh-Hans': '返回', 'zh-Hant': '返回' }).primary}</span>
          </button>
          <button
            onClick={onOpenSettings}
            data-testid="circulation-feed-settings"
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span className="text-xs">{t({ fr: 'Réglages', en: 'Settings', es: 'Ajustes', ja: '設定', 'zh-Hans': '设置', 'zh-Hant': '設定' }).primary}</span>
          </button>
        </div>

        <div className="mb-8 space-y-3 text-center">
          <h1 className="font-serif text-3xl md:text-4xl text-foreground leading-tight">
            {bilingual({ fr: "Circulation d'amour", en: 'Circulation of Love', es: 'Circulación del Amor', ja: '愛の循環', 'zh-Hans': '爱的流转', 'zh-Hant': '愛的流轉' })}
          </h1>
          <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">
            {t({
              fr: 'Des lettres anonymes dans votre langue. Elles dérivent quelques jours, puis se rangent.',
              en: 'Anonymous letters in your language. They drift for a few days, then quietly archive.',
              es: 'Cartas anónimas en tu idioma. Derivan unos días y luego se archivan en silencio.',
              ja: 'あなたの言語の匿名の手紙。数日漂って、静かに片付きます。',
              'zh-Hans': '用你的语言写的匿名信。漂上几天，然后静静归档。',
              'zh-Hant': '用你的語言寫的匿名信。漂上幾天，然後靜靜歸檔。',
            }).primary}
          </p>
        </div>

        {!optedIn && !settingsLoading && (
          <div
            data-testid="circulation-join-cta"
            className="relative overflow-hidden rounded-[32px] bg-primary/[0.03] p-8 text-center"
          >
            {/* Ghost letters drifting behind the CTA — pure decoration */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-4 -left-6 w-24 h-28 bg-card/40 rounded-tl-[28px] rounded-tr-[18px] rounded-bl-[20px] rounded-br-[26px] opacity-20 animate-letter-drift"
              style={{ animationDuration: '14s' }}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-8 -right-8 w-28 h-32 bg-card/40 rounded-tl-[22px] rounded-tr-[28px] rounded-bl-[26px] rounded-br-[18px] opacity-20 animate-letter-drift"
              style={{ animationDuration: '12s', animationDelay: '1.2s' }}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-6 left-12 w-20 h-24 bg-card/40 rounded-tl-[20px] rounded-tr-[26px] rounded-bl-[28px] rounded-br-[18px] opacity-20 animate-letter-drift"
              style={{ animationDuration: '10s', animationDelay: '0.6s' }}
            />
            <div className="relative">
              <Heart className="w-6 h-6 text-primary/70 mx-auto mb-4" />
              <p className="font-serif text-xl text-foreground mb-2">
                {t({ fr: 'Rejoindre le courant', en: 'Join the current', es: 'Únete a la corriente', ja: '流れに加わる', 'zh-Hans': '加入水流', 'zh-Hant': '加入水流' }).primary}
              </p>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                {t({
                  fr: 'Activez la réception pour voir les lettres des autres. Vous restez anonyme.',
                  en: 'Turn on receiving to see letters from others. You stay anonymous.',
                  es: 'Activa la recepción para ver cartas de otros. Sigues siendo anónimo.',
                  ja: '受信をオンにすると、他の人の手紙が見えます。あなたは匿名のまま。',
                  'zh-Hans': '打开接收，就能看到他人的来信。你仍是匿名的。',
                  'zh-Hant': '打開接收，就能看到他人的來信。你仍是匿名的。',
                }).primary}
              </p>
              <Button
                data-testid="circulation-optin-button"
                variant="default"
                onClick={() => update({ receive_letters: true })}
                className="rounded-full px-8"
              >
                {t({ fr: 'Je rejoins', en: "I'm in", es: 'Me uno', ja: '加わる', 'zh-Hans': '我加入', 'zh-Hant': '我加入' }).primary}
              </Button>
            </div>
          </div>
        )}

        {optedIn && (
          <>
            <Button
              data-testid="circulation-open-share"
              variant="outline"
              size="full"
              onClick={onOpenShare}
              className="mb-6"
            >
              <Send className="w-4 h-4 mr-2" />
              {t({ fr: 'Relâcher une lettre', en: 'Release a letter', es: 'Soltar una carta', ja: '手紙を放つ', 'zh-Hans': '放出一封信', 'zh-Hant': '放出一封信' }).primary}
            </Button>

            {loading && (
              <p className="text-center text-sm text-muted-foreground py-8">
                {t({ fr: 'Le courant arrive…', en: 'The current is arriving…', es: 'La corriente llega…', ja: '流れが届きます…', 'zh-Hans': '水流正在到来…', 'zh-Hant': '水流正在到來…' }).primary}
              </p>
            )}

            {!loading && current.length === 0 && !error && (
              <p data-testid="circulation-empty" className="text-center text-sm text-muted-foreground py-8 max-w-md mx-auto">
                {t({
                  fr: "Le courant est calme. Soyez la première lettre aujourd'hui.",
                  en: 'The current is still. Be the first letter today.',
                  es: 'La corriente está en calma. Sé la primera carta de hoy.',
                  ja: '流れは静かです。今日の最初の手紙になってみる。',
                  'zh-Hans': '水流很静。试着成为今天的第一封信。',
                  'zh-Hant': '水流很靜。試著成為今天的第一封信。',
                }).primary}
              </p>
            )}

            <div data-testid="circulation-letters" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {current.map((letter, i) => {
                const held = heldIds.has(letter.id);
                const days = daysRemaining(letter.expires_at);
                return (
                  <button
                    key={letter.id}
                    onClick={() => setOpened(letter)}
                    data-testid="circulation-letter-card"
                    className="text-left rounded-3xl border border-primary/15 bg-card/80 backdrop-blur-sm p-5 hover:border-primary/30 transition-all animate-letter-drift"
                    style={{ animationDelay: `${(i % 6) * 0.4}s` }}
                  >
                    <p className="font-serif text-lg text-foreground line-clamp-3 mb-3 leading-relaxed">
                      {letter.content}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-serif italic">{letter.pseudonym}</span>
                      <span>
                        {t({ fr: `${days}j`, en: `${days}d`, es: `${days}d`, ja: `あと${days}日`, 'zh-Hans': `还有 ${days} 天`, 'zh-Hant': `還有 ${days} 天` }).primary}
                      </span>
                    </div>
                    {held && (
                      <Heart className="w-3 h-3 text-accent fill-accent mt-2" data-testid="circulation-letter-held-mark" />
                    )}
                  </button>
                );
              })}
            </div>

            {error && (
              <p className="text-center text-xs text-destructive mt-6">
                {t({ fr: "On n'a pas pu charger. Réessayez.", en: "We couldn't load. Try again.", es: 'No pudimos cargar. Inténtalo de nuevo.', ja: '読み込めませんでした。もう一度お試しください。', 'zh-Hans': '没能加载。请再试一次。', 'zh-Hant': '沒能加載。請再試一次。' }).primary}
              </p>
            )}
          </>
        )}
      </div>

      {opened && (
        <div
          data-testid="circulation-letter-open"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm px-4 pb-6"
          onClick={() => setOpened(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-primary/20 bg-card p-6 shadow-xl animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-serif text-xl text-foreground leading-relaxed mb-4 whitespace-pre-wrap">
              {opened.content}
            </p>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-5">
              <span className="font-serif italic">{opened.pseudonym}</span>
              <span>
                {t({ fr: `${daysRemaining(opened.expires_at)}j`, en: `${daysRemaining(opened.expires_at)}d`, es: `${daysRemaining(opened.expires_at)}d`, ja: `あと${daysRemaining(opened.expires_at)}日`, 'zh-Hans': `还有 ${daysRemaining(opened.expires_at)} 天`, 'zh-Hant': `還有 ${daysRemaining(opened.expires_at)} 天` }).primary}
              </span>
            </div>
            <Button
              data-testid="circulation-hold-button"
              variant={heldIds.has(opened.id) ? 'outline' : 'default'}
              size="full"
              onClick={() => handleHold(opened.id)}
              disabled={heldIds.has(opened.id)}
            >
              <Heart className={`w-4 h-4 mr-2 ${heldIds.has(opened.id) ? 'fill-accent text-accent' : ''}`} />
              {heldIds.has(opened.id)
                ? t({ fr: 'Tenu', en: 'Held', es: 'Sostenida', ja: '受けとめた', 'zh-Hans': '已捧住', 'zh-Hant': '已捧住' }).primary
                : t({ fr: "La tenir un instant", en: 'Hold this for a moment', es: 'Sostén esto un momento', ja: '少しのあいだ受けとめる', 'zh-Hans': '为它驻足片刻', 'zh-Hant': '為它駐足片刻' }).primary}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
