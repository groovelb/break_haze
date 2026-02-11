# The Break & The Haze

90년대 Big Beat / Trip-hop 음악을 탐험하는 인터랙티브 오디오비주얼 타임라인 웹앱.

## Tech Stack

- React 19 + TypeScript + Vite
- Tailwind CSS (CDN via `<script>` in index.html)
- GSAP (애니메이션, ScrollTrigger)
- Web Audio API (오디오 분석 & 시각화)
- iTunes Search API (앨범 아트워크 & 프리뷰 오디오)
- pnpm (패키지 매니저)

## Architecture

```
App.tsx              # 루트 컴포넌트, AudioContext 관리
├── components/
│   ├── Timeline.tsx     # 수평 스크롤 타임라인 + 연도 마커
│   ├── AlbumCard.tsx    # 3D 틸트 앨범 카드 (GSAP)
│   └── Visualizer.tsx   # Canvas 기반 오디오 시각화
├── services/
│   └── api.ts           # iTunes API 데이터 페칭 & enrichment
├── constants.ts         # 아티스트/앨범 카탈로그 데이터
├── types.ts             # TypeScript 타입 정의
└── index.html           # Tailwind config, 커스텀 폰트, CRT/scanline 효과
```

## Commands

- `pnpm dev` — 개발 서버 (port 3000)
- `pnpm build` — 프로덕션 빌드
- `pnpm preview` — 빌드 결과 미리보기

## Design System

### 비주얼 컨셉

90년대 레트로 + CRT 모니터 미학. 반드시 이 톤을 유지할 것.

### Colors (Tailwind custom)

- `acid-yellow`: #ccff00 — 강조, Big Beat 계열
- `neon-pink`: #ff0099 — 강조, 글리치 효과
- `deep-purple`: #240046 — Trip-hop 시각화
- `off-black`: #050505 — 배경
- `dim-gray`: #2a2a2a — 보조 배경

### Fonts

- `font-display`: Syncopate (헤딩, 브랜드)
- `font-mono`: Space Mono (본문, UI 텍스트)

### Visual Effects

- CRT 스캔라인 오버레이 (index.html `.scanlines`)
- 노이즈 텍스처 오버레이 (index.html `.noise`)
- 글리치 애니메이션 (`animate-glitch-skew`)

## Genre Styles

두 가지 시각화 모드가 있으며, `GenreStyle` 타입으로 관리:

- `thunder` (Big Beat): 주파수 도메인 분석, 날카로운 라인, acid-yellow/neon-pink, 화면 셰이크
- `cloud` (Trip-hop): 시간 도메인 분석, 부드러운 웨이브, deep-purple 글로우, 잔상 효과

## Conventions

- Tailwind 클래스는 index.html의 CDN `tailwind.config`에서 확장됨 — 별도 tailwind.config 파일 없음
- 컴포넌트는 `components/` 디렉토리에 React.FC 타입으로 작성
- 상태 관리는 React hooks만 사용 (외부 상태 라이브러리 없음)
- IMPORTANT: `.env.local`의 API 키를 절대 커밋하지 말 것
- 앨범 데이터 추가 시 `constants.ts`의 `ALBUMS_DATA` 배열에 `ArtistGroup` 형태로 추가
- iTunes API 호출은 `services/api.ts`의 배치 처리 로직 사용 (rate limit 고려)
