# 이야기 이어쓰기 활동 앱 — Claude Code 프롬프트

> 이 파일은 Claude Code에 순서대로 입력하기 위한 프롬프트 모음입니다.
> Phase 1 → 2 → 3 순서로 진행하며, 각 Phase가 정상 작동함을 확인한 후 다음으로 넘어가세요.

---

## 사전 준비 (Claude Code 시작 전 직접 실행)

```bash
node -v   # v18 이상 확인
npm -v
```

---

## Phase 1 — 프로젝트 초기화 및 핵심 구조 구축

### Prompt 1-1. 프로젝트 생성 및 기술 스택 설정

```
다음 스펙으로 이야기 이어쓰기 활동 앱(story-relay-app)을 생성해줘.

[기술 스택]
- 프레임워크: Next.js 14 (App Router)
- 언어: TypeScript
- 실시간 통신: Socket.io (서버: @socket.io/standalone-server, 클라이언트: socket.io-client)
- 스타일: Tailwind CSS
- 상태 관리: Zustand
- 파일 저장: jsPDF, file-saver, html2canvas
- 폼/유효성: react-hook-form + zod

[디렉토리 구조]
story-relay-app/
├── app/
│   ├── page.tsx                  # 진입점 (교사/학생 선택)
│   ├── teacher/
│   │   ├── create/page.tsx       # 방 생성 및 설정
│   │   └── room/[roomCode]/page.tsx  # 교사 대시보드
│   └── student/
│       ├── join/page.tsx         # 방 참가
│       └── room/[roomCode]/page.tsx  # 학생 작성 화면
├── components/
│   ├── teacher/
│   │   ├── RoomSetupForm.tsx
│   │   ├── StudentStatusGrid.tsx
│   │   └── TeacherControls.tsx
│   └── student/
│       ├── WritingArea.tsx
│       ├── TimerDisplay.tsx
│       ├── StoryViewer.tsx
│       └── WaitingCanvas.tsx
├── lib/
│   ├── socket.ts                 # Socket.io 클라이언트 싱글턴
│   ├── store.ts                  # Zustand 스토어
│   └── types.ts                  # 공통 타입 정의
├── server/
│   └── socket-server.ts          # Socket.io 서버 (standalone)
└── pages/api/
    └── socket.ts                 # Next.js Socket.io 브릿지

[공통 타입 정의 — lib/types.ts에 포함]
- Room: { roomCode, password, hostId, settings, phase, students, stories }
- Settings: { chunkCount, timerSeconds, readingTimeSeconds, orderMode, groupConfig }
- Student: { id, nickname, status, currentChunk, isOnline }
- StoryChunk: { storyId, order, authorId, content, timestamp }
- Phase: 'waiting' | 'reading' | 'writing' | 'done'

패키지 설치 후 위 구조에 맞는 빈 파일들을 모두 생성하고, tsconfig와 tailwind.config는 기본 설정으로 구성해줘.
```

---

### Prompt 1-2. Socket.io 서버 및 이벤트 구현

```
story-relay-app의 server/socket-server.ts를 구현해줘.

[서버에서 처리할 Socket.io 이벤트 목록]

클라이언트 → 서버:
- create_room(settings, hostNickname) → roomCode 생성 후 join
- join_room(roomCode, password, nickname) → 방 참가 또는 재접속
- start_activity() → 교사 전용, Phase를 writing으로 전환
- submit_chunk(storyId, content) → 학생이 덩어리 제출
- next_phase() → 교사 전용, 모든 학생을 다음 단계로 이동
- request_edit(storyId, chunkIndex, newContent) → 교사 전용, 덩어리 수정
- request_help(storyId, message) → 학생이 교사에게 도움 요청
- save_draft(storyId, content) → 자동 임시저장 (3초 debounce)
- reconnect_session(roomCode, studentId) → 재접속 시 상태 복원

서버 → 클라이언트:
- room_created(roomCode) → 방 생성 확인
- room_state(room) → 방 전체 상태 동기화
- phase_changed(phase, targetStoryId) → 단계 전환 (읽기→쓰기 포함)
- student_list_updated(students) → 학생 목록 갱신
- chunk_submitted(storyId, chunk) → 덩어리 제출 확인
- help_requested(studentId, nickname, message) → 교사에게 알림
- error(code, message) → 에러 처리

[핵심 비즈니스 로직]
1. 방 코드는 대문자 알파벳+숫자 6자리 랜덤 생성
2. 이야기 할당: orderMode가 'random'이면 매 단계마다 랜덤 셔플, 'custom'이면 교사 설정 순서 유지
3. 단계 전환 시 읽기 타임(readingTimeSeconds) 동안 writing_area를 disabled 상태로 유지 후 자동 활성화
4. 서버 메모리에 Map<roomCode, Room>으로 방 상태 관리
5. 학생 disconnect 시 isOnline=false 처리, reconnect_session 이벤트로 복원
6. 자동 임시저장 데이터는 Map<studentId, draftContent>로 별도 관리

pages/api/socket.ts도 함께 구현해서 Next.js와 Socket.io를 연결해줘.
```

