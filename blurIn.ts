import './motion.css'

export const blurIn = (delay: string) => ({
  opacity: 0,
  animation: 'libtors-blur-in 0.4s ease forwards',
  animationDelay: delay,
})
