from __future__ import annotations

import os
from datetime import datetime
from typing import Literal
from email.utils import parsedate_to_datetime
from urllib.parse import urlparse

import httpx
from dotenv import load_dotenv

from backend.models.schemas import Article

load_dotenv()

NAVER_NEWS_URL = "https://openapi.naver.com/v1/search/news.json"

NaverSort = Literal["date", "sim"]


class NaverNewsClient:
    def __init__(self) -> None:
        self.client_id = os.getenv("NAVER_CLIENT_ID", "")
        self.client_secret = os.getenv("NAVER_CLIENT_SECRET", "")

    async def fetch_news(
        self,
        query: str,
        start_date: datetime,
        end_date: datetime,
        limit: int = 20,
        sort: NaverSort = "date",
    ) -> list[Article]:
        if not self.client_id or not self.client_secret:
            raise RuntimeError("NAVER_CLIENT_ID and NAVER_CLIENT_SECRET are required.")

        headers = {
            "X-Naver-Client-Id": self.client_id,
            "X-Naver-Client-Secret": self.client_secret,
        }

        articles: list[Article] = []
        page_start = 1

        async with httpx.AsyncClient(timeout=20.0) as client:
            while len(articles) < limit and page_start <= 91:
                response = await client.get(
                    NAVER_NEWS_URL,
                    params={
                        "query": query,
                        "display": min(50, limit),
                        "start": page_start,
                        "sort": sort,
                    },
                    headers=headers,
                )
                response.raise_for_status()
                payload = response.json()
                items = payload.get("items", [])
                if not items:
                    break

                for item in items:
                    published_at = parsedate_to_datetime(item["pubDate"])
                    if published_at.tzinfo is not None:
                        published_at = published_at.astimezone().replace(tzinfo=None)

                    if not (start_date <= published_at <= end_date):
                        continue

                    link = item.get("originallink") or item.get("link") or ""
                    source = urlparse(link).netloc.replace("www.", "")
                    articles.append(
                        Article(
                            title=item.get("title", ""),
                            snippet=item.get("description", ""),
                            link=link,
                            published_at=published_at,
                            source=source,
                        )
                    )

                    if len(articles) >= limit:
                        break

                page_start += 50

        return articles
