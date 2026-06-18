import { ArrowLeft } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCirculationSettings, type TTLDays } from '@/hooks/useCirculationSettings';

interface CirculationSettingsScreenProps {
  onBack: () => void;
}

export function CirculationSettingsScreen({ onBack }: CirculationSettingsScreenProps) {
  const { t, bilingual } = useLanguage();
  const { settings, loading, error, update } = useCirculationSettings();

  const ttlChoices: TTLDays[] = [7, 14, 30];

  return (
    <div data-testid="circulation-settings-screen" className="min-h-screen flex flex-col px-6 py-12">
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
            {bilingual({ fr: "Circulation d'amour", en: 'Circulation of Love', es: 'Circulación del Amor', ja: '愛の循環', 'zh-Hans': '爱的流转', 'zh-Hant': '愛的流轉' })}
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            {t({
              fr: "Partager une lettre courte et anonyme avec d'autres dans votre langue. Elle dérive pendant un temps, puis se range.",
              en: 'Share a short, anonymous letter with others in your language. It drifts for a while, then quietly archives.',
              es: 'Comparte una carta corta y anónima con otros en tu idioma. Deriva un tiempo y luego se archiva en silencio.',
              ja: '短い匿名の手紙を、同じ言語の人たちと分かち合う。しばらく漂い、静かに片付きます。',
              'zh-Hans': '用你的语言分享一封简短的匿名信。它在水流中漂一段时间，然后静静归档。',
              'zh-Hant': '用你的語言分享一封簡短的匿名信。它在水流中漂一段時間，然後靜靜歸檔。',
            }).primary}
          </p>
        </div>

        <div className="space-y-6">
          <label className="flex items-start justify-between gap-4 cursor-pointer">
            <span>
              <span className="block text-sm font-medium text-foreground">
                {t({ fr: 'Recevoir des lettres', en: 'Receive letters', es: 'Recibir cartas', ja: '手紙を受け取る', 'zh-Hans': '接收信件', 'zh-Hant': '接收信件' }).primary}
              </span>
              <span className="block text-xs text-muted-foreground mt-1">
                {t({ fr: 'Voir le courant des autres dans votre langue.', en: 'See the current from others in your language.', es: 'Ver la corriente de otras personas en tu idioma.', ja: '同じ言語の他の人たちの流れを見る。', 'zh-Hans': '看到同语言其他人的水流。', 'zh-Hant': '看到同語言其他人的水流。' }).primary}
              </span>
            </span>
            <Switch
              data-testid="circulation-receive-toggle"
              checked={settings.receive_letters}
              disabled={loading}
              onCheckedChange={(v) => update({ receive_letters: v })}
            />
          </label>

          <label className="flex items-start justify-between gap-4 cursor-pointer">
            <span>
              <span className="block text-sm font-medium text-foreground">
                {t({ fr: 'Partager mes lettres', en: 'Share my letters', es: 'Compartir mis cartas', ja: '自分の手紙を送る', 'zh-Hans': '分享我的信件', 'zh-Hant': '分享我的信件' }).primary}
              </span>
              <span className="block text-xs text-muted-foreground mt-1">
                {t({ fr: 'Quand je relâche une lettre, elle entre dans le courant.', en: 'When I release a letter, it joins the current.', es: 'Cuando libero una carta, entra en la corriente.', ja: '手紙を放すと、流れに加わります。', 'zh-Hans': '当我放出一封信时，它会汇入水流。', 'zh-Hant': '當我放出一封信時，它會匯入水流。' }).primary}
              </span>
            </span>
            <Switch
              data-testid="circulation-share-toggle"
              checked={settings.share_letters}
              disabled={loading}
              onCheckedChange={(v) => update({ share_letters: v })}
            />
          </label>

          <div>
            <p className="text-sm font-medium text-foreground mb-3">
              {t({ fr: 'Durée du courant', en: 'How long each letter drifts', es: 'Cuánto tiempo deriva cada carta', ja: '手紙が漂う期間', 'zh-Hans': '每封信漂流的时间', 'zh-Hant': '每封信漂流的時間' }).primary}
            </p>
            <div className="flex gap-2">
              {ttlChoices.map(days => (
                <button
                  key={days}
                  type="button"
                  data-testid={`circulation-ttl-${days}`}
                  onClick={() => update({ ttl_days: days })}
                  disabled={loading}
                  className={`flex-1 rounded-2xl border px-4 py-3 text-sm transition-colors ${
                    settings.ttl_days === days
                      ? 'border-primary bg-primary/5 text-foreground'
                      : 'border-border text-muted-foreground hover:border-primary/40'
                  }`}
                >
                  {t({ fr: `${days} jours`, en: `${days} days`, es: `${days} días`, ja: `${days}日`, 'zh-Hans': `${days} 天`, 'zh-Hant': `${days} 天` }).primary}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-xs text-destructive">
              {t({ fr: "On n'a pas pu enregistrer. Réessayez.", en: "We couldn't save. Try again.", es: 'No pudimos guardar. Inténtalo de nuevo.', ja: '保存できませんでした。もう一度お試しください。', 'zh-Hans': '没能保存。请再试一次。', 'zh-Hant': '沒能保存。請再試一次。' }).primary}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
