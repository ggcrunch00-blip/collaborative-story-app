import type { AppPhase } from './types'

export const PHASE_META: Record<AppPhase, { label: string; color: string; dot: string }> = {
  waiting: { label: '대기 중',   color: 'text-phase-waiting', dot: 'bg-phase-waiting' },
  reading: { label: '읽기 단계', color: 'text-phase-reading', dot: 'bg-phase-reading' },
  writing: { label: '작성 단계', color: 'text-phase-writing', dot: 'bg-phase-writing' },
  done:    { label: '완료',      color: 'text-phase-done',    dot: 'bg-phase-done'    },
}
