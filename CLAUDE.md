# 이야기 이어쓰기 앱 — 작업 컨텍스트

## 프로젝트 개요
초등학교 협력 창작 활동 앱. 교사가 방을 만들고 학생들이 이야기를 돌아가며 이어씁니다.

- **기술 스택**: Next.js 14 (App Router) + TypeScript + Socket.io + Tailwind CSS + Zustand
- **실행**: `npm run dev` → http://localhost:3000

---

## 현재 작업 상태

### 완료된 작업 (Phase 1 전체)
- [x] 프로젝트 초기화 및 디렉토리 구조
- [x] Socket.io 서버 (`server/server.js`)
- [x] 교사 방 생성 화면 (`app/teacher/create/`)
- [x] 교사 대시보드 (`app/teacher/room/[roomCode]/`)
- [x] 학생 접속 화면 (`app/student/join/`)
- [x] 학생 작성 화면 (`app/student/room/[roomCode]/`)
- [x] 파일 저장 기능 (`components/student/ExportButtons.tsx`)

### 미완료 (Phase 2~3)
- [ ] Phase 2-1: 세션 복원 + 오프라인 대응
- [ ] Phase 2-2: 교사 안전 도구 (덩어리 수정/삭제, 도움 요청)
- [ ] Phase 2-3: 모둠별 이야기 순환
- [ ] Phase 3-1: 낭독 모드 + 이야기 갤러리
- [ ] Phase 3-2: 활동 리포트 CSV + AI 이미지 프롬프트
- [ ] Phase 3-3: UI 폴리싱 + 반응형 완성

---

## 핵심 미결 과제: 디자인 핸드오프 적용

### 문제
Claude Code로 기능 구현 → Claude Design으로 디자인 → 핸드오프를 나중에 적용했더니 Claude Code 기본 디자인이 우선 적용됨.

### 해결 방향 (둘 중 선택)
**A) 현재 앱에 핸드오프 적용** (권장)
- Claude Design 핸드오프 파일을 받아서 기존 컴포넌트에 덮어 적용
- globals.css / tailwind.config.js / 각 컴포넌트의 className 교체
- `_prompts/` 폴더에 있는 원본 프롬프트 참고

**B) 처음부터 재시작**
- `_prompts/story-app-claude-code-prompt.md`의 Phase 1 프롬프트들을 순서대로 실행
- 단, 시작 전에 Claude Design 핸드오프를 먼저 제공한 뒤 스타일 가이드로 삼아 구현

### 디자인 가이드라인 (원본 프롬프트 기준)
- 주 색상: 파란색 `#3B82F6` / 보조: 초록 `#10B981` / 경고: 주황 `#F59E0B` / 오류: 빨강 `#EF4444`
- 폰트: Noto Sans KR (Google Fonts)
- 대상: 초등학생 → 큰 버튼, 명확한 레이블, 직관적 UI
- 반응형: 모바일 390px / 태블릿 768px / 데스크탑 1280px

---

## 다음 작업 시작 방법

1. **Claude Design 핸드오프 파일**을 먼저 공유해주세요
2. 핸드오프의 색상/타이포/컴포넌트 스펙을 확인한 뒤
3. "현재 앱에 적용(A)" 또는 "재시작(B)" 중 방향을 결정

전체 기능 프롬프트는 `_prompts/story-app-claude-code-prompt.md` 참고.
