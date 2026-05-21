import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { FILL_IN_PROMPTS, FillInCategory, FillInPrompt } from '@/types/journal';

interface PromptLibraryScreenProps {
  onPickPrompt: (template: string, vocabulary?: FillInPrompt['vocabulary']) => void;
  onBack: () => void;
}

const CATEGORY_LABELS: Record<FillInCategory, { fr: string; en: string; es: string }> = {
  'Emotions':    { fr: 'Émotions',     en: 'Emotions',     es: 'Emociones'    },
  'Daily Life':  { fr: 'Quotidien',    en: 'Daily Life',   es: 'Vida diaria'  },
  'Observations':{ fr: 'Observations', en: 'Observations', es: 'Observaciones'},
  'Challenges':  { fr: 'Défis',        en: 'Challenges',   es: 'Desafíos'     },
  'Hopes':       { fr: 'Espoirs',      en: 'Hopes',        es: 'Esperanzas'   },
  'Situations':  { fr: 'Situations',   en: 'Situations',   es: 'Situaciones'  },
};

const CATEGORIES: FillInCategory[] = ['Emotions', 'Daily Life', 'Observations', 'Challenges', 'Hopes', 'Situations'];

// Highlight ___ blanks with a styled span
function renderTemplate(text: string) {
  const parts = text.split('___');
  return parts.map((part, i) => (
    <span key={i}>
      {part}
      {i < parts.length - 1 && (
        <span className="text-primary font-semibold border-b-2 border-primary/50 px-1">___</span>
      )}
    </span>
  ));
}

export function PromptLibraryScreen({ onPickPrompt, onBack }: PromptLibraryScreenProps) {
  const { targetLang, t } = useLanguage();
  const lang = targetLang;

  return (
    <div className="min-h-screen flex flex-col px-6 py-12">
      <div className="w-full max-w-lg mx-auto flex flex-col animate-fade-in-up">
        <button
          onClick={onBack}
          className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-8 self-start"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span className="text-sm">{t('Retour', 'Back', 'Volver').primary}</span>
        </button>

        <div className="mb-8">
          <h2 className="font-serif text-2xl text-foreground">
            {t('Choisissez un modèle', 'Choose a template', 'Elige una plantilla').primary}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {t('Tapez pour commencer avec ce modèle', 'Tap to start with this template', 'Toca para empezar con esta plantilla').primary}
          </p>
        </div>

        <div className="space-y-8 pb-12">
          {CATEGORIES.map(category => {
            const prompts = FILL_IN_PROMPTS.filter(p => p.category === category);
            const label = CATEGORY_LABELS[category][lang];

            return (
              <div key={category}>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70 mb-3">
                  {label}
                </p>
                <div className="space-y-2">
                  {prompts.map(prompt => {
                    const text = (lang === 'zh-Hans' && prompt.zhHans) ? prompt.zhHans
                      : (lang === 'zh-Hant' && prompt.zhHant) ? prompt.zhHant
                      : prompt[lang as 'fr' | 'en' | 'es'] || prompt.en;
                    return (
                      <button
                        key={prompt.id}
                        onClick={() => onPickPrompt(text, prompt.vocabulary)}
                        className="w-full text-left p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all text-base leading-relaxed"
                      >
                        {renderTemplate(text)}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
