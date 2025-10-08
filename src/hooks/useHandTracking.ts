import { useRef, useState, RefObject, useEffect } from 'react'
import { HandLandmarkerResult, Landmark } from '@mediapipe/tasks-vision'
import { DEFAULT_HAND, HAND_PARTS } from '@/utils/constants'
import { isRectOverlap } from '@/utils/helpers'
import { CookingStatus, GameStatus } from '@/utils/types'

interface UseHandTrackingProps {
  cursorRef: RefObject<HTMLDivElement | null>
  itemRefs: (HTMLDivElement | null)[]
  itemStatusList: CookingStatus[]
  currentGameStatus: GameStatus
  startCookingItem: (i: number) => void
  onItemDone: (i: number) => void
}

export default function useHandTracking({
  cursorRef,
  itemRefs,
  itemStatusList,
  currentGameStatus,
  startCookingItem,
  onItemDone,
}: UseHandTrackingProps) {
  const [cursorPosition, setCursorPosition] = useState({ x: 200, y: 200 })

  const activeDragIndexRef = useRef<number | null>(null)
  const isPinchingRef = useRef(false)
  const lastCursorPosRef = useRef({ x: 0, y: 0 })
  const dragOffsetRef = useRef({ x: 0, y: 0 })
  const itemStatusListRef = useRef(itemStatusList)
  const gameStatusRef = useRef(currentGameStatus)

  const resetMovement = () => {
    activeDragIndexRef.current = null
    dragOffsetRef.current = { x: 0, y: 0 }
    lastCursorPosRef.current = { x: 0, y: 0 }
  }

  // Update the ref whenever itemStatusList changes
  useEffect(() => {
    itemStatusListRef.current = itemStatusList
  }, [itemStatusList])

  // Update the ref whenever currentGameStatus changes
  useEffect(() => {
    gameStatusRef.current = currentGameStatus
    // reset
    if (currentGameStatus === GameStatus.End) {
      resetMovement()
    }
  }, [currentGameStatus])

  const getPinchStatus = (landmarks: Landmark[]) => {
    const indexTip = landmarks[HAND_PARTS.indexFinger.tip]
    const thumbTip = landmarks[HAND_PARTS.thumb.tip]
    if (!indexTip || !thumbTip) return false

    const distance = {
      x: Math.abs(indexTip.x - thumbTip.x),
      y: Math.abs(indexTip.y - thumbTip.y),
      z: Math.abs(indexTip.z - thumbTip.z),
    }

    const isClose = distance.x < 0.08 && distance.y < 0.08 && distance.z < 0.11
    return isClose
  }

  const handleHandMovement = (detections: HandLandmarkerResult) => {
    if (!detections.handedness.length) return
    if (detections.handedness[0][0].categoryName !== DEFAULT_HAND) return
    // TODO: allow switch hand

    // update cursor position
    const indexTip = detections.landmarks[0][HAND_PARTS.indexFinger.middle]
    const newCursorX = (1 - indexTip.x) * window.innerWidth
    const newCursorY = indexTip.y * window.innerHeight
    setCursorPosition({ x: newCursorX, y: newCursorY })

    // If game is not started, only update cursor position
    if (gameStatusRef.current !== GameStatus.Start) return

    // update pinch status
    const currentPinchStatus = getPinchStatus(detections.landmarks[0])
    isPinchingRef.current = currentPinchStatus

    if (currentPinchStatus) {
      // if already dragging, continue dragging that box
      if (activeDragIndexRef.current !== null) {
        const deltaX = newCursorX - lastCursorPosRef.current.x
        const deltaY = newCursorY - lastCursorPosRef.current.y

        dragOffsetRef.current = {
          x: dragOffsetRef.current.x + deltaX,
          y: dragOffsetRef.current.y + deltaY,
        }
      } else {
        // check which box is overlapping with cursor
        const cursorRect = cursorRef.current?.getBoundingClientRect()
        if (!cursorRect) return
        for (const [i, ref] of itemRefs.entries()) {
          const itemRect = ref?.getBoundingClientRect()
          if (!itemRect) continue
          if (!isRectOverlap(cursorRect, itemRect)) continue

          const status = itemStatusListRef.current[i]
          if (status === CookingStatus.Idle) {
            startCookingItem(i)
          } else if (
            status === CookingStatus.Done ||
            status === CookingStatus.Overcooked
          ) {
            activeDragIndexRef.current = i
            dragOffsetRef.current = { x: 0, y: 0 }
          }
          break
        }
      }

      lastCursorPosRef.current = { x: newCursorX, y: newCursorY }
    } else {
      // release drag
      if (activeDragIndexRef.current !== null) {
        onItemDone(activeDragIndexRef.current)
      }
      // reset
      resetMovement()
    }
  }

  return {
    cursorPosition,
    dragOffset: dragOffsetRef.current,
    activeDragIndex: activeDragIndexRef.current,
    isPinching: isPinchingRef.current,
    handleHandMovement,
  }
}
