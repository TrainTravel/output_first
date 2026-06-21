
-- 1. circulation_settings
CREATE TABLE public.circulation_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  receive_letters boolean NOT NULL DEFAULT false,
  share_letters boolean NOT NULL DEFAULT false,
  ttl_days integer NOT NULL DEFAULT 14 CHECK (ttl_days IN (7, 14, 30)),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.circulation_settings TO authenticated;
GRANT ALL ON public.circulation_settings TO service_role;

ALTER TABLE public.circulation_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own settings"
  ON public.circulation_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own settings"
  ON public.circulation_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own settings"
  ON public.circulation_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own settings"
  ON public.circulation_settings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 2. love_letters
CREATE TABLE public.love_letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  language text NOT NULL,
  pseudonym text NOT NULL,
  moderated_status text NOT NULL DEFAULT 'pending'
    CHECK (moderated_status IN ('pending','passed','softfailed','blocked')),
  moderation_note text,
  posted_at timestamptz,
  expires_at timestamptz,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX love_letters_lang_status_expires_idx
  ON public.love_letters (language, moderated_status, expires_at)
  WHERE archived = false;
CREATE INDEX love_letters_author_idx ON public.love_letters (author_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.love_letters TO authenticated;
GRANT ALL ON public.love_letters TO service_role;

ALTER TABLE public.love_letters ENABLE ROW LEVEL SECURITY;

-- Authors always see their own letters (object permanence)
CREATE POLICY "Authors read own letters"
  ON public.love_letters FOR SELECT
  TO authenticated
  USING (auth.uid() = author_id);

-- Opted-in users see passed, live, same-language letters from others
CREATE POLICY "Opted-in users read live letters"
  ON public.love_letters FOR SELECT
  TO authenticated
  USING (
    archived = false
    AND moderated_status = 'passed'
    AND (expires_at IS NULL OR expires_at > now())
    AND EXISTS (
      SELECT 1 FROM public.circulation_settings cs
      WHERE cs.user_id = auth.uid() AND cs.receive_letters = true
    )
  );

CREATE POLICY "Authors insert own letters"
  ON public.love_letters FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

-- 3. letter_holdings
CREATE TABLE public.letter_holdings (
  letter_id uuid NOT NULL REFERENCES public.love_letters(id) ON DELETE CASCADE,
  holder_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (letter_id, holder_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.letter_holdings TO authenticated;
GRANT ALL ON public.letter_holdings TO service_role;

ALTER TABLE public.letter_holdings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Holders read own holdings"
  ON public.letter_holdings FOR SELECT
  TO authenticated
  USING (auth.uid() = holder_id);

CREATE POLICY "Holders insert own holdings"
  ON public.letter_holdings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = holder_id);

CREATE POLICY "Holders delete own holdings"
  ON public.letter_holdings FOR DELETE
  TO authenticated
  USING (auth.uid() = holder_id);
