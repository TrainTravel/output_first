import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Feather, CheckCircle2, Zap, Sprout, LogOut, Flame, CalendarDays, Mountain, PenLine, Trophy, Hourglass, Target, ListChecks, ChevronDown, ChevronUp, FlaskConical, Activity, LayoutGrid, Sparkles, Heart, Waves } from 'lucide-react';
import { useState } from 'react';
import { BADGES } from '@/types/journal';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { GardenThemeSelector } from './GardenThemeSelector';
import { ProfileChip } from './ProfileChip';
import { FontPicker } from '@/components/FontPicker';
import { languageNameFor } from '@/lib/languageNames';
import { SelfCompassionSeed } from './SelfCompassionSeed';
import { EmotionFrequencyNudge } from './EmotionFrequencyNudge';
import { Badge } from '@/types/journal';
import { useProWaitlist } from '@/hooks/useProWaitlist';

interface HomeScreenProps {
  hasJournaledToday: boolean;
  streak: number;
  totalDays: number;
  totalWords: number;
  earnedBadges: Badge[];
  onStartJournal: () => void;
  onStartFreeWrite: () => void;
  onViewProgress: () => void;
  onOpenChat: () => void;
  onOpenBrainDump: () => void;
  onOpenSmallWins: () => void;
  onOpenThoughtGarden: () => void;
  onOpenZenGarden: () => void;
  onOpenSandTimer: () => void;
  onOpenFocusPlan: () => void;
  onOpenTodoList: () => void;
  onOpenTinyExperiment: () => void;
  onOpenBodyScan: () => void;
  onOpenQuadrants: () => void;
  onOpenLanguageSettings: () => void;
  onOpenVocabulary: () => void;
  onOpenProWaitlist: () => void;
  onOpenCirculationFeed: () => void;
}

