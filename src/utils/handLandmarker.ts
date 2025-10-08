import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision'

const initHandLandmarker = async () => {
  const vision = await FilesetResolver.forVisionTasks(
    // path/to/wasm/root
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
  )
  const handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: '/hand_landmarker.task',
    },
    numHands: 2,
  })
  return handLandmarker
}

export default initHandLandmarker
