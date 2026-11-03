export type RecordItem = {
  id: string; source: string; title: string; url?: string; domain?: string;
  date?: Date; kind: 'visit'|'statement'|'order'|'product'; text: string; category?: string; price?: string; image?: string;
}
export type Interest = { label: string; count: number; evidence: string[]; confidence: number }
export type Product = { name: string; url: string; price?: string; image?: string; category?: string; source: string }
