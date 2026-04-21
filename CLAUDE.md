# 이야기 이어쓰기 앱 — 작업 컨텍스트

## 프로젝트 개요
초등학교 협력 창작 활동 앱. 교사가 방을 만들고 학생들이 이야기를 돌아가며 이어씁니다.

- **기술 스택**: Next.js 14 (App Router) + TypeScript + Socket.io + Tailwind CSS + Zustand + Zod + react-hook-form
- **실행**: `npm run dev` → http://localhost:3000
- **디자인**: 핸드오프 적용 완료 (`C:\Users\dlgks\Downloads\_ Design System\design_handoff_ieoseugi_design_system`)

---

## 디자인 시스템

모든 컴포넌트는 핸드오프 스펙 기반으로 재작성됨. **인라인 style={{}} 절대 사용 금지.**

- 색상: `bg-brand`, `text-fg-1`, `bg-paper-0` 등 CSS 변수 기반 Tailwind 토큰 사용
- 버튼: `components/ui/button.tsx` (Button 컴포넌트) 사용
- 인풋: `components/ui/input.tsx`, `components/ui/textarea.tsx`
- 뱃지: `components/ui/badge.tsx` (phase variant 포함)
- 카드: `components/ui/card.tsx`
- 앱바: `components/AppBar.tsx`

---

## 현재 작업 상태

### 완료 (Phase 1 — 핸드오프 재작성)
- [x] 디자인 토큰 (tailwind.config.js + globals.css)
- [x] UI 기본 컴포넌트 (Button, Input, Textarea, Badge, Card)
- [x] 홈 페이지 (`app/page.tsx`)
- [x] 교사 방 생성 (`app/teacher/create/`)
- [x] 교사 대시보드 (`app/teacher/room/[roomCode]/`)
- [x] 학생 입장 (`app/student/join/`)
- [x] 학생 방 (대기/읽기/작성/완료) (`app/student/room/[roomCode]/`)

### 완료 (Phase 1.5 — 버그픽스 + 기능 추가)
- [x] 홈 화면 비주얼 개선 (장식, 마스코트 애니메이션, 카드 컨테이너)
- [x] Gaegu 폰트 적용 수정 (globals.css 하드코딩 제거 → next/font 우선)
- [x] 1라운드 읽기 단계 스킵 (서버: start_activity 바로 writing으로)
- [x] 도움 요청 → 교사 대시보드 SOS 뱃지 표시 + 해제 기능
- [x] QR 코드 생성 (교사 대시보드 QR 버튼, 방 생성 모달, qrcode.react)
- [x] 이전 이야기 전체 히스토리 기본 펼침 (최신 1개 open, 이전 것 접힘)
- [x] 읽기 시간 단계별 점진 증가 (base + step×10초)
- [x] 이야기 제출 후 그림 그리기 캔버스 복원 (WaitingCanvas)
- [x] QR 스캔 시 방 코드 자동 입력 (join 페이지 URL query param)
- [x] 교사 설정: 이전 단계 다시 쓰기 허용 토글 (allowRevision)
- [x] 작성 화면: 모든 이전 이야기 히스토리 표시 (이전 chunk 전체 목록)

### Phase 1.5 점검 목록 (다음 세션 시작 시 확인)

> `npm run dev` → 교사 탭 + 학생 탭 2~3개로 직접 테스트

- [ ] 홈 화면에 배경 장식(이모지)·마스코트(160px)·버튼 카드가 보인다
- [ ] 앱 제목/서브타이틀에 Gaegu(손글씨) 폰트가 적용돼 있다
- [ ] 활동 시작 시 **1단계는 읽기 없이 바로 작성 단계**로 진입한다
- [ ] 학생이 ✋ 도움 버튼 클릭 → 교사 카드에 "도움 요청" 뱃지가 표시된다
- [ ] 교사가 뱃지 클릭 → 도움 요청이 해제(초기화)된다
- [ ] 교사 대시보드 QR 버튼 클릭 → QR 코드 모달이 뜬다
- [ ] 방 생성 모달에도 QR 코드가 표시된다
- [ ] QR 스캔(또는 URL 직접 열기) → 학생 입장 화면에 방 코드가 자동 입력된다
- [ ] 2단계부터 읽기 시간이 1단계보다 길어진다 (기본+10초씩 증가)
- [ ] 작성 화면에서 **이전 모든 이야기 덩어리**가 목록으로 표시된다 (최신 1개 기본 펼침)
- [ ] 이야기 제출 후 **그림 그리기 캔버스**가 표시된다 (색상·지우개·굵기 사용 가능)
- [ ] 교사 방 설정에 "이전 단계 다시 쓰기 허용" 토글이 있다
- [ ] allowRevision=ON: 제출 후 "다시 쓰기" 버튼으로 수정 재제출 가능
- [ ] allowRevision=OFF: 제출 후 버튼 없음, 서버도 재제출 차단

### 미완료 (Phase 2~3)
- [ ] Phase 2-1: 세션 복원 + 오프라인 대응
- [ ] Phase 2-2: 교사 안전 도구 (덩어리 수정/삭제, 미리보기)
- [ ] Phase 2-3: 모둠별 이야기 순환
- [ ] Phase 3-1: 낭독 모드 + 이야기 갤러리
- [ ] Phase 3-2: 활동 리포트 CSV + AI 이미지 프롬프트
- [ ] Phase 3-3: UI 폴리싱 + 반응형 완성

---

## 폴더 구조

```
app/
├── layout.tsx              ← 폰트 (Noto Sans KR, Gaegu, JetBrains Mono)
├── globals.css             ← CSS 변수 전체 정의
├── page.tsx                ← 홈 (선생님/학생 선택)
├── teacher/create/         ← 방 만들기 (react-hook-form + zod)
└── teacher/room/[roomCode] ← 대시보드

components/
├── ui/                     ← Button, Input, Textarea, Badge, Card
├── AppBar.tsx
└── StudentStatusCard.tsx

lib/
├── socket.ts               ← Socket.io 싱글턴
├── store.ts                ← Zustand 상태
├── types.ts                ← 공통 타입
├── schemas.ts              ← Zod 스키마
├── phase.ts                ← 페이즈 메타
├── nicknames.ts            ← 랜덤 닉네임
└── utils.ts                ← cn() 유틸

server/
└── socketServer.js         ← Socket.io 서버 로직
server.js                   ← Next.js + Socket.io 통합 서버
```
