'use client'
import { useEffect, useRef, useState } from 'react'

const COLORS = ['#EF4444','#F59E0B','#10B981','#2568D6','#8E4C8E','#1C1A17']
const SIZES = [4, 10, 20]

export default function WaitingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [color, setColor] = useState(COLORS[3])
  const [size, setSize] = useState(SIZES[1])
  const [isEraser, setIsEraser] = useState(false)
  const drawing = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#F5EEDF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [])

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    const sx = canvas.width / rect.width
    const sy = canvas.height / rect.height
    if ('touches' in e) {
      return { x: (e.touches[0].clientX - rect.left) * sx, y: (e.touches[0].clientY - rect.top) * sy }
    }
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy }
  }

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    drawing.current = true
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const pos = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (!drawing.current) return
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const pos = getPos(e, canvas)
    ctx.lineWidth = isEraser ? size * 3 : size
    ctx.lineCap = 'round'
    ctx.strokeStyle = isEraser ? '#F5EEDF' : color
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
  }

  const stopDraw = () => { drawing.current = false }

  return (
    <div className="bg-paper-0 rounded-lg border border-subtle shadow-sm p-5 space-y-4">
      <div className="text-center">
        <p className="font-bold text-fg-1 text-lg">잘 썼어요! 🎨</p>
        <p className="text-sm text-fg-2 mt-1">친구들을 기다리는 동안 자유롭게 그림을 그려봐요 :)</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {COLORS.map(c => (
            <button key={c} onClick={() => { setColor(c); setIsEraser(false) }}
              className={`w-7 h-7 rounded-full border-2 transition-all ${color === c && !isEraser ? 'border-ink-900 scale-110' : 'border-transparent'}`}
              style={{ backgroundColor: c }} />
          ))}
        </div>
        <div className="flex gap-2 items-center">
          {SIZES.map(s => (
            <button key={s} onClick={() => { setSize(s); setIsEraser(false) }}
              className={`rounded-full bg-ink-900 transition-all ${size === s && !isEraser ? 'ring-2 ring-brand' : ''}`}
              style={{ width: s * 1.5, height: s * 1.5 }} />
          ))}
        </div>
        <button onClick={() => setIsEraser(v => !v)}
          className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors
            ${isEraser ? 'bg-surface border-[var(--border-strong)] text-fg-1' : 'bg-paper-0 border-[var(--border-default)] text-fg-2'}`}>
          지우개
        </button>
        <button onClick={() => {
          const canvas = canvasRef.current!
          const ctx = canvas.getContext('2d')!
          ctx.fillStyle = '#F5EEDF'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
        }} className="px-3 py-1.5 rounded-md text-sm font-medium bg-berry-50 text-berry-700 border border-berry-100">
          전체 지우기
        </button>
      </div>

      <canvas ref={canvasRef} width={600} height={400}
        className="w-full rounded-lg border border-subtle touch-none cursor-crosshair"
        style={{ background: '#F5EEDF' }}
        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
        onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw} />
    </div>
  )
}
