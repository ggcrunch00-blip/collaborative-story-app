'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, X } from 'lucide-react'
import Image from 'next/image'
import { QRCodeSVG } from 'qrcode.react'
import { CreateRoomSchema, type CreateRoomInput } from '@/lib/schemas'
import { getSocket } from '@/lib/socket'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AppBar } from '@/components/AppBar'
import { cn } from '@/lib/utils'

export default function TeacherCreatePage() {
  const router = useRouter()
  const { setRole, setRoom } = useStore()
  const [seeds, setSeeds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState<{ roomCode: string } | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateRoomInput>({
    resolver: zodResolver(CreateRoomSchema),
    defaultValues: {
      chunkCount: 4,
      timerMinutes: 5,
      readingSeconds: 30,
      order: 'random',
      seeds: [],
      allowRevision: false,
    },
  })

  const chunkCount = watch('chunkCount')
  const timerMinutes = watch('timerMinutes')
  const readingSeconds = watch('readingSeconds')
  const order = watch('order')
  const allowRevision = watch('allowRevision')

  const addSeed = () => {
    if (seeds.length < 5) setSeeds(s => [...s, ''])
  }
  const removeSeed = (i: number) => setSeeds(s => s.filter((_, j) => j !== i))
  const updateSeed = (i: number, val: string) =>
    setSeeds(s => s.map((v, j) => (j === i ? val : v)))

  const onSubmit = (data: CreateRoomInput) => {
    setLoading(true)
    const socket = getSocket()
    socket.emit('create_room', {
      settings: {
        chunkCount: data.chunkCount,
        timerSeconds: data.timerMinutes * 60,
        readingSeconds: data.readingSeconds,
        seedCards: seeds.filter(s => s.trim()),
        allowRevision: data.allowRevision,
      },
      hostNickname: data.hostNickname,
    })
    socket.once('room_created', ({ roomCode }: { roomCode: string }) => {
      setLoading(false)
      setRole('teacher')
      setModal({ roomCode })
    })
    socket.on('room_state', (room) => setRoom(room))
  }

  return (
    <div className="min-h-screen bg-app">
      <AppBar badge="선생님 모드" />

      <main className="max-w-[640px] mx-auto py-12 px-6">
        <h1 className="font-display font-bold text-4xl text-fg-1 mb-2">새 활동 방 만들기</h1>
        <p className="text-lg text-fg-2 mb-10">설정을 마치면 학생들과 함께 이야기를 시작해요.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          {/* 닉네임 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-fg-2">선생님 닉네임 *</label>
            <Input
              {...register('hostNickname')}
              placeholder="2~10자 사이로 입력해 주세요"
            />
            {errors.hostNickname && (
              <p className="text-xs text-danger">{errors.hostNickname.message}</p>
            )}
          </div>

          {/* 슬라이더 그룹 */}
          <div className="bg-surface rounded-lg p-5 flex flex-col gap-5">
            {[
              {
                label: '이야기 덩어리 수',
                hint: '한 이야기를 몇 명이 이어서 쓸지 정해요',
                value: chunkCount,
                min: 2, max: 10, step: 1,
                unit: '덩어리',
                name: 'chunkCount' as const,
              },
              {
                label: '단계당 작성 시간',
                hint: '',
                value: timerMinutes,
                min: 1, max: 20, step: 1,
                unit: '분',
                name: 'timerMinutes' as const,
              },
              {
                label: '읽기 타임',
                hint: '다음 사람이 이어 쓰기 전, 앞의 이야기를 읽는 시간이에요',
                value: readingSeconds,
                min: 10, max: 120, step: 5,
                unit: '초',
                name: 'readingSeconds' as const,
              },
            ].map(({ label, hint, value, min, max, step, unit, name }) => (
              <div key={name}>
                <div className="flex justify-between mb-1.5">
                  <label className="text-sm font-medium text-fg-2">{label}</label>
                  <span className="font-mono font-bold text-base text-brand">
                    {value} {unit}
                  </span>
                </div>
                <input
                  type="range"
                  min={min} max={max} step={step}
                  {...register(name, { valueAsNumber: true })}
                  className="w-full accent-brand cursor-pointer"
                />
                {hint && <p className="text-xs text-fg-3 mt-1">{hint}</p>}
              </div>
            ))}
          </div>

          {/* 전달 순서 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-fg-2">전달 순서</label>
            <div className="flex gap-2.5">
              {(['random', 'group'] as const).map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setValue('order', val)}
                  className={cn(
                    'flex-1 py-3 px-4 rounded-md border-[1.5px] font-semibold text-sm transition-all duration-fast',
                    order === val
                      ? 'border-brand bg-brand-soft text-crayon-700'
                      : 'border-default bg-paper-0 text-fg-1 hover:bg-surface'
                  )}
                >
                  {val === 'random' ? '🎲 랜덤' : '모둠별'}
                </button>
              ))}
            </div>
          </div>

          {/* 이야기 씨앗 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-fg-2">
              이야기 씨앗{' '}
              <span className="font-normal text-fg-3">(선택 · 최대 5개)</span>
            </label>
            <div className="flex flex-col gap-2">
              {seeds.map((seed, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <textarea
                    value={seed}
                    onChange={e => updateSeed(i, e.target.value)}
                    rows={2}
                    placeholder="이야기 시작을 도와줄 한 문장"
                    className="flex-1 border-[1.5px] border-default rounded-md px-3.5 py-3 text-base bg-paper-0 text-fg-1 placeholder:text-fg-disabled focus:outline-none focus:border-brand focus:shadow-focus resize-none transition-[border-color,box-shadow] duration-[140ms]"
                  />
                  <button
                    type="button"
                    onClick={() => removeSeed(i)}
                    className="mt-1.5 w-8 h-8 flex items-center justify-center rounded-sm border border-default bg-paper-0 text-fg-3 hover:bg-surface transition-colors duration-fast"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              {seeds.length < 5 && (
                <button
                  type="button"
                  onClick={addSeed}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-sm border-[1.5px] border-dashed border-default text-brand text-sm font-semibold hover:bg-brand-soft transition-colors duration-fast"
                >
                  <Plus size={14} /> 씨앗 카드 추가
                </button>
              )}
            </div>
          </div>

          {/* 다시 쓰기 허용 */}
          <div className="flex items-center justify-between bg-surface rounded-lg px-5 py-4">
            <div>
              <p className="text-sm font-medium text-fg-2">이전 단계 이야기 다시 쓰기 허용</p>
              <p className="text-xs text-fg-3 mt-0.5">2단계부터 제출 후 수정 가능하게 할지 설정해요</p>
            </div>
            <button
              type="button"
              onClick={() => setValue('allowRevision', !allowRevision)}
              className={cn(
                'relative w-12 h-6 rounded-full transition-colors duration-fast shrink-0',
                allowRevision ? 'bg-brand' : 'bg-ink-200'
              )}
            >
              <span className={cn(
                'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-fast',
                allowRevision && 'translate-x-6'
              )} />
            </button>
          </div>

          {/* 푸터 버튼 */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => window.history.back()}
            >
              취소
            </Button>
            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="flex-[2]"
            >
              {loading ? '방 만드는 중...' : '방 만들기'}
            </Button>
          </div>
        </form>
      </main>

      {/* 방 코드 모달 */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-overlay">
          <div className="bg-paper-0 rounded-xl p-8 max-w-[440px] w-full shadow-lg text-center">
            <h2 className="font-display font-bold text-3xl text-fg-1 mb-2">방이 만들어졌어요!</h2>
            <p className="text-fg-2 mb-6">학생들에게 아래 코드를 알려주세요</p>

            <div
              className="font-mono font-bold text-brand leading-none mb-1.5"
              style={{ fontSize: 52, letterSpacing: '.12em' }}
            >
              {modal.roomCode}
            </div>
            <div className="font-mono text-xs uppercase tracking-widest text-fg-3 mb-6">
              ROOM CODE
            </div>

            <div className="mx-auto mb-6 p-3 bg-white rounded-xl inline-block shadow-sm">
              <QRCodeSVG
                value={`${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/student/join?room=${modal.roomCode}`}
                size={160}
                level="M"
              />
            </div>

            <Button
              size="lg"
              className="w-full"
              onClick={() => router.push(`/teacher/room/${modal.roomCode}`)}
            >
              대시보드로 이동
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
