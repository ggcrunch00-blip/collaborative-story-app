# 이야기 이어쓰기 앱 — Claude Code MVP 프롬프트

> Claude Code에 아래 프롬프트 하나를 그대로 붙여넣으면 됩니다.
> 완성 후 `npm run dev`로 바로 실행 가능한 수준을 목표로 합니다.

---

## 사전 확인 (터미널에서 직접 실행)

```bash
node -v   # v18 이상 필요
```

---

## MVP 프롬프트 (단일 입력)

```
초등학교 이야기 이어쓰기 활동 앱을 만들어줘. 아래 스펙을 정확히 따라서 구현해줘.

───────────────────────────────────────────
# 기술 스택
───────────────────────────────────────────

- 프레임워크: Next.js 14 (App Router)
- 언어: TypeScript
- 실시간 통신: Socket.io
  - 서버: pages/api/socket.ts (Next.js custom server 방식)
  - 클라이언트: socket.io-client
- 스타일: Tailwind CSS
- 상태 관리: Zustand
- 파일 저장: jsPDF, file-saver
- 패키지 매니저: npm

───────────────────────────────────────────
# 앱 개요
───────────────────────────────────────────

교사가 방을 만들고, 학생들이 방 코드로 접속해 이야기를 돌아가며 이어 쓰는 협력 창작 활동 앱.

핵심 흐름:
1. 교사가 방 생성 (설정: 덩어리 수, 작성 시간, 읽기 시간, 이야기 씨앗)
2. 학생들이 방 코드 + 닉네임으로 접속
3. 교사가 활동 시작 → 모든 학생이 첫 덩어리 작성
4. 타이머 종료 → 교사가 "다음 단계" 버튼 클릭 → 이야기가 다음 학생에게 랜덤 전달
5. 설정한 덩어리 수만큼 반복
6. 활동 종료 → 각자 내가 시작한 이야기의 완성본 확인 + 파일 저장

───────────────────────────────────────────
# 공통 타입 정의 (lib/types.ts)
───────────────────────────────────────────

```typescript
export type AppPhase = 'waiting' | 'reading' | 'writing' | 'done'

export interface RoomSettings {
  chunkCount: number        // 덩어리 수 (2~8)
  timerSeconds: number      // 작성 시간 (초)
  readingSeconds: number    // 읽기 타임 (초)
  seedCards: string[]       // 이야기 씨앗 카드 (선택)
}

export interface Student {
  id: string
  nickname: string
  isOnline: boolean
  status: 'idle' | 'reading' | 'writing' | 'done'
  charCount: number
}

export interface StoryChunk {
  authorId: string
  authorNickname: string
  content: string
  createdAt: number
}

export interface Story {
  id: string
  ownerId: string           // 첫 덩어리 작성자 (= 이야기 주인)
  chunks: StoryChunk[]
}

export interface Room {
  roomCode: string
  hostId: string
  settings: RoomSettings
  phase: AppPhase
  currentStep: number       // 현재 진행 중인 덩어리 번호 (1부터 시작)
  students: Student[]
  stories: Story[]          // stories[i]는 students[i]가 소유
}
```

───────────────────────────────────────────
# 디렉토리 구조
───────────────────────────────────────────

```
story-relay-app/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                          # 진입점: 교사 / 학생 선택
│   ├── teacher/
│   │   ├── create/page.tsx              # 방 생성 폼
│   │   └── room/[roomCode]/page.tsx     # 교사 대시보드
│   └── student/
│       ├── join/page.tsx                # 방 참가 폼
│       └── room/[roomCode]/page.tsx     # 학생 작성 화면
├── components/
│   ├── teacher/
│   │   ├── RoomSetupForm.tsx
│   │   ├── StudentStatusGrid.tsx
│   │   └── TeacherControls.tsx
│   └── student/
│       ├── WritingArea.tsx
│       ├── TimerDisplay.tsx
│       ├── StoryViewer.tsx
│       ├── WaitingCanvas.tsx
│       └── ExportButtons.tsx
├── lib/
│   ├── socket.ts           # Socket.io 클라이언트 싱글턴
│   ├── store.ts            # Zustand 스토어
│   ├── types.ts            # 공통 타입
│   └── nicknames.ts        # 랜덤 닉네임 생성
├── server/
│   └── socketServer.ts     # Socket.io 서버 로직
└── pages/api/
    └── socket.ts           # Next.js ↔ Socket.io 브릿지
