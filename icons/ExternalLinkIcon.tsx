export default function ExternalLinkIcon({ width = 16, height = 16, className = '' }: { width?: number; height?: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M7.5 16.5 16.5 7.5M9 7.5h7.5V15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
