/**
 * Vercel 등 서버리스에서 BACKEND_URL 없이 동작할 때 사용하는
 * 네이버 뉴스 + OpenAI 파이프라인 (Python 백엔드와 동일한 흐름).
 */

import type { NewsAnalysisResult } from "@/lib/types";

const NAVER_NEWS_URL = "https://openapi.naver.com/v1/search/news.json";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

/** OpenAI에서 널리 쓰이는 모델명. 잘못된 값이면 빌드/런타임 오류를 줄이기 위해 기본값 사용 */
const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

type Period = "today" | "3days" | "week";
type NaverSort = "date" | "sim";

interface ArticleRow {
  title: string;
  snippet: string;
  link: string;
  published_at: string;
  source: string;
}

function stripTags(s: string): string {
  return s.replace(/<[^>]*>/g, " ");
}

function decodeBasicEntities(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function cleanText(text: string): string {
  const withoutHtml = stripTags(decodeBasicEntities(text || ""));
  const withoutSymbols = withoutHtml.replace(/[^0-9A-Za-z가-힣\s]/g, " ");
  return withoutSymbols.replace(/\s+/g, " ").trim();
}

function getDateRange(period: Period): { start: Date; end: Date } {
  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0
  );
  const todayEnd = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999
  );

  if (period === "today") {
    return { start: todayStart, end: todayEnd };
  }
  if (period === "3days") {
    const start = new Date(todayStart);
    start.setDate(start.getDate() - 2);
    return { start, end: todayEnd };
  }
  if (period === "week") {
    const jsDay = now.getDay();
    const daysSinceMonday = (jsDay + 6) % 7;
    const start = new Date(todayStart);
    start.setDate(start.getDate() - daysSinceMonday);
    return { start, end: todayEnd };
  }
  return { start: todayStart, end: todayEnd };
}

