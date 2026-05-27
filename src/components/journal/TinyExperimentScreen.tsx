import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, FlaskConical, Check, Pause, Play, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useExperiments } from '@/hooks/useExperiments';

interface TinyExperimentScreenProps {
  onBack: () => void;
}

type DurationOption = { label: string; days: number };

const DURATIONS: DurationOption[] = [
  { label: '1 week', days: 7 },
  { label: '2 weeks', days: 14 },
  { label: '1 month', days: 30 },
];

export function TinyExperimentScreen({ onBack }: TinyExperimentScreenProps) {
  const { bilingual, t } = useLanguage();
  const {
    activeExperiment,
    pastExperiments,
    checkins,
    checkedInToday,
    isExpired,
    daysTotal,
    daysElapsed,
    loading,
    addExperiment,
    checkIn,
    completeExperiment,
    pauseExperiment,
    resumeExperiment,
  } = useExperiments();

  // Creation state
  const [action, setAction] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<DurationOption | null>(null);
  const [creating, setCreating] = useState(false);

  // Reflection state
  const [reflPlus, setReflPlus] = useState('');
  const [reflMinus, setReflMinus] = useState('');
  const [reflNext, setReflNext] = useState('');
  const [completing, setCompleting] = useState(false);

  const durationLabels: Record<number, string> = {
    7: t({ fr: '1 semaine', en: '1 week', es: '1 semana', ja: '1週間', 'zh-Hans': '1 周', 'zh-Hant': '1 週' }).primary,
    14: t({ fr: '2 semaines', en: '2 weeks', es: '2 semanas', ja: '2週間', 'zh-Hans': '2 周', 'zh-Hant': '2 週' }).primary,
    30: t({ fr: '1 mois', en: '1 month', es: '1 mes', ja: '1ヶ月', 'zh-Hans': '1 个月', 'zh-Hant': '1 個月' }).primary,
  };

  const handleCreate = async () => {
    if (!action.trim() || !selectedDuration) return;
    setCreating(true);
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + selectedDuration.days);
    await addExperiment(action.trim(), selectedDuration.label, endsAt);
    setAction('');
    setSelectedDuration(null);
    setCreating(false);
  };

  const handleCheckIn = async () => {
    if (!activeExperiment) return;
    await checkIn(activeExperiment.id);
  };

  const handleComplete = async () => {
    if (!activeExperiment) return;
    setCompleting(true);
    await completeExperiment(activeExperiment.id, reflPlus, reflMinus, reflNext);
    setReflPlus('');
    setReflMinus('');
    setReflNext('');
    setCompleting(false);
  };

  const handlePause = async () => {
    if (!activeExperiment) return;
    await pauseExperiment(activeExperiment.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground animate-gentle-pulse">
          {t({ fr: 'Chargement…', en: 'Loading…', es: 'Cargando…', ja: '読み込み中…', 'zh-Hans': '加载中…', 'zh-Hant': '載入中…' }).primary}
        </p>
      </div>
    );
  }

  // Determine screen state
  const showReflection = activeExperiment && isExpired;
  const showActive = activeExperiment && !isExpired;
  const showCreation = !activeExperiment;

  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-12">
      <div className="w-full max-w-md space-y-8 animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-serif text-2xl text-foreground">
              {bilingual({ fr: 'Mes petites expériences', en: 'My Tiny Experiments', es: 'Mis pequeños experimentos', ja: '小さな実験', 'zh-Hans': '我的小实验', 'zh-Hant': '我的小實驗' })}
            </h1>
          </div>
          <FlaskConical className="w-5 h-5 text-primary" />
        </div>

        {/* ─── REFLECTION STATE ─── */}
        {showReflection && (
          <div className="space-y-6">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center space-y-2">
              <Sparkles className="w-6 h-6 text-primary mx-auto" />
              <p className="font-serif text-lg text-foreground">
                {t({ fr: 'Votre expérience est terminée !', en: 'Your experiment is complete!', es: '¡Tu experimento terminó!', ja: '実験が完了しました！', 'zh-Hans': '你的实验完成啦！', 'zh-Hant': '你的實驗完成啦！' }).primary}
              </p>
              <p className="text-sm text-muted-foreground italic">
                "{activeExperiment.action}"
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  ➕ {bilingual({ fr: 'Ce qui a marché', en: 'What worked', es: 'Lo que funcionó', ja: '良かったこと', 'zh-Hans': '有效的部分', 'zh-Hant': '有效的部分' })}
                </label>
                <Textarea
                  value={reflPlus}
                  onChange={e => setReflPlus(e.target.value)}
                  placeholder={t(
                    { fr: "Qu'est-ce qui vous a plu ?", en: 'What did you enjoy?', es: '¿Qué disfrutaste?', ja: '何が楽しかったですか？', 'zh-Hans': '你享受了什么？', 'zh-Hant': '你享受了什麼？' }
                  ).primary}
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  ➖ {bilingual({ fr: 'Ce qui manquait', en: 'What was missing', es: 'Lo que faltó', ja: '足りなかったこと', 'zh-Hans': '缺少的部分', 'zh-Hant': '缺少的部分' })}
                </label>
                <Textarea
                  value={reflMinus}
                  onChange={e => setReflMinus(e.target.value)}
                  placeholder={t(
                    { fr: "Qu'est-ce qui a été difficile ?", en: 'What was difficult?', es: '¿Qué fue difícil?', ja: '難しかったことは？', 'zh-Hans': '什么是难的？', 'zh-Hant': '什麼是難的？' }
                  ).primary}
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  ➡️ {bilingual({ fr: 'Et maintenant', en: 'What next', es: 'Y ahora', ja: 'これから', 'zh-Hans': '接下来', 'zh-Hant': '接下來' })}
                </label>
                <Textarea
                  value={reflNext}
                  onChange={e => setReflNext(e.target.value)}
                  placeholder={t(
                    { fr: 'Quelle est la prochaine étape ?', en: "What's the next step?", es: '¿Cuál es el siguiente paso?', ja: '次のステップは？', 'zh-Hans': '下一步是什么？', 'zh-Hant': '下一步是什麼？' }
                  ).primary}
                  className="min-h-[80px]"
                />
              </div>
            </div>

            <Button
              variant="default"
              size="full"
              onClick={handleComplete}
              disabled={completing}
            >
              <Check className="w-5 h-5 mr-2" />
              {t({ fr: 'Terminer et archiver', en: 'Complete & archive', es: 'Completar y archivar', ja: '完了してアーカイブ', 'zh-Hans': '完成并归档', 'zh-Hant': '完成並封存' }).primary}
            </Button>
          </div>
        )}

        {/* ─── ACTIVE STATE ─── */}
        {showActive && (
          <div className="space-y-6">
            {/* Experiment statement */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                {t({ fr: 'Je vais...', en: 'I will...', es: 'Yo voy a...', ja: '私は…します', 'zh-Hans': '我会……', 'zh-Hant': '我會……' }).primary}
              </p>
              <p className="font-serif text-xl text-foreground">
                {activeExperiment.action}
              </p>
              <p className="text-sm text-muted-foreground">
                {t({ fr: 'pendant', en: 'for', es: 'durante', ja: '期間：', 'zh-Hans': '持续', 'zh-Hant': '持續' }).primary} {activeExperiment.duration}
              </p>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <Progress value={daysTotal > 0 ? (daysElapsed / daysTotal) * 100 : 0} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                {t(
                  { fr: `Jour ${daysElapsed} sur ${daysTotal}`, en: `Day ${daysElapsed} of ${daysTotal}`, es: `Día ${daysElapsed} de ${daysTotal}`, ja: `${daysTotal}日中${daysElapsed}日目`, 'zh-Hans': `第 ${daysElapsed} 天 / 共 ${daysTotal} 天`, 'zh-Hant': `第 ${daysElapsed} 天 / 共 ${daysTotal} 天` }
                ).primary}
              </p>
            </div>

            {/* Calendar dots */}
            <div className="flex flex-wrap gap-1.5 justify-center">
              {Array.from({ length: daysTotal }, (_, i) => {
                const date = new Date(activeExperiment.started_at);
                date.setDate(date.getDate() + i);
                const dateStr = date.toISOString().split('T')[0];
                const didCheckIn = checkins.some(c => c.date === dateStr && c.showed_up);
                const isFuture = date > new Date();
                return (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full transition-all ${
                      didCheckIn
                        ? 'bg-primary'
                        : isFuture
                          ? 'bg-muted'
                          : 'bg-muted-foreground/20'
                    }`}
                  />
                );
              })}
            </div>

            {/* Check-in button */}
            <Button
              variant={checkedInToday ? 'outline' : 'default'}
              size="full"
              onClick={handleCheckIn}
              disabled={checkedInToday}
              className={checkedInToday ? '' : 'animate-breathe'}
            >
              {checkedInToday ? (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  {t({ fr: 'Déjà noté aujourd\'hui', en: 'Checked in today', es: 'Ya registrado hoy', ja: '今日はチェックイン済み', 'zh-Hans': '今天已打卡', 'zh-Hant': '今天已打卡' }).primary}
                </>
              ) : (
                t(
                  { fr: 'Est-ce que ça vous a attiré·e aujourd\'hui ?', en: 'Did this pull you in today?', es: '¿Te atrajo hoy?', ja: '今日は気持ちが向きましたか？', 'zh-Hans': '今天有被它吸引到吗？', 'zh-Hant': '今天有被它吸引到嗎？' }
                ).primary
              )}
            </Button>

            {/* Pause button */}
            <Button variant="ghost" size="sm" onClick={handlePause} className="w-full text-muted-foreground">
              <Pause className="w-4 h-4 mr-1" />
              {t({ fr: 'Mettre en pause', en: 'Pause', es: 'Pausar', ja: '一時停止', 'zh-Hans': '暂停', 'zh-Hant': '暫停' }).primary}
            </Button>
          </div>
        )}

        {/* ─── CREATION STATE ─── */}
        {showCreation && (
          <div className="space-y-6">
            <p className="text-center text-muted-foreground text-sm">
              {t(
                { fr: "De quoi êtes-vous curieux·se ?", en: "What are you curious about?", es: "¿De qué tienes curiosidad?", ja: 'どんなことに興味がありますか？', 'zh-Hans': '你对什么感到好奇？', 'zh-Hant': '你對什麼感到好奇？' }
              ).primary}
            </p>

            {/* Fill-in prompt */}
            <div className="space-y-4 rounded-xl border border-border bg-card p-5">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">
                  {t({ fr: 'Je vais...', en: 'I will...', es: 'Yo voy a...', ja: '私は…します', 'zh-Hans': '我会……', 'zh-Hant': '我會……' }).primary}
                </label>
                <Input
                  value={action}
                  onChange={e => setAction(e.target.value)}
                  placeholder={t(
                    { fr: 'méditer 5 minutes chaque matin', en: 'meditate 5 minutes each morning', es: 'meditar 5 minutos cada mañana', ja: '毎朝5分間瞑想する', 'zh-Hans': '每天早上冥想 5 分钟', 'zh-Hant': '每天早上冥想 5 分鐘' }
                  ).primary}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && action.trim() && selectedDuration) handleCreate();
                  }}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">
                  {t({ fr: 'pendant...', en: 'for...', es: 'durante...', ja: '期間…', 'zh-Hans': '持续…', 'zh-Hant': '持續…' }).primary}
                </label>
                <div className="flex gap-2">
                  {DURATIONS.map(d => (
                    <button
                      key={d.days}
                      onClick={() => setSelectedDuration(d)}
                      className={`flex-1 rounded-full px-3 py-2 text-sm border transition-all ${
                        selectedDuration?.days === d.days
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-card text-foreground border-border hover:border-primary/40'
                      }`}
                    >
                      {durationLabels[d.days]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Button
              variant="default"
              size="full"
              onClick={handleCreate}
              disabled={!action.trim() || !selectedDuration || creating}
            >
              <FlaskConical className="w-5 h-5 mr-2" />
              {t({ fr: 'Commencer l\'expérience', en: 'Start experiment', es: 'Iniciar experimento', ja: '実験を始める', 'zh-Hans': '开始实验', 'zh-Hant': '開始實驗' }).primary}
            </Button>
          </div>
        )}

        {/* ─── PAST EXPERIMENTS ─── */}
        {pastExperiments.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-border">
            <h2 className="text-sm font-medium text-muted-foreground">
              {t({ fr: 'Expériences passées', en: 'Past experiments', es: 'Experimentos pasados', ja: '過去の実験', 'zh-Hans': '过往实验', 'zh-Hant': '過往實驗' }).primary}
            </h2>
            {pastExperiments.map(exp => (
              <div key={exp.id} className="rounded-lg border border-border bg-card p-3 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm text-foreground">{exp.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {exp.duration} · {exp.status === 'completed'
                        ? t({ fr: 'terminé', en: 'completed', es: 'completado', ja: '完了', 'zh-Hans': '已完成', 'zh-Hant': '已完成' }).primary
                        : t({ fr: 'en pause', en: 'paused', es: 'en pausa', ja: '一時停止中', 'zh-Hans': '已暂停', 'zh-Hant': '已暫停' }).primary}
                    </p>
                  </div>
                  {exp.status === 'paused' && !activeExperiment && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => resumeExperiment(exp.id)}
                      className="shrink-0 text-primary hover:text-primary"
                      title={t({ fr: 'Reprendre', en: 'Resume', es: 'Reanudar', ja: '再開', 'zh-Hans': '继续', 'zh-Hant': '繼續' }).primary}
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {exp.reflection_plus && (
                  <p className="text-xs text-muted-foreground mt-1">
                    ➕ {exp.reflection_plus}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