export function HomeScreen({ hasJournaledToday, streak, totalDays, totalWords, earnedBadges, onStartJournal, onStartFreeWrite, onViewProgress, onOpenChat, onOpenBrainDump, onOpenSmallWins, onOpenThoughtGarden, onOpenZenGarden, onOpenSandTimer, onOpenFocusPlan, onOpenTodoList, onOpenTinyExperiment, onOpenBodyScan, onOpenQuadrants, onOpenLanguageSettings, onOpenVocabulary, onOpenProWaitlist, onOpenCirculationFeed }: HomeScreenProps) {
  const { submitted: proWaitlistSubmitted } = useProWaitlist();
  const { bilingual, t, targetLang } = useLanguage();
  const isFr = targetLang === 'fr';
  const isEs = targetLang === 'es';
  const { signOut, user } = useAuth();
  const [showMore, setShowMore] = useState(false);
  const today = new Date();
  const primaryLocale = isFr ? 'fr-FR' : isEs ? 'es-ES' : 'en-US';
  const secondaryLocale = isFr ? 'en-US' : isEs ? 'en-US' : 'fr-FR';
  const frStyle = { day: 'numeric' as const, month: 'long' as const };
  const enStyle = { month: 'long' as const, day: 'numeric' as const };
  const formattedDatePrimary = today.toLocaleDateString(primaryLocale, {
    weekday: 'long',
    ...(isFr || isEs ? frStyle : enStyle),
  });
  const formattedDateSecondary = today.toLocaleDateString(secondaryLocale, {
    weekday: 'long',
    ...(!isFr && !isEs ? frStyle : enStyle),
  });

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-12 animate-fade-in-up">
        {/* Language Toggle */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1">
            {user && !user.is_anonymous && (
              <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground">
                <LogOut className="w-4 h-4 mr-1" />
                {t({ fr: 'Déconnexion', en: 'Sign out', es: 'Cerrar sesión', ja: 'ログアウト', 'zh-Hans': '退出登录', 'zh-Hant': '登出' }).primary}
              </Button>
            )}
            <GardenThemeSelector />
          </div>
          <ProfileChip onOpenLanguageSettings={onOpenLanguageSettings} />
        </div>

        {/* Date */}
        <div className="text-center space-y-2">
          <p className="text-foreground/80 text-sm tracking-wide capitalize">
            {formattedDatePrimary}
          </p>
          <p className="text-muted-foreground text-xs tracking-wide">
            {formattedDateSecondary}
          </p>
          <h1 className="font-serif text-4xl md:text-5xl text-foreground mt-4">
            OutputFirst
          </h1>
          <p className="text-muted-foreground text-sm italic">
            {(() => {
              const ln = languageNameFor(targetLang);
              return t({
                fr: `Journaling en ${ln.fr}`,
                en: `${ln.en} journaling practice`,
                es: `Práctica de journaling en ${ln.es}`,
                ja: `${ln.ja}日記の練習`,
                'zh-Hans': `${ln['zh-Hans']}日记练习`,
                'zh-Hant': `${ln['zh-Hant']}日記練習`,
              }).primary;
            })()}
          </p>
        </div>

        {/* Status Badge Only */}
        {hasJournaledToday && (
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm font-medium">{t({ fr: 'Terminé', en: 'Completed', es: 'Completado', ja: '完了', 'zh-Hans': '已完成', 'zh-Hant': '已完成' }).primary}</span>
            </div>
          </div>
        )}

        {/* Daily self-compassion seed */}
        <SelfCompassionSeed lang={targetLang} />

        {/* Compact Progress Card */}
        <button
          onClick={onViewProgress}
          className="w-full rounded-xl border-2 border-primary/20 bg-primary/5 text-card-foreground shadow-sm px-4 py-3 hover:shadow-md hover:border-primary/40 transition-all cursor-pointer text-left space-y-2"
        >
          <div className="flex items-center justify-center gap-3 text-sm">
            <span className="flex items-center gap-1 font-semibold text-foreground">
              <Flame className="w-4 h-4 text-primary" /> {streak}
            </span>
            <span className="text-border">│</span>
            <span className="flex items-center gap-1 font-semibold text-foreground">
              <CalendarDays className="w-4 h-4 text-accent-foreground" /> {totalDays}
            </span>
            <span className="text-border">│</span>
            <span className="text-muted-foreground">{totalWords} {t({ fr: 'mots', en: 'words', es: 'palabras', ja: '文字', 'zh-Hans': '字', 'zh-Hant': '字' }).primary}</span>
          </div>
          <TooltipProvider delayDuration={200}>
            <div className="flex items-center justify-center gap-2">
              {BADGES.map((badge) => {
                const earned = earnedBadges.some((b) => b.id === badge.id);
                return (
                  <Tooltip key={badge.id}>
                    <TooltipTrigger asChild>
                      <span
                        className={`text-lg transition-all cursor-default ${earned ? 'animate-scale-in' : 'opacity-30 grayscale'}`}
                      >
                        {badge.icon}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-center">
                      <p className="font-medium">{t({ fr: badge.fr, en: badge.en, es: badge.es, ja: badge.ja, 'zh-Hans': badge['zh-Hans'], 'zh-Hant': badge['zh-Hant'] }).primary}</p>
                      <p className="text-xs text-muted-foreground">
                        {earned
                          ? `✓ ${t({ fr: 'Obtenu', en: 'Earned', es: 'Obtenido', ja: '獲得', 'zh-Hans': '已获得', 'zh-Hant': '已獲得' }).primary}`
                          : `${badge.threshold} ${t({ fr: 'mots', en: 'words', es: 'palabras', ja: '文字', 'zh-Hans': '字', 'zh-Hant': '字' }).primary}`
                        }
                      </p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
              {(() => {
                const nextBadge = BADGES.find((b) => totalWords < b.threshold);
                if (!nextBadge) return null;
                return (
                  <span className="text-xs text-muted-foreground ml-1">
                    ({totalWords}/{nextBadge.threshold})
                  </span>
                );
              })()}
            </div>
          </TooltipProvider>
        </button>

        {/* Font Picker (a11y) */}
        <FontPicker />

        {/* Main Actions */}
        <div className="space-y-3">
          <Button
            variant="default"
            size="full"
            onClick={onStartJournal}
            className="animate-breathe"
          >
            <Feather className="w-5 h-5 mr-2" />
            {hasJournaledToday
              ? bilingual({
                  fr: 'Écrire encore',
                  en: 'Write another',
                  es: 'Escribir más',
                  ja: 'もう一度書きましょう',
                  'zh-Hans': '再写一篇',
                  'zh-Hant': '再寫一篇',
                })
              : bilingual({
                  fr: "Écrire aujourd'hui",
                  en: 'Write today',
                  es: 'Escribir hoy',
                  ja: '今日書きましょう',
                  'zh-Hans': '今天写日记',
                  'zh-Hant': '今天寫日記',
                })
            }
          </Button>

          <Button variant="outline" size="full" onClick={onOpenBrainDump}>
            <Zap className="w-5 h-5 mr-2" />
            {bilingual({ fr: 'Vide-tête', en: 'Brain Dump', es: 'Volcado mental', ja: '脳のメモ', 'zh-Hans': '想法清空', 'zh-Hant': '想法清空' })}
          </Button>

          <Button variant="outline" size="full" onClick={onOpenThoughtGarden}>
            <Sprout className="w-5 h-5 mr-2" />
            {bilingual({ fr: 'Jardin de pensées', en: 'Thought Garden', es: 'Jardín de pensamientos', ja: '思考の庭', 'zh-Hans': '思绪花园', 'zh-Hant': '思緒花園' })}
          </Button>

          {/* More tools toggle */}
          <button
            onClick={() => setShowMore(v => !v)}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {showMore ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {t({ fr: 'Autres outils', en: 'More tools', es: 'Más herramientas', ja: 'その他のツール', 'zh-Hans': '更多工具', 'zh-Hant': '更多工具' }).primary}
          </button>

          {showMore && (
            <div className="space-y-3 animate-fade-in-up">
              <Button variant="outline" size="full" onClick={onStartFreeWrite}>
                <PenLine className="w-5 h-5 mr-2" />
                {bilingual({ fr: 'Écrire librement', en: 'Free Write', es: 'Escritura libre', ja: '自由に書く', 'zh-Hans': '自由写作', 'zh-Hant': '自由寫作' })}
              </Button>

              <Button variant="outline" size="full" onClick={onOpenFocusPlan} className="bg-accent/10 border-accent/30">
                <Target className="w-5 h-5 mr-2" />
                {bilingual({ fr: 'Un truc à la fois', en: 'One Thing at a Time', es: 'Una cosa a la vez', ja: '一度に一つ', 'zh-Hans': '一次一件事', 'zh-Hant': '一次一件事' })}
              </Button>

              <Button variant="outline" size="full" onClick={onOpenTodoList}>
                <ListChecks className="w-5 h-5 mr-2" />
                {bilingual({ fr: 'Liste A/B/C', en: 'ABC List', es: 'Lista A/B/C', ja: 'A/B/Cリスト', 'zh-Hans': 'A/B/C 清单', 'zh-Hant': 'A/B/C 清單' })}
              </Button>

              <button
                data-testid="home-tile-quadrants"
                onClick={onOpenQuadrants}
                className="w-full h-14 rounded-xl px-6 flex items-center gap-3 border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-all duration-300 text-left"
              >
                <LayoutGrid className="w-5 h-5 shrink-0" />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium whitespace-normal h-auto leading-tight">
                    {bilingual({
                      fr: 'Matrice de priorités',
                      en: 'Priority Quadrants',
                      es: 'Matriz de prioridades',
                      ja: '優先順位マトリックス',
                      'zh-Hans': '优先级矩阵',
                      'zh-Hant': '優先級矩陣',
                    })}
                  </span>
                  <span className="block text-xs text-muted-foreground mt-0.5">
                    {t({
                      fr: 'Vos pensées et tâches, classées.',
                      en: 'Your thoughts and tasks, sorted.',
                      es: 'Tus pensamientos y tareas, clasificados.',
                      ja: '思考とタスクを分類。',
                      'zh-Hans': '想法和任务，已分类。',
                      'zh-Hant': '想法和任務，已分類。',
                    }).primary}
                  </span>
                </span>
              </button>

              <Button variant="outline" size="full" onClick={onOpenSmallWins}>
                <Trophy className="w-5 h-5 mr-2" />
                {bilingual({ fr: 'Petites Victoires', en: 'Small Wins', es: 'Pequeños Logros', ja: '小さな勝利', 'zh-Hans': '小成就', 'zh-Hant': '小成就' })}
              </Button>

              <Button variant="outline" size="full" onClick={onOpenTinyExperiment}>
                <FlaskConical className="w-5 h-5 mr-2" />
                {bilingual({ fr: 'Petites expériences', en: 'Tiny Experiments', es: 'Pequeños experimentos', ja: '小さな実験', 'zh-Hans': '微小实验', 'zh-Hant': '微小實驗' })}
              </Button>

              <Button variant="outline" size="full" onClick={onOpenZenGarden}>
                <Mountain className="w-5 h-5 mr-2" />
                {bilingual({ fr: 'Jardin Zen', en: 'Zen Garden', es: 'Jardín Zen', ja: '禅の庭', 'zh-Hans': '禅意花园', 'zh-Hant': '禪意花園' })}
              </Button>

              <Button variant="outline" size="full" onClick={onOpenSandTimer}>
                <Hourglass className="w-5 h-5 mr-2" />
                {bilingual({ fr: 'Sablier', en: 'Sand Timer', es: 'Reloj de arena', ja: '砂時計', 'zh-Hans': '沙漏', 'zh-Hant': '沙漏' })}
              </Button>

              <Button variant="outline" size="full" onClick={onOpenBodyScan}>
                <Activity className="w-5 h-5 mr-2" />
                {bilingual({ fr: 'Scan corporel', en: 'Body Scan', es: 'Escaneo corporal', ja: 'ボディスキャン', 'zh-Hans': '身体扫描', 'zh-Hant': '身體掃描' })}
              </Button>
            </div>
          )}

          {/* Vague-word frequency mirror — nudges toward higher emotional granularity */}
          <EmotionFrequencyNudge onOpenVocabulary={() => onOpenVocabulary?.()} />

          {/* Vocabulary Progress Card */}
          <button
            onClick={onOpenVocabulary}
            className="w-full rounded-xl border border-border bg-card text-card-foreground p-3 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer text-left flex items-center gap-3"
          >
            <div className="rounded-full bg-primary/10 p-2">
              <Sprout className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground font-medium">
                {t({ fr: 'Vocabulaire émotionnel', en: 'Emotion vocabulary', es: 'Vocabulario emocional', ja: '感情語彙', 'zh-Hans': '情绪词汇', 'zh-Hant': '情緒詞彙' }).primary}
              </p>
              <p className="text-xs text-muted-foreground">
                {t({ fr: 'Explorer vos mots', en: 'Explore your words', es: 'Explora tus palabras', ja: '言葉を探検する', 'zh-Hans': '探索你的词汇', 'zh-Hant': '探索你的詞彙' }).primary} →
              </p>
            </div>
          </button>

          {/* Circulation of Love — opt-in anonymous sharing in primary language. */}
          <button
            data-testid="home-circulation-tile"
            onClick={onOpenCirculationFeed}
            className="w-full rounded-xl border border-border bg-card text-card-foreground p-3 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer text-left flex items-center gap-3"
          >
            <div className="rounded-full bg-primary/10 p-2">
              <Waves className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground font-medium">
                {t({ fr: "Circulation d'amour", en: 'Circulation of Love', es: 'Circulación del Amor', ja: '愛の循環', 'zh-Hans': '爱的流转', 'zh-Hant': '愛的流轉' }).primary}
              </p>
              <p className="text-xs text-muted-foreground">
                {t({ fr: 'Lettres anonymes dans votre langue', en: 'Anonymous letters in your language', es: 'Cartas anónimas en tu idioma', ja: 'あなたの言語の匿名の手紙', 'zh-Hans': '用你的语言写的匿名信', 'zh-Hant': '用你的語言寫的匿名信' }).primary} →
              </p>
            </div>
          </button>

          <p className="text-center text-muted-foreground text-sm pt-2">
            {t({ fr: 'Une ou deux phrases suffisent.', en: 'One or two sentences is enough.', es: 'Una o dos frases bastan.', ja: '一文か二文で十分です。', 'zh-Hans': '一两句话就够了。', 'zh-Hant': '一兩句話就夠了。' }).primary}
          </p>

          {!proWaitlistSubmitted && (
            <button
              data-testid="home-pro-waitlist-cta"
              onClick={onOpenProWaitlist}
              className="w-full mt-2 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 px-4 py-3 transition-colors cursor-pointer text-left flex items-center gap-3 group"
            >
              <div className="rounded-full bg-primary/15 p-2 group-hover:bg-primary/25 transition-colors">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground font-medium">
                  {t({ fr: 'Aidez à façonner Pro', en: 'Help shape Pro', es: 'Ayuda a dar forma a Pro', ja: 'Pro を一緒に形作る', 'zh-Hans': '一起塑造 Pro', 'zh-Hant': '一起塑造 Pro' }).primary}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t({ fr: 'Dites-nous ce qui rendrait Pro utile.', en: 'Tell us what would make Pro worth it.', es: 'Cuéntanos qué haría Pro valga la pena.', ja: 'Pro を価値あるものにする要素を教えてください。', 'zh-Hans': '告诉我们什么会让 Pro 值得。', 'zh-Hant': '告訴我們什麼會讓 Pro 值得。' }).primary}
                </p>
              </div>
            </button>
          )}

          {/* Support link — opens the user-configured tip URL in a new tab. */}
          {/* If VITE_SUPPORT_URL is not set at build time, the link is hidden — */}
          {/* this keeps the dev environment clean while letting prod show it. */}
          {import.meta.env.VITE_SUPPORT_URL && (
            <a
              data-testid="home-support-cta"
              href={import.meta.env.VITE_SUPPORT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full mt-2 rounded-xl border border-accent/30 bg-accent/5 hover:bg-accent/10 px-4 py-3 transition-colors cursor-pointer text-left flex items-center gap-3 group"
            >
              <div className="rounded-full bg-accent/15 p-2 group-hover:bg-accent/25 transition-colors">
                <Heart className="w-4 h-4 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground font-medium">
                  {t({ fr: 'Soutenir cette appli', en: 'Support this app', es: 'Apoyar esta app', ja: 'このアプリを支援する', 'zh-Hans': '支持这个应用', 'zh-Hant': '支持這個應用' }).primary}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t({ fr: 'Si ça vous aide, offrez un café. Merci.', en: 'If it helps you, buy a coffee. Thanks.', es: 'Si te ayuda, invita un café. Gracias.', ja: '役に立ったら、コーヒーをご馳走してください。', 'zh-Hans': '如果它帮到你，请我喝杯咖啡，谢谢。', 'zh-Hant': '如果它幫到你，請我喝杯咖啡，謝謝。' }).primary}
                </p>
              </div>
            </a>
          )}
        </div>

      </div>
    </main>
  );
}
