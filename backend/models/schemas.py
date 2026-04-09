from datetime import datetime

from pydantic import BaseModel, Field


class Article(BaseModel):
    title: str
    snippet: str
    link: str
    published_at: datetime
    source: str = ""


class WordCloudItem(BaseModel):
    text: str
    value: int = Field(ge=1)


class NewsAnalysisResult(BaseModel):
    summary: str = ""
    keywords: list[str] = Field(default_factory=list)
    sentiment: str = ""
    category: str = ""
    wordcloud: list[WordCloudItem] = Field(default_factory=list)
    articles: list[Article] = Field(default_factory=list)
