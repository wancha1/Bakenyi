export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string; // supports rich Markdown or paragraphs
  category: 'Community News' | 'Culture' | 'Heritage' | 'Leadership' | 'History' | 'Announcements';
  author: string;
  publishedAt: string; // ISO date string or formatted date
  imageUrl?: string;
  pdfUrl?: string; // for document downloads
  popular?: boolean;
  views?: number;
  tags?: string[];
  additionalImages?: string[];
  status?: 'draft' | 'published';
}
