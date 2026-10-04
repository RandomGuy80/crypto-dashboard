interface CircularProgressProps {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  color?: string
  trackColor?: string
  label?: string
  sublabel?: string
}

export function CircularProgress({
  value,
  max = 100,
  size = 80,
  strokeWidth = 6,
  color = '#a855f7',
  trackColor = 'rgba(255,255,255,0.06)',
  label,
  sublabel,
}: CircularProgressProps) {
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const pct = Math.min(value / max, 1)
  const dash = pct * circ

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color}80)`, transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      {label && (
        <div className="text-center -mt-1">
          <p className="text-xs font-bold" style={{ color }}>{label}</p>
          {sublabel && <p className="text-xs text-gray-500">{sublabel}</p>}
        </div>
      )}
    </div>
  )
}
