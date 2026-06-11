import { useState, useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { BODY_PARTS } from '@/data/body-parts';

interface BodyScanScreenProps {
  onReady: () => void;
  onBack: () => void;
}

const SCAN_DURATION_MS = 15000;
const REVEAL_DELAY_MS = 10000;

export function BodyScanScreen({ onReady, onBack }: BodyScanScreenProps) {
  const { t } = useLanguage();
  const [scanY, setScanY] = useState(0);
  const [showContinue, setShowContinue] = useState(false);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = (now - start) % SCAN_DURATION_MS;
      setScanY(elapsed / SCAN_DURATION_MS);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowContinue(true), REVEAL_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-12 animate-fade-in">
      <div className="w-full max-w-md flex flex-col items-center space-y-6">
        <button
          onClick={onBack}
          className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors self-start"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span className="text-sm">
            {t({ fr: 'Retour', en: 'Back', es: 'Volver', ja: '戻る', 'zh-Hans': '返回', 'zh-Hant': '返回' }).primary}
          </span>
        </button>

        <div className="text-center space-y-1">
          <h2 className="font-serif text-2xl text-foreground">
            {t({ fr: 'Scan corporel', en: 'Body scan', es: 'Escaneo corporal', ja: 'ボディスキャン', 'zh-Hans': '身体扫描', 'zh-Hant': '身體掃描' }).primary}
          </h2>
          <p className="text-muted-foreground text-sm italic">
            {t({ fr: 'Scan corporel', en: 'Body scan', es: 'Escaneo corporal', ja: 'ボディスキャン', 'zh-Hans': '身体扫描', 'zh-Hant': '身體掃描' }).secondary}
          </p>
        </div>

        <div className="relative w-72 h-[420px]">
          {/* Abstract aura column — soft vertical glow, no body silhouette */}
          <div
            className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-32 rounded-full"
            style={{
              background:
                'radial-gradient(ellipse at center, hsl(var(--primary) / 0.22) 0%, hsl(var(--primary) / 0.10) 45%, hsl(var(--primary) / 0.03) 75%, transparent 100%)',
              filter: 'blur(8px)',
            }}
            aria-hidden
          />
          <div
            className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-16 rounded-full"
            style={{
              background:
                'linear-gradient(to bottom, hsl(var(--primary) / 0.18), hsl(var(--primary) / 0.10) 50%, hsl(var(--primary) / 0.18))',
              filter: 'blur(4px)',
            }}
            aria-hidden
          />


          <div
            className="absolute left-0 right-0 h-10 pointer-events-none"
            style={{
              top: `calc(${scanY * 100}% - 20px)`,
              background:
                'linear-gradient(to bottom, transparent, hsl(var(--primary) / 0.18) 35%, hsl(var(--primary) / 0.45) 50%, hsl(var(--primary) / 0.18) 65%, transparent)',
              filter: 'blur(0.5px)',
            }}
            aria-hidden
          />

          {BODY_PARTS.map(part => {
            // active = scan line is currently crossing this part
            // passed = scan has already swept past (lingering memory)
            // hidden = scan hasn't reached yet
            const active = scanY >= part.yNorm - 0.04 && scanY <= part.yNorm + 0.14;
            const passed = scanY > part.yNorm + 0.14;
            const opacity = active ? 1 : passed ? 0.55 : 0;
            const scale = active ? 1.08 : 1;
            const label = t(part.label);
            return (
              <div
                key={part.id}
                className="absolute pointer-events-none text-center"
                style={{
                  top: `${part.yNorm * 100}%`,
                  left: `${part.xPercent}%`,
                  transform: `translate(-50%, -50%) scale(${scale})`,
                  opacity,
                  transition: 'opacity 600ms ease, transform 600ms ease',
                }}
              >
                <p
                  className="font-serif text-base whitespace-nowrap"
                  style={{ color: active ? 'hsl(var(--primary))' : 'hsl(var(--foreground))' }}
                >
                  {label.primary}
                </p>
                <p className="text-xs text-muted-foreground italic whitespace-nowrap">
                  {label.secondary}
                </p>
              </div>
            );
          })}
        </div>

        <p className="text-center text-muted-foreground text-sm max-w-xs">
          {t({
            fr: 'Suivez la lumière. Remarquez ce que vous ressentez sans juger.',
            en: 'Follow the light. Notice what you feel without judging.',
            es: 'Sigue la luz. Nota lo que sientes sin juzgar.',
            ja: '光に従って、判断せず感じることに気づきましょう。',
            'zh-Hans': '跟随光线,不评判地觉察身体的感受。',
            'zh-Hant': '跟隨光線,不評判地覺察身體的感受。',
          }).primary}
        </p>

        <div
          className="w-full transition-all duration-1000"
          style={{
            opacity: showContinue ? 1 : 0,
            transform: showContinue ? 'translateY(0)' : 'translateY(8px)',
            pointerEvents: showContinue ? 'auto' : 'none',
          }}
        >
          <Button variant="default" size="full" onClick={onReady}>
            {t({ fr: 'Je suis prêt(e)', en: "I'm ready", es: 'Estoy listo/a', ja: '準備できました', 'zh-Hans': '我准备好了', 'zh-Hant': '我準備好了' }).primary}
          </Button>
          <p className="text-center text-muted-foreground/50 text-xs mt-2 italic">
            {t({ fr: 'Je suis prêt(e)', en: "I'm ready", es: 'Estoy listo/a', ja: '準備できました', 'zh-Hans': '我准备好了', 'zh-Hant': '我準備好了' }).secondary}
          </p>
        </div>
      </div>
    </div>
  );
}
