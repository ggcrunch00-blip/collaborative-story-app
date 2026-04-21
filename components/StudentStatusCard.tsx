import { Eye, Edit3 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Student, AppPhase } from '@/lib/types'

const AVATAR_COLORS = [
  'bg-crayon-500', 'bg-sprout-500', 'bg-plum-500',
  'bg-sun-500',    'bg-berry-500',  'bg-crayon-300',
]

function getAvatarColor(nickname: string) {
  let hash = 0
  for (const c of nickname) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

interface StudentStatusCardProps {
  student: Student
  currentStep: number
  totalSteps: number
  phase: AppPhase
  onResolveHelp?: () => void
}

export function StudentStatusCard({ student, currentStep, totalSteps, phase, onResolveHelp }: StudentStatusCardProps) {
  const isOffline = !student.isOnline

  const phaseBadgeVariant = isOffline ? 'offline' : (phase as any)

  const phaseLabel = isOffline
    ? '재접속 대기'
    : { waiting: '대기 중', reading: '읽기 중', writing: '작성 중', done: '완료' }[phase]

  return (
    <div className={cn(
      'bg-paper-0 border border-subtle rounded-lg p-3.5 shadow-sm',
      isOffline && 'opacity-[.52]',
      student.needsHelp && 'border-sun-300 bg-sun-50',
    )}>
      {/* 헤더 */}
      <div className="flex items-center gap-2.5 mb-2.5">
        <div className={cn(
          'w-9 h-9 rounded-full flex items-center justify-center text-white font-display font-bold text-sm shrink-0',
          getAvatarColor(student.nickname)
        )}>
          {student.nickname.slice(-1)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-fg-1 truncate">{student.nickname}</p>
          <p className="text-xs text-fg-3">1모둠</p>
        </div>
      </div>

      {/* 메타 */}
      <div className="flex justify-between font-mono text-xs text-fg-2 mb-2">
        <span>{student.charCount}자</span>
        <span>{currentStep}/{totalSteps} 단계</span>
      </div>

      {/* 뱃지 */}
      <div className="flex flex-wrap gap-1 mb-2.5">
        <Badge variant={phaseBadgeVariant}>{phaseLabel}</Badge>
        {student.needsHelp && (
          <button
            onClick={onResolveHelp}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-sun-50 text-sun-700 border border-sun-300 hover:bg-sun-100 transition-colors duration-fast"
          >
            ✋ 도움 요청
          </button>
        )}
      </div>

      {/* 액션 */}
      {!isOffline && (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" className="flex-1 gap-1 text-xs">
            <Eye size={12} /> 미리보기
          </Button>
          <Button variant="ghost" size="sm" className="flex-1 gap-1 text-xs">
            <Edit3 size={12} /> 수정
          </Button>
        </div>
      )}
    </div>
  )
}
