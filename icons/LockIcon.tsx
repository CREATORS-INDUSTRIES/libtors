export default function LockIcon({ width = 16, height = 16, className = '' }: { width?: number; height?: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="5.25" y="10.5" width="13.5" height="9" rx="2.25" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8.25 10.5V8.25a3.75 3.75 0 0 1 7.5 0v2.25" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
