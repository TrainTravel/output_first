import { ArrowLeft, Check } from 'lucide-react';
import { useLanguage, type PrimaryLang, type TargetLang } from '@/contexts/LanguageContext';

interface LanguageSettingsScreenProps {
  onBack: () => void;
}

const TARGET_OPTIONS: ReadonlyArray<{ code: TargetLang; native: string; en: string }> = [
  { code: 'fr',      native: 'Français',  en: 'French'              },
  { code: 'es',      native: 'Español',   en: 'Spanish'             },
  { code: 'zh-Hans', native: '简体中文',   en: 'Chinese (Simplified)' },
  { code: 'zh-Hant', native: '繁體中文',   en: 'Chinese (Traditional)'},
  { code: 'ja',      native: '日本語',    en: 'Japanese'             },
];

const PRIMARY_OPTIONS: ReadonlyArray<{ code: PrimaryLang; native: string; en: string }> = [
  { code: 'en',      native: 'English',  en: 'English'              },
  { code: 'fr',      native: 'Français', en: 'French'               },
  { code: 'es',      native: 'Español',  en: 'Spanish'              },
  { code: 'zh-Hans', native: '简体中文',  en: 'Chinese (Simplified)' },
  { code: 'zh-Hant', native: '繁體中文',  en: 'Chinese (Traditional)'},
];

export function LanguageSettingsScreen({ onBack }: LanguageSettingsScreenProps) {
  const { pair, setLangPair, t, bilingual, availablePrimaries, availableTargets } =
    useLanguage();

  const onPickTarget = (next: TargetLang) => setLangPair({ ...pair, target: next });
  const onPickPrimary = (next: PrimaryLang) => setLangPair({ ...pair, primary: next });

  return (
    <div className="min-h-screen flex flex-col px-6 py-12">
      <div className="w-full max-w-lg mx-auto flex-1 flex flex-col animate-fade-in-up">
        <button
          onClick={onBack}
          className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-8 self-start"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span className="text-sm">{t({ fr: 'Retour', en: 'Back', es: 'Volver', ja: '戻る', 'zh-Hans': '返回', 'zh-Hant': '返回' }).primary}</span>
        </button>

        <div className="mb-10 space-y-2">
          <h2 className="font-serif text-2xl md:text-3xl text-foreground">
            {t({ fr: 'Réglages de langue', en: 'Language settings', es: 'Ajustes de idioma', ja: '言語設定', 'zh-Hans': '语言设置', 'zh-Hant': '語言設定' }).primary}
          </h2>
          <p className="text-muted-foreground italic">
            {t({ fr: 'Réglages de langue', en: 'Language settings', es: 'Ajustes de idioma', ja: '言語設定', 'zh-Hans': '语言设置', 'zh-Hant': '語言設定' }).secondary}
          </p>
        </div>

        <section className="mb-10" data-testid="learn-section">
          <h3 className="font-medium text-foreground mb-3">
            {bilingual({ fr: "J'apprends", en: "I'm learning", es: 'Estoy aprendiendo', ja: '学んでいる言語', 'zh-Hans': '正在学习', 'zh-Hant': '正在學習' })}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {TARGET_OPTIONS
              .filter(opt => (availableTargets as readonly TargetLang[]).includes(opt.code) || opt.code === pair.target)
              .map(opt => {
                const active = opt.code === pair.target;
                return (
                  <button
                    key={opt.code}
                    onClick={() => onPickTarget(opt.code)}
                    aria-pressed={active}
                    className={`relative text-left rounded-xl border-2 px-4 py-3 transition-all ${
                      active
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card hover:border-primary/40 hover:bg-primary/5'
                    }`}
                  >
                    <p className="font-serif text-lg text-foreground">{opt.native}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{opt.en}</p>
                    {active && (
                      <Check className="absolute top-3 right-3 w-4 h-4 text-primary" />
                    )}
                  </button>
                );
              })}
          </div>
        </section>

        <section className="mb-10" data-testid="speak-section">
          <h3 className="font-medium text-foreground mb-3">
            {bilingual({ fr: 'Je parle déjà', en: 'I already speak', es: 'Ya hablo', ja: 'すでに話せる言語', 'zh-Hans': '我已经会说', 'zh-Hant': '我已經會說' })}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {PRIMARY_OPTIONS
              .filter(opt => (availablePrimaries as readonly PrimaryLang[]).includes(opt.code) || opt.code === pair.primary)
              .map(opt => {
                const active = opt.code === pair.primary;
                return (
                  <button
                    key={opt.code}
                    onClick={() => onPickPrimary(opt.code)}
                    aria-pressed={active}
                    className={`relative text-left rounded-xl border-2 px-4 py-3 transition-all ${
                      active
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card hover:border-primary/40 hover:bg-primary/5'
                    }`}
                  >
                    <p className="font-serif text-lg text-foreground">{opt.native}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{opt.en}</p>
                    {active && (
                      <Check className="absolute top-3 right-3 w-4 h-4 text-primary" />
                    )}
                  </button>
                );
              })}
          </div>
        </section>

        <section className="mt-auto">
          <p className="text-xs text-muted-foreground mb-2">
            {t({ fr: 'Aperçu', en: 'Preview', es: 'Vista previa', ja: 'プレビュー', 'zh-Hans': '预览', 'zh-Hant': '預覽' }).primary}
          </p>
          <div className="rounded-xl border border-border bg-card/50 p-4">
            <p className="font-serif text-base text-foreground">
              {bilingual({ fr: 'Vide-tête', en: 'Brain Dump', es: 'Volcado mental', ja: '脳のメモ', 'zh-Hans': '想法清空', 'zh-Hant': '想法清空' })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t({ fr: 'cible / familière', en: 'target / primary', es: 'objetivo / familiar', ja: '学習中 / 普段の言語', 'zh-Hans': '学习中 / 熟悉的', 'zh-Hant': '學習中 / 熟悉的' }).primary}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