---

### Prompt 1-3. 교사 방 생성 화면

```
app/teacher/create/page.tsx와 components/teacher/RoomSetupForm.tsx를 구현해줘.

[화면 구성]
- 페이지 제목: "새 활동 방 만들기"
- 폼 필드 (react-hook-form + zod 유효성 검사):
  1. 교사 닉네임 (필수, 2~10자)
  2. 방 비밀번호 (선택, 4~8자. 비워두면 비밀번호 없음)
  3. 이야기 덩어리 수 (필수, 2~10 슬라이더, 기본값 4)
  4. 단계당 작성 시간 (필수, 1~20분 슬라이더, 기본값 5분)
  5. 읽기 타임 (필수, 10~120초 슬라이더, 기본값 30초)
  6. 전달 순서: "랜덤" / "모둠별" 라디오 버튼
     - "모둠별" 선택 시 모둠 이름 입력 필드 동적 추가 (최대 6개 모둠)
  7. 이야기 씨앗 (선택): 교사가 제공할 시작 문장 힌트 textarea
     - "씨앗 카드 추가" 버튼으로 최대 5개까지 추가 가능
     - 각 카드는 삭제 가능
- "방 만들기" 제출 버튼

[동작]
- 폼 제출 시 create_room 이벤트 emit
- 서버에서 room_created 응답 받으면 /teacher/room/[roomCode]로 이동
- 방 코드와 QR코드를 생성 직후 모달로 미리 보여줌 (qrcode 패키지 사용)

[스타일]
- Tailwind CSS, 모바일 반응형
- 깔끔하고 교사 친화적인 UI (과도한 애니메이션 지양)
- 슬라이더 오른쪽에 현재 값을 실시간 표시
```

---

### Prompt 1-4. 교사 대시보드 (실시간 모니터링)

```
app/teacher/room/[roomCode]/page.tsx와 관련 컴포넌트들을 구현해줘.

[레이아웃]
- 상단 헤더: 방 코드(크게), QR코드 버튼, 현재 단계 표시, 타이머 진행바
- 좌측: 활동 제어 패널 (TeacherControls)
- 우측: 학생 현황 그리드 (StudentStatusGrid)

[TeacherControls 컴포넌트]
- "활동 시작" 버튼 (대기 단계에서만 표시)
- "다음 단계로" 버튼 (진행 단계에서 표시, 클릭 시 확인 다이얼로그)
- 현재 단계 / 전체 단계 표시 (예: 2/4 단계)
- 도움 요청 알림 목록 (실시간 갱신, 클릭 시 해당 학생 강조)

[StudentStatusGrid 컴포넌트]
- 학생 1인당 카드 형태로 표시:
  - 닉네임
  - 현재 글자 수 (실시간)
  - 상태 뱃지: 읽는 중 / 작성 중 / 완료 / 오프라인
  - "글 미리보기" 버튼 (읽기 전용 모달)
  - "수정 요청" 버튼 (교사가 해당 학생 덩어리 직접 수정 가능)
- 그리드 레이아웃: 반응형 (모바일 2열, 태블릿 3열, 데스크탑 4열)
- 오프라인 학생 카드는 흐리게 처리 + "재접속 대기" 뱃지

[데이터 흐름]
- Socket.io room_state, student_list_updated, help_requested 이벤트 구독
- Zustand store에서 상태 관리
```

---

### Prompt 1-5. 학생 접속 및 작성 화면

