'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { ChevronDown, ChevronUp, Hand, Check, Download } from 'lucide-react'
import { getSocket } from '@/lib/socket'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { WaitingCanvas } from '@/components/WaitingCanvas'
import { cn } from '@/lib/utils'
import type { Room, AppPhase } from '@/lib/types'

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  return `${m}:${(s % 60).toString().padStart(2, '0')}`
}

function WaitingScreen({ room, myNickname }: { room: Room; myNickname: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 gap-8">
      <div className="text-center flex flex-col items-center gap-3">
        <Image src="/mascot-fox.svg" alt="" width={96} height={96} />
        <h2 className="font-display font-bold text-3xl text-fg-1">곧 시작해요!</h2>
        <div className="flex items-center gap-2 text-sm text-fg-2">
          <span className="inline-block w-2 h-2 rounded-full bg-sun-500 animate-wait-dot" />
          선생님이 활동을 시작할 때까지 잠깐만 기다려 주세요
        </div>
      </div>
      <div className="bg-paper-0 border border-subtle rounded-lg p-4 w-full max-w-sm">
        <p className="font-mono text-xs text-fg-3 mb-3">지금 모인 친구들 · {room.students.filter(s => s.isOnline).length}명</p>
        <div className="flex flex-wrap gap-2">
          {room.students.map(s => (
            <span key={s.id} className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium', s.nickname === myNickname ? 'bg-brand-soft text-crayon-700' : 'bg-paper-100 text-fg-2')}>
              <span className="w-1.5 h-1.5 rounded-full bg-sprout-500 inline-block" />
              {s.nickname}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function ReadingScreen({ room, assignedStoryId, readingLeft }: { room: Room; assignedStoryId: string | null; readingLeft: number }) {
  const story = room.stories.find(s => s.id === assignedStoryId)
  const chunks = story?.chunks ?? []
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex justify-between items-center bg-plum-50 text-plum-700 px-5 py-3">
        <span className="font-medium text-sm">🔒 읽기 시간</span>
        <span className="font-mono font-bold text-lg tracking-[.04em]">{readingLeft}초</span>
      </div>
      <div className="flex-1 px-5 py-6 flex flex-col gap-4 overflow-y-auto">
        {chunks.length === 0 ? (
          <p className="text-center text-fg-3 mt-8">아직 이야기가 없어요.</p>
        ) : (
          chunks.map((chunk, i) => (
            <div key={i} className="bg-paper-100 rounded-lg p-4 border-l-4 border-l-brand">
              <p className="font-mono text-xs uppercase tracking-widest text-fg-3 mb-2">{i + 1}번째 이야기</p>
              <p className="text-base text-fg-1 leading-[1.7] whitespace-pre-wrap">{chunk.content}</p>
              <p className="text-right font-display text-sm text-brand mt-2">— {chunk.authorNickname}가 썼어요</p>
            </div>
          ))
        )}
        <div className="bg-plum-50 rounded-xl p-6 text-center border-[1.5px] border-dashed border-plum-300">
          <div className="text-3xl mb-3">📖</div>
          <div className="font-display font-bold text-5xl text-plum-700 mb-2">{readingLeft}</div>
          <p className="font-bold text-plum-700 mb-1">천천히 읽어 보세요</p>
          <p className="text-xs text-fg-2">곧 이어서 쓸 수 있어요</p>
        </div>
      </div>
    </div>
  )
}

function WritingScreen({ room, assignedStoryId, myNickname, currentStep }: { room: Room; assignedStoryId: string | null; myNickname: string; currentStep: number }) {
  const [draft, setDraft] = useState('')
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [writingLeft, setWritingLeft] = useState(room.settings.timerSeconds)
  const [helpRaised, setHelpRaised] = useState(false)
  const [editing, setEditing] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const story = room.stories.find(s => s.id === assignedStoryId)
  const chunks = story?.chunks ?? []
  const myStudent = room.students.find(s => s.nickname === myNickname)
  const isSubmitted = myStudent?.status === 'done'
  const canRevise = room.settings.allowRevision && currentStep > 1

  useEffect(() => {
    setWritingLeft(room.settings.timerSeconds)
    const interval = setInterval(() => setWritingLeft(t => Math.max(0, t - 1)), 1000)
    return () => clearInterval(interval)
  }, [room.settings.timerSeconds])

  // Reset editing flag when newly submitted
  useEffect(() => {
    if (isSubmitted) setEditing(false)
  }, [isSubmitted])

  const pct = writingLeft / room.settings.timerSeconds
  const zone = pct > 0.5 ? 'ok' : pct > 0.1 ? 'warn' : 'danger'
  const zoneStyle = { ok: { wrap: 'bg-brand-soft text-crayon-700', bar: 'bg-brand' }, warn: { wrap: 'bg-sun-50 text-sun-700', bar: 'bg-warning' }, danger: { wrap: 'bg-berry-50 text-berry-700', bar: 'bg-danger' } }[zone]

  const handleDraftChange = useCallback((val: string) => {
    setDraft(val)
    setSaveState('saving')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (assignedStoryId) getSocket().emit('save_draft', { storyId: assignedStoryId, content: val })
      setSaveState('saved')
    }, 800)
  }, [assignedStoryId])

  const handleSubmit = () => {
    if (assignedStoryId && draft.trim()) {
      getSocket().emit('submit_chunk', { storyId: assignedStoryId, content: draft.trim() })
    }
  }

  // Submitted: show waiting canvas
  if (isSubmitted && !editing) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-center bg-sprout-50 text-sprout-700 px-5 py-3">
          <span className="font-medium text-sm">✅ 제출 완료! 친구들을 기다려요</span>
          {canRevise && (
            <button
              onClick={() => setEditing(true)}
              className="text-xs font-medium text-crayon-700 bg-brand-soft px-3 py-1 rounded-full hover:bg-crayon-100 transition-colors duration-fast"
            >
              다시 쓰기
            </button>
          )}
        </div>
        <WaitingCanvas />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex justify-between items-center bg-brand-soft text-crayon-700 px-5 py-3">
        <span className="font-medium text-sm">✏️ 작성 시간 · {currentStep}/{room.settings.chunkCount} 단계</span>
        <Button variant="ghost" size="sm" onClick={() => { if (!helpRaised) { getSocket().emit('help_raise'); setHelpRaised(true) } }} disabled={helpRaised} className="gap-1 text-xs">
          <Hand size={12} /> {helpRaised ? '요청됨' : '도움'}
        </Button>
      </div>
      <div className={cn('mx-5 mt-4 rounded-md px-4 py-3', zoneStyle.wrap, zone === 'danger' && 'animate-pulse-strong')}>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium shrink-0">남은 시간</span>
          <div className="flex-1 h-2 rounded-full bg-black/[.08] overflow-hidden">
            <div className={cn('h-full rounded-full transition-all duration-1000', zoneStyle.bar)} style={{ width: `${pct * 100}%` }} />
          </div>
          <span className="font-mono font-bold text-sm shrink-0">{formatTime(writingLeft)}</span>
        </div>
      </div>
      <div className="flex-1 px-5 py-4 flex flex-col gap-4 overflow-y-auto">
        {/* 이전 이야기 전체 히스토리 */}
        {chunks.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-mono uppercase tracking-widest text-fg-3">이전 이야기</p>
            {chunks.map((chunk, i) => {
              const isLatest = i === chunks.length - 1
              return (
                <details key={i} open={isLatest} className="group">
                  <summary className="flex items-center gap-1.5 text-sm text-brand cursor-pointer list-none select-none">
                    <ChevronDown size={14} className="transition-transform group-open:rotate-180 shrink-0" />
                    <span className="font-medium">{i + 1}번째</span>
                    <span className="text-fg-3 font-normal">— {chunk.authorNickname}가 썼어요</span>
                  </summary>
                  <div className="mt-2 bg-paper-100 rounded-md p-3 text-sm leading-relaxed text-fg-1 whitespace-pre-wrap border-l-2 border-l-brand">{chunk.content}</div>
                </details>
              )
            })}
          </div>
        )}

        <div className="bg-paper-0 border-[1.5px] border-default rounded-lg">
          <textarea value={draft} onChange={e => handleDraftChange(e.target.value)} placeholder="이야기를 이어 써보세요..." className="w-full px-3.5 py-3 text-base bg-transparent text-fg-1 placeholder:text-fg-disabled focus:outline-none resize-none" style={{ minHeight: 200, lineHeight: 1.75 }} />
          <div className="flex justify-between items-center px-3.5 py-2 border-t border-dashed border-subtle">
            <span className="font-mono text-xs text-fg-3">{draft.length}자</span>
            <span className="font-mono text-xs text-fg-3 flex items-center gap-1">
              {saveState === 'saving' && '저장 중…'}
              {saveState === 'saved' && <><Check size={10} className="text-success" /> 저장됨</>}
            </span>
          </div>
        </div>
        <Button size="lg" className="w-full" onClick={handleSubmit} disabled={!draft.trim()}>
          {editing ? '다시 제출하기' : '이야기 제출하기'}
        </Button>
      </div>
    </div>
  )
}

