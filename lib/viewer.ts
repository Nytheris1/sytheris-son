import 'server-only'
import { cache } from 'react'
import { getCommentCount } from './community'
import { getLists, libraryStats } from './library'
import { activeTier, resolveBannerOverlay, resolveFrame, resolveNameplate } from './membership'
import { computeBadges, getCurrentUser } from './users'
import type { HeaderUser } from './viewer-types'

export const getViewer = cache(async () => {
  const user = await getCurrentUser()
  if (!user) return null
  const [lists, comments] = await Promise.all([getLists(user.id).catch(() => []), getCommentCount(user.id).catch(() => 0)])
  const stats = libraryStats(lists)
  const header: HeaderUser = {
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar,
    background: user.background,
    bannerPreset: user.bannerPreset ?? 'none',
    bannerOverlay: resolveBannerOverlay(user),
    profileEffect: user.profileEffect ?? 'none',
    nameStyle: user.nameStyle ?? 'default',
    commentColor: user.commentColor ?? 'default',
    nameplate: resolveNameplate(user.nameplate),
    frame: resolveFrame(user.frame),
    tier: activeTier(user.premium),
    premiumUntil: user.premium?.until ?? null,
    role: user.role ?? 'user',
    badges: computeBadges(user, { libraryCount: stats.total, customLists: stats.custom, comments }),
    memberSince: user.createdAt,
    bio: user.bio,
    stats: {
      favorites: user.favorites.length,
      library: stats.total,
      watching: stats.watching,
      completed: stats.completed,
      planning: stats.planning,
      lists: lists.length,
      comments,
    },
  }
  return { user, lists, header }
})
