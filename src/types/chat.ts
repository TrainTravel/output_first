export interface ThoughtContext {
  mode: 'all' | 'theme' | 'cluster';
  label: string;
  thoughts: Array<{
    content: string;
    createdAt: string;
    aiTheme: string | null;
  }>;
  clusterDescription?: string;
}
