from __future__ import annotations

import json
import os

from dotenv import load_dotenv
from openai import OpenAI
from pydantic import BaseModel, Field

load_dotenv()


class LLMNewsAnalysis(BaseModel):
    summary: str = ""
    keywords: list[str] = Field(default_factory=list)
    sentiment: str = ""
    category: str = ""


class NewsAnalyzer:
    def __init__(self) -> None:
        self.api_key = os.getenv("OPENAI_API_KEY", "")
        self.model = os.getenv("OPENAI_MODEL", "gpt-5.4")

    def analyze(self, articles_text: str) -> LLMNewsAnalysis:
        if not self.api_key:
            raise RuntimeError("OPENAI_API_KEY is required.")

        client = OpenAI(api_key=self.api_key)
        response = client.chat.completions.create(
            model=self.model,
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": (
                        "너는 뉴스 분석 AI다. "
                        "항상 JSON 형식만 출력하고, 설명은 포함하지 마라."
                    ),
                },
                {
                    "role": "user",
                    "content": f"""
입력된 여러 뉴스 기사를 기반으로 다음 작업을 수행해라:

1. 전체 흐름을 하나로 묶어 요약 (5줄 이내)
2. 핵심 키워드 10개 추출 (중요도 순)
3. 전체 뉴스의 감정 분석 (긍정 / 부정 / 중립)
4. 뉴스 카테고리 분류

[카테고리 목록]
정치 / 경제 / 사회 / IT / 세계 / 문화

[출력 형식 - 반드시 JSON]
{{
  "summary": "",
  "keywords": [],
  "sentiment": "",
  "category": ""
}}

[조건]
- 요약은 중복 제거 후 핵심만 작성
- 키워드는 명사 위주
- 감정은 전체 맥락 기준
- 카테고리는 하나만 선택
- 키가 누락되면 안 된다
- 만약 정보가 부족하면 빈 문자열(\"\") 또는 []로 채워라

[뉴스 데이터]
{articles_text}
""".strip(),
                },
            ],
        )

        content = response.choices[0].message.content or "{}"
        parsed = json.loads(content)
        analysis = LLMNewsAnalysis.model_validate(parsed)

        cleaned_keywords = []
        for keyword in analysis.keywords:
            normalized = str(keyword).strip()
            if normalized and normalized not in cleaned_keywords:
                cleaned_keywords.append(normalized)

        return LLMNewsAnalysis(
            summary=analysis.summary.strip(),
            keywords=cleaned_keywords[:10],
            sentiment=analysis.sentiment.strip(),
            category=analysis.category.strip(),
        )
