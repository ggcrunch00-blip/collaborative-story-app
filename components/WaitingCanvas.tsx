'use client'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

const COLORS = [
  { label: '파랑', value: '#2568D6' },
  { label: '초록', value: '#10B981' },
  { label: '빨강', value: '#EF4444' },
  { label: '노랑', value: '#F59E0B' },
  { label: '보라', value: '#8E4C8E' },
  { label: '분홍', value: '#EC4899' },
  { label: '검정', value: '#1C1A17' },
]
const SIZES = [4, 8, 14]

export function WaitingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [color, setColor] = useState(COLORS[0].value)
  const [size, setSize] = useState(SIZES[1])
  const [eraser, setEraser] = useState(false)
  const drawing = useRef(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#FBF7EF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [])

  function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current
    if (!canvas) return
    drawing.current = true
    lastPos.current = getPos(e, canvas)
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pos = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(lastPos.current!.x, lastPos.current!.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = eraser ? '#FBF7EF' : color
    ctx.lineWidth = eraser ? size * 3 : size
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
    lastPos.current = pos
  }

  function endDraw() {
    drawing.current = false
    lastPos.current = null
  }

  function clearCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#FBF7EF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  return (
    <div className="flex flex-col gap-3 px-5 py-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-fg-2">🎨 기다리는 동안 그림을 그려봐요!</p>
        <button
          onClick={clearCanvas}
          className="text-xs text-fg-3 px-2.5 py-1 rounded-md border border-default hover:bg-surface transition-colors duration-fast"
        >
          전체 지우기
        </button>
      </div>

      {/* 툴바 */}
      <div className="flex items-center gap-2 flex-wrap">
        {COLORS.map(c => (
          <button
            key={c.value}
            onClick={() => { setColor(c.value); setEraser(false) }}
            className={cn(
              'w-7 h-7 rounded-full border-2 transition-transform duration-fast',
              color === c.value && !eraser ? 'border-fg-1 scale-110' : 'border-transparent'
            )}
            style={{ background: c.value }}
            title={c.label}
          />
        ))}
        <button
          onClick={() => setEraser(e => !e)}
          className={cn(
            'px-2.5 py-1 rounded-md text-xs font-medium border transition-colors duration-fast',
            eraser ? 'bg-sun-50 border-sun-300 text-sun-700' : 'bg-paper-0 border-default text-fg-2'
          )}
        >
          지우개
        </button>
        <div className="flex gap-1 ml-1">
          {SIZES.map(s => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className={cn(
                'w-7 h-7 rounded-full border flex items-center justify-center transition-colors duration-fast',
                size === s ? 'border-brand bg-brand-soft' : 'border-default bg-paper-0'
              )}
            >
              <span className="rounded-full bg-fg-2" style={{ width: s / 1.5, height: s / 1.5 }} />
            </button>
          ))}
        </div>
      </div>

      {/* 캔버스 */}
      <canvas
        ref={canvasRef}
        width={600}
        height={400}
        className="w-full rounded-xl border border-subtle cursor-crosshair touch-none"
        style={{ background: '#FBF7EF' }}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={e => { e.preventDefault(); startDraw(e) }}
        onTouchMove={e => { e.preventDefault(); draw(e) }}
        onTouchEnd={endDraw}
      />
    </div>
  )
}
