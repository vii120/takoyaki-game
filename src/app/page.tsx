'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import CameraView from '@/components/CameraView'
import HandCursor from '@/components/HandCursor'
import DraggableBox from '@/components/DraggableBox'
import useHandTracking from '@/hooks/useHandTracking'
import {
  DRAGGABLE_ITEM_COUNT,
  GAME_TIME,
  READY_TIME,
  ITEMS_PER_PACK,
  ITEM_COLOR_SET,
} from '@/utils/constants'
import { CookingStatus, GameStatus } from '@/utils/types'
import { formatMilliseconds } from '@/utils/helpers'

export default function Home() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const packingBoxRef = useRef<HTMLDivElement>(null)
  const trashRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const [isSmallScreen, setIsSmallScreen] = useState(false)

  const setItemRef = (index: number) => (ref: HTMLDivElement | null) => {
    if (itemRefs.current) {
      itemRefs.current[index] = ref
    }
  }

  const [packingCount, setPackingCount] = useState(0)
  const [completedCount, setCompletedCount] = useState(0)
  const [cookingList, setCookingList] = useState<
    { id: number; status: CookingStatus }[]
  >(
    Array.from({ length: DRAGGABLE_ITEM_COUNT }, (_, i) => ({
      id: i + 1,
      status: CookingStatus.Idle,
    })),
  )
  const [currentGameStatus, setCurrentGameStatus] = useState<GameStatus>(
    GameStatus.Ready,
  )
  const [gameTimeLeft, setGameTimeLeft] = useState<number>(GAME_TIME)
  const [readyCountdown, setReadyCountdown] = useState<number>(READY_TIME)
  const [isCameraReady, setIsCameraReady] = useState(false)
  const [isGuideRead, setIsGuideRead] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null) // prevent duplicate timer

  const score = useMemo(() => {
    return completedCount * 10
  }, [completedCount])

  const startCookingItem = (i: number) => {
    setCookingList((prev) => {
      const newList = [...prev]
      newList[i].status = CookingStatus.Raw
      return newList
    })
  }

  const updateNextStatus = (i: number) => {
    setCookingList((prev) => {
      const newList = [...prev]
      const status = newList[i].status

      if (status === CookingStatus.Raw) {
        newList[i].status = CookingStatus.Cooking
      } else if (status === CookingStatus.Cooking) {
        newList[i].status = CookingStatus.Done
      } else if (status === CookingStatus.Done) {
        newList[i].status = CookingStatus.Overcooked
      }
      return newList
    })
  }

  const onItemDone = (i: number) => {
    setCookingList((prev) => {
      // Check status before updating
      if (prev[i].status === CookingStatus.Done) {
        setPackingCount((count) => count + 1) // only the good one counts
      }
      const newList = [...prev]
      newList[i].status = CookingStatus.Idle
      return newList
    })
  }

  const {
    cursorPosition,
    dragOffset,
    activeDragIndex,
    isPinching,
    handleHandMovement,
  } = useHandTracking({
    cursorRef,
    packingBoxRef,
    trashRef,
    currentGameStatus,
    itemRefs: itemRefs.current,
    itemStatusList: cookingList.map((el) => el.status),
    startCookingItem,
    onItemDone,
  })

  useEffect(() => {
    if (packingCount === ITEMS_PER_PACK) {
      setPackingCount(0)
      setCompletedCount((count) => count + 1)
    }
  }, [packingCount])

  const onRestart = () => {
    setCookingList((prev) =>
      prev.map((el) => ({ ...el, status: CookingStatus.Idle })),
    )
    setPackingCount(0)
    setCompletedCount(0)
    setGameTimeLeft(GAME_TIME)
    setReadyCountdown(READY_TIME)
    setCurrentGameStatus(GameStatus.Ready)
  }

  const onGameStart = () => {
    setCurrentGameStatus(GameStatus.Start)

    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    timerRef.current = setInterval(() => {
      setGameTimeLeft((prev) => {
        const next = prev - 1
        if (next < 0) {
          if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
          }
          setCurrentGameStatus(GameStatus.End)
          return 0
        }
        return next
      })
    }, 1000)
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!isGuideRead || currentGameStatus !== GameStatus.Ready) return

    const timer = setInterval(() => {
      setReadyCountdown((prev) => {
        const next = prev - 1
        if (next < 0) {
          clearInterval(timer)
          onGameStart()
          return 0
        }
        return next
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [currentGameStatus, isGuideRead])

  useEffect(() => {}, [isCameraReady])

  const handleResize = () => {
    setIsSmallScreen(window.innerWidth < 768)
  }

  useEffect(() => {
    handleResize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  if (isSmallScreen)
    return (
      <div className="fixed inset-0 flex flex-col justify-center items-center font-bold text-xl">
        <div>Oh, the screen is too small!</div>
        <div>I cannot squeeze in 🥲</div>
      </div>
    )

  return (
    <div className="bg-amber-500/70 min-h-dvh flex flex-col items-stretch">
      <CameraView
        onHandDetection={handleHandMovement}
        onCameraReady={() => setIsCameraReady(true)}
      />

      <div className="flex items-stretch justify-center px-16 py-12 gap-16">
        {/* cooking panel */}
        <div className="shrink-0 aspect-square p-8 grid grid-cols-3 grid-rows-3 place-items-center gap-12 border-[18px] border-yellow-700 outline-2 outline-black bg-neutral-300 relative">
          {/* deco border */}
          <div className="absolute w-full h-full border-2 pointer-events-none"></div>

          {/* takoyaki */}
          {Array.from({ length: DRAGGABLE_ITEM_COUNT }, (_, i) => (
            <DraggableBox
              key={i}
              ref={setItemRef(i)}
              dragOffset={dragOffset}
              status={cookingList[i].status}
              isDragging={activeDragIndex === i}
              updateNextStatus={() => updateNextStatus(i)}
              forceStop={currentGameStatus !== GameStatus.Start}
            />
          ))}
        </div>

        {/* timer and box */}
        <div className="w-30 flex flex-col items-stretch gap-6">
          {/* octopus logo */}
          <div className="aspect-square rounded-full border-2 bg-yellow-50 bg-[url('/octopus.png')] bg-no-repeat bg-center bg-size-[75%]"></div>
          {/* timer */}
          <div className="text-5xl text-center font-semibold">
            {formatMilliseconds(gameTimeLeft)}
          </div>
          {/* packing box */}
          <div
            className="bg-yellow-50 w-30 h-full rounded-lg border-2 grid grid-cols-2 grid-rows-4 place-items-center"
            ref={packingBoxRef}
          >
            {Array.from({ length: packingCount }, (_, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: ITEM_COLOR_SET[CookingStatus.Done].main,
                  borderColor: ITEM_COLOR_SET[CookingStatus.Done].border,
                  color: ITEM_COLOR_SET[CookingStatus.Done].border,
                }}
                className="w-12 h-12 rounded-full border-2"
              >
                <div className="w-fit text-xl rotate-[-60deg] translate-y-[2px]">
                  )))
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* footer */}
      <div className="flex-1 shrink-0 px-16 py-8 bg-amber-600 border-t-2 flex items-center justify-center relative">
        <div className="w-full max-w-[800px] flex items-center">
          {/* score */}
          <div className="w-36 aspect-square font-extrabold text-8xl flex justify-center items-center">
            {score}
          </div>
          {/* completed boxes */}
          <div className="flex items-center">
            {Array.from({ length: completedCount }, (_, i) => (
              <div
                key={i}
                className="w-20 aspect-[9/16] -mr-4 rounded-lg bg-yellow-50 border-2 grid grid-cols-2 grid-rows-4 place-items-center"
              >
                {Array.from({ length: ITEMS_PER_PACK }, (_, i) => (
                  <div
                    key={i}
                    style={{
                      backgroundColor: ITEM_COLOR_SET[CookingStatus.Done].main,
                      borderColor: ITEM_COLOR_SET[CookingStatus.Done].border,
                      color: ITEM_COLOR_SET[CookingStatus.Done].border,
                    }}
                    className="w-7 h-7 rounded-full border-2"
                  >
                    <div className="w-fit text-sm rotate-[-60deg] -translate-y-[2px]">
                      )))
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          {/* trash can */}
          <div
            className="w-30 aspect-[3/4] rounded-full ml-auto bg-[url('/trash.png')] bg-no-repeat bg-center bg-contain"
            ref={trashRef}
          ></div>
        </div>
      </div>

      {/* ready countdown */}
      {isCameraReady &&
        isGuideRead &&
        currentGameStatus === GameStatus.Ready && (
          <div className="fixed w-full h-full inset-0 pointer-events-none flex justify-center items-center font-bold text-9xl bg-amber-50/50">
            {readyCountdown === 0 ? 'start!' : readyCountdown}
          </div>
        )}

      {/* game end */}
      {currentGameStatus === GameStatus.End && (
        <div className="fixed w-full h-full inset-0 flex flex-col justify-center items-center gap-8 font-bold text-5xl bg-amber-50/80">
          <div>Your score:</div>
          <div className="text-8xl">{score}</div>
          <div>{score === 0 ? 'You can do better!' : 'Good job!'}</div>
          <div
            onClick={onRestart}
            className="px-6 py-2 mt-6 rounded-xl bg-amber-600 text-amber-50 text-2xl cursor-pointer transition active:translate-0.5"
          >
            restart
          </div>
        </div>
      )}

      <AnimatePresence>
        {isCameraReady && !isGuideRead && (
          <motion.div
            layoutId="guide-modal"
            className="fixed w-full h-full inset-0 flex flex-col justify-center items-center gap-8 bg-amber-50/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="max-w-4/5 w-120 p-6 rounded-2xl border-2 bg-amber-50 flex flex-col justify-center gap-4"
              initial={{ scale: 0.7 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 20,
              }}
            >
              <div className="font-bold text-3xl">Before you start</div>
              <div className="flex gap-3 items-center">
                <div className="text-3xl">👋</div>
                <div>
                  Wave your <span className="font-bold">right hand</span> in
                  front of the camera to make sure the tool is tracking
                </div>
              </div>
              <div className="flex gap-3 items-center">
                <div className="text-3xl">🤏</div>
                <div>
                  In the game, pinch your{' '}
                  <span className="font-bold">thumb and index finger</span> to
                  interact: add ingredients, move the takoyaki
                </div>
              </div>
              <div
                className="px-6 py-2 mt-6 rounded-xl bg-amber-600 text-amber-50 self-center text-xl font-bold cursor-pointer transition active:translate-0.5"
                onClick={() => setIsGuideRead(true)}
              >
                start
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <HandCursor
        ref={cursorRef}
        x={cursorPosition.x}
        y={cursorPosition.y}
        isPinching={isPinching}
      />
    </div>
  )
}
