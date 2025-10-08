export const isRectOverlap = (rect1: DOMRect, rect2: DOMRect) => {
  return !(
    rect1.right < rect2.left ||
    rect1.left > rect2.right ||
    rect1.bottom < rect2.top ||
    rect1.top > rect2.bottom
  )
}

export const formatMilliseconds = (second: number) => {
  const minutes = Math.floor(second / 60)
  const seconds = second % 60

  // const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0')

  return `${minutes}:${ss}`
}
