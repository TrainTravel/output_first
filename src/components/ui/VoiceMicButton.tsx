import { useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Language } from '@/contexts/LanguageContext';
import { useVoiceRecording, VoiceRecordingError } from '@/hooks/useVoiceRecording';

interface VoiceMicButtonProps {
  onTranscript: (text: string) => void;
  language: Language;
  disabled?: boolean;
  className?: string;
}

const ERROR_MESSAGES: Record<VoiceRecordingError, Record<Language, string>> = {
  permission_denied: {
    fr: 'Accès au microphone refusé.',
    en: 'Microphone access denied.',
    es: 'Acceso al micrófono denegado.',
  },
  not_supported: {
    fr: 'Enregistrement vocal non supporté sur cet appareil.',
    en: 'Voice recording not supported on this device.',
    es: 'Grabación de voz no compatible con este dispositivo.',
  },
  recording_failed: {
    fr: "Impossible de démarrer l'enregistrement.",
    en: 'Could not start recording.',
    es: 'No se pudo iniciar la grabación.',
  },
  transcription_failed: {
    fr: 'Transcription échouée. Réessayez.',
    en: 'Transcription failed. Please try again.',
    es: 'Transcripción fallida. Inténtalo de nuevo.',
  },
  empty_transcript: {
    fr: 'Aucune parole détectée. Réessayez.',
    en: 'No speech detected. Please try again.',
    es: 'No se detectó voz. Inténtalo de nuevo.',
  },
  network_error: {
    fr: 'Erreur réseau. Vérifiez votre connexion.',
    en: 'Network error. Check your connection.',
    es: 'Error de red. Verifica tu conexión.',
  },
};

const ARIA_LABELS: Record<'idle' | 'recording' | 'transcribing', Record<Language, string>> = {
  idle: { fr: 'Démarrer la dictée', en: 'Start voice input', es: 'Iniciar dictado' },
  recording: { fr: 'Arrêter la dictée', en: 'Stop recording', es: 'Detener grabación' },
  transcribing: { fr: 'Transcription…', en: 'Transcribing…', es: 'Transcribiendo…' },
};

export function VoiceMicButton({ onTranscript, language, disabled, className }: VoiceMicButtonProps) {
  const { isRecording, isTranscribing, error, startRecording, stopRecording, cancelRecording } =
    useVoiceRecording();

  // Show localised toast whenever error changes
  useEffect(() => {
    if (error) {
      toast.error(ERROR_MESSAGES[error][language]);
    }
  }, [error, language]);

  // Release mic on unmount (user navigated away mid-recording)
  useEffect(() => {
    return () => {
      cancelRecording();
    };
  }, []);

  const handleClick = async () => {
    if (isTranscribing || disabled) return;

    if (isRecording) {
      const text = await stopRecording(language);
      if (text) onTranscript(text);
    } else {
      await startRecording();
    }
  };

  const state = isTranscribing ? 'transcribing' : isRecording ? 'recording' : 'idle';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isTranscribing || disabled}
      aria-label={ARIA_LABELS[state][language]}
      className={[
        'flex items-center justify-center w-8 h-8 rounded-full transition-colors',
        state === 'idle' && 'text-muted-foreground hover:bg-muted hover:text-foreground',
        state === 'recording' && 'bg-destructive/10 text-destructive animate-pulse',
        state === 'transcribing' && 'text-muted-foreground cursor-wait',
        (isTranscribing || disabled) && 'opacity-60',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {state === 'transcribing' ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : state === 'recording' ? (
        <MicOff className="w-4 h-4" />
      ) : (
        <Mic className="w-4 h-4" />
      )}
    </button>
  );
}
