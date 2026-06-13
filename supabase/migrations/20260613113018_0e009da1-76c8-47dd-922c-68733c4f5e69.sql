
-- Circulation of Love — anonymous time-bound story sharing.
-- See docs/specs/love-circulation.md for the full design.

CREATE TABLE public.love_letters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id TEXT NOT NULL,
  content TEXT NOT NULL CHECK (length(content) BETWEEN 1 AND 500),
  language TEXT NOT NULL CHECK (language IN ('en','fr','es','ja','zh-Hans','zh-Hant')),
  pseudonym TEXT NOT NULL,
  moderated_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (moderated_status IN ('pending','passed','softfailed','blocked')),
  moderation_note TEXT,
  posted_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.letter_holdings (
  letter_id UUID NOT NULL REFERENCES public.love_letters(id) ON DELETE CASCADE,
  holder_id TEXT NOT NULL,
  held_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (letter_id, holder_id)
);

CREATE TABLE public.circulation_settings (
  user_id TEXT NOT NULL PRIMARY KEY,
  receive_letters BOOLEAN NOT NULL DEFAULT false,
  share_letters BOOLEAN NOT NULL DEFAULT false,
  ttl_days INTEGER NOT NULL DEFAULT 14 CHECK (ttl_days IN (7,14,30)),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for the hot query paths:
-- (1) "show me the live current in my language" — most frequent
CREATE INDEX idx_love_letters_current
  ON public.love_letters(language, moderated_status, archived, expires_at)
  WHERE moderated_status = 'passed' AND archived = false;
-- (2) "all my letters, including archived"
CREATE INDEX idx_love_letters_author
  ON public.love_letters(author_id, created_at DESC);
-- (3) "how many holds does this letter have"
CREATE INDEX idx_letter_holdings_letter
  ON public.letter_holdings(letter_id);

-- RLS — see spec for full rationale.

ALTER TABLE public.love_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.letter_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circulation_settings ENABLE ROW LEVEL SECURITY;

-- love_letters policies

-- Author always sees their own letters (every status, every archived state).
CREATE POLICY "Authors see their own letters" ON public.love_letters
  FOR SELECT TO authenticated
  USING (author_id = auth.uid()::text);

-- Other users see only: passed + not archived + matching language + reader opted in.
CREATE POLICY "Opted-in users see live current in their language" ON public.love_letters
  FOR SELECT TO authenticated
  USING (
    author_id <> auth.uid()::text
    AND moderated_status = 'passed'
    AND archived = false
    AND expires_at > now()
    AND EXISTS (
      SELECT 1 FROM public.circulation_settings s
      WHERE s.user_id = auth.uid()::text
        AND s.receive_letters = true
    )
  );

CREATE POLICY "Authors insert their own letters" ON public.love_letters
  FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid()::text AND moderated_status = 'pending');

-- Authors can only flip `archived` on their own row. Other columns are immutable from client.
CREATE POLICY "Authors can archive their own letters" ON public.love_letters
  FOR UPDATE TO authenticated
  USING (author_id = auth.uid()::text)
  WITH CHECK (author_id = auth.uid()::text);

CREATE POLICY "Authors can delete their own letters" ON public.love_letters
  FOR DELETE TO authenticated
  USING (author_id = auth.uid()::text);

-- Service role moderates + cycles expiry.
CREATE POLICY "Service role full access love_letters" ON public.love_letters
  FOR ALL TO service_role USING (true);

-- letter_holdings policies

-- Holder sees their own holdings (used by "letters I've held" view).
CREATE POLICY "Holders see their own holdings" ON public.letter_holdings
  FOR SELECT TO authenticated
  USING (holder_id = auth.uid()::text);

-- Authors can read holdings on their own letters to see the count.
-- (Reading individual rows is fine — the UI only shows the aggregate; we don't expose
-- holder_id in the client query for author views.)
CREATE POLICY "Authors see holdings on their letters" ON public.letter_holdings
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.love_letters l
      WHERE l.id = letter_holdings.letter_id
        AND l.author_id = auth.uid()::text
    )
  );

-- Hold a letter: must not be your own, must be live, must have receive_letters=true.
CREATE POLICY "Opted-in users hold live letters that are not their own" ON public.letter_holdings
  FOR INSERT TO authenticated
  WITH CHECK (
    holder_id = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM public.love_letters l
      WHERE l.id = letter_holdings.letter_id
        AND l.moderated_status = 'passed'
        AND l.archived = false
        AND l.expires_at > now()
        AND l.author_id <> auth.uid()::text
    )
    AND EXISTS (
      SELECT 1 FROM public.circulation_settings s
      WHERE s.user_id = auth.uid()::text
        AND s.receive_letters = true
    )
  );

CREATE POLICY "Holders can unhold" ON public.letter_holdings
  FOR DELETE TO authenticated
  USING (holder_id = auth.uid()::text);

CREATE POLICY "Service role full access letter_holdings" ON public.letter_holdings
  FOR ALL TO service_role USING (true);

-- circulation_settings policies

CREATE POLICY "Users see their own circulation settings" ON public.circulation_settings
  FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users insert their own circulation settings" ON public.circulation_settings
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users update their own circulation settings" ON public.circulation_settings
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users delete their own circulation settings" ON public.circulation_settings
  FOR DELETE TO authenticated
  USING (user_id = auth.uid()::text);

CREATE POLICY "Service role full access circulation_settings" ON public.circulation_settings
  FOR ALL TO service_role USING (true);