```

───────────────────────────────────────────
# Socket.io 이벤트 명세
───────────────────────────────────────────

## 클라이언트 → 서버

| 이벤트 | 페이로드 | 설명 |
|--------|---------|------|
| create_room | { settings, hostNickname } | 방 생성 |
| join_room | { roomCode, nickname } | 방 참가 |
| start_activity | — | 교사: 활동 시작 |
| next_phase | — | 교사: 다음 단계로 이동 |
| submit_chunk | { storyId, content } | 학생: 덩어리 제출 |
| save_draft | { storyId, content } | 학생: 임시저장 |

## 서버 → 클라이언트

| 이벤트 | 페이로드 | 설명 |
|--------|---------|------|
| room_created | { roomCode } | 방 생성 완료 |
| room_state | Room | 방 전체 상태 동기화 |
| phase_changed | { phase, currentStep, assignedStoryId? } | 단계 전환 |
| error | { code, message } | 에러 |

───────────────────────────────────────────
# 서버 로직 (server/socketServer.ts)
───────────────────────────────────────────

1. 방 코드 생성: 대문자+숫자 6자리 랜덤 (중복 체크)
2. 방 상태: Map<roomCode, Room> 인메모리 저장
3. 임시저장: Map<studentId, string> 별도 관리

활동 시작 (start_activity):
- phase를 'reading'으로 변경
- currentStep = 1
- 각 학생에게 자신의 storyId 할당 (stories[i].ownerId = students[i].id)
- readingSeconds 후 자동으로 phase를 'writing'으로 전환 (setTimeout)
- phase_changed 이벤트 전송 (assignedStoryId 포함)

다음 단계 (next_phase):
- currentStep += 1
- currentStep > chunkCount 이면 → phase = 'done', 활동 종료
- 아니라면:
  - 이야기를 랜덤 셔플하여 다음 학생에게 재배분
  (단, 자신이 쓴 마지막 덩어리 → 같은 사람에게 다시 오지 않도록)
  - phase를 'reading'으로 변경
  - readingSeconds 후 'writing'으로 자동 전환
- room_state + phase_changed 이벤트 전송

disconnect 처리:
- student.isOnline = false 업데이트
- room_state 브로드캐스트

reconnect (join_room에서 기존 닉네임 감지):
- 동일 roomCode + nickname이면 isOnline = true로 복원
- 임시저장된 draft 내용 함께 전달

───────────────────────────────────────────
# 화면별 상세 스펙
───────────────────────────────────────────

## app/page.tsx — 진입점
- "선생님입니다" 버튼 → /teacher/create
- "학생입니다" 버튼 → /student/join
- 앱 이름: "이야기 이어쓰기"
- 큰 글씨, 중앙 정렬, 모바일 최적화

---

## app/teacher/create/page.tsx + RoomSetupForm.tsx
- 폼 필드:
  1. 선생님 닉네임 (필수)
  2. 이야기 덩어리 수: 슬라이더 2~8, 기본값 4 (현재 값 옆에 실시간 표시)
  3. 작성 시간: 슬라이더 1~15분, 기본값 5분
  4. 읽기 타임: 슬라이더 15~90초, 기본값 30초
  5. 이야기 씨앗 (선택): textarea, "이 힌트로 이야기를 시작해도 좋아요" 플레이스홀더
- "방 만들기" 버튼 클릭 → create_room emit
- room_created 응답 시 /teacher/room/[roomCode]로 이동
  이동 직전 모달: 방 코드를 크게 표시 + "학생들에게 알려주세요!" 안내

---

## app/teacher/room/[roomCode]/page.tsx — 교사 대시보드

레이아웃:
- 상단: 방 코드(크게), 현재 단계(예: 2 / 4단계), 타이머 진행바
- 좌측(1/3): TeacherControls
- 우측(2/3): StudentStatusGrid

TeacherControls:
- [대기 중] "활동 시작하기" 버튼 (초록, 큰 버튼)
- [진행 중] 타이머 표시 + "다음 단계로" 버튼
  - 클릭 시 "정말 다음 단계로 넘어갈까요?" 확인 모달
- [종료] "활동이 끝났습니다!" 메시지 + "결과 보기" 버튼

StudentStatusGrid:
- 학생 1인당 카드:
  - 닉네임
  - 상태 뱃지: 대기 중(회색) / 읽는 중(파랑) / 작성 중(초록) / 완료(보라) / 오프라인(빨강)
  - 글자 수 (작성 중일 때만 표시)
- 그리드: 모바일 2열, 태블릿 3열, 데스크탑 4열

---

## app/student/join/page.tsx
- 방 코드 입력 (6자리, 자동 대문자)
- 닉네임 입력 + "랜덤으로 정해줘" 버튼
  - 랜덤 닉네임 형식: 형용사 + 동물 (예: "용감한 호랑이")
  - lib/nicknames.ts에 형용사 20개, 동물 20개 배열 정의
- "입장하기" 버튼
- 에러: 방 없음 / 닉네임 중복 → 인라인 메시지

---

## app/student/room/[roomCode]/page.tsx — 학생 작성 화면

phase === 'waiting':
  - "선생님이 활동을 시작할 때까지 기다려주세요 :)"
  - 현재 접속한 학생 닉네임 목록 표시

phase === 'reading':
  - StoryViewer: 지금까지의 이야기 전체 표시 (스크롤 가능)
  - 이야기 씨앗 카드가 있으면 상단에 카드 형태로 표시
  - 읽기 타임 카운트다운 (크게, 중앙)
  - "잠깐! 먼저 이야기를 읽어보세요" 안내 문구
  - 입력 영역 없음

phase === 'writing':
  - StoryViewer: 이전 내용 (접이식, 기본 접힘)
  - WritingArea: textarea (큰 글씨, 여유 있는 크기)
    - placeholder: "여기서부터 이야기를 이어 써보세요!"
    - 글자 수 실시간 표시
    - 3초 debounce로 save_draft 자동 전송
  - TimerDisplay:
    - 남은 시간 표시 (분:초)
    - 진행바 색상: 100~50% 파랑, 50~10% 주황, 10~0% 빨강
    - 타이머 0 도달 시 토스트: "슬슬 마무리해볼까요? 선생님이 넘길 때까지 계속 쓸 수 있어요 :)"
  - 이야기 씨앗 카드가 있으면 우측에 작게 상시 표시

phase === 'done':
  - "내가 시작한 이야기가 완성됐어요!" 제목
  - StoryViewer: 완성된 이야기 전체 표시
    - 각 덩어리 아래: 작성자 닉네임 + 작성 시각
    - 내가 쓴 덩어리: 배경색 강조 (연한 파랑)
  - ExportButtons: txt / md / pdf 저장 버튼

---

## WaitingCanvas (phase === 'writing', 제출 완료 후)
- "잘 썼어요! 친구들을 기다리는 동안 자유롭게 그림을 그려봐요 :)"
- HTML Canvas 낙서장
  - 색상 팔레트 6가지 (빨강/주황/초록/파랑/보라/검정)
  - 브러시 크기 3가지 (작게/중간/크게)
  - "지우개" 버튼, "전체 지우기" 버튼
  - 마우스 + 터치 모두 지원

---

## ExportButtons — 파일 저장
- TXT: Blob + file-saver, 각 덩어리를 개행으로 구분, 작성자 표시
- Markdown: # 제목 + 각 덩어리를 섹션으로 구분
- PDF: jsPDF 사용
  - 한글 지원: NotoSansKR 폰트 Base64 임베드
  - 표지: 이야기 제목, 참여 학생 닉네임, 날짜
  - 덩어리별 페이지 구분, 페이지 하단에 작성자

───────────────────────────────────────────
# Zustand 스토어 (lib/store.ts)
───────────────────────────────────────────

```typescript
interface AppStore {
  // 공통
  socket: Socket | null
  role: 'teacher' | 'student' | null
  roomCode: string | null

