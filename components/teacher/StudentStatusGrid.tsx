'use client'
import { Eye, Edit3 } from 'lucide-react'
import { Student } from '@/lib/types'

const statusConfig = {
  idle:    { label: '대기 중',  cls: 'b-waiting', dot: 'var(--phase-waiting)' },
  reading: { label: '읽는 중', cls: 'b-reading', dot: 'var(--phase-reading)' },
  writing: { label: '작성 중', cls: 'b-writing', dot: 'var(--phase-writing)' },
  done:    { label: '완료',    cls: 'b-done',    dot: 'var(--phase-done)' },
}

const avatarColors = [
  '#2568D6','#8E4C8E','#10B981','#F59E0B',
  '#EF4444','#123E87','#5E2D5E','#0A7A56',
]

interface Props {
  students: Student[]
  currentStep?: number
  totalSteps?: number
}

export default function StudentStatusGrid({ students, currentStep = 0, totalSteps = 0 }: Props) {
  return (
    <div className="bg-paper-0 rounded-lg shadow-sm border border-subtle p-5">
      <h2 className="font-bold text-2xl text-fg-1 mb-4">
        학생 현황{' '}
        <span className="text-fg-3 font-normal text-lg">{students.filter(s => s.isOnline).length}명 접속</span>
      </h2>

      {students.length === 0 ? (
        <div className="text-center py-12 text-fg-3 text-sm">아직 참가한 학생이 없어요.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {students.map((student, i) => {
            const cfg = statusConfig[student.status] || statusConfig.idle
            const avatarColor = avatarColors[i % avatarColors.length]
            const initial = student.nickname.slice(-1)
            const isOffline = !student.isOnline

            return (
              <div key={student.id}
                style={{
                  background: 'var(--paper-0)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 12,
                  padding: 14,
                  boxShadow: 'var(--shadow-sm)',
                  opacity: isOffline ? 0.52 : 1,
                }}>

                {/* head: avatar + 닉네임 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: avatarColor, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, flexShrink: 0,
                  }}>
                    {initial}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--fg-1)', lineHeight: 1.2 }}>
                      {student.nickname}
                    </div>
                  </div>
                </div>

                {/* meta-row: 글자 수 · 단계 */}
                {totalSteps > 0 && (
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-2)',
                    marginBottom: 8,
                  }}>
                    <span>{student.charCount > 0 ? `${student.charCount}자` : '—'}</span>
                    <span>{currentStep}/{totalSteps} 단계</span>
                  </div>
                )}

                {/* 상태 배지 */}
                <div style={{ marginBottom: isOffline ? 0 : 8 }}>
                  {isOffline ? (
                    <span className="badge b-offline">
                      <span className="dot" style={{ background: 'var(--danger)' }} />재접속 대기
                    </span>
                  ) : (
                    <span className={`badge ${cfg.cls}`}>
                      <span className="dot" style={{ background: cfg.dot }} />
                      {cfg.label}
                    </span>
                  )}
                </div>

                {/* actions */}
                {!isOffline && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      fontSize: 12, color: 'var(--fg-3)',
                      background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 6,
                    }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--paper-100)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <Eye size={12} /> 미리보기
                    </button>
                    <button style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      fontSize: 12, color: 'var(--fg-3)',
                      background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 6,
                    }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--paper-100)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <Edit3 size={12} /> 수정
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