```
app/student/join/page.tsx와 app/student/room/[roomCode]/page.tsx를 구현해줘.

[접속 화면 — student/join]
- 방 코드 입력 (6자리 자동 대문자 변환)
- 비밀번호 입력 (방에 비밀번호가 설정된 경우에만 표시)
- 닉네임 입력 (랜덤 생성 버튼 포함 — "용감한호랑이" 형태)
- 닉네임 랜덤 생성 풀: 형용사(20개) + 동물(20개) 조합
- "입장하기" 버튼

[작성 화면 — student/room/[roomCode]]
다음 Phase에 따라 화면 전환:

Phase 'waiting':
  - "선생님이 활동을 시작할 때까지 기다려주세요" 메시지
  - 현재 접속한 학생 목록 (닉네임만)

Phase 'reading':
  - 이전 이야기 내용 전체 표시 (StoryViewer)
  - 읽기 타임 카운트다운 타이머 (크게 표시)
  - 입력 영역은 잠금 상태 (자물쇠 아이콘 + "읽기 시간입니다" 안내)
  - 이야기 씨앗 카드가 있으면 우측에 카드 형태로 표시

Phase 'writing':
  - 이전 덩어리 요약 (접이식, 기본값: 펼침)
  - WritingArea: 글 입력 textarea (placeholder: "이야기를 이어 써보세요...")
  - TimerDisplay: 남은 시간 표시, 50% 이하 주황, 10% 이하 빨강
  - 타이머 종료 시: "슬슬 마무리해볼까요? 선생님이 다음 단계로 넘길 때까지 계속 쓸 수 있어요" 토스트 알림
  - 글자 수 실시간 표시
  - "교사에게 도움 요청" 버튼 (클릭 시 간단한 메시지 입력 모달)
  - 3초마다 자동 임시저장 (save_draft 이벤트)

Phase 'done' (내 이야기 결과):
  - "완성된 내 이야기" 제목
  - 이야기 전체 표시, 각 덩어리 아래에 작성자 닉네임 + 작성 시각 표시
  - 내가 쓴 덩어리는 배경색으로 강조
  - 파일 저장 버튼 (txt / md / pdf / png)

[WaitingCanvas 컴포넌트 — Phase 'writing'에서 완료 후 표시]
- 학생이 "완료" 버튼을 누르면 간단한 낙서 캔버스로 전환
- Canvas API 사용, 색상 팔레트 5가지, 브러시 크기 3가지, 지우기 버튼
- 대기 중임을 알리는 상단 메시지 표시
```

---

### Prompt 1-6. 파일 저장 기능

```
components/student/ExportButtons.tsx를 구현해줘.

[저장 형식별 구현]

1. TXT:
   - 이야기 제목, 각 덩어리 내용, 작성자, 날짜를 순서대로 텍스트로 저장
   - Blob + file-saver 사용

2. Markdown (.md):
   - # 제목
   - 각 덩어리를 ## n번째 이야기 섹션으로 구분
   - > 작성자: 닉네임 인용구 포함

3. PDF:
   - jsPDF 사용
   - 한글 폰트 내장 (Noto Sans KR — CDN에서 Base64로 임베드)
   - 표지 페이지: 이야기 제목, 참여 학생 목록, 날짜
   - 각 덩어리를 페이지로 구분, 페이지 하단에 작성자 표시

4. PNG:
   - html2canvas로 StoryViewer 컴포넌트를 캡처
   - 배경 흰색, 패딩 32px, 해상도 2x

[UI]
- 4개 버튼을 가로로 배치
- 각 버튼에 형식 이름과 아이콘 표시
- 저장 중에는 스피너 표시
```

---

## Phase 2 — 안전장치 및 교실 운영 기능 강화

### Prompt 2-1. 세션 복원 및 오프라인 대응

```
다음 기능을 추가해줘.

[자동 임시저장 + 재접속 복원]
1. lib/store.ts의 Zustand 스토어에 persist 미들웨어 추가
   - studentId, roomCode, currentDraft를 localStorage에 저장
2. student/room 페이지 마운트 시:
   - localStorage에 저장된 studentId + roomCode가 현재 방과 일치하면
   - 자동으로 reconnect_session 이벤트 emit
   - 서버에서 저장된 draft 내용과 현재 phase를 복원
3. WritingArea에서 타이핑 중 3초 debounce로 save_draft emit

[오프라인 감지]
1. Socket.io disconnect 이벤트 발생 시:
   - 학생 화면: "연결이 끊겼습니다. 재연결 중..." 오버레이 표시
   - 5초마다 재접속 시도 (최대 10회)
   - 재연결 성공 시 오버레이 제거 + 토스트 알림
2. 교사 대시보드: 해당 학생 카드에 오프라인 뱃지 표시

[서버 측]
socket-server.ts에 reconnect_session 핸들러 추가:
- studentId로 기존 세션 찾아서 소켓 ID 업데이트
- 현재 phase, 할당된 storyId, 임시저장 draft 내용을 클라이언트에 전달
```

