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
            {t('Créez un compte pour continuer', 'Create an account to continue').primary}
          </DialogTitle>
          <DialogDescription className="text-base">
            {featureName
              ? t(
                  `Pour utiliser ${featureName}, créez un compte gratuit. Vos données de journal seront préservées.`,
                  `To use ${featureName}, create a free account. Your journal data will be preserved.`
                ).primary
              : t(
                  'Créez un compte gratuit pour sauvegarder vos données.',
                  'Create a free account to save your data.'
                ).primary}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <Button size="full" onClick={handleSignUp}>
            {t("S'inscrire", 'Sign Up').primary}
          </Button>
          <Button variant="ghost" size="full" onClick={() => onOpenChange(false)}>
            {t('Plus tard', 'Maybe later').primary}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
