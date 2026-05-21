import { useState } from 'react';
import { MessageSquareHeart, X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const EMOJI_RATINGS = ['😞', '😐', '🙂', '😊', '🤩'];

const PRICE_OPTIONS = [
  { value: 'free', label: '$0 (free only)' },
  { value: '1-3', label: '$1–3/mo' },
  { value: '3-5', label: '$3–5/mo' },
  { value: '5-10', label: '$5–10/mo' },
  { value: '10+', label: '$10+/mo' },
];

const PLATFORM_OPTIONS = [
  { value: 'web', label: '🌐 Web' },
  { value: 'ios', label: '🍎 iOS' },
  { value: 'android', label: '🤖 Android' },
  { value: 'any', label: '🤷 Don\'t mind' },
];

export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(() => localStorage.getItem('feedback-hidden') === 'true');
  const isEligible = localStorage.getItem('feedback-eligible') === 'true';
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [wouldPay, setWouldPay] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<string | null>(null);
  const [platform, setPlatform] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { t, targetLang } = useLanguage();
  const isFr = targetLang === 'fr';
  const { user } = useAuth();

  const reset = () => {
    setRating(null);
    setComment('');
    setWouldPay(null);
    setPriceRange(null);
    setPlatform(null);
    setSent(false);
  };

  const handleSubmit = async () => {
    if (!rating) return;
    setIsSending(true);

    const { error } = await supabase.from('feedback' as any).insert({
      user_anonymous_id: user?.id,
      rating,
      comment: comment.trim().slice(0, 2000),
      would_pay: wouldPay || 'no',
      price_range: wouldPay === 'yes' || wouldPay === 'maybe' ? priceRange : null,
      platform_preference: platform || 'web',
    } as any);

    setIsSending(false);

    if (error) {
      console.error('Feedback error:', error);
      toast.error(isFr ? 'Erreur — réessayez.' : 'Error — please try again.');
      return;
    }

    setSent(true);
    toast.success(isFr ? 'Merci pour votre retour!' : 'Thanks for your feedback!');
    setTimeout(() => {
      setIsOpen(false);
      reset();
    }, 2000);
  };

  const showPriceQuestion = wouldPay === 'yes' || wouldPay === 'maybe';

  return (
    <>
      {/* Floating trigger button */}
      {!isOpen && !isHidden && isEligible && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-1">
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
            aria-label="Give feedback"
          >
            <MessageSquareHeart className="w-5 h-5" />
            <span className="text-sm font-medium hidden sm:inline">
              {isFr ? 'Votre avis' : 'Feedback'}
            </span>
          </button>
          <button
            onClick={() => { setIsHidden(true); localStorage.setItem('feedback-hidden', 'true'); }}
            className="rounded-full bg-muted p-1.5 text-muted-foreground shadow hover:text-foreground transition-colors"
            aria-label="Hide feedback button"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Modal overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => { setIsOpen(false); reset(); }} />

          <div className="relative w-full max-w-md mx-4 mb-4 sm:mb-0 bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-5 animate-fade-in-up max-h-[85vh] overflow-y-auto">
            {/* Close */}
            <button
              onClick={() => { setIsOpen(false); reset(); }}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            {sent ? (
              <div className="text-center py-8 space-y-3">
                <span className="text-4xl">💚</span>
                <p className="font-serif text-xl text-foreground">
                  {isFr ? 'Merci!' : 'Thank you!'}
                </p>
                <p className="text-muted-foreground text-sm">
                  {isFr ? 'Votre retour nous aide à améliorer l\'app.' : 'Your feedback helps us improve.'}
                </p>
              </div>
            ) : (
              <>
                <div>
                  <h3 className="font-serif text-xl text-foreground">
                    {isFr ? 'Comment trouvez-vous l\'app?' : 'How\'s the app?'}
                  </h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    {isFr ? 'Rapide — moins d\'une minute.' : 'Quick — less than a minute.'}
                  </p>
                </div>

                {/* Rating */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {isFr ? 'Votre impression' : 'Your impression'}
                  </label>
                  <div className="flex gap-2 justify-center">
                    {EMOJI_RATINGS.map((emoji, i) => (
                      <button
                        key={i}
                        onClick={() => setRating(i + 1)}
                        className={`text-3xl p-2 rounded-xl transition-all ${
                          rating === i + 1
                            ? 'bg-primary/15 scale-110 ring-2 ring-primary/30'
                            : 'hover:bg-muted hover:scale-105'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {isFr ? 'Que changeriez-vous?' : 'What would you change?'}
                    <span className="text-muted-foreground font-normal"> ({isFr ? 'optionnel' : 'optional'})</span>
                  </label>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={isFr ? 'Partagez vos pensées...' : 'Share your thoughts...'}
                    className="resize-none h-20"
                    maxLength={2000}
                  />
                </div>

                {/* Would pay */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {isFr ? 'Paieriez-vous pour cette app?' : 'Would you pay for this app?'}
                  </label>
                  <div className="flex gap-2">
                    {[
                      { value: 'yes', label: isFr ? 'Oui' : 'Yes' },
                      { value: 'maybe', label: isFr ? 'Peut-être' : 'Maybe' },
                      { value: 'no', label: isFr ? 'Non' : 'No' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setWouldPay(opt.value)}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
                          wouldPay === opt.value
                            ? 'bg-primary/15 border-primary/30 text-foreground'
                            : 'border-border text-muted-foreground hover:border-primary/20'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price range (conditional) */}
                {showPriceQuestion && (
                  <div className="space-y-2 animate-fade-in-up">
                    <label className="text-sm font-medium text-foreground">
                      {isFr ? 'Combien par mois?' : 'How much per month?'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {PRICE_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setPriceRange(opt.value)}
                          className={`py-1.5 px-3 rounded-lg text-sm border transition-all ${
                            priceRange === opt.value
                              ? 'bg-primary/15 border-primary/30 text-foreground'
                              : 'border-border text-muted-foreground hover:border-primary/20'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Platform */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {isFr ? 'Où l\'utiliseriez-vous?' : 'Where would you use it?'}
                  </label>
                  <div className="flex gap-2">
                    {PLATFORM_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setPlatform(opt.value)}
                        className={`flex-1 py-2 px-2 rounded-lg text-sm border transition-all ${
                          platform === opt.value
                            ? 'bg-primary/15 border-primary/30 text-foreground'
                            : 'border-border text-muted-foreground hover:border-primary/20'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit */}
                <Button
                  onClick={handleSubmit}
                  disabled={!rating || isSending}
                  className="w-full"
                  size="lg"
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  {isFr ? 'Envoyer' : 'Send feedback'}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
