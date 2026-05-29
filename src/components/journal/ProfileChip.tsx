import { useState } from 'react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Profile, TargetLang } from '@/contexts/LanguageContext';
import { languageNameFor } from '@/lib/languageNames';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Check, ChevronDown, Plus, Settings } from 'lucide-react';

const LABELS: Record<string, string> = {
  fr: 'FR',
  en: 'EN',
  es: 'ES',
  'zh-Hans': '简',
  'zh-Hant': '繁',
  ja: '日',
};

const TARGET_OPTIONS: TargetLang[] = ['fr', 'es', 'zh-Hans', 'zh-Hant', 'ja'];

function displayName(profile: Profile, fallbackName: string): string {
  if (profile.name && profile.name.trim()) return profile.name.trim();
  return fallbackName;
}

interface ProfileChipProps {
  onOpenLanguageSettings?: () => void;
}

export function ProfileChip({ onOpenLanguageSettings }: ProfileChipProps = {}) {
  const { profiles, activeProfileId, switchProfile, createProfile, primaryLang, t } = useLanguage();
  const [createOpen, setCreateOpen] = useState(false);
  // Default new-profile target: first option that isn't the global primary.
  const defaultNewTarget: TargetLang =
    (TARGET_OPTIONS.find(t => (t as string) !== (primaryLang as string)) ?? 'ja') as TargetLang;
  const [newTarget, setNewTarget] = useState<TargetLang>(defaultNewTarget);

  const live = profiles
    .filter(p => !p.archivedAt)
    .slice()
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const active = live.find(p => p.id === activeProfileId) ?? live[0];
  const activeName = displayName(active, t(languageNameFor(active.target)).primary);

  const triggerAria = t({
    fr: `Profil actif : ${activeName}. Ouvrir le menu des profils.`,
    en: `Active profile: ${activeName}. Open profile menu.`,
    es: `Perfil activo: ${activeName}. Abrir el menú de perfiles.`,
    ja: `アクティブなプロファイル: ${activeName}。プロファイルメニューを開く。`,
    'zh-Hans': `当前档案：${activeName}。打开档案菜单。`,
    'zh-Hant': `當前檔案：${activeName}。打開檔案選單。`,
  }).primary;

  const addLabel = t({
    fr: 'Ajouter un profil',
    en: 'Add profile',
    es: 'Añadir perfil',
    ja: 'プロファイルを追加',
    'zh-Hans': '添加档案',
    'zh-Hant': '新增檔案',
  }).primary;

  const settingsLabel = t({
    fr: 'Réglages de langue',
    en: 'Language settings',
    es: 'Ajustes de idioma',
    ja: '言語設定',
    'zh-Hans': '语言设置',
    'zh-Hant': '語言設定',
  }).primary;

  const conflict = (newTarget as string) === (primaryLang as string);

  const handleCreate = () => {
    if (conflict) return;
    try {
      createProfile({ target: newTarget });
      toast.success(t({
        fr: 'Profil créé',
        en: 'Profile created',
        es: 'Perfil creado',
        ja: 'プロファイルを作成しました',
        'zh-Hans': '档案已创建',
        'zh-Hant': '檔案已建立',
      }).primary);
      setCreateOpen(false);
      setNewTarget(defaultNewTarget);
    } catch {
      toast.error(t({
        fr: 'Impossible de créer le profil',
        en: 'Could not create profile',
        es: 'No se pudo crear el perfil',
        ja: 'プロファイルを作成できませんでした',
        'zh-Hans': '无法创建档案',
        'zh-Hant': '無法建立檔案',
      }).primary);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={triggerAria}
          className="inline-flex items-center gap-1.5 h-12 px-3 rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="text-sm font-semibold leading-none">{LABELS[active.target]}</span>
          <ChevronDown className="w-3.5 h-3.5 opacity-70" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[14rem] rounded-xl">
          {live.map(p => {
            const isActive = p.id === active.id;
            const name = displayName(p, t(languageNameFor(p.target)).primary);
            const switchAria = t({
              fr: `Passer à ${name}`,
              en: `Switch to ${name}`,
              es: `Cambiar a ${name}`,
              ja: `${name}に切り替え`,
              'zh-Hans': `切换到${name}`,
              'zh-Hant': `切換到${name}`,
            }).primary;
            return (
              <DropdownMenuItem
                key={p.id}
                onSelect={() => switchProfile(p.id)}
                aria-label={switchAria}
                className={`flex items-center gap-2 px-3 py-2 cursor-pointer ${isActive ? 'bg-primary/10' : ''}`}
              >
                <div className="flex-1 min-w-0 truncate text-sm text-foreground">{name}</div>
                {isActive && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-3 py-2 cursor-pointer text-primary"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">{addLabel}</span>
          </DropdownMenuItem>
          {onOpenLanguageSettings && (
            <DropdownMenuItem
              onSelect={() => onOpenLanguageSettings()}
              className="flex items-center gap-2 px-3 py-2 cursor-pointer text-muted-foreground"
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm">{settingsLabel}</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {t({
                fr: 'Nouveau profil',
                en: 'New profile',
                es: 'Nuevo perfil',
                ja: '新しいプロファイル',
                'zh-Hans': '新建档案',
                'zh-Hant': '新增檔案',
              }).primary}
            </DialogTitle>
            <DialogDescription>
              {t({
                fr: 'Choisissez la langue que vous voulez apprendre.',
                en: 'Pick the language you want to learn.',
                es: 'Elige el idioma que quieres aprender.',
                ja: '学びたい言語を選んでください。',
                'zh-Hans': '选择你想学的语言。',
                'zh-Hant': '選擇你想學的語言。',
              }).primary}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label className="text-xs font-medium text-muted-foreground">
              {t({
                fr: "J'apprends",
                en: 'I am learning',
                es: 'Estoy aprendiendo',
                ja: '学んでいる言語',
                'zh-Hans': '我在学',
                'zh-Hant': '我在學',
              }).primary}
            </label>
            <Select value={newTarget} onValueChange={v => setNewTarget(v as TargetLang)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TARGET_OPTIONS.map(code => {
                  const disabled = (code as string) === (primaryLang as string);
                  return (
                    <SelectItem key={code} value={code} disabled={disabled}>
                      {LABELS[code]} · {t(languageNameFor(code)).primary}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {conflict && (
              <p className="text-xs text-destructive">
                {t({
                  fr: 'Cette langue est déjà votre langue d\'interface.',
                  en: 'That language is already your chrome language.',
                  es: 'Ese idioma ya es tu idioma de interfaz.',
                  ja: 'その言語はすでに表示言語です。',
                  'zh-Hans': '该语言已是你的界面语言。',
                  'zh-Hant': '該語言已是你的介面語言。',
                }).primary}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              {t({
                fr: 'Annuler',
                en: 'Cancel',
                es: 'Cancelar',
                ja: 'キャンセル',
                'zh-Hans': '取消',
                'zh-Hant': '取消',
              }).primary}
            </Button>
            <Button onClick={handleCreate} disabled={conflict}>
              {t({
                fr: 'Créer',
                en: 'Create',
                es: 'Crear',
                ja: '作成',
                'zh-Hans': '创建',
                'zh-Hant': '建立',
              }).primary}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
