import type { BadgeId, BannerOverlay, BannerPreset, CommentColor, FrameId, NameStyle, Nameplate, ProfileEffect, Role, Tier } from './membership'

export type HeaderUser = {
  username: string
  displayName: string
  avatar?: string | null
  background?: string | null
  bannerPreset?: BannerPreset
  bannerOverlay?: BannerOverlay
  profileEffect?: ProfileEffect
  nameStyle?: NameStyle
  commentColor?: CommentColor
  nameplate?: Nameplate
  frame?: FrameId
  tier: Tier
  premiumUntil?: number | null
  role: Role
  badges: BadgeId[]
  memberSince: number
  bio?: string
  stats: {
    favorites: number
    library: number
    watching: number
    completed: number
    planning: number
    lists: number
    comments: number
  }
}
