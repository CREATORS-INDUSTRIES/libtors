export default function MarkdownIcon({ width = 16, height = 16, className = '' }: { width?: number; height?: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 16 16" fill="none" className={className}>
      <rect x="1.5" y="4" width="13" height="8" rx="1.5" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
      <path d="M3.75 10V6.5l1.6 1.8 1.6-1.8V10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11.1 6.5V10m0 0l-1.4-1.5m1.4 1.5l1.4-1.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
