import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy } from 'lucide-react';
import { useSmallWins, SmallWin } from '@/hooks/useSmallWins';
import { useLanguage } from '@/contexts/LanguageContext';

interface SmallWinsScreenProps {
  onBack: () => void;
}

const PLACEHOLDERS_EN = [
  'Finished a task…',
  'Replied to that message…',
  'Got out of bed today…',
  'Did the thing…',
  'Showed up…',
];

const PLACEHOLDERS_FR = [
  'Terminé une tâche…',
  'Répondu à ce message…',
  'Levé du lit aujourd\'hui…',
  'Fait la chose difficile…',
  'Montré présent(e)…',
];

const PLACEHOLDERS_ES = [
  'Terminé una tarea…',
  'Respondí ese mensaje…',
  'Me levanté hoy…',
  'Hice lo que debía…',
  'Me presenté…',
];

export function SmallWinsScreen({ onBack }: SmallWinsScreenProps) {
  const { bilingual, t, targetLang } = useLanguage();
  const isFr = targetLang === 'fr';
  const isEs = targetLang === 'es';
  const { addWin, winsToday } = useSmallWins();
  const [input, setInput] = useState('');
  const [recentlyAdded, setRecentlyAdded] = useState<SmallWin[]>([]);
  const [celebratingId, setCelebratingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx(prev => prev + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const placeholders = isFr ? PLACEHOLDERS_FR : isEs ? PLACEHOLDERS_ES : PLACEHOLDERS_EN;
  const currentPlaceholder = placeholders[placeholderIdx % placeholders.length];

  const submitWin = (text: string) => {
    if (!text || saving) return;
    setSaving(true);
    const win = addWin(text);
    setSaving(false);
    setRecentlyAdded(prev => [win, ...prev].slice(0, 5));
    setCelebratingId(win.id);
    setTimeout(() => setCelebratingId(null), 700);
    setInput('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitWin(input.trim());
    }
  };

  return (
    <div className="min-h-screen flex flex-col px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          {t({ fr: 'Retour', en: 'Back', es: 'Volver' }).primary}
        </Button>
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Trophy className="w-4 h-4" />
          <span>
            {winsToday.length} {t({ fr: 'victoire(s) aujourd\'hui', en: 'win(s) today', es: 'logro(s) hoy' }).primary}
          </span>
        </div>
      </div>

      {/* Main input area */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full">
        <h2 className="font-serif text-3xl text-foreground mb-2 text-center">
          {bilingual({ fr: 'Petites Victoires', en: 'Small Wins', es: 'Pequeños Logros' })}
        </h2>
        <p className="text-muted-foreground text-sm mb-8 text-center">
          {t(
            { fr: 'Même les choses déjà faites comptent.', en: 'Even things you already did count.', es: 'Incluso lo que ya hiciste cuenta.' }
          ).primary}
        </p>

        <div className="w-full relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={currentPlaceholder}
            rows={3}
            className="w-full bg-card border border-border rounded-xl px-5 py-4 text-foreground text-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring/50 placeholder:text-muted-foreground/50 transition-all"
          />
          <Button
            onClick={() => submitWin(input.trim())}
            disabled={!input.trim() || saving}
            size="sm"
            className="absolute bottom-3 right-3"
          >
            {saving ? '…' : t({ fr: 'Ajouter', en: 'Add', es: 'Agregar' }).primary}
          </Button>
        </div>

        {/* Recently added wins */}
        {recentlyAdded.length > 0 && (
          <div className="w-full mt-8 space-y-2">
            {recentlyAdded.map((win, i) => (
              <div
                key={win.id}
                className={`animate-fade-in-up text-sm text-muted-foreground bg-muted/50 rounded-lg px-4 py-3 flex items-center gap-2 transition-opacity ${
                  celebratingId === win.id ? 'animate-celebrate' : ''
                }`}
                style={{ opacity: 1 - i * 0.2 }}
              >
                <Trophy className="w-3 h-3 text-primary shrink-0" />
                {win.text}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
