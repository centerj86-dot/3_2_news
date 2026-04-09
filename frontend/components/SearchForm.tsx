"use client";

import type { NaverSort, Period } from "@/lib/types";

interface SearchFormProps {
  query: string;
  period: Period;
  sort: NaverSort;
  isLoading: boolean;
  onQueryChange: (value: string) => void;
  onPeriodChange: (value: Period) => void;
  onSortChange: (value: NaverSort) => void;
  onSubmit: () => void;
}

const PERIOD_OPTIONS: Array<{ label: string; value: Period }> = [
  { label: "오늘", value: "today" },
  { label: "최근 3일", value: "3days" },
  { label: "이번 주", value: "week" },
];

const SORT_OPTIONS: Array<{ label: string; value: NaverSort; hint: string }> = [
  { label: "최신순", value: "date", hint: "날짜 기준" },
  { label: "관련도순", value: "sim", hint: "검색어와의 유사도" },
];

export function SearchForm({
  query,
  period,
  sort,
  isLoading,
  onQueryChange,
  onPeriodChange,
  onSortChange,
  onSubmit,
}: SearchFormProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700">검색어</span>
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onSubmit();
            }}
            placeholder="예: 금리, 반도체, AI"
            className="h-11 rounded-xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          />
        </label>

        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="flex flex-col gap-1.5 sm:w-36">
            <span className="text-sm font-medium text-slate-700">기간</span>
            <select
              value={period}
              onChange={(event) => onPeriodChange(event.target.value as Period)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            >
              {PERIOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex min-w-0 flex-1 flex-col gap-1.5 sm:min-w-[11rem]">
            <span className="text-sm font-medium text-slate-700">뉴스 정렬</span>
            <select
              value={sort}
              onChange={(event) =>
                onSortChange(event.target.value as NaverSort)
              }
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} ({option.hint})
                </option>
              ))}
            </select>
            <span className="text-xs text-slate-400">
              조회수는 API에 없어, 관련도순이 인기와 가장 가깝습니다.
            </span>
          </label>

          <button
            type="button"
            onClick={onSubmit}
            disabled={isLoading || !query.trim()}
            className="h-11 rounded-xl bg-sky-600 px-6 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-300 sm:shrink-0"
          >
            {isLoading ? "분석 중…" : "뉴스 분석"}
          </button>
        </div>
      </div>
    </section>
  );
}