function DoneScreen({ room, myNickname }: { room: Room; myNickname: string }) {
  const myStudent = room.students.find(s => s.nickname === myNickname)
  const myStory = room.stories.find(s => s.ownerId === myStudent?.id)

  const handleExport = (format: 'txt' | 'md') => {
    if (!myStory) return
    const content = format === 'md'
      ? myStory.chunks.map((c, i) => `## ${i + 1}번째 — ${c.authorNickname}\n\n${c.content}`).join('\n\n---\n\n')
      : myStory.chunks.map((c, i) => `${i + 1}번째 — ${c.authorNickname}\n\n${c.content}`).join('\n\n---\n\n')
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' })), download: `이야기.${format}` })
    a.click(); URL.revokeObjectURL(a.href)
  }

  return (
    <div className="flex-1 px-5 py-8 flex flex-col items-center gap-6">
      <div className="text-center">
        <Image src="/mascot-fox.svg" alt="" width={80} height={80} className="mx-auto mb-3" />
        <h1 className="font-bold text-2xl text-fg-1 mb-1">우리가 함께 쓴 이야기예요</h1>
        <p className="text-fg-2">모두 수고했어요! 🎉</p>
      </div>
      {myStory && (
        <div className="w-full flex flex-col gap-2">
          {myStory.chunks.map((chunk, i) => {
            const isMine = chunk.authorNickname === myNickname
            return (
              <div key={i} className={cn('border rounded-md p-4', isMine ? 'bg-sun-50 border-sun-100' : 'bg-paper-0 border-subtle')}>
                {isMine && <p className="font-mono text-xs text-fg-3 mb-1">{i + 1}번째 · 내가 쓴 부분</p>}
                <p className="text-base text-fg-1 leading-[1.7] whitespace-pre-wrap">{chunk.content}</p>
                <p className="text-right font-display text-sm text-brand mt-2">— {chunk.authorNickname}가 썼어요</p>
              </div>
            )
          })}
        </div>
      )}
      <div className="grid grid-cols-4 gap-2 w-full">
        {(['txt', 'md'] as const).map(fmt => (
          <button key={fmt} onClick={() => handleExport(fmt)} className="flex flex-col items-center gap-0.5 bg-paper-0 border-[1.5px] border-default rounded-sm p-2.5 hover:bg-paper-100 transition-colors duration-fast">
            <Download size={14} className="text-fg-2 mb-0.5" />
            <span className="font-mono text-xs font-medium">{fmt.toUpperCase()}</span>
            <span className="text-xs text-fg-2">{fmt === 'txt' ? '글만' : '마크다운'}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function StudentRoomPage() {
  const { roomCode } = useParams<{ roomCode: string }>()
  const { room, setRoom, myNickname, myPhase, setPhase, assignedStoryId, setAssignedStoryId } = useStore()
  const [readingLeft, setReadingLeft] = useState(0)

  useEffect(() => {
    const socket = getSocket()
    socket.on('room_state', (r: Room) => setRoom(r))
    socket.on('phase_changed', ({ phase, assignedStoryId: sid }: { phase: AppPhase; currentStep: number; assignedStoryId: string | null }) => {
      setPhase(phase)
      if (sid) setAssignedStoryId(sid)
    })
    return () => { socket.off('room_state'); socket.off('phase_changed') }
  }, [setRoom, setPhase, setAssignedStoryId])

  useEffect(() => {
    if (!room || myPhase !== 'reading') return
    const seconds = (room as any).currentReadingSeconds ?? room.settings.readingSeconds
    setReadingLeft(seconds)
    const interval = setInterval(() => setReadingLeft(t => Math.max(0, t - 1)), 1000)
    return () => clearInterval(interval)
  }, [myPhase, room])

  if (!room) return <div className="min-h-screen bg-app flex items-center justify-center"><p className="text-fg-3">연결 중...</p></div>

  return (
    <div className="min-h-screen bg-app flex flex-col max-w-[390px] mx-auto">
      {myPhase === 'waiting' && <WaitingScreen room={room} myNickname={myNickname ?? ''} />}
      {myPhase === 'reading' && <ReadingScreen room={room} assignedStoryId={assignedStoryId} readingLeft={readingLeft} />}
      {myPhase === 'writing' && <WritingScreen room={room} assignedStoryId={assignedStoryId} myNickname={myNickname ?? ''} currentStep={room.currentStep} />}
      {myPhase === 'done' && <DoneScreen room={room} myNickname={myNickname ?? ''} />}
    </div>
  )
}
