import { ArrowLeft, Feather, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface PromptChoiceScreenProps {
  onChooseDirect: () => void;
  onOpenLibrary: () => void;
  onBack: () => void;
}

export function PromptChoiceScreen({ onChooseDirect, onOpenLibrary, onBack }: PromptChoiceScreenProps) {
  const { t } = useLanguage();

  // Compute the heading once and use both .primary (target lang) and .secondary
  // (primary lang) from the same object, so the subtitle is a real translation
  // of the heading instead of a mis-keyed duplicate.
  const heading = t({
    fr: 'Comment voulez-vous commencer ?',
    en: 'How would you like to start?',
    es: '¿Cómo quieres empezar?',
    ja: 'どのように始めますか？',
    'zh-Hans': '你想怎么开始？',
    'zh-Hant': '你想怎麼開始？',
  });

  return (
    <div className="min-h-screen flex flex-col px-6 py-12">
      <div className="w-full max-w-lg mx-auto flex-1 flex flex-col animate-fade-in-up">
        <button
          onClick={onBack}
          className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-10 self-start"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span className="text-sm">{t({ fr: 'Retour', en: 'Back', es: 'Volver', ja: '戻る', 'zh-Hans': '返回', 'zh-Hant': '返回' }).primary}</span>
        </button>

        <div className="mb-10">
          <h2 className="font-serif text-3xl text-foreground leading-relaxed">
            {heading.primary}
          </h2>
          {heading.secondary !== heading.primary && (
            <p className="text-muted-foreground text-sm italic mt-2">
              {heading.secondary}
            </p>
          )}
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
                {t({ fr: 'Je sais ce que j\'écris', en: 'I know what I want to write', es: 'Sé lo que quiero escribir', ja: '書きたいことが決まっています', 'zh-Hans': '我知道想写什么', 'zh-Hant': '我知道想寫什麼' }).primary}
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                {t({ fr: 'Commencer directement', en: 'Start writing directly', es: 'Empezar a escribir directamente', ja: 'そのまま始める', 'zh-Hans': '直接开始写', 'zh-Hant': '直接開始寫' }).primary}
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
                {t({ fr: 'J\'ai besoin d\'inspiration', en: 'I need some inspiration', es: 'Necesito inspiración', ja: 'ヒントが欲しい', 'zh-Hans': '我需要一些灵感', 'zh-Hant': '我需要一些靈感' }).primary}
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                {t({ fr: 'Choisir un modèle de phrase', en: 'Choose a sentence template', es: 'Elegir una plantilla de frase', ja: '文のテンプレートを選ぶ', 'zh-Hans': '选择一个句子模板', 'zh-Hant': '選擇一個句子範本' }).primary}
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
