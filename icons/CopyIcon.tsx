export default function CopyIcon({ width = 16, height = 16, className = '' }: { width?: number; height?: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="8.25" y="8.25" width="12" height="12" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5.25 15.75h-.75a2.25 2.25 0 0 1-2.25-2.25v-9a2.25 2.25 0 0 1 2.25-2.25h9a2.25 2.25 0 0 1 2.25 2.25v.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
