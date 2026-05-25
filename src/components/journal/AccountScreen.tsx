// GDPR data-controls screen.
// Surfaces:
//   - Right-to-erasure (Article 17): schedule a 30-day soft delete, with the
//     option to cancel any time within the window.
//   - Right-to-portability (Article 20): download all rows tagged with this
//     user_id as a single JSON file.
//
// v1 lazy purge: the moment the user visits this screen, if their
// scheduled_deletion_at is in the past we invoke `hard-delete-account` and
// sign them out. Known limitation: a user who never returns after day 30 is
// not actually deleted until they return. Production should add a pg_cron job.

import { useCallback, useEffect, useState } from 'react';
import * as O from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';
import { ArrowLeft, Download, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface AccountScreenProps {
  onBack: () => void;
}

interface ExportPayload {
  exported_at: string;
  user_id: string;
  schema_version: number;
  data: Record<string, unknown>;
}

export function AccountScreen({ onBack }: AccountScreenProps) {
  const { user, signOut } = useAuth();
  const { t, bilingual } = useLanguage();

  const [scheduledAt, setScheduledAt] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [exportSubmitting, setExportSubmitting] = useState(false);

  // Fetch profile.scheduled_deletion_at and lazy-purge if expired.
  const refreshStatus = useCallback(async () => {
    if (!user) {
      setStatusLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('scheduled_deletion_at')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Failed to fetch profile:', error);
        setStatusLoading(false);
        return;
      }

      const next = pipe(
        O.fromNullable(data?.scheduled_deletion_at as string | null | undefined),
        O.getOrElse<string | null>(() => null),
      );

      // Lazy purge: if the window has passed, fire hard-delete and sign out.
      if (next && new Date(next).getTime() <= Date.now()) {
        await supabase.functions.invoke('hard-delete-account');
        await signOut();
        toast.success(
          t({ fr: 'Votre compte a été supprimé.', en: 'Your account has been deleted.', es: 'Tu cuenta ha sido eliminada.' }).primary,
        );
        return;
      }

      setScheduledAt(next);
    } catch (e) {
      console.error('refreshStatus error:', e);
    } finally {
      setStatusLoading(false);
    }
  }, [user, signOut, t]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const handleSchedule = async () => {
    if (deleteSubmitting) return;
    setDeleteSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('schedule-account-deletion');
      if (error) {
        console.error('schedule-account-deletion error:', error);
        toast.error(
          t({ fr: 'Échec de la suppression.', en: 'Could not schedule deletion.', es: 'No se pudo programar la eliminación.' }).primary,
        );
        return;
      }
      toast.success(
        t(
          { fr: 'Votre compte sera supprimé dans 30 jours. Reconnectez-vous pour annuler.', en: 'Your account will be deleted in 30 days. Sign in anytime to cancel.', es: 'Tu cuenta será eliminada en 30 días. Inicia sesión para cancelar.' },
        ).primary,
      );
      await signOut();
    } catch (e) {
      console.error('handleSchedule error:', e);
      toast.error(t({ fr: 'Erreur réseau.', en: 'Network error.', es: 'Error de red.' }).primary);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (cancelSubmitting) return;
    setCancelSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('cancel-account-deletion');
      if (error) {
        console.error('cancel-account-deletion error:', error);
        toast.error(t({ fr: 'Échec.', en: 'Could not cancel.', es: 'No se pudo cancelar.' }).primary);
        return;
      }
      setScheduledAt(null);
      toast.success(
        t({ fr: 'Suppression annulée.', en: 'Deletion cancelled.', es: 'Eliminación cancelada.' }).primary,
      );
    } catch (e) {
      console.error('handleCancel error:', e);
      toast.error(t({ fr: 'Erreur réseau.', en: 'Network error.', es: 'Error de red.' }).primary);
    } finally {
      setCancelSubmitting(false);
    }
  };

  const handleExport = async () => {
    if (exportSubmitting) return;
    setExportSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('export-user-data');
      if (error || !data) {
        console.error('export-user-data error:', error);
        toast.error(
          t({ fr: 'Échec du téléchargement.', en: 'Could not download data.', es: 'No se pudo descargar.' }).primary,
        );
        return;
      }
      const payload = data as ExportPayload;
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `outputfirst-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(
        t({ fr: 'Vos données ont été téléchargées.', en: 'Your data has been downloaded.', es: 'Tus datos han sido descargados.' }).primary,
      );
    } catch (e) {
      console.error('handleExport error:', e);
      toast.error(t({ fr: 'Erreur réseau.', en: 'Network error.', es: 'Error de red.' }).primary);
    } finally {
      setExportSubmitting(false);
    }
  };

  const formattedDeletionDate = pipe(
    O.fromNullable(scheduledAt),
    O.map((s) =>
      new Date(s).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }),
    ),
    O.getOrElse(() => ''),
  );

  return (
    <div className="min-h-screen flex flex-col px-6 py-12">
      <div className="w-full max-w-lg mx-auto flex-1 flex flex-col animate-fade-in-up">
        <button
          onClick={onBack}
          className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-8 self-start"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span className="text-sm">{t({ fr: 'Retour', en: 'Back', es: 'Volver' }).primary}</span>
        </button>

        <div className="mb-10 space-y-2">
          <h2 className="font-serif text-2xl md:text-3xl text-foreground">
            {bilingual({ fr: 'Compte', en: 'Account', es: 'Cuenta' })}
          </h2>
          <p className="text-muted-foreground italic">
            {t(
              { fr: 'Gérer vos données et votre compte', en: 'Manage your data and account', es: 'Gestiona tus datos y tu cuenta' },
            ).primary}
          </p>
        </div>

        {/* Scheduled-deletion banner */}
        {scheduledAt && (
          <div
            data-testid="deletion-banner"
            className="mb-8 rounded-xl border-2 border-yellow-500/40 bg-yellow-500/10 p-4 space-y-3"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-700 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-foreground">
                {t(
                  { fr: `Votre compte sera supprimé le ${formattedDeletionDate}.`, en: `Your account is scheduled for deletion on ${formattedDeletionDate}.`, es: `Tu cuenta será eliminada el ${formattedDeletionDate}.` },
                ).primary}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={cancelSubmitting}
              data-testid="cancel-deletion"
            >
              {cancelSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t({ fr: 'Annuler la suppression', en: 'Cancel deletion', es: 'Cancelar eliminación' }).primary}
            </Button>
          </div>
        )}

        <section className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-medium text-foreground">
              {bilingual({ fr: 'Vos données', en: 'Your data', es: 'Tus datos' })}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t(
                { fr: 'Téléchargez tout ce que vous avez écrit, au format JSON.', en: 'Download everything you have written, as JSON.', es: 'Descarga todo lo que has escrito, en formato JSON.' },
              ).primary}
            </p>
            <Button
              variant="outline"
              size="full"
              onClick={handleExport}
              disabled={exportSubmitting}
              data-testid="export-button"
            >
              {exportSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              {t({ fr: 'Télécharger mes données', en: 'Download my data', es: 'Descargar mis datos' }).primary}
            </Button>
          </div>

          {!scheduledAt && !statusLoading && (
            <div className="space-y-2 pt-4 border-t border-border">
              <h3 className="font-medium text-foreground">
                {bilingual({ fr: 'Supprimer mon compte', en: 'Delete my account', es: 'Eliminar mi cuenta' })}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t(
                  { fr: 'Vous aurez 30 jours pour annuler en vous reconnectant.', en: 'You will have 30 days to undo this by signing in again.', es: 'Tendrás 30 días para deshacerlo iniciando sesión de nuevo.' },
                ).primary}
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="full" data-testid="delete-trigger">
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t({ fr: 'Supprimer mon compte', en: 'Delete my account', es: 'Eliminar mi cuenta' }).primary}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t({ fr: 'Êtes-vous sûr ?', en: 'Are you sure?', es: '¿Estás seguro?' }).primary}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t(
                        { fr: 'Vous aurez 30 jours pour annuler avant que vos données ne soient définitivement supprimées. Annulez à tout moment en vous reconnectant.', en: 'You have 30 days to undo this before your data is permanently deleted. Cancel anytime by signing in.', es: 'Tienes 30 días para deshacerlo antes de que tus datos se eliminen definitivamente. Cancela en cualquier momento iniciando sesión.' },
                      ).primary}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={deleteSubmitting}>
                      {t({ fr: 'Annuler', en: 'Cancel', es: 'Cancelar' }).primary}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleSchedule}
                      disabled={deleteSubmitting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      data-testid="delete-confirm"
                    >
                      {deleteSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {t({ fr: 'Supprimer', en: 'Delete', es: 'Eliminar' }).primary}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
