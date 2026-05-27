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
          <span className="text-sm">{t({ fr: 'Retour', en: 'Back', es: 'Volver', ja: '戻る', 'zh-Hans': '返回', 'zh-Hant': '返回' }).primary}</span>
        </button>

        <div className="mb-10">
          <h2 className="font-serif text-3xl text-foreground leading-relaxed">
            {t({ fr: 'Quel type d\'écriture ?', en: 'What kind of writing?', es: '¿Qué tipo de escritura?', ja: 'どんな書き方にしますか？', 'zh-Hans': '想要哪种写作？', 'zh-Hant': '想要哪種寫作？' }).primary}
          </h2>
          <p className="text-muted-foreground text-sm italic mt-2">
            {t({ fr: 'What kind of writing?', en: 'Quel type d\'écriture ?', es: '¿Qué tipo de escritura?', ja: 'どんな書き方にしますか？', 'zh-Hans': '想要哪种写作？', 'zh-Hant': '想要哪種寫作？' }).secondary}
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
                {t({ fr: 'Écriture libre', en: 'Free Write', es: 'Escritura libre', ja: '自由に書く', 'zh-Hans': '自由书写', 'zh-Hant': '自由書寫' }).primary}
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                {t({ fr: 'Pas de structure, pas de chrono. Juste vos mots.', en: 'No structure, no timer. Just your words.', es: 'Sin estructura, sin cronómetro. Solo tus palabras.', ja: '形式もタイマーもなし。あなたの言葉だけ。', 'zh-Hans': '没有结构、没有计时，只有你的文字。', 'zh-Hant': '沒有結構、沒有計時，只有你的文字。' }).primary}
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
                {t({ fr: 'Écriture expressive', en: 'Expressive Writing', es: 'Escritura expresiva', ja: '感情をひらく書き方', 'zh-Hans': '情感书写', 'zh-Hant': '情感書寫' }).primary}
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                {t({ fr: 'Session guidée de 20 min. Explorez vos émotions profondes en toute sécurité.', en: 'Guided 20-min session. Safely explore your deepest emotions.', es: 'Sesión guiada de 20 min. Explora tus emociones más profundas.', ja: '20分のガイド付きセッション。深い感情を安心して見つめましょう。', 'zh-Hans': '20 分钟引导式书写，安心地探索内心深处的情绪。', 'zh-Hant': '20 分鐘引導式書寫，安心地探索內心深處的情緒。' }).primary}
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
