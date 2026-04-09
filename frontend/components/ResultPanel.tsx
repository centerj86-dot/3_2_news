import type { NewsAnalysisResult } from "@/lib/types";
import { WordCloudView } from "@/components/WordCloudView";
import { formatSource } from "@/lib/media";

interface ResultPanelProps {
  result: NewsAnalysisResult | null;
  error: string;
}

const SENTIMENT_COLOR: Record<string, string> = {
  긍정: "bg-emerald-50 text-emerald-700 border-emerald-200",
  부정: "bg-red-50 text-red-700 border-red-200",
  중립: "bg-slate-50 text-slate-700 border-slate-200",
};

function MetaBadge({ label, value }: { label: string; value: string }) {
  const colorClass =
    label === "감정"
      ? (SENTIMENT_COLOR[value] ?? "bg-slate-50 text-slate-700 border-slate-200")
      : "bg-sky-50 text-sky-700 border-sky-200";

  return (
    <div className={`rounded-xl border px-4 py-3 ${colorClass}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-60">
        {label}
      </p>
      <p className="mt-0.5 text-base font-semibold">{value || "-"}</p>
    </div>
  );
}

export function ResultPanel({ result, error }: ResultPanelProps) {
  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!result) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-400">
        검색어를 입력하고 <strong className="text-slate-600">뉴스 분석</strong>을
        누르면 결과가 여기에 표시됩니다.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 감정 · 카테고리 + 요약 */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-wrap gap-3">
          <MetaBadge label="감정" value={result.sentiment} />
          <MetaBadge label="카테고리" value={result.category} />
        </div>

        <div className="rounded-xl bg-slate-50 px-5 py-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            통합 요약
          </p>
          <p className="whitespace-pre-line text-[15px] leading-7 text-slate-800">
            {result.summary || "요약 결과가 없습니다."}
          </p>
        </div>
      </section>

      {/* 키워드 + 워드클라우드 */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="mb-1 text-sm font-semibold text-slate-700">핵심 키워드</p>
        <p className="mb-4 text-xs text-slate-400">
          중요도 순으로 정렬된 키워드입니다.
        </p>

        <div className="mb-4 flex flex-wrap gap-2">
          {result.keywords.map((keyword) => (
            <span
              key={keyword}
              className="rounded-full bg-sky-100 px-3 py-1 text-sm font-medium text-sky-700"
            >
              {keyword}
            </span>
          ))}
        </div>

        <WordCloudView words={result.wordcloud} />
      </section>

      {/* 기사 목록 */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="mb-1 text-sm font-semibold text-slate-700">수집된 기사</p>
        <p className="mb-5 text-xs text-slate-400">
          GPT 분석에 사용된 최신 기사 {result.articles.length}건입니다.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {result.articles.map((article) => (
            <article
              key={`${article.link}-${article.published_at}`}
              className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50 p-4 transition hover:border-sky-200 hover:bg-sky-50"
            >
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                <span className="rounded bg-slate-200 px-1.5 py-0.5 font-semibold text-slate-600">
                  {formatSource(article.source)}
                </span>
                <span>·</span>
                <span>
                  {new Date(article.published_at).toLocaleString("ko-KR", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <a
                href={article.link}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold leading-snug text-slate-900 hover:text-sky-700"
              >
                {article.title}
              </a>
              <p className="line-clamp-2 text-xs leading-5 text-slate-500">
                {article.snippet}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