---

### Prompt 2-2. 교사 안전 도구 (트롤링 대응)

```
다음 교사 안전 도구를 추가해줘.

[덩어리 수정/삭제]
1. 교사 대시보드의 각 학생 카드에 "덩어리 보기" 버튼 추가
2. 클릭 시 모달 열림:
   - 해당 학생이 현재 단계에서 작성 중인 내용 미리보기
   - "내용 수정" 버튼 → 교사가 직접 내용 편집 가능
   - "이전 상태로 되돌리기" 버튼 → 해당 storyId의 마지막 정상 덩어리로 롤백
   - "다시 쓰기 요청" 버튼 → 해당 학생에게 재작성 알림 전송

[학생 도움 요청 처리]
1. 학생 화면 하단 "선생님 도움 요청" 버튼 → 짧은 메시지 입력 모달
2. 교사 대시보드 우상단에 알림 뱃지 (읽지 않은 요청 수)
3. 알림 클릭 시 요청 내용 + 해당 학생 강조 표시

[서버 이벤트 추가]
- edit_chunk(storyId, chunkIndex, newContent): 교사 전용 덩어리 수정
- rollback_chunk(storyId): 마지막 덩어리 롤백
- rewrite_request(studentId): 학생에게 재작성 요청 알림
- rewrite_requested: 학생에게 전달 (화면에 "선생님이 다시 써달라고 했어요" 알림)
```

---

### Prompt 2-3. 모둠별 이야기 순환 기능

```
모둠별 이야기 순환 기능을 구현해줘.

[설정]
- 방 생성 시 orderMode='group'이면 모둠 목록(groupConfig)을 받음
- groupConfig: Array<{ name: string, studentIds: string[] }>
- 교사 대시보드에서 학생 입장 후 모둠 배정 UI 제공
  - 드래그 앤 드롭 또는 셀렉트 박스로 학생을 모둠에 배정
  - 배정 안 된 학생은 "미배정" 그룹으로 별도 표시

[이야기 순환 로직 — socket-server.ts 수정]
- orderMode='group'이면 각 이야기는 같은 모둠 학생들 사이에서만 순환
- 모둠 내 순서는 랜덤 또는 입장 순서 (교사 선택)
- 모둠 크기보다 덩어리 수가 많을 경우: 같은 학생이 같은 이야기를 다시 이어받지 않도록 처리

[UI]
- 교사 대시보드에서 모둠별로 학생 카드를 그룹핑하여 표시
- 각 모둠의 이야기 진행 상태를 색상으로 구분
```

---

## Phase 3 — 결과물 강화 및 UX 완성

### Prompt 3-1. 낭독 모드 및 이야기 갤러리

```
활동 종료 후 낭독 모드와 갤러리 화면을 구현해줘.

[이야기 갤러리 — app/teacher/room/[roomCode]/gallery/page.tsx]
- 모든 완성된 이야기를 카드 형태로 표시
- 각 이야기 카드: 제목(자동 생성: "첫 번째 이야기" 등), 첫 문장 미리보기, 참여 학생 닉네임 목록
- "낭독 모드로 보기" 버튼

[낭독 모드 — components/teacher/ReadAloudMode.tsx]
- 전체 화면 레이아웃 (프로젝터 화면 최적화)
- 이야기 전체 표시, 현재 읽고 있는 덩어리 배경 하이라이트
- 키보드 방향키(←/→)로 덩어리 이동
- 현재 덩어리 작성자 이름 크게 표시 ("이 부분은 [닉네임]이 썼어요!")
- 교사가 마우스 클릭으로도 덩어리 이동 가능
- ESC로 전체화면 종료

[학생 갤러리 화면 — Phase 'done' 화면에 추가]
- 내 이야기 확인 후 "다른 친구들 이야기 보기" 버튼
- 갤러리에서 각 이야기를 클릭하면 전체 내용 모달로 확인
- 내가 참여한 덩어리는 강조 표시
```

