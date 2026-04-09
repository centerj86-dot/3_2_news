from __future__ import annotations

import html
import re
from collections import Counter
from typing import Iterable

from backend.models.schemas import Article, WordCloudItem

HTML_TAG_PATTERN = re.compile(r"<[^>]+>")
WHITESPACE_PATTERN = re.compile(r"\s+")
NON_WORD_PATTERN = re.compile(r"[^0-9A-Za-z가-힣\s]")


def clean_text(text: str) -> str:
    without_html = HTML_TAG_PATTERN.sub(" ", html.unescape(text or ""))
    without_symbols = NON_WORD_PATTERN.sub(" ", without_html)
    return WHITESPACE_PATTERN.sub(" ", without_symbols).strip()


def deduplicate_articles(articles: Iterable[Article]) -> list[Article]:
    seen: set[tuple[str, str]] = set()
    unique_articles: list[Article] = []

    for article in articles:
        key = (clean_text(article.title).lower(), article.link)
        if key in seen:
            continue
        seen.add(key)
        unique_articles.append(
            Article(
                title=clean_text(article.title),
                snippet=clean_text(article.snippet),
                link=article.link,
                published_at=article.published_at,
                source=article.source,
            )
        )

    return unique_articles


def truncate_articles(articles: Iterable[Article], max_chars: int = 350) -> list[Article]:
    trimmed: list[Article] = []
    for article in articles:
        snippet = article.snippet[:max_chars].strip()
        trimmed.append(
            Article(
                title=article.title,
                snippet=snippet,
                link=article.link,
                published_at=article.published_at,
                source=article.source,
            )
        )
    return trimmed


def build_analysis_corpus(articles: Iterable[Article]) -> str:
    chunks = []
    for index, article in enumerate(articles, start=1):
        chunks.append(
            "\n".join(
                [
                    f"[기사 {index}]",
                    f"제목: {article.title}",
                    f"요약: {article.snippet}",
                    f"출처: {article.source or 'unknown'}",
                ]
            )
        )
    return "\n\n".join(chunks)


def build_wordcloud(keywords: list[str], articles: Iterable[Article], limit: int = 10) -> list[WordCloudItem]:
    normalized_keywords = [clean_text(keyword) for keyword in keywords if clean_text(keyword)]
    if not normalized_keywords:
        return []

    corpus = " ".join(f"{article.title} {article.snippet}" for article in articles)
    lowered_corpus = corpus.lower()
    weights: Counter[str] = Counter()

    for index, keyword in enumerate(normalized_keywords):
        count = lowered_corpus.count(keyword.lower())
        weights[keyword] = count if count > 0 else max(1, len(normalized_keywords) - index)

    return [
        WordCloudItem(text=text, value=value)
        for text, value in weights.most_common(limit)
    ]