  // 교사
  room: Room | null

  // 학생
  myId: string | null
  myNickname: string | null
  myPhase: AppPhase
  assignedStoryId: string | null
  currentStory: Story | null    // 현재 이어써야 할 이야기
  myStory: Story | null         // 내가 시작한 이야기 (결과 확인용)
  draftContent: string

  // 액션
  setSocket: (socket: Socket) => void
  setRole: (role: 'teacher' | 'student') => void
  setRoom: (room: Room) => void
  setPhase: (phase: AppPhase) => void
  setDraft: (content: string) => void
  reset: () => void
}
```

───────────────────────────────────────────
# 스타일 가이드
───────────────────────────────────────────

- 주 색상: blue-500 (#3B82F6)
- 성공/완료: green-500
- 경고: amber-500
- 오류/긴급: red-500
- 폰트: Noto Sans KR (Google Fonts, app/layout.tsx에서 로드)
- 버튼: 최소 높이 48px (모바일 터치 대응)
- 카드: rounded-xl, shadow-sm, bg-white, border border-gray-100
- 전체 배경: bg-gray-50

───────────────────────────────────────────
# 구현 지시사항
───────────────────────────────────────────

1. 위 스펙대로 모든 파일을 한 번에 생성해줘.
2. package.json의 scripts에 다음을 포함해줘:
   - "dev": "node server.js" (Socket.io custom server 실행)
   - "build": "next build"
3. Socket.io를 Next.js App Router와 함께 쓰기 위한 custom server(server.js)를 루트에 생성해줘.
4. 모든 컴포넌트는 'use client' 지시어를 포함해줘.
5. TypeScript 에러가 없도록 타입을 꼼꼼히 지정해줘.
6. README.md를 생성해줘:
   - 실행 방법: npm install → npm run dev
   - 접속 URL: http://localhost:3000
   - 주요 기능 요약
```

