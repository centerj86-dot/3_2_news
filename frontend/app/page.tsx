import { NewsDashboard } from "@/components/NewsDashboard";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      {/* 헤더 */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600 text-white text-sm font-bold">
            N
          </div>
          <div>
            <span className="text-sm font-semibold text-slate-900">
              뉴스 요약 서비스
            </span>
            <span className="ml-2 text-xs text-slate-400">
              Naver News × GPT
            </span>
          </div>
        </div>
      </header>

      {/* 히어로 */}
      <section className="mx-auto max-w-5xl px-4 pb-2 pt-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-sky-600">
          Real-time News Summarization
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          최신 뉴스 흐름을 한눈에
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
          키워드와 기간을 입력하면 네이버 뉴스를 수집하고 GPT가 요약·키워드·감정·카테고리를 분석합니다.
        </p>
      </section>

      {/* 대시보드 */}
      <NewsDashboard />
    </main>
  );
}
