import { type NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get("query") ?? "";
  const period = searchParams.get("period") ?? "today";
  const sort = searchParams.get("sort") ?? "date";

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
