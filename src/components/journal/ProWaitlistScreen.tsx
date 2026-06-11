import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ArrowRight, Heart, Send } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProWaitlist } from '@/hooks/useProWaitlist';
import { PRO_WAITLIST_FEATURES, type ProWaitlistFeature } from '@/types/journal';

interface ProWaitlistScreenProps {
  onBack: () => void;
}

interface FeatureCopy {
  title: ReturnType<ReturnType<typeof useLanguage>['t']>;
  description: ReturnType<ReturnType<typeof useLanguage>['t']>;
}

export function ProWaitlistScreen({ onBack }: ProWaitlistScreenProps) {
  const { t, bilingual } = useLanguage();
  const { submitted, loading, error, submit } = useProWaitlist();
  const [selected, setSelected] = useState<Set<ProWaitlistFeature>>(new Set());
  const [otherText, setOtherText] = useState('');
  const [email, setEmail] = useState('');
  const [showThanks, setShowThanks] = useState(false);

  const featureCopy: Record<ProWaitlistFeature, FeatureCopy> = {
    sync: {
      title: t({ fr: 'Sync entre appareils', en: 'Cross-device sync', es: 'Sincronización entre dispositivos', ja: 'デバイス間の同期', 'zh-Hans': '跨设备同步', 'zh-Hant': '跨裝置同步' }),
      description: t({ fr: 'Vos entrées, votre jardin, votre collection — partout.', en: 'Your entries, garden, and collection — everywhere.', es: 'Tus entradas, jardín y colección — en cualquier lugar.', ja: '日記、ガーデン、コレクション — どこからでも。', 'zh-Hans': '你的日记、花园和收藏 — 处处可见。', 'zh-Hant': '你的日記、花園和收藏 — 處處可見。' }),
    },
    voice: {
      title: t({ fr: 'Saisie vocale', en: 'Voice input', es: 'Entrada por voz', ja: '音声入力', 'zh-Hans': '语音输入', 'zh-Hant': '語音輸入' }),
      description: t({ fr: 'Enregistrez, on transcrit. Idéal en marchant.', en: 'Record, we transcribe. Great while walking.', es: 'Graba, nosotros transcribimos. Ideal mientras caminas.', ja: '録音すれば書き起こします。散歩中に最適。', 'zh-Hans': '录音，我们来转写。散步时也能记录。', 'zh-Hant': '錄音，我們來轉寫。散步時也能記錄。' }),
    },
    'deeper-ai': {
      title: t({ fr: 'Réflexions IA plus profondes', en: 'Deeper AI reflections', es: 'Reflexiones de IA más profundas', ja: 'より深いAIリフレクション', 'zh-Hans': '更深入的 AI 反思', 'zh-Hant': '更深入的 AI 反思' }),
      description: t({ fr: 'Un modèle plus grand, des questions plus justes.', en: 'A larger model, more precise questions.', es: 'Un modelo más grande, preguntas más precisas.', ja: 'より大きなモデルで、的確な問いかけ。', 'zh-Hans': '更大的模型，更精准的提问。', 'zh-Hant': '更大的模型，更精準的提問。' }),
    },
    export: {
      title: t({ fr: 'Export PDF / Markdown', en: 'Export to PDF / Markdown', es: 'Exportar a PDF / Markdown', ja: 'PDF / Markdown へのエクスポート', 'zh-Hans': '导出为 PDF / Markdown', 'zh-Hant': '匯出為 PDF / Markdown' }),
      description: t({ fr: 'Téléchargez vos écrits, gardez-les près de vous.', en: 'Download your writing, keep it close.', es: 'Descarga tus escritos, mantenlos cerca.', ja: 'あなたの文章をダウンロードして手元に。', 'zh-Hans': '下载你的文字，留在身边。', 'zh-Hant': '下載你的文字，留在身邊。' }),
    },
    'more-languages': {
      title: t({ fr: 'Plus de langues', en: 'More languages', es: 'Más idiomas', ja: 'もっと多くの言語', 'zh-Hans': '更多语言', 'zh-Hant': '更多語言' }),
      description: t({ fr: 'Coréen, arabe, allemand… dites-nous lesquelles.', en: 'Korean, Arabic, German… tell us which.', es: 'Coreano, árabe, alemán… dinos cuáles.', ja: '韓国語、アラビア語、ドイツ語… ご希望をお聞かせください。', 'zh-Hans': '韩语、阿拉伯语、德语…告诉我们你想要哪些。', 'zh-Hant': '韓語、阿拉伯語、德語…告訴我們你想要哪些。' }),
    },
    'weekly-insights': {
      title: t({ fr: 'Résumé hebdomadaire', en: 'Weekly insights summary', es: 'Resumen semanal de ideas', ja: '週次インサイトのまとめ', 'zh-Hans': '每周洞察总结', 'zh-Hant': '每週洞察總結' }),
      description: t({ fr: 'Une lettre douce le dimanche, à votre rythme.', en: 'A gentle Sunday letter, at your pace.', es: 'Una carta suave el domingo, a tu ritmo.', ja: '穏やかな日曜のレター、あなたのペースで。', 'zh-Hans': '一封温柔的周日来信，按你的节奏。', 'zh-Hant': '一封溫柔的週日來信，按你的節奏。' }),
    },
    'custom-themes': {
      title: t({ fr: 'Thèmes personnalisés', en: 'Custom themes', es: 'Temas personalizados', ja: 'カスタムテーマ', 'zh-Hans': '自定义主题', 'zh-Hant': '自訂主題' }),
      description: t({ fr: 'Plus de palettes, plus de polices, votre espace.', en: 'More palettes, more fonts, your space.', es: 'Más paletas, más fuentes, tu espacio.', ja: 'パレット、フォント、あなたの空間。', 'zh-Hans': '更多调色、更多字体，属于你的空间。', 'zh-Hant': '更多調色、更多字體，屬於你的空間。' }),
    },
  };

  const toggleFeature = (key: ProWaitlistFeature) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSubmit = async () => {
    const { ok } = await submit({
      features: Array.from(selected),
      otherText,
      email,
    });
    if (ok || !error) setShowThanks(true);
  };

  if (submitted || showThanks) {
    return (
      <div className="min-h-screen flex flex-col px-6 py-12">
        <div className="w-full max-w-lg mx-auto flex-1 flex flex-col items-center justify-center text-center animate-fade-in-up">
          <Heart className="w-10 h-10 text-accent mb-6" />
          <h1 className="font-serif text-2xl md:text-3xl text-foreground mb-3">
            {bilingual({ fr: 'Merci', en: 'Thank you', es: 'Gracias', ja: 'ありがとう', 'zh-Hans': '谢谢', 'zh-Hant': '謝謝' })}
          </h1>
          <p className="text-muted-foreground max-w-md mb-8">
            {t({ fr: 'On vous écoute. Vos votes façonnent ce qui sera construit ensuite.', en: 'We hear you. Your vote shapes what gets built next.', es: 'Te escuchamos. Tu voto da forma a lo que se construye después.', ja: '受け取りました。あなたの一票が次に作るものを形作ります。', 'zh-Hans': '我们听见你了。你的投票将决定接下来要打造的功能。', 'zh-Hant': '我們聽見你了。你的投票將決定接下來要打造的功能。' }).primary}
          </p>
          <Button variant="default" size="full" onClick={onBack}>
            <ArrowLeft className="w-5 h-5 mr-2" />
            {t({ fr: 'Retour à l\'écriture', en: 'Back to writing', es: 'Volver a escribir', ja: '書き戻る', 'zh-Hans': '回到写作', 'zh-Hant': '回到寫作' }).primary}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="prowaitlist-screen" className="min-h-screen flex flex-col px-6 py-12">
      <div className="w-full max-w-lg mx-auto flex-1 flex flex-col animate-fade-in-up">
        <button
          onClick={onBack}
          className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-8 self-start"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span className="text-sm">{t({ fr: 'Retour', en: 'Back', es: 'Volver', ja: '戻る', 'zh-Hans': '返回', 'zh-Hant': '返回' }).primary}</span>
        </button>

        <div className="mb-8 space-y-3">
          <h1 className="font-serif text-3xl md:text-4xl text-foreground leading-tight">
            {bilingual({ fr: 'Aidez à façonner Pro', en: 'Help shape Pro', es: 'Ayuda a dar forma a Pro', ja: 'Pro を一緒に形作る', 'zh-Hans': '一起塑造 Pro', 'zh-Hant': '一起塑造 Pro' })}
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            {t({ fr: 'OutputFirst restera gratuit. Dites-nous ce qui rendrait une version Pro utile pour vous.', en: 'OutputFirst will always have a free tier. Tell us what would make a Pro version worth it for you.', es: 'OutputFirst siempre tendrá un nivel gratuito. Cuéntanos qué haría que una versión Pro valga la pena para ti.', ja: 'OutputFirst には常に無料枠があります。Pro 版を価値あるものにするには何が必要か教えてください。', 'zh-Hans': 'OutputFirst 将始终保留免费版。告诉我们 Pro 版需要包含什么才对你有价值。', 'zh-Hant': 'OutputFirst 將始終保留免費版。告訴我們 Pro 版需要包含什麼才對你有價值。' }).primary}
          </p>
        </div>

        <fieldset className="mb-6 space-y-3">
          <legend className="text-sm text-foreground font-medium mb-3">
            {t({ fr: 'Qu\'est-ce qui compterait le plus ? (cochez ce que vous voulez)', en: 'What would matter most? (pick any)', es: '¿Qué importaría más? (elige los que quieras)', ja: '一番気になるものは？（複数可）', 'zh-Hans': '哪些最重要？（任选）', 'zh-Hant': '哪些最重要？（任選）' }).primary}
          </legend>
          {PRO_WAITLIST_FEATURES.map(key => {
            const copy = featureCopy[key];
            const checked = selected.has(key);
            return (
              <label
                key={key}
                data-testid={`prowaitlist-feature-${key}`}
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                  checked ? 'bg-primary/10 border-primary/40' : 'bg-card border-border hover:bg-muted/40'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleFeature(key)}
                  className="mt-1 w-4 h-4 accent-primary"
                  aria-label={copy.title.primary}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-foreground font-medium">{copy.title.primary}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{copy.description.primary}</p>
                </div>
              </label>
            );
          })}
        </fieldset>

        <div className="mb-6">
          <label htmlFor="prowaitlist-other" className="block text-sm text-foreground font-medium mb-2">
            {t({ fr: 'Autre chose ?', en: 'Anything else?', es: '¿Algo más?', ja: 'ほかに何かありますか？', 'zh-Hans': '还有别的吗？', 'zh-Hant': '還有別的嗎？' }).primary}
          </label>
          <Textarea
            id="prowaitlist-other"
            data-testid="prowaitlist-other"
            value={otherText}
            onChange={e => setOtherText(e.target.value)}
            placeholder={t({ fr: 'Une fonctionnalité, une critique, un rêve...', en: 'A feature, a critique, a wish...', es: 'Una función, una crítica, un deseo...', ja: '機能、ご意見、夢…', 'zh-Hans': '功能、想法、批评…都可以', 'zh-Hant': '功能、想法、批評…都可以' }).primary}
            className="min-h-[100px] resize-none"
          />
        </div>

        <div className="mb-8">
          <label htmlFor="prowaitlist-email" className="block text-sm text-foreground font-medium mb-2">
            {t({ fr: 'Email (facultatif)', en: 'Email (optional)', es: 'Email (opcional)', ja: 'メールアドレス（任意）', 'zh-Hans': '邮箱（可选）', 'zh-Hant': '電子郵件（選填）' }).primary}
          </label>
          <Input
            id="prowaitlist-email"
            data-testid="prowaitlist-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder={t({ fr: 'Pour vous notifier au lancement, rien d\'autre.', en: 'We\'ll only email about Pro launches.', es: 'Solo te escribiremos sobre el lanzamiento de Pro.', ja: 'Pro リリース時のお知らせのみに使います。', 'zh-Hans': '仅在 Pro 上线时通知你，不做其他用途。', 'zh-Hant': '僅在 Pro 上線時通知你，不做其他用途。' }).primary}
            autoComplete="email"
            inputMode="email"
          />
        </div>

        {error && (
          <p data-testid="prowaitlist-error" className="text-sm text-destructive mb-4">
            {error}
          </p>
        )}

        <div className="space-y-3">
          <Button
            data-testid="prowaitlist-submit"
            variant="default"
            size="full"
            onClick={handleSubmit}
            disabled={loading}
          >
            <Send className="w-5 h-5 mr-2" />
            {loading
              ? t({ fr: 'Envoi...', en: 'Sending...', es: 'Enviando...', ja: '送信中...', 'zh-Hans': '发送中...', 'zh-Hant': '傳送中...' }).primary
              : t({ fr: 'Envoyer mon vote', en: 'Send my vote', es: 'Enviar mi voto', ja: '投票を送る', 'zh-Hans': '提交我的投票', 'zh-Hant': '提交我的投票' }).primary}
          </Button>

          <Button
            data-testid="prowaitlist-skip"
            variant="skip"
            size="full"
            onClick={onBack}
          >
            <ArrowRight className="w-5 h-5 mr-2" />
            {t({ fr: 'Passer', en: 'Skip', es: 'Omitir', ja: 'スキップ', 'zh-Hans': '跳过', 'zh-Hant': '跳過' }).primary}
          </Button>
        </div>
      </div>
    </div>
  );
}
