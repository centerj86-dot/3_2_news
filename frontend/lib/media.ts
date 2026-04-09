/**
 * 도메인 → 한국어 언론사명 매핑 테이블.
 * 없는 도메인은 formatSource()가 도메인을 보기 좋게 가공해서 반환합니다.
 */
const MEDIA_MAP: Record<string, string> = {
  // 종합 일간지
  "chosun.com": "조선일보",
  "joongang.co.kr": "중앙일보",
  "donga.com": "동아일보",
  "hani.co.kr": "한겨레",
  "khan.co.kr": "경향신문",
  "ohmynews.com": "오마이뉴스",
  "pressian.com": "프레시안",
  "hankookilbo.com": "한국일보",
  "munhwa.com": "문화일보",
  "segye.com": "세계일보",
  "kmib.co.kr": "국민일보",
  "seoul.co.kr": "서울신문",
  "naeil.com": "내일신문",
  "imaeil.com": "매일신문",
  "busan.com": "부산일보",

  // 경제·금융
  "mk.co.kr": "매일경제",
  "hankyung.com": "한국경제",
  "sedaily.com": "서울경제",
  "etoday.co.kr": "이투데이",
  "fnnews.com": "파이낸셜뉴스",
  "inews24.com": "아이뉴스24",
  "thebell.co.kr": "더벨",
  "edaily.co.kr": "이데일리",
  "newspim.com": "뉴스핌",
  "businesspost.co.kr": "비즈니스포스트",
  "bizwatch.co.kr": "비즈워치",
  "mt.co.kr": "머니투데이",
  "moneys.mt.co.kr": "머니S",
  "asiae.co.kr": "아시아경제",
  "ajunews.com": "아주경제",
  "news1.kr": "뉴스1",
  "newsis.com": "뉴시스",
  "yonhapnews.co.kr": "연합뉴스",
  "yna.co.kr": "연합뉴스",

  // 방송
  "kbs.co.kr": "KBS",
  "mbc.co.kr": "MBC",
  "sbs.co.kr": "SBS",
  "jtbc.co.kr": "JTBC",
  "tvchosun.com": "TV조선",
  "mbn.co.kr": "MBN",
  "channela.com": "채널A",
  "ytn.co.kr": "YTN",
  "tbs.seoul.kr": "TBS",

  // IT·테크
  "zdnet.co.kr": "ZDNet Korea",
  "etnews.com": "전자신문",
  "dt.co.kr": "디지털타임스",
  "itchosun.com": "IT조선",
  "bloter.net": "블로터",
  "techm.kr": "테크M",
  "techcrunch.com": "TechCrunch",
  "venturebeat.com": "VentureBeat",
  "aitimes.com": "AI타임스",
  "aitimes.kr": "AI타임스",
  "tokenpost.kr": "토큰포스트",
  "coindesk.com": "코인데스크",
  "coindeskkorea.com": "코인데스크코리아",

  // 스포츠·연예
  "sports.chosun.com": "스포츠조선",
  "sportsworldi.com": "스포츠월드",
  "osen.co.kr": "OSEN",
  "isplus.com": "일간스포츠",
  "xportsnews.com": "엑스포츠뉴스",
  "tenasia.hankyung.com": "텐아시아",
  "starnewskorea.com": "스타뉴스",

  // 기타
  "vop.co.kr": "민중의소리",
  "getnews.co.kr": "글로벌경제신문",
  "ebn.co.kr": "EBN",
  "pinpointnews.co.kr": "핀포인트뉴스",
  "bigtanews.co.kr": "빅타뉴스",
  "megaeconomy.co.kr": "메가이코노미",
};

/**
 * 도메인 문자열을 받아 언론사명을 반환합니다.
 * 매핑 테이블에 없으면 도메인에서 TLD를 제거하고 첫 글자를 대문자로 변환합니다.
 */
export function formatSource(domain: string): string {
  if (!domain) return "출처 미상";

  const clean = domain.replace(/^www\./, "").toLowerCase();

  if (MEDIA_MAP[clean]) return MEDIA_MAP[clean];

  // 매핑 없는 경우: TLD 제거 후 보기 좋게 반환
  const withoutTld = clean.replace(/\.(com|co\.kr|kr|net|org|io)$/, "");
  return withoutTld.charAt(0).toUpperCase() + withoutTld.slice(1);
}
