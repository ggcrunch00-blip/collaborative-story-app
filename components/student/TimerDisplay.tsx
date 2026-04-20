'use client'
import { useEffect, useRef, useState } from 'react'

interface Props {
  totalSeconds: number
  phase: 'reading' | 'writing'
  onTimeUp?: () => void
}

export default function TimerDisplay({ totalSeconds, phase, onTimeUp }: Props) {
  const [remaining, setRemaining] = useState(totalSeconds)
  const calledRef = useRef(false)

  useEffect(() => {
    setRemaining(totalSeconds)
    calledRef.current = false
    const interval = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          if (!calledRef.current) { calledRef.current = true; onTimeUp?.() }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [totalSeconds])

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  const pct = remaining / totalSeconds
  const mm = String(minutes).padStart(2, '0')
  const ss = String(seconds).padStart(2, '0')

  if (phase === 'reading') {
    return (
      <div className="phase-banner read">
        <span>🔒 읽기 시간</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 18, letterSpacing: '.04em' }}>
          {mm}:{ss}
        </span>
      </div>
    )
  }

  const zone = pct > 0.5 ? 'ok' : pct > 0.1 ? 'warn' : 'danger'

  return (
    <div className={`timer-banner ${zone}`}>
      <span className="t-label">남은 시간</span>
      <div className="bar">
        <div className="bar-fill" style={{ width: `${pct * 100}%` }} />
      </div>
      <span className="t-time">{mm}:{ss}</span>
    </div>
  )
}
