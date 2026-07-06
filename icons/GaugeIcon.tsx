export default function GaugeIcon({ width = 16, height = 16, className = '' }: { width?: number; height?: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M3 12a5 5 0 1 1 10 0" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <path d="M8 12l2.6-2.6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  )
}
