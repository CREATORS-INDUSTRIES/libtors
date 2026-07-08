export default function MarkdownIcon({ width = 16, height = 16, className = '' }: { width?: number; height?: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2.25" y="6" width="19.5" height="12" rx="2.25" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M5.6 15V9.75l2.4 2.7 2.4-2.7V15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16.65 9.75V15m0 0-2.1-2.25m2.1 2.25 2.1-2.25" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
