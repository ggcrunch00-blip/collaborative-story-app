'use client'
import { useState } from 'react'
import { ArrowRight, Pause } from 'lucide-react'
import { Room } from '@/lib/types'
import { getSocket } from '@/lib/socket'

interface Props { room: Room }

export default function TeacherControls({ room }: Props) {
  const [confirmNext, setConfirmNext] = useState(false)
  const socket = getSocket()

  return (
    <div className="flex flex-col gap-4">
      {/* 활동 진행 카드 */}
      <div className="bg-paper-0 rounded-lg border border-subtle shadow-sm p-5">
        <h3 className="font-bold text-xl text-fg-1 mb-4">활동 진행</h3>

        {room.phase === 'waiting' && (
          <>
            <p className="text-sm text-fg-3 mb-4">학생들이 모이면 활동을 시작하세요.</p>
            <button
              onClick={() => socket.emit('start_activity')}
              disabled={room.students.length === 0}
              className="w-full min-h-14 rounded-md bg-brand text-white font-bold text-lg
                shadow-btn-brand hover:bg-brand-hover hover:shadow-btn-brand-hover hover:translate-y-[1px]
                active:translate-y-[2px] active:shadow-none
                disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
                transition-all duration-fast ease-out flex items-center justify-center gap-2"
            >
              활동 시작하기 🚀
            </button>
          </>
        )}

        {(room.phase === 'reading' || room.phase === 'writing') && (
          <div className="flex flex-col gap-3">
            <div className="flex items-baseline gap-1">
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 52, color: 'var(--brand)', lineHeight: 1 }}>
                {room.currentStep}
              </span>
              <span className="text-fg-3 text-lg"> / {room.settings.chunkCount} 단계</span>
            </div>

            {/* 진행 바 */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
              {Array.from({ length: room.settings.chunkCount }).map((_, i) => (
                <div key={i} style={{
                  flex: 1, height: 6, borderRadius: 999,
                  background: i < room.currentStep ? 'var(--brand)' : 'var(--paper-200)',
                }} />
              ))}
            </div>

            <div className="text-sm text-fg-3 mb-1">
              {room.phase === 'reading' ? '📖 읽기 타임 진행 중' : '✏️ 학생들이 작성 중이에요'}
            </div>

            <button
              onClick={() => setConfirmNext(true)}
              className="w-full min-h-12 rounded-md bg-brand text-white font-bold
                shadow-btn-brand hover:bg-brand-hover hover:shadow-btn-brand-hover hover:translate-y-[1px]
                active:translate-y-[2px] active:shadow-none transition-all duration-fast ease-out
                flex items-center justify-center gap-2"
            >
              <ArrowRight size={16} /> 다음 단계로
            </button>
            <button
              className="w-full min-h-9 rounded-md text-fg-3 text-sm
                bg-transparent hover:bg-paper-100 transition-all duration-fast
                flex items-center justify-center gap-1.5 border border-[var(--border-subtle)]"
            >
              <Pause size={13} /> 활동 일시 중지
            </button>
          </div>
        )}

        {room.phase === 'done' && (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">🎊</div>
            <p className="font-bold text-fg-1 text-lg">활동이 끝났습니다!</p>
            <p className="text-sm text-fg-3 mt-1">학생들이 완성된 이야기를 확인 중이에요.</p>
          </div>
        )}
      </div>

      {/* 도움 요청 카드 */}
      <div className="bg-paper-0 rounded-lg border border-subtle shadow-sm p-5">
        <h3 className="font-bold text-xl text-fg-1 mb-3">
          도움 요청 <span className="text-fg-3 font-normal text-sm">0</span>
        </h3>
        <p className="text-sm text-fg-3 text-center py-2">현재 도움 요청이 없어요.</p>
      </div>

      {/* 설정 카드 */}
      <div className="bg-paper-0 rounded-lg border border-subtle shadow-sm p-5">
        <h3 className="font-bold text-xl text-fg-1 mb-3">설정</h3>
        <ul className="text-sm text-fg-2 space-y-1.5" style={{ lineHeight: 1.8 }}>
          <li>· 덩어리 수 <strong className="text-fg-1">{room.settings.chunkCount}개</strong></li>
          <li>· 단계당 <strong className="text-fg-1">{Math.floor(room.settings.timerSeconds / 60)}분</strong></li>
          <li>· 읽기 타임 <strong className="text-fg-1">{room.settings.readingSeconds}초</strong></li>
          <li>· 전달 순서 <strong className="text-fg-1">랜덤</strong></li>
        </ul>
      </div>

      {/* 다음 단계 확인 모달 */}
      {confirmNext && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4"
          style={{ background: 'var(--bg-overlay)' }}>
          <div className="bg-paper-0 rounded-xl p-6 max-w-sm w-full shadow-lg">
            <h3 className="font-bold text-xl text-fg-1 mb-2">다음 단계로 넘어갈까요?</h3>
            <p className="text-fg-3 text-sm mb-6">아직 작성 중인 학생이 있을 수 있어요.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmNext(false)}
                className="flex-1 min-h-12 border border-[var(--border-default)] text-fg-1 rounded-md font-medium hover:bg-surface transition-all duration-fast">
                취소
              </button>
              <button onClick={() => { setConfirmNext(false); socket.emit('next_phase') }}
                className="flex-1 min-h-12 bg-brand text-white rounded-md font-bold
                  shadow-btn-brand hover:bg-brand-hover transition-all duration-fast">
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
