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
];

const PRIMARY_OPTIONS: ReadonlyArray<{ code: PrimaryLang; native: string; en: string }> = [
  { code: 'en', native: 'English',  en: 'English' },
  { code: 'fr', native: 'Français', en: 'French'  },
  { code: 'es', native: 'Español',  en: 'Spanish' },
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
          <span className="text-sm">{t('Retour', 'Back', 'Volver').primary}</span>
        </button>

        <div className="mb-10 space-y-2">
          <h2 className="font-serif text-2xl md:text-3xl text-foreground">
            {t('Réglages de langue', 'Language settings', 'Ajustes de idioma').primary}
          </h2>
          <p className="text-muted-foreground italic">
            {t('Réglages de langue', 'Language settings', 'Ajustes de idioma').secondary}
          </p>
        </div>

        <section className="mb-10" data-testid="learn-section">
          <h3 className="font-medium text-foreground mb-3">
            {bilingual("J'apprends", "I'm learning", 'Estoy aprendiendo')}
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
            {bilingual('Je parle déjà', 'I already speak', 'Ya hablo')}
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
            {t('Aperçu', 'Preview', 'Vista previa').primary}
          </p>
          <div className="rounded-xl border border-border bg-card/50 p-4">
            <p className="font-serif text-base text-foreground">
              {bilingual('Vide-tête', 'Brain Dump', 'Volcado mental', '清空大脑', '清空大腦')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('cible / familière', 'target / primary', 'objetivo / familiar').primary}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
