# 실시간 뉴스 요약 서비스

네이버 뉴스 검색 결과를 수집하고, OpenAI(GPT)로 **통합 요약**, **핵심 키워드**, **감정 분석**, **카테고리 분류**, **워드클라우드** 데이터를 제공하는 웹 서비스입니다.

## 기술 스택

| 구분 | 사용 |
|------|------|
| 프론트엔드 | Next.js 16 (App Router), TypeScript, Tailwind CSS |
| 백엔드 | Python 3, FastAPI, Uvicorn |
| 외부 API | 네이버 검색 API(뉴스), OpenAI Chat Completions |

## 프로젝트 구조

```
3_2_news/
├── backend/          # FastAPI 서버
│   ├── main.py
│   ├── requirements.txt
│   ├── .env.example
│   └── services/
├── frontend/         # Next.js 앱
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── .env.example
│   └── package.json
├── gpt.md            # GPT 프롬프트 설계 메모
├── wordcloud.md      # 워드클라우드 파이프라인 메모
└── README.md
```

## 사전 준비

1. [네이버 개발자 센터](https://developers.naver.com/)에서 애플리케이션 등록 후 **Client ID**, **Client Secret** 발급  
2. [OpenAI](https://platform.openai.com/)에서 **API Key** 발급  
3. Node.js · Python 설치

## 환경 변수 (비밀 정보는 Git에 올리지 마세요)

### 백엔드

`backend/.env.example`을 복사해 `backend/.env`를 만들고 값을 채웁니다.

```bash
cd backend
copy .env.example .env   # Windows
# cp .env.example .env   # macOS / Linux
```

| 변수 | 설명 |
|------|------|
| `NAVER_CLIENT_ID` | 네이버 Client ID |
| `NAVER_CLIENT_SECRET` | 네이버 Client Secret |
| `OPENAI_API_KEY` | OpenAI API 키 |
| `OPENAI_MODEL` | 사용 모델명 (예: `gpt-5.4`) |

### 프론트엔드

`frontend/.env.example`을 복사해 `frontend/.env.local`을 만듭니다.

| 변수 | 설명 |
|------|------|
| `NEXT_PUBLIC_API_BASE_URL` | (선택) 공개 API 베이스 URL |
| `BACKEND_URL` | Next.js가 프록시할 백엔드 주소 (기본 `http://127.0.0.1:8000`) |

로컬 개발 시 프론트는 `/api/news`로 요청하고, Route Handler가 `BACKEND_URL`로 전달합니다.

## 설치 및 실행

### 백엔드

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate          # Windows
# source .venv/bin/activate       # macOS / Linux
pip install -r requirements.txt
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

헬스 체크: `http://127.0.0.1:8000/health`

### 프론트엔드

```bash
cd frontend
npm install
npm run dev -- --port 3001
```

브라우저: `http://localhost:3001` (또는 표시된 포트)

## API

### `GET /news` (백엔드)

| 쿼리 | 설명 |
|------|------|
| `query` | 검색 키워드 (필수) |
| `period` | `today` · `3days` · `week` |
| `sort` | `date`(최신순) · `sim`(관련도순). 조회수는 네이버 API에 없어 관련도순이 대안입니다. |

응답: `summary`, `keywords`, `sentiment`, `category`, `wordcloud`, `articles`

## 보안 주의

- **`backend/.env`**, **`frontend/.env.local`** 은 `.gitignore`에 포함되어 있으며 저장소에 커밋하지 마세요.
- 키가 유출된 적이 있다면 네이버·OpenAI에서 키를 재발급하세요.

## 라이선스

개인·교육 목적 프로젝트에 맞게 자유롭게 수정해 사용하세요.
