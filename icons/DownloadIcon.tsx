export default function DownloadIcon({ width = 16, height = 16, className = '' }: { width?: number; height?: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 3v12M7.5 10.5 12 15l4.5-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.5 18h15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
