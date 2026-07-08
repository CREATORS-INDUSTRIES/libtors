export default function GaugeIcon({ width = 16, height = 16, className = '' }: { width?: number; height?: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4.5 18a7.5 7.5 0 1 1 15 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 18l3.9-3.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
