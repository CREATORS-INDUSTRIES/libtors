export default function Loader({ size = 40, lines = 12 }: { size?: number; lines?: number }) {
  const duration = 1.2
  const lineWidth = size * 0.05
  const lineHeight = size * 0.22

  return (
    <div
      className="relative"
      style={{ width: size, height: size } as React.CSSProperties}
    >
      {Array.from({ length: lines }).map((_, i) => {
        const angle = (i * 360) / lines

        return (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: lineWidth,
              height: lineHeight,
              backgroundColor: '#898989',
              top: '50%',
              left: '50%',
              transformOrigin: 'center bottom',
              transform: `translate(-50%, -${size / 2 - lineHeight / 2}px) rotate(${angle}deg) translateY(-${size * 0.15}px)`,
              animation: `throbber-pulse ${duration}s ease-in-out infinite`,
              animationDelay: `${(i / lines) * duration}s`,
            } as React.CSSProperties}
          />
        )
      })}
      <style>{`
        @keyframes throbber-pulse {
          0% { opacity: 0.2; }
          50% { opacity: 1; }
          100% { opacity: 0.2; }
        }
      `}</style>
    </div>
  )
}