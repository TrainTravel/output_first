import { ArrowLeft, Feather, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface PromptChoiceScreenProps {
  onChooseDirect: () => void;
  onOpenLibrary: () => void;
  onBack: () => void;
}

export function PromptChoiceScreen({ onChooseDirect, onOpenLibrary, onBack }: PromptChoiceScreenProps) {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col px-6 py-12">
      <div className="w-full max-w-lg mx-auto flex-1 flex flex-col animate-fade-in-up">
        <button
          onClick={onBack}
          className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-10 self-start"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span className="text-sm">{t({ fr: 'Retour', en: 'Back', es: 'Volver' }).primary}</span>
        </button>

        <div className="mb-10">
          <h2 className="font-serif text-3xl text-foreground leading-relaxed">
            {t({ fr: 'Comment voulez-vous commencer ?', en: 'How would you like to start?', es: '¿Cómo quieres empezar?' }).primary}
          </h2>
          <p className="text-muted-foreground text-sm italic mt-2">
            {t({ fr: 'Comment would you like to start?', en: 'Comment voulez-vous commencer ?', es: 'Comment voulez-vous commencer ?' }).secondary}
          </p>
        </div>

        <div className="flex flex-col gap-4 flex-1">
          <button
            onClick={onChooseDirect}
            className="group flex items-start gap-4 p-6 rounded-2xl border-2 border-primary/20 bg-primary/5 hover:border-primary/50 hover:bg-primary/10 transition-all text-left"
          >
            <div className="rounded-full bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors mt-0.5">
              <Feather className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground text-lg leading-snug">
                {t({ fr: 'Je sais ce que j\'écris', en: 'I know what I want to write', es: 'Sé lo que quiero escribir' }).primary}
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                {t({ fr: 'Commencer directement', en: 'Start writing directly', es: 'Empezar a escribir directamente' }).primary}
              </p>
            </div>
          </button>

          <button
            onClick={onOpenLibrary}
            className="group flex items-start gap-4 p-6 rounded-2xl border-2 border-accent/30 bg-accent/5 hover:border-accent/60 hover:bg-accent/10 transition-all text-left"
          >
            <div className="rounded-full bg-accent/20 p-3 group-hover:bg-accent/30 transition-colors mt-0.5">
              <Sparkles className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground text-lg leading-snug">
                {t({ fr: 'J\'ai besoin d\'inspiration', en: 'I need some inspiration', es: 'Necesito inspiración' }).primary}
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                {t({ fr: 'Choisir un modèle de phrase', en: 'Choose a sentence template', es: 'Elegir una plantilla de frase' }).primary}
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
