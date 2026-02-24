
-- Thoughts table
CREATE TABLE public.thoughts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_anonymous_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  archived BOOLEAN NOT NULL DEFAULT false,
  composted BOOLEAN NOT NULL DEFAULT false,
  ai_theme TEXT
);

-- Clusters table (formerly "projects")
CREATE TABLE public.clusters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_anonymous_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Many-to-many: thoughts <-> clusters
CREATE TABLE public.cluster_thoughts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cluster_id UUID NOT NULL REFERENCES public.clusters(id) ON DELETE CASCADE,
  thought_id UUID NOT NULL REFERENCES public.thoughts(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(cluster_id, thought_id)
);

-- Proposals table with bilingual content
CREATE TABLE public.proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cluster_id UUID NOT NULL REFERENCES public.clusters(id) ON DELETE CASCADE,
  content_native TEXT NOT NULL,
  content_target_language TEXT NOT NULL,
  target_language_code TEXT NOT NULL DEFAULT 'fr',
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_thoughts_user ON public.thoughts(user_anonymous_id);
CREATE INDEX idx_thoughts_composted ON public.thoughts(composted);
CREATE INDEX idx_clusters_user ON public.clusters(user_anonymous_id);
CREATE INDEX idx_cluster_thoughts_cluster ON public.cluster_thoughts(cluster_id);
CREATE INDEX idx_cluster_thoughts_thought ON public.cluster_thoughts(thought_id);
CREATE INDEX idx_proposals_cluster ON public.proposals(cluster_id);
