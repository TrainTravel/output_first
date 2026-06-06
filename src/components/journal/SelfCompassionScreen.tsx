import { Button } from '@/components/ui/button';
import { ArrowRight, Heart } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SelfCompassionPractice } from './SelfCompassionPractice';

interface SelfCompassionScreenProps {
  onContinue: () => void;
  onSkip: () => void;
}

export function SelfCompassionScreen({ onContinue, onSkip }: SelfCompassionScreenProps) {
  const { bilingual, t, targetLang } = useLanguage();

  return (
    <div
      data-testid="selfcompassion-screen"
      className="min-h-screen flex flex-col px-6 py-12"
    >
      <div className="w-full max-w-lg mx-auto flex-1 flex flex-col animate-fade-in-up">
        {/* Header — bilingual anchor */}
        <div className="mb-8 space-y-3">
          <h2 className="font-serif text-2xl md:text-3xl text-foreground leading-relaxed">
            {bilingual({
              fr: 'Un moment pour soi',
              en: 'A moment for yourself',
              es: 'Un momento para ti',
              ja: '自分(じぶん)のための一時(ひととき)',
              'zh-Hans': '给自己一刻',
              'zh-Hant': '給自己一刻',
            })}
          </h2>
          <p className="text-muted-foreground text-sm">
            {t({
              fr: 'Avant de passer à la gratitude, prenez un instant pour vous-même.',
              en: 'Before moving on to gratitude, take an instant for yourself.',
              es: 'Antes de pasar a la gratitud, tómate un momento para ti.',
              ja: '感謝(かんしゃ)に進(すす)む前(まえ)に、自分(じぶん)のための時間(じかん)を少(すこ)し取(と)りましょう。',
              'zh-Hans': '在转向感恩之前，先给自己片刻。',
              'zh-Hant': '在轉向感恩之前，先給自己片刻。',
            }).primary}
          </p>
        </div>

        {/* Practice */}
        <div className="flex-1">
          <SelfCompassionPractice lang={targetLang} defaultOpen />
        </div>

        {/* Actions */}
        <div className="mt-8 space-y-3">
          <Button
            variant="default"
            size="full"
            onClick={onContinue}
            data-testid="selfcompassion-continue"
          >
            <Heart className="w-5 h-5 mr-2" />
            {t({
              fr: 'Continuer vers la gratitude',
              en: 'Continue to gratitude',
              es: 'Continuar a la gratitud',
              ja: '感謝(かんしゃ)へ進(すす)む',
              'zh-Hans': '继续，去感恩',
              'zh-Hant': '繼續，去感恩',
            }).primary}
          </Button>

          <Button
            variant="skip"
            size="full"
            onClick={onSkip}
            data-testid="selfcompassion-skip"
          >
            <ArrowRight className="w-5 h-5 mr-2" />
            {t({
              fr: 'Passer',
              en: 'Skip',
              es: 'Omitir',
              ja: 'スキップ',
              'zh-Hans': '跳过',
              'zh-Hant': '跳過',
            }).primary}
          </Button>
        </div>
      </div>
    </div>
  );
}
