"use client";

import { useState } from "react";

import { ResultPanel } from "@/components/ResultPanel";
import { SearchForm } from "@/components/SearchForm";
import { fetchNews } from "@/lib/api";
import type { NaverSort, NewsAnalysisResult, Period } from "@/lib/types";

export function NewsDashboard() {
  const [query, setQuery] = useState("AI");
  const [period, setPeriod] = useState<Period>("today");
  const [sort, setSort] = useState<NaverSort>("date");
  const [result, setResult] = useState<NewsAnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setError("검색어를 입력해 주세요.");
      return;
    }

    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const nextResult = await fetchNews(trimmedQuery, period, sort);
      setResult(nextResult);
    } catch (submissionError) {
      const message =
        submissionError instanceof Error
          ? submissionError.message
          : "알 수 없는 오류가 발생했습니다.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-16 pt-6">
      {/* 검색 폼 — 항상 상단 가로 1줄 */}
      <SearchForm
        query={query}
        period={period}
        sort={sort}
        isLoading={isLoading}
        onQueryChange={setQuery}
        onPeriodChange={setPeriod}
        onSortChange={setSort}
        onSubmit={handleSubmit}
      />

      {/* 로딩 인디케이터 */}
      {isLoading && (
        <div className="mt-8 flex flex-col items-center gap-4 py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-sky-500" />
          <p className="text-sm text-slate-500">
            뉴스를 수집하고 AI가 분석 중입니다…
          </p>
        </div>
      )}

      {/* 결과 — 검색 폼 아래 전체 너비 */}
      {!isLoading && (
        <div className="mt-8">
          <ResultPanel result={result} error={error} />
        </div>
      )}
    </div>
  );
}
