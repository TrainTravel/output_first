import { useState } from 'react';
import { ArrowLeft, Check, Pencil, Archive, X } from 'lucide-react';
import { useLanguage, type PrimaryLang, type Profile, type Translations } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useQuotesEnabled } from '@/hooks/useQuotesEnabled';

interface LanguageSettingsScreenProps {
  onBack: () => void;
}

const PRIMARY_OPTIONS: ReadonlyArray<{ code: PrimaryLang; native: string; en: string }> = [
  { code: 'en',      native: 'English',  en: 'English'              },
  { code: 'fr',      native: 'Français', en: 'French'               },
  { code: 'es',      native: 'Español',  en: 'Spanish'              },
  { code: 'zh-Hans', native: '简体中文',  en: 'Chinese (Simplified)' },
  { code: 'zh-Hant', native: '繁體中文',  en: 'Chinese (Traditional)'},
];

function languageName(code: string): Translations {
  switch (code) {
    case 'fr': return { fr: 'Français', en: 'French', es: 'Francés', ja: 'フランス語', 'zh-Hans': '法语', 'zh-Hant': '法語' };
    case 'es': return { fr: 'Espagnol', en: 'Spanish', es: 'Español', ja: 'スペイン語', 'zh-Hans': '西班牙语', 'zh-Hant': '西班牙語' };
    case 'ja': return { fr: 'Japonais', en: 'Japanese', es: 'Japonés', ja: '日本語', 'zh-Hans': '日语', 'zh-Hant': '日語' };
    case 'zh-Hans': return { fr: 'Chinois simplifié', en: 'Simplified Chinese', es: 'Chino simplificado', ja: '中国語（簡体）', 'zh-Hans': '简体中文', 'zh-Hant': '簡體中文' };
    case 'zh-Hant': return { fr: 'Chinois traditionnel', en: 'Traditional Chinese', es: 'Chino tradicional', ja: '中国語（繁体）', 'zh-Hans': '繁体中文', 'zh-Hant': '繁體中文' };
    default: return { fr: code, en: code, es: code };
  }
}

