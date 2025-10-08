import { CookingStatus } from './types'

export const IS_DEBUG_MODE = false
export const DEFAULT_HAND = 'Right'

export const HAND_PARTS = {
  thumb: { base: 1, middle: 2, topKnuckle: 3, tip: 4 },
  indexFinger: { base: 5, middle: 6, topKnuckle: 7, tip: 8 },
  middleFinger: { base: 9, middle: 10, topKnuckle: 11, tip: 12 },
  ringFinger: { base: 13, middle: 14, topKnuckle: 15, tip: 16 },
  pinky: { base: 17, middle: 18, topKnuckle: 19, tip: 20 },
}

export const DRAGGABLE_ITEM_COUNT = 9
export const ITEMS_PER_PACK = 8
export const GAME_TIME = 1.5 * 60 // in sec
export const READY_TIME = 5 // in sec
export const COOKING_DURATION = 5 * 1000 // in ms

export const ITEM_COLOR_SET = {
  [CookingStatus.Idle]: {
    main: '#0000',
    border: '#0000',
  },
  [CookingStatus.Raw]: {
    main: '#ffeec4',
    border: '#cf903e',
  },
  [CookingStatus.Cooking]: {
    main: '#e9c186',
    border: '#ac7447',
  },
  [CookingStatus.Done]: {
    main: '#cf9644',
    border: '#905514',
  },
  [CookingStatus.Overcooked]: {
    main: '#89520a',
    border: '#642304',
  },
}
