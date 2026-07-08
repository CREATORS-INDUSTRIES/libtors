export default function CodeIcon({ width = 16, height = 16, className = '' }: { width?: number; height?: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M9 6.75 3.75 12 9 17.25M15 6.75 20.25 12 15 17.25" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
