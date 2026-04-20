'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { useStore } from '@/lib/store'
import { getSocket } from '@/lib/socket'
import { Room, Story } from '@/lib/types'
import WritingArea from '@/components/student/WritingArea'
import TimerDisplay from '@/components/student/TimerDisplay'
import StoryViewer, { PrevChunk, StoryChunkList } from '@/components/student/StoryViewer'
import WaitingCanvas from '@/components/student/WaitingCanvas'
import ExportButtons from '@/components/student/ExportButtons'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'

export default function StudentRoomPage() {
  const params = useParams()
  const roomCode = params.roomCode as string
  const {
    room, setRoom, myPhase, setPhase,
    myId, setMyId, myNickname,
    assignedStoryId, setAssignedStoryId,
    currentStory, setCurrentStory,
    myStory, setMyStory,
    draftContent, setDraft,
  } = useStore()
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const socket = getSocket()
    setMyId(socket.id || '')
    socket.on('connect', () => setMyId(socket.id || ''))

    socket.on('room_state', (r: Room) => {
      setRoom(r)
      if (assignedStoryId) {
        const story = r.stories.find(s => s.id === assignedStoryId)
        if (story) setCurrentStory(story)
      }
    })

    socket.on('phase_changed', (data: {
      phase: string; currentStep: number; assignedStoryId?: string;
      myStory?: Story; draft?: string
    }) => {
      setPhase(data.phase as any)
      setSubmitted(false)
      if (data.assignedStoryId) setAssignedStoryId(data.assignedStoryId)
      if (data.myStory) setMyStory(data.myStory)
      if (data.draft) setDraft(data.draft)
    })

    return () => { socket.off('room_state'); socket.off('phase_changed'); socket.off('connect') }
  }, [assignedStoryId])

  useEffect(() => {
    if (room && assignedStoryId) {
      const story = room.stories.find(s => s.id === assignedStoryId)
      if (story) setCurrentStory(story)
    }
  }, [room, assignedStoryId])

  const handleSubmit = (content: string) => {
    if (!assignedStoryId) return
    getSocket().emit('submit_chunk', { storyId: assignedStoryId, content })
    setSubmitted(true)
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <p className="text-fg-3">연결 중...</p>
      </div>
    )
  }

  const seed = room.settings.seedCards?.[0]
  const onlineStudents = room.students.filter(s => s.isOnline)

  return (
    <main className="min-h-screen bg-app flex flex-col">
      <Toaster />

      {/* 상단 헤더 */}
      <div className="bg-paper-0 border-b border-subtle px-4 py-2.5 flex items-center justify-between">
        <Image src="/logo-mark.svg" alt="로고" width={24} height={24} />
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 18, letterSpacing: '.12em', color: 'var(--brand)' }}>
          {roomCode}
        </span>
        {myNickname && (
          <span className="text-xs text-fg-3 bg-surface px-2 py-1 rounded-full">{myNickname}</span>
        )}
      </div>

      <div className="flex-1 max-w-content mx-auto w-full px-4 py-5 space-y-4">

        {/* ── 대기 ───────────────────────────── */}
        {myPhase === 'waiting' && (
          <div className="flex flex-col items-center gap-5 pt-6 text-center">
            <Image src="/mascot-fox.svg" alt="마스코트" width={100} height={100} />
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 36, color: 'var(--fg-1)' }}>
              곧 시작해요!
            </h2>
            <div className="flex items-center gap-2 text-fg-3 text-sm">
              <span className="pulse-dot" />
              <span>선생님이 활동을 시작할 때까지 잠깐만 기다려 주세요.</span>
            </div>

            <div className="w-full bg-paper-0 border border-subtle rounded-lg p-4 text-left">
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--fg-3)', marginBottom: 10 }}>
                지금 모인 친구들 · {onlineStudents.length}명
              </p>
              <div className="flex flex-wrap gap-2">
                {onlineStudents.map(s => (
                  <span key={s.id} className={`att-chip ${s.id === myId ? 'me' : ''}`}>
                    <span className="ad" />
                    {s.nickname}{s.id === myId ? ' (나)' : ''}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── 읽기 ───────────────────────────── */}
        {myPhase === 'reading' && (
          <div className="space-y-4">
            <TimerDisplay totalSeconds={room.settings.readingSeconds} phase="reading" />

            {seed && (
              <div className="bg-brand-soft border border-brand-soft-border rounded-lg p-4">
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--fg-3)', marginBottom: 6 }}>
                  이야기 씨앗 🌱
                </p>
                <p className="text-md text-fg-1">{seed}</p>
              </div>
            )}

            {currentStory && currentStory.chunks.length > 0 && (
              <PrevChunk chunks={currentStory.chunks} />
            )}

            <div className="lock-panel">
              <div className="lp-icon">📖</div>
              <div className="lp-big">
                {String(Math.floor(room.settings.readingSeconds / 60)).padStart(2,'0')}
              </div>
              <div className="lp-title">천천히 읽어 보세요</div>
              <div className="lp-hint">곧 이어서 쓸 수 있어요</div>
            </div>
          </div>
        )}

        {/* ── 작성 ───────────────────────────── */}
        {myPhase === 'writing' && !submitted && (
          <div className="space-y-4">
            <div className="phase-banner write">
              <span>✏️ 작성 시간 · {room.currentStep}/{room.settings.chunkCount} 단계</span>
              <button className="text-xs px-2.5 py-1 rounded-full bg-paper-0 text-fg-2 border border-[var(--border-default)]">
                ✋ 도움
              </button>
            </div>

            <TimerDisplay
              totalSeconds={room.settings.timerSeconds}
              phase="writing"
              onTimeUp={() => toast('슬슬 마무리해볼까요? 선생님이 넘길 때까지 계속 쓸 수 있어요 :)', { icon: '⏰', duration: 5000 })}
            />

            {seed && (
              <div className="text-sm bg-brand-soft px-3 py-2 rounded-md text-crayon-700">🌱 {seed}</div>
            )}

            {currentStory && currentStory.chunks.length > 0 && (
              <PrevChunk chunks={currentStory.chunks} collapsible={true} />
            )}

            <WritingArea initialContent={draftContent} storyId={assignedStoryId || ''} onSubmit={handleSubmit} />
          </div>
        )}

        {/* ── 제출 후 대기 (낙서) ─────────────── */}
        {myPhase === 'writing' && submitted && <WaitingCanvas />}

        {/* ── 완료 ───────────────────────────── */}
        {myPhase === 'done' && (
          <div className="space-y-5">
            <div className="text-center pt-4 flex flex-col items-center gap-3">
              <Image src="/mascot-fox.svg" alt="마스코트" width={96} height={96} />
              <h1 className="font-bold text-3xl text-fg-1">우리가 함께 쓴 이야기예요</h1>
              <p className="text-lg text-fg-2">🎉 모두 수고했어요!</p>
            </div>

            {myStory && (
              <>
                <StoryChunkList chunks={myStory.chunks} myId={myId || ''} />
                <ExportButtons story={myStory} />
              </>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
