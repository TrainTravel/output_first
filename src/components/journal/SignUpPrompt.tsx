import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { Feather } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SignUpPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName?: string;
}

export function SignUpPrompt({ open, onOpenChange, featureName }: SignUpPromptProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSignUp = () => {
    onOpenChange(false);
    navigate('/auth');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-3">
          <div className="mx-auto">
            <Feather className="w-10 h-10 text-primary" />
          </div>
          <DialogTitle className="font-serif text-2xl">
            {t({ fr: 'Créez un compte pour continuer', en: 'Create an account to continue', es: 'Crea una cuenta para continuar' }).primary}
          </DialogTitle>
          <DialogDescription className="text-base">
            {featureName
              ? t(
                  { fr: `Pour utiliser ${featureName}, créez un compte gratuit. Vos données de journal seront préservées.`, en: `To use ${featureName}, create a free account. Your journal data will be preserved.`, es: `Para usar ${featureName}, crea una cuenta gratuita. Tus datos del diario se conservarán.` }
                ).primary
              : t(
                  { fr: 'Créez un compte gratuit pour sauvegarder vos données.', en: 'Create a free account to save your data.', es: 'Crea una cuenta gratuita para guardar tus datos.' }
                ).primary}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <Button size="full" onClick={handleSignUp}>
            {t({ fr: "S'inscrire", en: 'Sign Up', es: 'Registrarse' }).primary}
          </Button>
          <Button variant="ghost" size="full" onClick={() => onOpenChange(false)}>
            {t({ fr: 'Plus tard', en: 'Maybe later', es: 'Más tarde' }).primary}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
