from __future__ import annotations

from datetime import datetime, time, timedelta
from typing import Literal

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from backend.models.schemas import NewsAnalysisResult
from backend.services.analyzer import NewsAnalyzer
from backend.services.naver_api import NaverNewsClient
from backend.services.preprocess import (
    build_analysis_corpus,
    build_wordcloud,
    deduplicate_articles,
    truncate_articles,
)

load_dotenv()

Period = Literal["today", "3days", "week"]
NaverSort = Literal["date", "sim"]

app = FastAPI(title="Real-time News Summarization Service")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

naver_client = NaverNewsClient()
news_analyzer = NewsAnalyzer()


def get_date_range(period: Period) -> tuple[datetime, datetime]:
    now = datetime.now()
    today_start = datetime.combine(now.date(), time.min)
    today_end = datetime.combine(now.date(), time.max)

    if period == "today":
        return today_start, today_end
    if period == "3days":
        return today_start - timedelta(days=2), today_end
    if period == "week":
        start_of_week = today_start - timedelta(days=now.weekday())
        return start_of_week, today_end
    raise HTTPException(status_code=400, detail="Unsupported period.")


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/news", response_model=NewsAnalysisResult)
async def get_news(
    query: str = Query(..., min_length=1, description="News keyword"),
    period: Period = Query("today"),
    sort: NaverSort = Query(
        "date",
        description="Naver news sort: date (newest) or sim (relevance)",
    ),
) -> NewsAnalysisResult:
    try:
        start_date, end_date = get_date_range(period)
        articles = await naver_client.fetch_news(
            query, start_date, end_date, limit=15, sort=sort
        )
        articles = truncate_articles(deduplicate_articles(articles), max_chars=280)

        if not articles:
            return NewsAnalysisResult(
                summary="검색 조건에 맞는 최신 뉴스가 없습니다.",
                keywords=[],
                sentiment="",
                category="",
                wordcloud=[],
                articles=[],
            )

        analysis = news_analyzer.analyze(build_analysis_corpus(articles))
        wordcloud = build_wordcloud(analysis.keywords, articles)

        return NewsAnalysisResult(
            summary=analysis.summary,
            keywords=analysis.keywords,
            sentiment=analysis.sentiment,
            category=analysis.category,
            wordcloud=wordcloud,
            articles=articles,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to process news: {exc}") from exc
