export type Period = "today" | "3days" | "week";

/** 네이버 뉴스 검색 정렬: date=최신순, sim=관련도순(조회수 대체에 가까움) */
export type NaverSort = "date" | "sim";

export interface Article {
  title: string;
  snippet: string;
  link: string;
  published_at: string;
  source: string;
}

export interface WordCloudItem {
  text: string;
  value: number;
}

export interface NewsAnalysisResult {
  summary: string;
  keywords: string[];
  sentiment: string;
  category: string;
  wordcloud: WordCloudItem[];
  articles: Article[];
}
