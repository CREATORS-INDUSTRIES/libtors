export default function CopyIcon({ width = 16, height = 16, className = '' }: { width?: number; height?: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 16 16" fill="none" className={className}>
      <rect x="5.5" y="5.5" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1" />
      <path d="M3.5 10.5h-.5a1.5 1.5 0 01-1.5-1.5v-6a1.5 1.5 0 011.5-1.5h6a1.5 1.5 0 011.5 1.5v.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  )
}
