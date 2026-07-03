import { useEffect, useRef } from 'react'

/** แผ่นเซ็นชื่อบนหน้าจอ (สำหรับสัญญายืม) — ส่งค่าเป็น dataURL PNG ผ่าน onChange */
export function SignaturePad({ onChange }: { onChange: (dataUrl: string | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const dirty = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    // ปรับความละเอียดตาม DPR ให้ลายเส้นคม
    const ratio = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * ratio
    canvas.height = rect.height * ratio
    ctx.scale(ratio, ratio)
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#111827'

    function pos(e: PointerEvent) {
      const r = canvas.getBoundingClientRect()
      return { x: e.clientX - r.left, y: e.clientY - r.top }
    }
    function down(e: PointerEvent) {
      drawing.current = true
      dirty.current = true
      const p = pos(e)
      ctx.beginPath()
      ctx.moveTo(p.x, p.y)
      canvas.setPointerCapture(e.pointerId)
    }
    function move(e: PointerEvent) {
      if (!drawing.current) return
      const p = pos(e)
      ctx.lineTo(p.x, p.y)
      ctx.stroke()
    }
    function up() {
      if (!drawing.current) return
      drawing.current = false
      onChange(canvas.toDataURL('image/png'))
    }
    canvas.addEventListener('pointerdown', down)
    canvas.addEventListener('pointermove', move)
    canvas.addEventListener('pointerup', up)
    canvas.addEventListener('pointerleave', up)
    return () => {
      canvas.removeEventListener('pointerdown', down)
      canvas.removeEventListener('pointermove', move)
      canvas.removeEventListener('pointerup', up)
      canvas.removeEventListener('pointerleave', up)
    }
  }, [onChange])

  function clear() {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    dirty.current = false
    onChange(null)
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        className="h-40 w-full touch-none rounded-lg border border-dashed border-gray-400 bg-white"
      />
      <div className="mt-1 flex justify-between text-sm">
        <span className="text-gray-400">เซ็นในกรอบด้านบน</span>
        <button type="button" className="text-brand" onClick={clear}>
          ล้างลายเซ็น
        </button>
      </div>
    </div>
  )
}
