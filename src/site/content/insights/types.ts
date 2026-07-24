export interface InsightArticle {
  slug: string;
  title: string;
  description: string;
  dateline: string;
  tags: string[];
  headlineMetric: {
    value: string;
    label: string;
  };
  buildId: string;
  content: InsightBlock[];
}

export type InsightBlock =
  | { type: 'paragraph' | 'heading'; text: string }
  | { type: 'cta'; text: string }
  | { type: 'table'; headers: string[]; rows: string[][]; caption?: string }
  | { type: 'equation'; formula: string; version?: string; label?: string };
