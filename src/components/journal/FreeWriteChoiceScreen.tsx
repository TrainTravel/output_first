import { ArrowLeft, Feather, Heart } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface FreeWriteChoiceScreenProps {
  onChooseFreeWrite: () => void;
  onChooseExpressive: () => void;
  onBack: () => void;
}

export function FreeWriteChoiceScreen({ onChooseFreeWrite, onChooseExpressive, onBack }: FreeWriteChoiceScreenProps) {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col px-6 py-12">
      <div className="w-full max-w-lg mx-auto flex-1 flex flex-col animate-fade-in-up">
        <button
          onClick={onBack}
          className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-10 self-start"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span className="text-sm">{t('Retour', 'Back', 'Volver').primary}</span>
        </button>

        <div className="mb-10">
          <h2 className="font-serif text-3xl text-foreground leading-relaxed">
            {t('Quel type d\'écriture ?', 'What kind of writing?', '¿Qué tipo de escritura?').primary}
          </h2>
          <p className="text-muted-foreground text-sm italic mt-2">
            {t('What kind of writing?', 'Quel type d\'écriture ?', '¿Qué tipo de escritura?').secondary}
          </p>
        </div>

        <div className="flex flex-col gap-4 flex-1">
          <button
            onClick={onChooseFreeWrite}
            className="group flex items-start gap-4 p-6 rounded-2xl border-2 border-primary/20 bg-primary/5 hover:border-primary/50 hover:bg-primary/10 transition-all text-left"
          >
            <div className="rounded-full bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors mt-0.5">
              <Feather className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground text-lg leading-snug">
                {t('Écriture libre', 'Free Write', 'Escritura libre').primary}
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                {t('Pas de structure, pas de chrono. Juste vos mots.',
                  'No structure, no timer. Just your words.',
                  'Sin estructura, sin cronómetro. Solo tus palabras.').primary}
              </p>
            </div>
          </button>

          <button
            onClick={onChooseExpressive}
            className="group flex items-start gap-4 p-6 rounded-2xl border-2 border-accent/30 bg-accent/5 hover:border-accent/60 hover:bg-accent/10 transition-all text-left"
          >
            <div className="rounded-full bg-accent/20 p-3 group-hover:bg-accent/30 transition-colors mt-0.5">
              <Heart className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground text-lg leading-snug">
                {t('Écriture expressive', 'Expressive Writing', 'Escritura expresiva').primary}
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                {t('Session guidée de 20 min. Explorez vos émotions profondes en toute sécurité.',
                  'Guided 20-min session. Safely explore your deepest emotions.',
                  'Sesión guiada de 20 min. Explora tus emociones más profundas.').primary}
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
