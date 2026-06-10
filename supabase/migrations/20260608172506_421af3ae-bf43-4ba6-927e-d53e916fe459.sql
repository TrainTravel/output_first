
-- Priority Quadrants: classify thoughts as task / non-task + Eisenhower placement.
--
-- is_task  : null = not yet classified, true = confirmed task,
--            false = explicitly not a task (user unchecked AI's guess in verify step).
-- quadrant : null = unplaced, otherwise 'q1'..'q4' for the Eisenhower matrix
--            q1 = urgent + important
--            q2 = important, not urgent
--            q3 = urgent, not important
--            q4 = neither

ALTER TABLE public.thoughts ADD COLUMN IF NOT EXISTS is_task BOOLEAN;

ALTER TABLE public.thoughts ADD COLUMN IF NOT EXISTS quadrant TEXT
  CHECK (quadrant IS NULL OR quadrant IN ('q1','q2','q3','q4'));

-- Partial index for the Quadrants Home tile query
-- (per user, by quadrant, excluding archived / composted thoughts).
CREATE INDEX IF NOT EXISTS idx_thoughts_quadrant
  ON public.thoughts(user_anonymous_id, quadrant)
  WHERE quadrant IS NOT NULL AND archived = false AND composted = false;
