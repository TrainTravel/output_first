import { useFont } from '@/contexts/FontContext';
import { useLanguage } from '@/contexts/LanguageContext';

export function FontPicker() {
  const { font, setFont, options } = useFont();
  const { t } = useLanguage();

  return (
    <div className="w-full space-y-2">
      <p className="text-xs text-muted-foreground text-center tracking-wide">
        {t({ fr: 'Police de lecture', en: 'Reading font', es: 'Fuente de lectura' }).primary}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {options.map((opt) => {
          const active = opt.id === font;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setFont(opt.id)}
              aria-pressed={active}
              style={{ fontFamily: opt.cssFamily }}
              className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                active
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-background text-foreground border-border hover:border-primary/40'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
