'use client'

import { useEffect, useRef } from 'react'
import { HandLandmarkerResult } from '@mediapipe/tasks-vision'
import initHandLandmarker from '@/utils/handLandmarker'
import { IS_DEBUG_MODE } from '@/utils/constants'

interface CameraViewProps {
  onHandDetection: (detections: HandLandmarkerResult) => void
  onCameraReady?: () => void
}

export default function CameraView({
  onHandDetection,
  onCameraReady,
}: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  const onLoadedData = async () => {
    const handLandmarker = await initHandLandmarker()

    await handLandmarker.setOptions({ runningMode: 'VIDEO' })
    let lastVideoTime = -1

    const renderLoop = (): void => {
      if (!videoRef.current) return

      const { currentTime } = videoRef.current
      if (currentTime !== lastVideoTime) {
        const detections = handLandmarker.detectForVideo(
          videoRef.current,
          currentTime,
        )

        onHandDetection(detections)
        lastVideoTime = currentTime
      }

      requestAnimationFrame(() => {
        renderLoop()
      })
    }

    renderLoop()
  }

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadeddata = () => {
            onLoadedData()
            onCameraReady?.()
          }
        }
      } catch (err) {
        console.error(err)
      }
    }

    startCamera()

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach((track) => track.stop())
      }
    }
  }, [])

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className={`fixed top-0 right-0 w-60 aspect-[4/3] object-contain scale-x-[-1] pointer-events-none ${IS_DEBUG_MODE ? 'z-1' : '-z-50 opacity-0'}`}
    />
  )
}
