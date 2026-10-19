import type { SVGProps } from 'react'

// Traced from /logo.png and pre-placed in CreatorsWordmarkPath's user space, left of
// the C and overhanging the letters (x -129.43..-37.27, y -23.7..96.01): a transform
// would move the path out of the userSpaceOnUse gradients the wordmark strokes share.
export default function CreatorsHeadPath(props: SVGProps<SVGPathElement>) {
  return (
    <path
      d="M-95.98,-23.7L-56.62,-23.7L-40.88,-10.91L-38.58,16.64L-47.44,52.06L-61.54,52.06L-78.93,32.06L-84.83,19.59L-93.36,19.27L-97.29,13.36L-104.18,-2.05ZM-95.65,37.63L-92.37,39.6L-68.76,68.13L-53.67,68.13L-37.6,81.58L-37.27,96.01L-129.43,96.01L-129.43,50.42Z"
      {...props}
    />
  )
}