function deduplicateArticles(rows: ArticleRow[]): ArticleRow[] {
  const seen = new Set<string>();
  const out: ArticleRow[] = [];
  for (const a of rows) {
    const key = `${cleanText(a.title).toLowerCase()}|${a.link}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      ...a,
      title: cleanText(a.title),
      snippet: cleanText(a.snippet),
    });
  }
  return out;
}

function truncateArticles(rows: ArticleRow[], maxChars: number): ArticleRow[] {
  return rows.map((a) => ({
    ...a,
    snippet: a.snippet.slice(0, maxChars).trim(),
  }));
}

function buildCorpus(articles: ArticleRow[]): string {
  return articles
    .map((article, index) =>
      [
        `[기사 ${index + 1}]`,
        `제목: ${article.title}`,
        `요약: ${article.snippet}`,
        `출처: ${article.source || "unknown"}`,
      ].join("\n")
    )
    .join("\n\n");
}

function buildWordcloud(
  keywords: string[],
  articles: ArticleRow[],
  limit = 10
): { text: string; value: number }[] {
  const normalized = keywords
    .map((k) => cleanText(k))
    .filter(Boolean);
  if (!normalized.length) return [];

  const corpus = articles.map((a) => `${a.title} ${a.snippet}`).join(" ").toLowerCase();
  const weights = new Map<string, number>();

  normalized.forEach((keyword, index) => {
    const count = corpus.split(keyword.toLowerCase()).length - 1;
    weights.set(keyword, count > 0 ? count : Math.max(1, normalized.length - index));
  });

  return [...weights.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([text, value]) => ({ text, value }));
}

interface NaverJson {
  items?: Array<{
    title: string;
    description: string;
    link: string;
    originallink?: string;
    pubDate: string;
  }>;
}

export async function fetchNaverArticles(
  query: string,
  period: Period,
  sort: NaverSort,
  clientId: string,
  clientSecret: string,
  limit: number
): Promise<ArticleRow[]> {
  const { start, end } = getDateRange(period);
  const headers = {
    "X-Naver-Client-Id": clientId,
    "X-Naver-Client-Secret": clientSecret,
  };

  const articles: ArticleRow[] = [];
  let pageStart = 1;

  while (articles.length < limit && pageStart <= 91) {
    const url = new URL(NAVER_NEWS_URL);
    url.searchParams.set("query", query);
    url.searchParams.set("display", String(Math.min(50, limit)));
    url.searchParams.set("start", String(pageStart));
    url.searchParams.set("sort", sort);

    const res = await fetch(url.toString(), { headers, cache: "no-store" });
    if (!res.ok) {
      throw new Error(`네이버 뉴스 API 오류: ${res.status}`);
    }
    const payload = (await res.json()) as NaverJson;
    const items = payload.items ?? [];
    if (!items.length) break;

    for (const item of items) {
      const publishedAt = new Date(item.pubDate);
      if (publishedAt < start || publishedAt > end) continue;

      const link = item.originallink || item.link || "";
      let source = "";
      try {
        source = new URL(link).hostname.replace(/^www\./, "");
      } catch {
        source = "";
      }

      articles.push({
        title: item.title,
        snippet: item.description,
        link,
        published_at: publishedAt.toISOString(),
        source,
      });

      if (articles.length >= limit) break;
    }

    if (articles.length >= limit) break;
    pageStart += 50;
  }

  return articles;
}

async function analyzeWithOpenAI(
  corpus: string,
  apiKey: string,
  model: string
): Promise<{
  summary: string;
  keywords: string[];
  sentiment: string;
  category: string;
}> {
  const body = {
    model,
    response_format: { type: "json_object" as const },
    messages: [
      {
        role: "system" as const,
        content:
          "너는 뉴스 분석 AI다. 항상 JSON 형식만 출력하고, 설명은 포함하지 마라.",
      },
      {
        role: "user" as const,
        content: `입력된 여러 뉴스 기사를 기반으로 다음 작업을 수행해라:

1. 전체 흐름을 하나로 묶어 요약 (5줄 이내)
2. 핵심 키워드 10개 추출 (중요도 순)
3. 전체 뉴스의 감정 분석 (긍정 / 부정 / 중립)
4. 뉴스 카테고리 분류

[카테고리 목록]
정치 / 경제 / 사회 / IT / 세계 / 문화

[출력 형식 - 반드시 JSON]
{
  "summary": "",
  "keywords": [],
  "sentiment": "",
  "category": ""
}

[조건]
- 요약은 중복 제거 후 핵심만 작성
- 키워드는 명사 위주
- 감정은 전체 맥락 기준
- 카테고리는 하나만 선택
- 키가 누락되면 안 된다
- 만약 정보가 부족하면 빈 문자열("") 또는 []로 채워라

[뉴스 데이터]
${corpus}`,
      },
    ],
  };

  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI API 오류 (${res.status}): ${errText.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const raw = data.choices?.[0]?.message?.content ?? "{}";
  let parsed: {
    summary?: string;
    keywords?: string[];
    sentiment?: string;
    category?: string;
  };
  try {
    parsed = JSON.parse(raw) as typeof parsed;
  } catch {
    parsed = {};
  }

  const keywords = Array.isArray(parsed.keywords) ? parsed.keywords : [];
  const cleaned: string[] = [];
  for (const k of keywords) {
    const s = String(k).trim();
    if (s && !cleaned.includes(s)) cleaned.push(s);
  }

  return {
    summary: String(parsed.summary ?? "").trim(),
    keywords: cleaned.slice(0, 10),
    sentiment: String(parsed.sentiment ?? "").trim(),
    category: String(parsed.category ?? "").trim(),
  };
}

function resolveOpenAIModel(envModel: string | undefined): string {
  const m = (envModel ?? "").trim();
  if (!m) return DEFAULT_OPENAI_MODEL;
  return m;
}

export async function runNewsAnalysisServerless(params: {
  query: string;
  period: Period;
  sort: NaverSort;
  naverClientId: string;
  naverClientSecret: string;
  openaiApiKey: string;
  openaiModel?: string;
}): Promise<NewsAnalysisResult> {
  const {
    query,
    period,
    sort,
    naverClientId,
    naverClientSecret,
    openaiApiKey,
    openaiModel,
  } = params;

  if (!naverClientId || !naverClientSecret) {
    throw new Error("NAVER_CLIENT_ID와 NAVER_CLIENT_SECRET이 필요합니다.");
  }
  if (!openaiApiKey) {
    throw new Error("OPENAI_API_KEY가 필요합니다.");
  }

  let raw = await fetchNaverArticles(
    query,
    period,
    sort,
    naverClientId,
    naverClientSecret,
    15
  );
  raw = truncateArticles(deduplicateArticles(raw), 280);

  if (!raw.length) {
    return {
      summary: "검색 조건에 맞는 최신 뉴스가 없습니다.",
      keywords: [],
      sentiment: "",
      category: "",
      wordcloud: [],
      articles: [],
    };
  }

  const corpus = buildCorpus(raw);
  const model = resolveOpenAIModel(openaiModel);
  const analysis = await analyzeWithOpenAI(corpus, openaiApiKey, model);
  const wordcloud = buildWordcloud(analysis.keywords, raw);

  return {
    summary: analysis.summary,
    keywords: analysis.keywords,
    sentiment: analysis.sentiment,
    category: analysis.category,
    wordcloud,
    articles: raw,
  };
}
