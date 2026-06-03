import { ArrowLeft, Wind, Activity } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface CenterChoiceScreenProps {
  onChooseBreathe: () => void;
  onChooseBodyScan: () => void;
  onBack: () => void;
}

export function CenterChoiceScreen({ onChooseBreathe, onChooseBodyScan, onBack }: CenterChoiceScreenProps) {
  const { t } = useLanguage();

  const heading = t({
    fr: 'Comment voulez-vous vous recentrer ?',
    en: 'How would you like to settle in?',
    es: '¿Cómo quieres centrarte?',
    ja: 'どのように落ち着きますか？',
    'zh-Hans': '你想怎么让自己安定下来?',
    'zh-Hant': '你想怎麼讓自己安定下來?',
  });

  return (
    <div className="min-h-screen flex flex-col px-6 py-12">
      <div className="w-full max-w-lg mx-auto flex-1 flex flex-col animate-fade-in-up">
        <button
          onClick={onBack}
          className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-10 self-start"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span className="text-sm">
            {t({ fr: 'Retour', en: 'Back', es: 'Volver', ja: '戻る', 'zh-Hans': '返回', 'zh-Hant': '返回' }).primary}
          </span>
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
            onClick={onChooseBreathe}
            className="group flex items-start gap-4 p-6 rounded-2xl border-2 border-primary/20 bg-primary/5 hover:border-primary/50 hover:bg-primary/10 transition-all text-left"
          >
            <div className="rounded-full bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors mt-0.5">
              <Wind className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground text-lg leading-snug">
                {t({
                  fr: 'Respirer',
                  en: 'Breathe',
                  es: 'Respirar',
                  ja: '呼吸する',
                  'zh-Hans': '呼吸',
                  'zh-Hant': '呼吸',
                }).primary}
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                {t({
                  fr: 'Quelques cycles guidés pour s\'ancrer',
                  en: 'A few guided cycles to ground yourself',
                  es: 'Unos ciclos guiados para centrarte',
                  ja: 'ガイド付きの呼吸で落ち着きましょう',
                  'zh-Hans': '几个引导呼吸帮你安定下来',
                  'zh-Hant': '幾個引導呼吸幫你安定下來',
                }).primary}
              </p>
            </div>
          </button>

          <button
            onClick={onChooseBodyScan}
            className="group flex items-start gap-4 p-6 rounded-2xl border-2 border-accent/30 bg-accent/5 hover:border-accent/60 hover:bg-accent/10 transition-all text-left"
          >
            <div className="rounded-full bg-accent/20 p-3 group-hover:bg-accent/30 transition-colors mt-0.5">
              <Activity className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground text-lg leading-snug">
                {t({
                  fr: 'Scan corporel',
                  en: 'Body scan',
                  es: 'Escaneo corporal',
                  ja: 'ボディスキャン',
                  'zh-Hans': '身体扫描',
                  'zh-Hant': '身體掃描',
                }).primary}
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                {t({
                  fr: 'De la tête aux pieds, notez ce que vous ressentez',
                  en: 'Head to toe — notice what you feel',
                  es: 'De la cabeza a los pies, nota lo que sientes',
                  ja: '頭から足まで、感じることに気づきましょう',
                  'zh-Hans': '从头到脚,觉察身体的感受',
                  'zh-Hant': '從頭到腳,覺察身體的感受',
                }).primary}
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
