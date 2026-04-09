import { type NextRequest, NextResponse } from "next/server";

import { runNewsAnalysisServerless } from "@/lib/server/news-pipeline";

export const dynamic = "force-dynamic";
/** Pro 플랜에서만 60초까지. Hobby는 최대 10초 제한이 있을 수 있음 */
export const maxDuration = 60;

const BACKEND_URL = process.env.BACKEND_URL?.trim() ?? "";

function isPeriod(s: string): s is "today" | "3days" | "week" {
  return s === "today" || s === "3days" || s === "week";
}

function isSort(s: string): s is "date" | "sim" {
  return s === "date" || s === "sim";
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get("query") ?? "";
  const periodRaw = searchParams.get("period") ?? "today";
  const sortRaw = searchParams.get("sort") ?? "date";

  const period = isPeriod(periodRaw) ? periodRaw : "today";
  const sort = isSort(sortRaw) ? sortRaw : "date";

  if (BACKEND_URL) {
    try {
      const upstream = await fetch(
        `${BACKEND_URL}/news?query=${encodeURIComponent(query)}&period=${encodeURIComponent(period)}&sort=${encodeURIComponent(sort)}`,
        { cache: "no-store" }
      );

      const data = await upstream.json();

      return NextResponse.json(data, { status: upstream.status });
    } catch {
      return NextResponse.json(
        { detail: "백엔드 서버에 연결할 수 없습니다." },
        { status: 503 }
      );
    }
  }

  const naverId = process.env.NAVER_CLIENT_ID ?? "";
  const naverSecret = process.env.NAVER_CLIENT_SECRET ?? "";
  const openaiKey = process.env.OPENAI_API_KEY ?? "";

  if (!naverId || !naverSecret || !openaiKey) {
    return NextResponse.json(
      {
        detail:
          "환경 변수 NAVER_CLIENT_ID, NAVER_CLIENT_SECRET, OPENAI_API_KEY를 설정하거나, 별도 FastAPI 주소를 BACKEND_URL로 지정하세요.",
      },
      { status: 503 }
    );
  }

  try {
    const result = await runNewsAnalysisServerless({
      query,
      period,
      sort,
      naverClientId: naverId,
      naverClientSecret: naverSecret,
      openaiApiKey: openaiKey,
      openaiModel: process.env.OPENAI_MODEL,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "뉴스 분석에 실패했습니다.";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