───────────────────────────────────────────
# 완성 기준 체크리스트
───────────────────────────────────────────

MVP 완성으로 인정하는 기준:

- [ ] npm run dev 실행 후 http://localhost:3000 접속 가능
- [ ] 교사가 방을 만들고 방 코드를 받을 수 있다
- [ ] 학생 2명 이상이 방 코드로 접속할 수 있다
- [ ] 교사가 활동 시작 버튼을 누르면 모든 학생 화면이 전환된다
- [ ] 읽기 타임 후 자동으로 작성 화면으로 전환된다
- [ ] 학생이 글을 쓰면 글자 수가 실시간으로 표시된다
- [ ] 타이머가 작동하고 종료 시 토스트 메시지가 뜬다
- [ ] 교사가 다음 단계로 넘기면 이야기가 다른 학생에게 전달된다
- [ ] 설정한 덩어리 수만큼 반복 후 자동 종료된다
- [ ] 종료 후 완성된 이야기를 확인할 수 있다
- [ ] txt / md / pdf 중 하나 이상의 저장이 작동한다
```

---

## 실행 후 테스트 방법

```bash
npm install
npm run dev
```

브라우저를 두 탭으로 열어서:
- 탭 1: http://localhost:3000 → "선생님입니다" → 방 생성
- 탭 2: http://localhost:3000 → "학생입니다" → 방 코드 입력 후 참가