---

### Prompt 3-2. 교사 활동 기록 리포트 및 이미지 프롬프트

```
두 가지 기능을 추가해줘.

[1. 활동 기록 리포트 CSV 내보내기]
- 교사 갤러리 화면에 "활동 리포트 다운로드 (CSV)" 버튼 추가
- CSV 컬럼: 학생 닉네임, 모둠명, 이야기 번호, 작성 순서, 글자 수, 작성 소요 시간(초), 작성 내용
- file-saver로 저장, 파일명: report_YYYYMMDD_방코드.csv
- 한글 인코딩: UTF-8 with BOM (엑셀 호환)

[2. AI 이미지 생성 프롬프트 출력]
- 각 이야기의 결과 화면 하단에 "그림 만들기 힌트 보기" 버튼 추가
- 클릭 시 각 덩어리별로 핵심 명사/장면을 추출하여 영문 이미지 생성 프롬프트 자동 생성
  - 추출 방식: 한국어 텍스트에서 명사 추출 (compromise.js 또는 간단한 키워드 추출 로직)
  - 프롬프트 형식: "children's book illustration style, [장면 요소들], soft colors, simple"
- 각 덩어리의 프롬프트를 카드 형태로 표시
- 각 카드에 "복사" 버튼 → 클립보드에 복사
- 하단에 안내 문구: "이 프롬프트를 복사해서 그림 생성 AI(예: DALL-E, Midjourney)에 붙여넣어 보세요!"
```

---

### Prompt 3-3. 전체 UI 폴리싱 및 반응형 완성

```
전체 앱의 UI를 다음 기준으로 폴리싱해줘.

[디자인 원칙]
- 주 색상: 파란색(#3B82F6) / 보조: 초록(#10B981) / 경고: 주황(#F59E0B) / 오류: 빨강(#EF4444)
- 폰트: Noto Sans KR (Google Fonts)
- 초등학생이 직관적으로 이해할 수 있는 큰 버튼, 명확한 레이블

[반응형]
- 모바일(기준 390px): 학생 화면 최적화, 큰 글씨, 큰 터치 영역
- 태블릿(768px): 교사 대시보드 2단 레이아웃
- 데스크탑(1280px): 교사 대시보드 풀 레이아웃

[접근성]
- 모든 버튼에 aria-label
- 키보드 네비게이션 지원
- 타이머는 시각적 표시 외에 텍스트로도 남은 시간 표시

[에러 처리 UI]
- 방을 찾을 수 없을 때: 친절한 안내 페이지
- 비밀번호 오류: 인라인 에러 메시지
- 네트워크 오류: 전체 화면 재연결 오버레이

[로딩 상태]
- 방 생성/입장 중: 로딩 스피너
- 단계 전환 중: 전환 애니메이션 (fade)
- 파일 저장 중: 버튼 로딩 상태

마지막으로 README.md를 생성해줘:
- 로컬 실행 방법 (npm install → npm run dev)
- 환경 변수 목록 (.env.example)
- 기능 목록 요약
- 주요 Socket.io 이벤트 목록
```

---

## 참고: 환경 변수 (.env.local)

```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
SOCKET_PORT=3001
NODE_ENV=development
```

---

## 작업 순서 요약

| Phase | Prompt | 핵심 산출물 | 예상 우선도 |
|-------|--------|------------|------------|
| 1 | 1-1 | 프로젝트 골격 + 타입 | 필수 |
| 1 | 1-2 | Socket.io 서버 + 이벤트 | 필수 |
| 1 | 1-3 | 교사 방 생성 UI | 필수 |
| 1 | 1-4 | 교사 대시보드 | 필수 |
| 1 | 1-5 | 학생 접속 + 작성 화면 | 필수 |
| 1 | 1-6 | 파일 저장 기능 | 필수 |
| 2 | 2-1 | 세션 복원 + 오프라인 대응 | 권장 |
| 2 | 2-2 | 교사 안전 도구 | 권장 |
| 2 | 2-3 | 모둠별 순환 | 선택 |
| 3 | 3-1 | 낭독 모드 + 갤러리 | 선택 |
| 3 | 3-2 | 리포트 + 이미지 프롬프트 | 선택 |
| 3 | 3-3 | UI 폴리싱 + README | 권장 |
