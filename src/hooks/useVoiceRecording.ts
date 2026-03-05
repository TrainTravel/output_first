import { useState, useRef } from 'react';
import * as O from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';
import { supabase } from '@/integrations/supabase/client';
import { Language } from '@/contexts/LanguageContext';

export type VoiceRecordingError =
  | 'permission_denied'
  | 'not_supported'
  | 'recording_failed'
  | 'transcription_failed'
  | 'empty_transcript'
  | 'network_error';

interface UseVoiceRecordingReturn {
  isRecording: boolean;
  isTranscribing: boolean;
  error: VoiceRecordingError | null;
  startRecording: () => Promise<void>;
  stopRecording: (language: Language) => Promise<string | null>;
  cancelRecording: () => void;
}

export function useVoiceRecording(): UseVoiceRecordingReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<VoiceRecordingError | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const startRecording = async () => {
    setError(null);

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError('not_supported');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const streamOption = pipe(
        O.fromNullable(stream),
        O.map((s) => {
          chunksRef.current = [];
          const recorder = new MediaRecorder(s, { mimeType });
          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
          };
          recorder.start();
          return recorder;
        }),
      );

      if (O.isSome(streamOption)) {
        mediaRecorderRef.current = streamOption.value;
        setIsRecording(true);
      } else {
        setError('recording_failed');
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setError('permission_denied');
      } else {
        setError('recording_failed');
      }
    }
  };

  const stopRecording = (language: Language): Promise<string | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder) {
        resolve(null);
        return;
      }

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });

        // Release mic tracks
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        mediaRecorderRef.current = null;
        setIsRecording(false);
        setIsTranscribing(true);
        setError(null);

        try {
          const { data: { session } } = await supabase.auth.getSession();

          const authToken = pipe(
            O.fromNullable(session?.access_token),
            O.getOrElse(() => import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string),
          );

          const formData = new FormData();
          formData.append('audio', blob, 'audio.webm');
          formData.append('language', language);

          abortControllerRef.current = new AbortController();

          const res = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/speech-to-text`,
            {
              method: 'POST',
              headers: { Authorization: `Bearer ${authToken}` },
              body: formData,
              signal: abortControllerRef.current.signal,
            },
          );

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            const code = errData?.code;
            if (code === 'RATE_LIMIT') {
              setError('transcription_failed');
            } else {
              setError('transcription_failed');
            }
            resolve(null);
            return;
          }

          const data = await res.json();
          const transcript = pipe(
            O.fromNullable(data?.text as string | undefined),
            O.filter((t) => t.trim().length > 0),
          );

          if (O.isSome(transcript)) {
            resolve(transcript.value.trim());
          } else {
            setError('empty_transcript');
            resolve(null);
          }
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') {
            // User cancelled — silent, no error
            resolve(null);
          } else {
            setError('network_error');
            resolve(null);
          }
        } finally {
          setIsTranscribing(false);
          abortControllerRef.current = null;
        }
      };

      recorder.stop();
    });
  };

  const cancelRecording = () => {
    // Abort any in-flight transcription fetch
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;

    // Stop recorder without triggering onstop side-effects
    const recorder = mediaRecorderRef.current;
    if (recorder) {
      recorder.onstop = null;
      try { recorder.stop(); } catch { /* ignore */ }
      mediaRecorderRef.current = null;
    }

    // Release mic
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    chunksRef.current = [];
    setIsRecording(false);
    setIsTranscribing(false);
  };

  return { isRecording, isTranscribing, error, startRecording, stopRecording, cancelRecording };
}