export function LanguageSettingsScreen({ onBack }: LanguageSettingsScreenProps) {
  const {
    pair,
    setLangPair,
    t,
    bilingual,
    availablePrimaries,
    profiles,
    activeProfileId,
    switchProfile,
    renameProfile,
    archiveProfile,
  } = useLanguage();
  const [quotesEnabled, setQuotesEnabled] = useQuotesEnabled();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [confirmArchiveId, setConfirmArchiveId] = useState<string | null>(null);

  const live = profiles
    .filter(p => !p.archivedAt)
    .slice()
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const canArchive = live.length > 1;

  const onPickPrimary = (next: PrimaryLang) => setLangPair({ ...pair, primary: next });

  const startRename = (p: Profile, fallback: string) => {
    setEditingId(p.id);
    setEditingValue(p.name ?? fallback);
    setConfirmArchiveId(null);
  };
  const commitRename = () => {
    if (editingId) renameProfile(editingId, editingValue.trim());
    setEditingId(null);
    setEditingValue('');
  };
  const cancelRename = () => {
    setEditingId(null);
    setEditingValue('');
  };

  const requestArchive = (id: string) => {
    setConfirmArchiveId(id);
    setEditingId(null);
  };
  const confirmArchive = (id: string) => {
    archiveProfile(id);
    setConfirmArchiveId(null);
  };

  return (
    <div className="min-h-screen flex flex-col px-6 py-12">
      <div className="w-full max-w-lg mx-auto flex-1 flex flex-col animate-fade-in-up">
        <button
          onClick={onBack}
          className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-8 self-start"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span className="text-sm">{t({ fr: 'Retour', en: 'Back', es: 'Volver', ja: '戻る', 'zh-Hans': '返回', 'zh-Hant': '返回' }).primary}</span>
        </button>

        <div className="mb-10 space-y-2">
          <h2 className="font-serif text-2xl md:text-3xl text-foreground">
            {t({ fr: 'Réglages de langue', en: 'Language settings', es: 'Ajustes de idioma', ja: '言語設定', 'zh-Hans': '语言设置', 'zh-Hant': '語言設定' }).primary}
          </h2>
          <p className="text-muted-foreground italic">
            {t({ fr: 'Réglages de langue', en: 'Language settings', es: 'Ajustes de idioma', ja: '言語設定', 'zh-Hans': '语言设置', 'zh-Hant': '語言設定' }).secondary}
          </p>
        </div>

        <section className="mb-10" data-testid="profiles-section">
          <h3 className="font-medium text-foreground mb-3">
            {bilingual({ fr: 'Mes profils', en: 'My profiles', es: 'Mis perfiles', ja: 'マイプロファイル', 'zh-Hans': '我的档案', 'zh-Hant': '我的檔案' })}
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            {t({
              fr: 'Touchez la puce en haut à droite pour ajouter un profil.',
              en: 'Tap the chip in the top-right to add a profile.',
              es: 'Toca el chip arriba a la derecha para añadir un perfil.',
              ja: '右上のチップをタップしてプロファイルを追加します。',
              'zh-Hans': '点击右上角的标签添加档案。',
              'zh-Hant': '點選右上角的標籤新增檔案。',
            }).primary}
          </p>
          <ul className="space-y-2">
            {live.map(p => {
              const isActive = p.id === activeProfileId;
              const fallback = t(languageName(p.target)).primary;
              const isEditing = editingId === p.id;
              const isConfirming = confirmArchiveId === p.id;
              const renameAria = t({
                fr: `Renommer le profil ${fallback}`,
                en: `Rename profile ${fallback}`,
                es: `Renombrar perfil ${fallback}`,
                ja: `${fallback} のプロファイル名を変更`,
                'zh-Hans': `重命名档案 ${fallback}`,
                'zh-Hant': `重新命名檔案 ${fallback}`,
              }).primary;
              const archiveAria = t({
                fr: `Archiver le profil ${fallback}`,
                en: `Archive profile ${fallback}`,
                es: `Archivar perfil ${fallback}`,
                ja: `${fallback} のプロファイルをアーカイブ`,
                'zh-Hans': `归档档案 ${fallback}`,
                'zh-Hant': `封存檔案 ${fallback}`,
              }).primary;
              return (
                <li
                  key={p.id}
                  data-testid={`profile-row-${p.id}`}
                  className={`rounded-xl border-2 transition-all ${
                    isActive ? 'border-primary bg-primary/5' : 'border-border bg-card'
                  }`}
                >
                  <div className="flex items-center gap-2 px-3 py-2">
                    {isEditing ? (
                      <>
                        <Input
                          autoFocus
                          value={editingValue}
                          onChange={e => setEditingValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') commitRename();
                            if (e.key === 'Escape') cancelRename();
                          }}
                          placeholder={fallback}
                          className="h-8 flex-1"
                        />
                        <Button size="sm" variant="ghost" onClick={commitRename}>
                          {t({ fr: 'OK', en: 'Save', es: 'Guardar', ja: '保存', 'zh-Hans': '保存', 'zh-Hant': '儲存' }).primary}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={cancelRename} aria-label={t({ fr: 'Annuler', en: 'Cancel', es: 'Cancelar', ja: 'キャンセル', 'zh-Hans': '取消', 'zh-Hant': '取消' }).primary}>
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => switchProfile(p.id)}
                          className="flex-1 flex items-center gap-2 min-w-0 text-left"
                          aria-pressed={isActive}
                          aria-label={t({
                            fr: `Passer au profil ${p.name ?? fallback}`,
                            en: `Switch to profile ${p.name ?? fallback}`,
                            es: `Cambiar al perfil ${p.name ?? fallback}`,
                            ja: `${p.name ?? fallback} のプロファイルに切り替え`,
                            'zh-Hans': `切换到档案 ${p.name ?? fallback}`,
                            'zh-Hant': `切換到檔案 ${p.name ?? fallback}`,
                          }).primary}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-serif text-base text-foreground truncate">
                              {p.name?.trim() || fallback}
                            </p>
                            {p.name?.trim() && (
                              <p className="text-xs text-muted-foreground truncate">{fallback}</p>
                            )}
                          </div>
                          {isActive && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                        </button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startRename(p, fallback)}
                          aria-label={renameAria}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => requestArchive(p.id)}
                          disabled={!canArchive}
                          aria-label={archiveAria}
                          title={!canArchive
                            ? t({
                                fr: 'Impossible d\'archiver le dernier profil',
                                en: 'Cannot archive your last profile',
                                es: 'No se puede archivar el último perfil',
                                ja: '最後のプロファイルはアーカイブできません',
                                'zh-Hans': '无法归档最后一个档案',
                                'zh-Hant': '無法封存最後一個檔案',
                              }).primary
                            : undefined}
                        >
                          <Archive className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                  {isConfirming && (
                    <div className="border-t border-border px-3 py-2 flex items-center justify-between gap-2 bg-muted/40 rounded-b-xl">
                      <span className="text-xs text-muted-foreground">
                        {t({
                          fr: 'Archiver ce profil ?',
                          en: 'Archive this profile?',
                          es: '¿Archivar este perfil?',
                          ja: 'このプロファイルをアーカイブしますか？',
                          'zh-Hans': '归档此档案？',
                          'zh-Hant': '封存此檔案？',
                        }).primary}
                      </span>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setConfirmArchiveId(null)}>
                          {t({ fr: 'Annuler', en: 'Cancel', es: 'Cancelar', ja: 'キャンセル', 'zh-Hans': '取消', 'zh-Hant': '取消' }).primary}
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => confirmArchive(p.id)}>
                          {t({ fr: 'Archiver', en: 'Archive', es: 'Archivar', ja: 'アーカイブ', 'zh-Hans': '归档', 'zh-Hant': '封存' }).primary}
                        </Button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <section className="mb-10" data-testid="speak-section">
          <h3 className="font-medium text-foreground mb-3">
            {bilingual({ fr: 'Je parle déjà', en: 'I already speak', es: 'Ya hablo', ja: 'すでに話せる言語', 'zh-Hans': '我已经会说', 'zh-Hant': '我已經會說' })}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {PRIMARY_OPTIONS
              .filter(opt => (availablePrimaries as readonly PrimaryLang[]).includes(opt.code) || opt.code === pair.primary)
              .map(opt => {
                const active = opt.code === pair.primary;
                return (
                  <button
                    key={opt.code}
                    onClick={() => onPickPrimary(opt.code)}
                    aria-pressed={active}
                    className={`relative text-left rounded-xl border-2 px-4 py-3 transition-all ${
                      active
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card hover:border-primary/40 hover:bg-primary/5'
                    }`}
                  >
                    <p className="font-serif text-lg text-foreground">{opt.native}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{opt.en}</p>
                    {active && (
                      <Check className="absolute top-3 right-3 w-4 h-4 text-primary" />
                    )}
                  </button>
                );
              })}
          </div>
        </section>

        <section className="mb-10" data-testid="preferences-section">
          <h3 className="font-medium text-foreground mb-3">
            {bilingual({ fr: 'Préférences', en: 'Preferences', es: 'Preferencias', ja: '設定', 'zh-Hans': '偏好设置', 'zh-Hant': '偏好設定' })}
          </h3>
          <div className="rounded-xl border border-border bg-card px-4 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <label htmlFor="quotes-toggle" className="text-sm text-foreground font-medium block">
                {t({
                  fr: 'Pensée du jour',
                  en: 'Daily thought',
                  es: 'Pensamiento del día',
                  ja: '今日の言葉',
                  'zh-Hans': '每日一思',
                  'zh-Hant': '每日一思',
                }).primary}
              </label>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t({
                  fr: "Une citation d'un·e philosophe après chaque entrée du jour.",
                  en: 'A philosopher quote after your first entry each day.',
                  es: 'Una cita filosófica después de tu primera entrada del día.',
                  ja: '毎日最初の記録の後に哲学者の言葉を表示します。',
                  'zh-Hans': '每天首次记录后展示一段哲思摘录。',
                  'zh-Hant': '每天首次記錄後展示一段哲思摘錄。',
                }).primary}
              </p>
            </div>
            <Switch
              id="quotes-toggle"
              checked={quotesEnabled}
              onCheckedChange={setQuotesEnabled}
              aria-label={t({
                fr: 'Activer la pensée du jour',
                en: 'Enable daily thought',
                es: 'Activar el pensamiento del día',
                ja: '今日の言葉を表示する',
                'zh-Hans': '启用每日一思',
                'zh-Hant': '啟用每日一思',
              }).primary}
            />
          </div>
        </section>

        <section className="mt-auto">
          <p className="text-xs text-muted-foreground mb-2">
            {t({ fr: 'Aperçu', en: 'Preview', es: 'Vista previa', ja: 'プレビュー', 'zh-Hans': '预览', 'zh-Hant': '預覽' }).primary}
          </p>
          <div className="rounded-xl border border-border bg-card/50 p-4">
            <p className="font-serif text-base text-foreground">
              {bilingual({ fr: 'Vide-tête', en: 'Brain Dump', es: 'Volcado mental', ja: '脳のメモ', 'zh-Hans': '想法清空', 'zh-Hant': '想法清空' })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t({ fr: 'cible / familière', en: 'target / primary', es: 'objetivo / familiar', ja: '学習中 / 普段の言語', 'zh-Hans': '学习中 / 熟悉的', 'zh-Hant': '學習中 / 熟悉的' }).primary}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
