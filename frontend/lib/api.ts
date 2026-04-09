import type { NaverSort, NewsAnalysisResult, Period } from "@/lib/types";

export async function fetchNews(
  query: string,
  period: Period,
  sort: NaverSort = "date"
) {
  const params = new URLSearchParams({
    query,
    period,
    sort,
  });

  const response = await fetch(`/api/news?${params.toString()}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      detail?: string;
    } | null;

    throw new Error(payload?.detail || "뉴스 분석 요청에 실패했습니다.");
  }

  return (await response.json()) as NewsAnalysisResult;
}
