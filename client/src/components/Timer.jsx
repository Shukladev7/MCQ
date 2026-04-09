import { useState, useEffect, useRef } from 'react'

const Timer = ({ durationSeconds, onExpire, warningAt = 300 }) => {
  const [secs, setSecs] = useState(durationSeconds)
  const firedRef = useRef(false)

  useEffect(() => {
    setSecs(durationSeconds)
    firedRef.current = false
  }, [durationSeconds])

  useEffect(() => {
    const id = setInterval(() => {
      setSecs(prev => {
        if (prev <= 1) {
          clearInterval(id)
          if (!firedRef.current) { firedRef.current = true; onExpire?.() }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [durationSeconds])

  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  const pct = Math.max(0, (secs / durationSeconds) * 100)

  const isDanger  = secs <= 60
  const isWarning = secs <= warningAt && secs > 60

  const color = isDanger ? '#f87171' : isWarning ? '#fbbf24' : '#00ff88'

  return (
    <div className={`flex flex-col items-end gap-1 px-3 py-2 rounded-xl border transition-all duration-300 ${
      isDanger  ? 'border-red-500/40 bg-red-500/5 animate-pulse' :
      isWarning ? 'border-yellow-500/40 bg-yellow-500/5' :
                  'border-neon/20 bg-neon/5'
    }`}>
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
        <span className="font-mono font-bold text-xl tabular-nums leading-none"
          style={{ color, textShadow: isDanger ? 'none' : `0 0 12px ${color}60` }}>
          {h > 0 && `${String(h).padStart(2,'0')}:`}
          {String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-0.5 bg-gray-800 rounded-full overflow-hidden" style={{ minWidth: 80 }}>
        <div className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${pct}%`, background: color }} />
      </div>

      <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: color + '99' }}>
        {isDanger ? '⚠ critical' : isWarning ? '⚡ hurry up' : 'remaining'}
      </span>
    </div>
  )
}

export default Timer
