'use client'

import { forwardRef } from 'react'

interface HandCursorProps {
  x: number
  y: number
  isPinching: boolean
}

const HandCursor = forwardRef<HTMLDivElement, HandCursorProps>(
  ({ x, y, isPinching }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          top: `${y}px`,
          left: `${x}px`,
        }}
        className={`w-16 aspect-square fixed -translate-x-1/2 -translate-y-1/2 transition z-10 pointer-events-none ${isPinching ? 'scale-110' : ''}`}
      >
        <div className="w-full h-full bg-[url('/skewer.png')] bg-no-repeat bg-center bg-contain"></div>
      </div>
    )
  },
)

HandCursor.displayName = 'HandCursor'

export default HandCursor
