'use client'

import { useEffect, useState } from 'react'
import type { RefObject } from 'react'

type Options = {
  /** Stop observing after the first intersection. */
  once?: boolean
  /** Fraction of the element that must be visible to trigger. */
  amount?: number
  rootMargin?: string
}

/**
 * Minimal replacement for framer-motion's `useInView`.
 *
 * framer-motion was pulled in for this single hook, and its transitive
 * `motion-dom` dependency broke the Next 15 build. A direct IntersectionObserver
 * keeps the same behaviour with no extra dependencies.
 */
export function useInView<T extends Element>(
  targetRef: RefObject<T | null>,
  { once = false, amount = 0, rootMargin = '0px' }: Options = {}
) {
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const element = targetRef.current
    if (!element || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry) return

        if (entry.isIntersecting) {
          setIsInView(true)
          if (once) observer.disconnect()
        } else if (!once) {
          setIsInView(false)
        }
      },
      { threshold: amount, rootMargin }
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [targetRef, once, amount, rootMargin])

  return isInView
}
