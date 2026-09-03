export type View = 'home' | 'review' | 'editorial' | 'response' | 'checklist' | 'about';
export type Language = 'tr' | 'en';

export interface Tool {
  id: View;
  num: string;
  title: { tr: string; en: string };
  desc: { tr: string; en: string };
  features: { tr: string[]; en: string[] };
  cost: number;
  status: 'live' | 'soon';
  gradient: string;
}
