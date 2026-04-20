'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Plus, X } from 'lucide-react'
import { getSocket } from '@/lib/socket'
import { useStore } from '@/lib/store'

export default function RoomSetupForm() {
  const router = useRouter()
  const { setRole, setRoom } = useStore()
  const [hostNickname, setHostNickname] = useState('')
  const [chunkCount, setChunkCount] = useState(4)
  const [timerMinutes, setTimerMinutes] = useState(5)
  const [readingSeconds, setReadingSeconds] = useState(30)
  const [order, setOrder] = useState<'random' | 'group'>('random')
  const [seeds, setSeeds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState<{ roomCode: string } | null>(null)

  const addSeed = () => { if (seeds.length < 5) setSeeds(s => [...s, '']) }
  const removeSeed = (i: number) => setSeeds(s => s.filter((_, j) => j !== i))
  const updateSeed = (i: number, val: string) => setSeeds(s => s.map((v, j) => j === i ? val : v))

  const handleCreate = () => {
    if (!hostNickname.trim()) return
    setLoading(true)
    const socket = getSocket()
    socket.emit('create_room', {
      settings: {
        chunkCount,
        timerSeconds: timerMinutes * 60,
        readingSeconds,
        seedCards: seeds.filter(s => s.trim()),
      },
      hostNickname: hostNickname.trim(),
    })
    socket.once('room_created', ({ roomCode }: { roomCode: string }) => {
      setLoading(false)
      setRole('teacher')
      setModal({ roomCode })
    })
    socket.on('room_state', (room) => setRoom(room))
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    border: '1.5px solid var(--border-default)',
    borderRadius: 14,
    padding: '12px 14px',
    fontSize: 17,
    fontFamily: 'var(--font-sans)',
    background: 'var(--paper-0)',
    color: 'var(--fg-1)',
    outline: 'none',
    transition: 'border-color 140ms, box-shadow 140ms',
  }

  return (
    <>
      {/* 헤더 */}
      <div className="sticky top-0 bg-paper-0 border-b border-subtle px-6 py-3 flex items-center gap-3 z-10">
        <Image src="/logo-mark.svg" alt="로고" width={28} height={28} />
        <Image src="/logo-wordmark.svg" alt="이야기 이어쓰기" width={120} height={28} />
        <span className="ml-auto text-xs font-medium text-fg-3 bg-surface px-3 py-1 rounded-full">선생님 모드</span>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 48, color: 'var(--fg-1)', marginBottom: 8 }}>
          새 활동 방 만들기
        </h1>
        <p className="text-lg text-fg-2 mb-8">설정을 마치면 학생들과 함께 이야기를 시작해요.</p>

        <div className="flex flex-col gap-5">
          {/* 닉네임 */}
          <div className="field">
            <label>선생님 닉네임 *</label>
            <input
              type="text" value={hostNickname} onChange={e => setHostNickname(e.target.value)}
              placeholder="2~10자 사이로 입력해 주세요"
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = 'var(--brand)'; e.target.style.boxShadow = 'var(--shadow-focus)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--border-default)'; e.target.style.boxShadow = 'none' }}
            />
          </div>

          {/* 슬라이더들 */}
          <div className="bg-surface rounded-lg p-5 flex flex-col gap-5">
            {[
              { label: '이야기 덩어리 수', hint: '한 이야기를 몇 명이 이어서 쓸지 정해요', value: chunkCount, min: 2, max: 10, unit: '덩어리', set: setChunkCount },
              { label: '단계당 작성 시간', hint: '', value: timerMinutes, min: 1, max: 20, unit: '분', set: setTimerMinutes },
              { label: '읽기 타임', hint: '다음 사람이 이어 쓰기 전, 앞의 이야기를 읽는 시간이에요', value: readingSeconds, min: 10, max: 120, step: 5, unit: '초', set: setReadingSeconds },
            ].map(({ label, hint, value, min, max, unit, set, step = 1 }) => (
              <div key={label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ fontWeight: 500, fontSize: 14, color: 'var(--fg-2)' }}>{label}</label>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16, color: 'var(--brand)' }}>
                    {value} {unit}
                  </span>
                </div>
                <input type="range" min={min} max={max} step={step} value={value}
                  onChange={e => (set as (v: number) => void)(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--brand)', cursor: 'pointer' }} />
                {hint && <div className="hint">{hint}</div>}
              </div>
            ))}
          </div>

          {/* 전달 순서 radio 카드 */}
          <div>
            <label style={{ display: 'block', fontWeight: 500, fontSize: 14, color: 'var(--fg-2)', marginBottom: 8 }}>전달 순서</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {([['random', '🎲 랜덤'], ['group', '모둠별']] as const).map(([val, label]) => (
                <button key={val} onClick={() => setOrder(val)}
                  style={{
                    flex: 1, padding: '12px 16px', borderRadius: 14,
                    border: `1.5px solid ${order === val ? 'var(--brand)' : 'var(--border-default)'}`,
                    background: order === val ? 'var(--brand-soft)' : 'var(--paper-0)',
                    color: order === val ? 'var(--crayon-700)' : 'var(--fg-1)',
                    fontWeight: 600, fontSize: 15, cursor: 'pointer',
                    transition: 'all 140ms',
                  }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 이야기 씨앗 */}
          <div>
            <label style={{ display: 'block', fontWeight: 500, fontSize: 14, color: 'var(--fg-2)', marginBottom: 8 }}>
              이야기 씨앗 <span style={{ color: 'var(--fg-3)', fontWeight: 400 }}>(선택 · 최대 5개)</span>
            </label>
            <div className="flex flex-col gap-2">
              {seeds.map((seed, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <textarea
                    value={seed} onChange={e => updateSeed(i, e.target.value)}
                    rows={2}
                    placeholder="이야기 시작을 도와줄 한 문장"
                    style={{ ...inputStyle, resize: 'none', flex: 1 }}
                    onFocus={e => { e.target.style.borderColor = 'var(--brand)'; e.target.style.boxShadow = 'var(--shadow-focus)' }}
                    onBlur={e => { e.target.style.borderColor = 'var(--border-default)'; e.target.style.boxShadow = 'none' }}
                  />
                  <button onClick={() => removeSeed(i)}
                    style={{
                      width: 32, height: 32, borderRadius: 8,
                      border: '1px solid var(--border-default)',
                      background: 'var(--paper-0)', color: 'var(--fg-3)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 6,
                    }}>
                    <X size={14} />
                  </button>
                </div>
              ))}
              {seeds.length < 5 && (
                <button onClick={addSeed}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '10px 14px', borderRadius: 10,
                    border: '1.5px dashed var(--border-default)',
                    background: 'transparent', color: 'var(--brand)',
                    fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    transition: 'background 140ms',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--brand-soft)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <Plus size={14} /> 씨앗 카드 추가
                </button>
              )}
            </div>
          </div>

          {/* 버튼 행 */}
          <div style={{ display: 'flex', gap: 12, paddingTop: 8 }}>
            <button onClick={() => window.history.back()}
              style={{
                flex: 1, minHeight: 48, borderRadius: 14,
                border: '1px solid var(--border-default)',
                background: 'var(--paper-0)', color: 'var(--fg-1)',
                fontWeight: 600, fontSize: 15, cursor: 'pointer',
                transition: 'background 120ms',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--paper-200)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--paper-0)')}
            >
              취소
            </button>
            <button onClick={handleCreate} disabled={loading || !hostNickname.trim()}
              className="flex-[2] min-h-14 rounded-md bg-brand text-white font-bold text-lg
                shadow-btn-brand hover:bg-brand-hover hover:shadow-btn-brand-hover hover:translate-y-[1px]
                active:translate-y-[2px] active:shadow-none
                disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
                transition-all duration-fast ease-out"
            >
              {loading ? '방 만드는 중...' : '방 만들기'}
            </button>
          </div>
        </div>
      </div>

      {/* 방 코드 모달 */}
      {modal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 px-4"
          style={{ background: 'var(--bg-overlay)' }}
        >
          <div style={{
            background: 'var(--paper-0)', borderRadius: 20, padding: 32,
            maxWidth: 440, width: '100%', boxShadow: 'var(--shadow-lg)', textAlign: 'center',
          }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 36, color: 'var(--fg-1)', marginBottom: 8 }}>
              방이 만들어졌어요!
            </h2>
            <p style={{ color: 'var(--fg-2)', marginBottom: 20 }}>학생들에게 아래 코드를 알려주세요</p>

            {/* big-code */}
            <div style={{
              fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 52,
              letterSpacing: '.12em', color: 'var(--brand)', lineHeight: 1, marginBottom: 6,
            }}>
              {modal.roomCode}
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase',
              letterSpacing: '.08em', color: 'var(--fg-3)', marginBottom: 24,
            }}>
              ROOM CODE
            </div>

            {/* QR placeholder */}
            <div style={{
              width: 140, height: 140, margin: '0 auto 24px',
              border: '2px dashed var(--border-default)', borderRadius: 12,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 6, color: 'var(--fg-3)', fontSize: 12,
            }}>
              <span style={{ fontSize: 28 }}>🔲</span>
              <span>QR 코드</span>
            </div>

            <button
              onClick={() => router.push(`/teacher/room/${modal.roomCode}`)}
              className="w-full min-h-14 rounded-md bg-brand text-white font-bold text-lg
                shadow-btn-brand hover:bg-brand-hover hover:shadow-btn-brand-hover hover:translate-y-[1px]
                active:translate-y-[2px] active:shadow-none transition-all duration-fast ease-out"
            >
              대시보드로 이동
            </button>
          </div>
        </div>
      )}
    </>
  )
}
