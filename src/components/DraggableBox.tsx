'use client'

import { COOKING_DURATION, ITEM_COLOR_SET } from '@/utils/constants'
import { CookingStatus } from '@/utils/types'
import { forwardRef, useEffect } from 'react'

interface DraggableBoxProps {
  dragOffset: { x: number; y: number }
  status: CookingStatus
  isDragging: boolean
  forceStop: boolean
  updateNextStatus: () => void
}

const DraggableBox = forwardRef<HTMLDivElement, DraggableBoxProps>(
  ({ dragOffset, status, isDragging, forceStop, updateNextStatus }, ref) => {
    const colorSet = ITEM_COLOR_SET[status]

    useEffect(() => {
      if (
        status === CookingStatus.Idle ||
        status === CookingStatus.Overcooked ||
        isDragging ||
        forceStop
      )
        return

      const timer = setInterval(() => {
        updateNextStatus()
      }, COOKING_DURATION)

      return () => clearInterval(timer)
    }, [status, isDragging, forceStop])

    return (
      <div className="relative w-24 aspect-square  rounded-full bg-stone-400">
        <div className="absolute w-full h-full pointer-events-none inset-0 border-3 border-stone-600 rounded-full"></div>

        <div
          ref={ref}
          style={{
            transform: isDragging
              ? `translate(${dragOffset.x}px, ${dragOffset.y}px) scale(1.1)`
              : 'scale(1)',
            backgroundColor: colorSet.main,
            borderColor: colorSet.border,
            color: colorSet.border,
          }}
          className={`absolute w-full h-full inset-0 rounded-full transition border-3 ${isDragging ? 'z-1' : ''}`}
        >
          {status !== CookingStatus.Idle && (
            <div className="w-fit text-5xl rotate-[-60deg] translate-x-[2px] translate-y-[5px]">
              )))
            </div>
          )}
        </div>
      </div>
    )
  },
)

DraggableBox.displayName = 'DraggableBox'

export default DraggableBox
