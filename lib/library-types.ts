export type ListStatus = 'watching' | 'planning' | 'completed' | 'paused' | 'dropped'

export type LibraryList = {
  id: string
  name: string
  description: string
  hue: number
  system?: ListStatus
  items: { id: number; addedAt: number }[]
  isPublic: boolean
  createdAt: number
  updatedAt: number
}

export const STATUS_LABEL: Record<ListStatus, string> = {
  watching: 'İzliyorum',
  planning: 'İzleyeceğim',
  completed: 'Tamamladım',
  paused: 'Ara verdim',
  dropped: 'Bıraktım',
}

export const LIST_HUES = [155, 25, 255, 80, 355, 300, 200, 45]
