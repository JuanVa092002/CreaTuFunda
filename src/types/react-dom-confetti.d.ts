// Ambient types for react-dom-confetti (ships without TypeScript definitions).

declare module 'react-dom-confetti' {
  import type { CSSProperties } from 'react'

  interface ConfettiConfig {
    angle?: number
    spread?: number
    startVelocity?: number
    elementCount?: number
    dragFriction?: number
    duration?: number
    stagger?: number
    width?: string | number
    height?: string | number
    perspective?: string
    colors?: string[]
  }

  interface ConfettiProps {
    active: boolean
    config?: ConfettiConfig
    className?: string
    style?: CSSProperties
  }

  export default function Confetti(props: ConfettiProps): JSX.Element
}
